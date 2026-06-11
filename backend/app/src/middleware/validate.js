"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
exports.validateLogin = validateLogin;
exports.validateCreatePermission = validateCreatePermission;
exports.validateCreateWorkflow = validateCreateWorkflow;
exports.validateStartWorkflow = validateStartWorkflow;
const zod_1 = require("zod");
const error_1 = require("./error");
function validate(schema, source = 'body') {
    return (req, res, next) => {
        try {
            const data = schema.parse(req[source]);
            req[source] = data;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const messages = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
                return next(new error_1.AppError(`Validation error: ${messages.join('; ')}`, 400));
            }
            next(error);
        }
    };
}
function validateLogin(body) {
    if (!body || typeof body !== 'object')
        throw new error_1.AppError('Invalid request body', 400);
    const { username, password } = body;
    if (!username || typeof username !== 'string' || username.length < 1)
        throw new error_1.AppError('username is required (min 1 char)', 400);
    if (!password || typeof password !== 'string' || password.length < 1)
        throw new error_1.AppError('password is required', 400);
    return body;
}
function validateCreatePermission(body) {
    if (!body || typeof body !== 'object')
        throw new error_1.AppError('Invalid request body', 400);
    const { name, module, action, description } = body;
    if (!name || typeof name !== 'string')
        throw new error_1.AppError('name is required (string)', 400);
    if (!module || typeof module !== 'string')
        throw new error_1.AppError('module is required (string)', 400);
    if (!action || typeof action !== 'string')
        throw new error_1.AppError('action is required (string)', 400);
    return body;
}
function validateCreateWorkflow(body) {
    if (!body || typeof body !== 'object')
        throw new error_1.AppError('Invalid request body', 400);
    const { name, description, config } = body;
    if (!name || typeof name !== 'string')
        throw new error_1.AppError('name is required (string)', 400);
    if (!config || typeof config !== 'object' || !Array.isArray(config.steps))
        throw new error_1.AppError('config.steps is required (array)', 400);
    return body;
}
function validateStartWorkflow(body) {
    if (!body || typeof body !== 'object')
        throw new error_1.AppError('Invalid request body', 400);
    const { defId, title, refType, refId, metadata } = body;
    if (!defId || typeof defId !== 'string')
        throw new error_1.AppError('defId is required', 400);
    if (!title || typeof title !== 'string')
        throw new error_1.AppError('title is required', 400);
    if (!refType || typeof refType !== 'string')
        throw new error_1.AppError('refType is required', 400);
    if (!refId || typeof refId !== 'string')
        throw new error_1.AppError('refId is required', 400);
    return body;
}
