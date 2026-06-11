"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedis = getRedis;
exports.closeRedis = closeRedis;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("./env");
let redisClient = null;
function getRedis() {
    if (!redisClient) {
        redisClient = new ioredis_1.default(env_1.env.REDIS_URL, { lazyConnect: true });
    }
    return redisClient;
}
async function closeRedis() {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
    }
}
