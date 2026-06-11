export interface NotificationMessage {
  to: string;
  subject: string;
  body: string;
  type: string;
  userId?: string;
}

export interface NotificationProvider {
  name: string;
  send(message: NotificationMessage): Promise<{ success: boolean; error?: string }>;
}

export class WebSocketProvider implements NotificationProvider {
  name = 'websocket';
  async send(message: NotificationMessage): Promise<{ success: boolean; error?: string }> {
    try {
      const { emitEvent } = await import('../realtime/realtime');
      emitEvent('notification:alert', {
        type: message.type,
        subject: message.subject,
        body: message.body,
        userId: message.userId,
        timestamp: new Date().toISOString(),
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export class SmtpProvider implements NotificationProvider {
  name = 'email';
  private transporter: any = null;

  private async getTransporter() {
    if (this.transporter) return this.transporter;
    const nodemailer = await import('nodemailer');
    const { env } = await import('../../config/env');
    const host = process.env.SMTP_HOST || 'mailhog';
    const port = parseInt(process.env.SMTP_PORT || '1025', 10);
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASS || '';
    this.transporter = nodemailer.createTransport({
      host, port,
      secure: port === 465,
      auth: user ? { user, pass } : undefined,
      tls: { rejectUnauthorized: false },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
    });
    return this.transporter;
  }

  async send(message: NotificationMessage): Promise<{ success: boolean; error?: string }> {
    try {
      const transporter = await this.getTransporter();
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@ismart-gravure.com',
        to: message.to,
        subject: message.subject,
        html: message.body,
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export class LineProvider implements NotificationProvider {
  name = 'line';
  async send(message: NotificationMessage): Promise<{ success: boolean; error?: string }> {
    const token = process.env.LINE_CHANNEL_TOKEN;
    if (!token) return { success: false, error: 'LINE_CHANNEL_TOKEN not configured' };
    try {
      const https = await import('https');
      const data = JSON.stringify({ to: message.to, messages: [{ type: 'text', text: `${message.subject}\n\n${message.body.replace(/<[^>]*>/g, '')}` }] });
      return new Promise((resolve) => {
        const req = https.request({
          hostname: 'api.line.me', path: '/v2/bot/message/push', method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Content-Length': Buffer.byteLength(data) },
        }, (res) => {
          let body = '';
          res.on('data', (c) => body += c);
          res.on('end', () => resolve(res.statusCode === 200 ? { success: true } : { success: false, error: `LINE API returned ${res.statusCode}: ${body}` }));
        });
        req.on('error', (e) => resolve({ success: false, error: e.message }));
        req.write(data);
        req.end();
      });
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export class TelegramProvider implements NotificationProvider {
  name = 'telegram';
  async send(message: NotificationMessage): Promise<{ success: boolean; error?: string }> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return { success: false, error: 'TELEGRAM_BOT_TOKEN not configured' };
    try {
      const https = await import('https');
      const text = `${message.subject}\n\n${message.body.replace(/<[^>]*>/g, '')}`;
      const data = JSON.stringify({ chat_id: message.to, text, parse_mode: 'HTML' });
      return new Promise((resolve) => {
        const req = https.request({
          hostname: 'api.telegram.org', path: `/bot${token}/sendMessage`, method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
        }, (res) => {
          let body = '';
          res.on('data', (c) => body += c);
          res.on('end', () => resolve(res.statusCode === 200 ? { success: true } : { success: false, error: `Telegram API returned ${res.statusCode}: ${body}` }));
        });
        req.on('error', (e) => resolve({ success: false, error: e.message }));
        req.write(data);
        req.end();
      });
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
