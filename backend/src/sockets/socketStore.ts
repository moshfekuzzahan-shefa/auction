import { Server } from 'socket.io';

let ioInstance: Server | null = null;

export const setSocketIo = (io: Server) => {
  ioInstance = io;
};

export const getSocketIo = (): Server | null => {
  return ioInstance;
};
