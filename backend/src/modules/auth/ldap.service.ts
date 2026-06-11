import { env } from '../../config/env';
import { prisma } from '../../config/database';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

interface LdapUserInfo {
  authenticated: boolean;
  dn?: string;
  groups?: string[];
  attributes?: Record<string, string[]>;
}

interface RoleMapping {
  [adGroup: string]: string;
}

function parseRoleMap(): RoleMapping {
  try {
    return JSON.parse(env.LDAP_ROLE_MAP || '{}');
  } catch {
    return {};
  }
}

function mapLdapGroupsToRole(groups: string[]): string | null {
  const mapping = parseRoleMap();
  for (const group of groups) {
    const groupName = group.split(',').shift()?.replace(/^CN=/i, '') || group;
    if (mapping[groupName]) return mapping[groupName];
    const cnMatch = group.match(/^CN=([^,]+)/i);
    if (cnMatch && mapping[cnMatch[1]]) return mapping[cnMatch[1]];
  }
  return null;
}

export class LdapService {
  static async authenticate(username: string, password: string): Promise<LdapUserInfo> {
    const result: LdapUserInfo = { authenticated: false };
    if (!env.LDAP_URL) return result;

    try {
      const ldapjs = require('ldapjs');
      const client = ldapjs.createClient({ url: env.LDAP_URL, timeout: 5000, connectTimeout: 5000 });

      return new Promise((resolve) => {
        client.bind(env.LDAP_BIND_DN, env.LDAP_BIND_CREDENTIALS, (bindErr: any) => {
          if (bindErr) {
            client.destroy();
            resolve({ authenticated: false });
            return;
          }

          const searchDn = env.LDAP_BASE_DN;
          const filter = env.LDAP_USER_FILTER
            ? env.LDAP_USER_FILTER.replace('{{username}}', username)
            : `(uid=${username})`;

          const attributes = env.LDAP_GROUP_ATTR
            ? ['dn', env.LDAP_GROUP_ATTR, 'accountControl', 'memberOf', 'displayName', 'mail']
            : ['dn', 'memberOf', 'accountControl', 'displayName', 'mail'];

          client.search(searchDn, { scope: 'sub', filter, attributes }, (searchErr: any, res: any) => {
            if (searchErr) {
              client.destroy();
              resolve({ authenticated: false });
              return;
            }

            let entry: any = null;
            res.on('searchEntry', (e: any) => {
              entry = e;
            });

            res.on('end', () => {
              if (!entry) {
                client.destroy();
                resolve({ authenticated: false });
                return;
              }

              const userDn = entry.dn;
              const rawAttrs: Record<string, string[]> = {};
              if (entry.attributes) {
                for (const attr of entry.attributes) {
                  rawAttrs[attr.type] = attr.vals || [];
                }
              }

              const accountControl = rawAttrs['accountControl']?.[0];
              const ac = parseInt(accountControl || '512', 10);
              const isDisabled = (ac & 0x0002) !== 0;
              if (isDisabled) {
                client.destroy();
                resolve({ authenticated: false });
                return;
              }

              const groups = rawAttrs['memberOf'] || rawAttrs[env.LDAP_GROUP_ATTR || ''] || [];

              client.bind(userDn, password, (userBindErr: any) => {
                client.destroy();
                if (userBindErr) {
                  resolve({ authenticated: false });
                  return;
                }

                resolve({
                  authenticated: true,
                  dn: userDn,
                  groups,
                  attributes: rawAttrs,
                });
              });
            });
          });
        });
      });
    } catch {
      return { authenticated: false };
    }
  }

  static async syncUser(username: string, ldapInfo: LdapUserInfo): Promise<{ id: string; role: string }> {
    const mappedRole = ldapInfo.groups ? mapLdapGroupsToRole(ldapInfo.groups) : null;
    const role = mappedRole || 'viewer';

    const displayName = ldapInfo.attributes?.displayName?.[0] || username;
    const email = ldapInfo.attributes?.mail?.[0];

    const existing = await prisma.user.findUnique({ where: { username } });

    if (existing) {
      const groupsChanged = JSON.stringify(existing.ldapGroups || []) !== JSON.stringify(ldapInfo.groups || []);
      if (groupsChanged) {
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            role: role as any,
            ldapDn: ldapInfo.dn,
            ldapGroups: ldapInfo.groups || [],
          },
        });
      }
      return { id: existing.id, role: existing.role };
    }

    const tempPassword = crypto.randomBytes(16).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: role as any,
        ldapDn: ldapInfo.dn,
        ldapGroups: ldapInfo.groups || [],
      },
    });

    return { id: user.id, role: user.role };
  }
}
