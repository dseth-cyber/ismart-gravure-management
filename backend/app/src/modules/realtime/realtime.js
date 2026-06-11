"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initRealtime = initRealtime;
exports.getIO = getIO;
exports.emitEvent = emitEvent;
exports.emitToJob = emitToJob;
const socket_io_1 = require("socket.io");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("../../config/env");
let io = null;
function initRealtime(httpServer) {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });
    const pubClient = new ioredis_1.default(env_1.env.REDIS_URL);
    const subClient = pubClient.duplicate();
    io.adapter((0, redis_adapter_1.createAdapter)(pubClient, subClient));
    io.on('connection', (socket) => {
        console.log(`[Realtime] Client connected: ${socket.id}`);
        socket.on('subscribe:job', (jobNumber) => {
            socket.join(`job:${jobNumber}`);
        });
        socket.on('unsubscribe:job', (jobNumber) => {
            socket.leave(`job:${jobNumber}`);
        });
        socket.on('disconnect', () => {
            console.log(`[Realtime] Client disconnected: ${socket.id}`);
        });
    });
    return io;
}
function getIO() {
    if (!io)
        throw new Error('Socket.io not initialized');
    return io;
}
function emitEvent(event, data) {
    if (io) {
        io.emit(event, data);
    }
}
function emitToJob(jobNumber, event, data) {
    if (io) {
        io.to(`job:${jobNumber}`).emit(event, data);
    }
}
