import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error';
import crypto from 'crypto';

const MFA_ISSUER = 'iSmart Gravure Management';

// TOTP implementation (RFC 6238) using Node.js crypto
// Compatible with Google Authenticator / Microsoft Authenticator

function base32Decode(encoded: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleaned = encoded.replace(/[^A-Za-z2-7]/g, '').toUpperCase();
  const bits: string[] = [];
  for (const ch of cleaned) {
    const val = alphabet.indexOf(ch);
    if (val >= 0) bits.push(val.toString(2).padStart(5, '0'));
  }
  const bytes: number[] = [];
  const joined = bits.join('');
  for (let i = 0; i + 7 < joined.length; i += 8) {
    bytes.push(parseInt(joined.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function base32Encode(buf: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bits = Array.from(buf).map(b => b.toString(2).padStart(8, '0')).join('');
  const result: string[] = [];
  for (let i = 0; i + 4 < bits.length; i += 5) {
    result.push(alphabet[parseInt(bits.substring(i, i + 5), 2)]);
  }
  return result.join('');
}

function generateToptSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

function totp(secret: string, timestamp: number = Date.now()): string {
  const key = base32Decode(secret);
  const time = Math.floor(timestamp / 30000);
  const timeBuf = Buffer.alloc(8);
  timeBuf.writeBigInt64BE(BigInt(time), 0);

  const hmac = crypto.createHmac('sha1', key).update(timeBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = (binary % 1000000).toString(10).padStart(6, '0');
  return otp;
}

function generateTotpUri(secret: string, username: string, issuer: string): string {
  const encodedSecret = secret.replace(/ /g, '');
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(username)}?secret=${encodedSecret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

export class MfaService {
  static generateSecret(): { secret: string; uri: string } {
    const secret = generateToptSecret();
    const uri = generateTotpUri(secret, 'user', MFA_ISSUER);
    return { secret, uri };
  }

  static generateUri(secret: string, username: string): string {
    return generateTotpUri(secret, username, MFA_ISSUER);
  }

  static verifyToken(token: string, secret: string): boolean {
    const now = Date.now();
    // Check current and adjacent time windows (allow 1 step drift)
    for (const offset of [0, -1, 1]) {
      const expected = totp(secret, now + offset * 30000);
      if (expected === token) return true;
    }
    return false;
  }

  static generateBackupCodes(count: number = 8): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  static async enable(userId: string, token: string): Promise<{ backupCodes: string[] }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);
    if (!user.mfaSecret) throw new AppError('MFA not initialized. Generate secret first.', 400);
    if (user.mfaEnabled) throw new AppError('MFA is already enabled', 400);

    if (!this.verifyToken(token, user.mfaSecret)) {
      throw new AppError('Invalid TOTP code. Please try again.', 400);
    }

    const backupCodes = this.generateBackupCodes();
    const hashedBackupCodes = backupCodes.map(c => {
      const hash = crypto.createHash('sha256').update(c).digest('hex');
      return hash;
    });

    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true, mfaBackupCodes: hashedBackupCodes },
    });

    return { backupCodes };
  }

  static async disable(userId: string, tokenOrBackup: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);
    if (!user.mfaEnabled) throw new AppError('MFA is not enabled', 400);
    if (!user.mfaSecret) throw new AppError('MFA secret not found', 400);

    const validToken = this.verifyToken(tokenOrBackup, user.mfaSecret);
    const validBackup = user.mfaBackupCodes.some(storedHash => {
      const inputHash = crypto.createHash('sha256').update(tokenOrBackup).digest('hex');
      return storedHash === inputHash;
    });

    if (!validToken && !validBackup) {
      throw new AppError('Invalid TOTP code or backup code', 400);
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: [],
      },
    });
  }

  static async verify(userId: string, token: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.mfaSecret || !user.mfaEnabled) return false;

    const valid = this.verifyToken(token, user.mfaSecret);
    if (valid) return true;

    const backupHash = crypto.createHash('sha256').update(token).digest('hex');
    const backupIndex = user.mfaBackupCodes.indexOf(backupHash);
    if (backupIndex !== -1) {
      const codes = [...user.mfaBackupCodes];
      codes.splice(backupIndex, 1);
      await prisma.user.update({ where: { id: userId }, data: { mfaBackupCodes: codes } });
      return true;
    }

    return false;
  }

  static isMfaRequired(role: string): boolean {
    return role === 'admin' || role === 'superadmin';
  }
}
