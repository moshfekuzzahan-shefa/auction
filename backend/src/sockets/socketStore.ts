import { Server } from 'socket.io';
import { AuctionEngine } from '../modules/auction/auction.engine';

let ioInstance: Server | null = null;
let auctionEngineInstance: AuctionEngine | null = null;

export const setSocketIo = (io: Server) => {
  ioInstance = io;
};

export const getSocketIo = (): Server | null => {
  return ioInstance;
};

export const setAuctionEngine = (engine: AuctionEngine) => {
  auctionEngineInstance = engine;
};

export const getAuctionEngine = (): AuctionEngine | null => {
  return auctionEngineInstance;
};
