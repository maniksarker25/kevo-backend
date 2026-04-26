/* eslint-disable no-console */
import { Server as HTTPServer } from 'http';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Server as IOServer, Socket } from 'socket.io';
import config from '../config';

let io: IOServer;

const onlineUsers = new Set<string>();

const initializeSocket = (server: HTTPServer) => {
    if (!io) {
        io = new IOServer(server, {
            pingTimeout: 60000,
            cors: {
                origin: [
                    'http://localhost:5173',
                    'http://localhost:3000',
                    'https://bankybondy.com',
                    'http://10.10.20.48:3000',
                    'https://flonx-admin-dashboard.vercel.app',
                    'https://flonx-bartender-flow-client.vercel.app',
                    'https://flonx-progressive-web-client.vercel.app',
                    'https://flonx-venue-owner-dashboard-client.vercel.app',
                ],
            },
        });

        io.on('connection', async (socket: Socket) => {
            try {
                console.log('nice ot meet you');
                const token =
                    socket.handshake.auth?.token ||
                    socket.handshake.query?.token;

                if (!token) return socket.disconnect();

                const decode = jwt.verify(
                    token,
                    config.jwt_access_secret as string
                ) as JwtPayload;

                const currentUserId = decode.profileId;

                if (!currentUserId) return socket.disconnect();

                socket.join(currentUserId);

                onlineUsers.add(currentUserId);

                io.emit('onlineUser', Array.from(onlineUsers));

                socket.on('disconnect', () => {
                    onlineUsers.delete(currentUserId);
                    io.emit('onlineUser', Array.from(onlineUsers));
                    console.log('User disconnected:', currentUserId);
                });
            } catch (error) {
                console.error('Socket Auth Error:', error);
                socket.disconnect();
            }
        });
    }

    return io;
};

const isUserOnline = (userId: string) => {
    return onlineUsers.has(userId);
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io is not initialized.');
    }
    return io;
};

export { getIO, initializeSocket, isUserOnline };
