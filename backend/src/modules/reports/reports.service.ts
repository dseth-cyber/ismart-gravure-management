import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import os from 'os';
import nodemailer from 'nodemailer';
import { CronTime } from 'cron';

type ReportType = 'cylinders' | 'inks' | 'jobs' | 'orders' | 'audit';

interface ReportConfig {
  id: string;
  name: string;
  type: ReportType;
  format: 'pdf' | 'xlsx';
  cron: string;
  recipients: string[];
  params?: Record<string, any>;
}

async function fetchData(type: ReportType, _params?: Record<string, any>) {
  switch (type) {
    case 'cylinders':
      return prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM inventory.cylinders WHERE "deletedAt" IS NULL ORDER BY "createdAt" DESC LIMIT 1000`
      );
    case 'inks':
      return prisma.$queryRawUnsafe<any[]>(
        `SELECT code, name, color, product_code, status, "pantoneCode", viscosity, "solventRatio", "createdAt"
         FROM inventory.ink_formulas WHERE "deletedAt" IS NULL ORDER BY "createdAt" DESC LIMIT 500`
      );
    case 'jobs':
      return prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM production.production_jobs WHERE "deletedAt" IS NULL ORDER BY "createdAt" DESC LIMIT 500`
      );
    case 'orders':
      return prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM sales.sales_orders WHERE "deletedAt" IS NULL ORDER BY "createdAt" DESC LIMIT 500`
      );
    case 'audit':
      return prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM audit.audit_logs WHERE "createdAt" >= NOW() - INTERVAL '7 days' ORDER BY "createdAt" DESC LIMIT 1000`
      );
  }
}

async function generatePDF(title: string, columns: string[], rows: any[][]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const buffers: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    doc.fontSize(16).font('Helvetica-Bold').text(title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(8).font('Helvetica').text(`Generated: ${new Date().toLocaleString('th-TH')}`, { align: 'right' });
    doc.moveDown();

    const pageWidth = doc.page.width - 60;
    const colWidth = pageWidth / Math.max(columns.length, 1);

    let y = doc.y;
    doc.fontSize(8).font('Helvetica-Bold');
    for (let i = 0; i < columns.length; i++) {
      doc.text(columns[i], 30 + i * colWidth, y, { width: colWidth - 4, align: 'left' });
    }
    y += 14;
    doc.moveTo(30, y).lineTo(30 + pageWidth, y).stroke();

    doc.font('Helvetica').fontSize(7);
    for (const row of rows) {
      if (y > doc.page.height - 40) {
        doc.addPage();
        y = 30;
      }
      y += 2;
      for (let i = 0; i < row.length; i++) {
        doc.text(String(row[i] ?? ''), 30 + i * colWidth, y, { width: colWidth - 4, align: 'left' });
      }
      y += 12;
    }
    doc.end();
  });
}

async function generateExcel(title: string, columns: string[], rows: any[][]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(title.slice(0, 31));

  ws.columns = columns.map((c) => ({ header: c, key: c, width: 20 }));
  ws.addRows(rows);

  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

async function generateFile(config: ReportConfig) {
  const raw = await fetchData(config.type, config.params);
  if (!raw || raw.length === 0) throw new AppError('No data found for report', 404);

  const columns = Object.keys(raw[0]).slice(0, 20);
  const rows = raw.map((r: any) => columns.map((c) => r[c]));

  const title = `${config.name} - ${new Date().toISOString().slice(0, 10)}`;
  const buffer = config.format === 'pdf' ? await generatePDF(title, columns, rows) : await generateExcel(title, columns, rows);
  return { buffer, filename: `${title}.${config.format}`, mime: config.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
}

export const ReportsService = {
  async list() {
    return prisma.scheduledReport.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' } });
  },

  async getById(id: string) {
    const r = await prisma.scheduledReport.findUnique({ where: { id } });
    if (!r || r.deletedAt) throw new AppError('Report config not found', 404);
    return r;
  },

  async create(data: {
    name: string; description?: string; type: ReportType; format: 'pdf' | 'xlsx';
    cron: string; recipients: string[]; params?: Record<string, any>; createdBy?: string;
  }) {
    return prisma.scheduledReport.create({ data: { ...data, createdBy: data.createdBy || null } } as any);
  },

  async update(id: string, data: Partial<{
    name: string; description: string; type: ReportType; format: 'pdf' | 'xlsx';
    cron: string; recipients: string[]; params: Record<string, any>; active: boolean;
  }>) {
    await this.getById(id);
    return prisma.scheduledReport.update({ where: { id }, data });
  },

  async delete(id: string) {
    await this.getById(id);
    return prisma.scheduledReport.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  async runNow(id: string) {
    const config = await this.getById(id);
    return this.executeAndDeliver(config as any);
  },

  async executeAndDeliver(config: ReportConfig) {
    try {
      const { buffer, filename, mime } = await generateFile(config);
      const tmpPath = path.join(os.tmpdir(), filename);
      fs.writeFileSync(tmpPath, buffer);

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'mailhog',
        port: parseInt(process.env.SMTP_PORT || '1025', 10),
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' } : undefined,
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'reports@ismart-gravure.com',
        to: config.recipients.join(', '),
        subject: `[iSmart] ${config.name} — ${new Date().toLocaleDateString('th-TH')}`,
        text: `Please find attached the scheduled report: ${config.name}`,
        attachments: [{ filename, path: tmpPath, contentType: mime }],
      });

      fs.unlinkSync(tmpPath);

      await prisma.scheduledReport.update({
        where: { id: config.id },
        data: { lastRunAt: new Date(), lastError: null },
      });
      return { success: true, message: `Report sent to ${config.recipients.length} recipient(s)` };
    } catch (err: any) {
      await prisma.scheduledReport.update({
        where: { id: config.id },
        data: { lastError: err.message },
      });
      return { success: false, error: err.message };
    }
  },

  async checkAndRunDue() {
    const reports = await prisma.scheduledReport.findMany({
      where: { active: true, deletedAt: null },
    });
    const now = new Date();
    for (const r of reports) {
      try {
        if (r.lastRunAt && r.lastRunAt > now) continue;
        const ct = new CronTime(r.cron);
        const next = ct.sendAt().toJSDate();
        if (next <= now) {
          await this.executeAndDeliver(r as any);
        }
      } catch { }
    }
  },
};
