"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = requirePermission;
exports.getUserPermissions = getUserPermissions;
exports.matchPermission = matchPermission;
const database_1 = require("../config/database");
const error_1 = require("./error");
async function getUserPermissions(userId, role) {
    const perms = new Set();
    // SUPERADMIN gets everything
    if (role === 'superadmin') {
        perms.add('*:*');
        return perms;
    }
    // Role-based permissions
    const rolePerms = await database_1.prisma.rolePermission.findMany({
        where: { role: role },
        include: { permission: true },
    });
    for (const rp of rolePerms) {
        perms.add(rp.permission.name);
    }
    // User-specific grants (override)
    const userPerms = await database_1.prisma.userPermission.findMany({
        where: { userId },
        include: { permission: true },
    });
    for (const up of userPerms) {
        if (up.effect === 'deny') {
            perms.delete(up.permission.name);
        }
        else {
            perms.add(up.permission.name);
        }
    }
    return perms;
}
function matchPermission(required, granted) {
    if (granted.has('*:*'))
        return true;
    if (granted.has(required))
        return true;
    // Wildcard: module:* matches any action in that module
    const [reqModule] = required.split('.');
    if (granted.has(`${reqModule}:*`))
        return true;
    return false;
}
function requirePermission(...permissions) {
    return (req, res, next) => {
        if (!req.user) {
            return next(new error_1.AppError('Unauthorized: Authentication required', 401));
        }
        getUserPermissions(req.user.userId, req.user.role).then(userPerms => {
            const hasAll = permissions.every(p => matchPermission(p, userPerms));
            if (!hasAll) {
                return next(new error_1.AppError(`Forbidden: Required permission(s): ${permissions.join(', ')}`, 403));
            }
            next();
        }).catch(err => {
            next(new error_1.AppError('Error checking permissions', 500));
        });
    };
}
