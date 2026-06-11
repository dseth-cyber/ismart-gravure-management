"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LdapService = void 0;
const env_1 = require("../../config/env");
const database_1 = require("../../config/database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
function parseRoleMap() {
    try {
        return JSON.parse(env_1.env.LDAP_ROLE_MAP || '{}');
    }
    catch {
        return {};
    }
}
function mapLdapGroupsToRole(groups) {
    const mapping = parseRoleMap();
    for (const group of groups) {
        const groupName = group.split(',').shift()?.replace(/^CN=/i, '') || group;
        if (mapping[groupName])
            return mapping[groupName];
        const cnMatch = group.match(/^CN=([^,]+)/i);
        if (cnMatch && mapping[cnMatch[1]])
            return mapping[cnMatch[1]];
    }
    return null;
}
class LdapService {
    static async authenticate(username, password) {
        const result = { authenticated: false };
        if (!env_1.env.LDAP_URL)
            return result;
        try {
            const ldapjs = require('ldapjs');
            const client = ldapjs.createClient({ url: env_1.env.LDAP_URL, timeout: 5000, connectTimeout: 5000 });
            return new Promise((resolve) => {
                client.bind(env_1.env.LDAP_BIND_DN, env_1.env.LDAP_BIND_CREDENTIALS, (bindErr) => {
                    if (bindErr) {
                        client.destroy();
                        resolve({ authenticated: false });
                        return;
                    }
                    const searchDn = env_1.env.LDAP_BASE_DN;
                    const filter = env_1.env.LDAP_USER_FILTER
                        ? env_1.env.LDAP_USER_FILTER.replace('{{username}}', username)
                        : `(uid=${username})`;
                    const attributes = env_1.env.LDAP_GROUP_ATTR
                        ? ['dn', env_1.env.LDAP_GROUP_ATTR, 'accountControl', 'memberOf', 'displayName', 'mail']
                        : ['dn', 'memberOf', 'accountControl', 'displayName', 'mail'];
                    client.search(searchDn, { scope: 'sub', filter, attributes }, (searchErr, res) => {
                        if (searchErr) {
                            client.destroy();
                            resolve({ authenticated: false });
                            return;
                        }
                        let entry = null;
                        res.on('searchEntry', (e) => {
                            entry = e;
                        });
                        res.on('end', () => {
                            if (!entry) {
                                client.destroy();
                                resolve({ authenticated: false });
                                return;
                            }
                            const userDn = entry.dn;
                            const rawAttrs = {};
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
                            const groups = rawAttrs['memberOf'] || rawAttrs[env_1.env.LDAP_GROUP_ATTR || ''] || [];
                            client.bind(userDn, password, (userBindErr) => {
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
        }
        catch {
            return { authenticated: false };
        }
    }
    static async syncUser(username, ldapInfo) {
        const mappedRole = ldapInfo.groups ? mapLdapGroupsToRole(ldapInfo.groups) : null;
        const role = mappedRole || 'viewer';
        const displayName = ldapInfo.attributes?.displayName?.[0] || username;
        const email = ldapInfo.attributes?.mail?.[0];
        const existing = await database_1.prisma.user.findUnique({ where: { username } });
        if (existing) {
            const groupsChanged = JSON.stringify(existing.ldapGroups || []) !== JSON.stringify(ldapInfo.groups || []);
            if (groupsChanged) {
                await database_1.prisma.user.update({
                    where: { id: existing.id },
                    data: {
                        role: role,
                        ldapDn: ldapInfo.dn,
                        ldapGroups: ldapInfo.groups || [],
                    },
                });
            }
            return { id: existing.id, role: existing.role };
        }
        const tempPassword = crypto_1.default.randomBytes(16).toString('hex');
        const passwordHash = await bcryptjs_1.default.hash(tempPassword, 12);
        const user = await database_1.prisma.user.create({
            data: {
                username,
                passwordHash,
                role: role,
                ldapDn: ldapInfo.dn,
                ldapGroups: ldapInfo.groups || [],
            },
        });
        return { id: user.id, role: user.role };
    }
}
exports.LdapService = LdapService;
