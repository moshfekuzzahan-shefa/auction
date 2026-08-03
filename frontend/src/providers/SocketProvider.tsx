import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppSelector } from '../store/hooks';

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

// Singleton instance to prevent multiple connections across re-renders
let socketInstance: Socket | null = null;

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(socketInstance);
  const { token, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && token && !socketInstance) {
      // Support dedicated persistent socket URL (e.g. Render backend) or fallback to VITE_API_URL
      const rawUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'https://auctionbyshefa.onrender.com';
      const cleanUrl = rawUrl.replace(/\/+$/, '').replace(/\/api$/, '');

      socketInstance = io(cleanUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      socketInstance.on('connect', () => {
        console.log('Connected to WebSocket server:', cleanUrl);
        setSocket(socketInstance);
      });

      socketInstance.on('connect_error', (err) => {
        console.warn('Socket connection error (deferring):', err.message);
      });

      socketInstance.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
        setSocket(null);
      });
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (!isAuthenticated && socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
      setSocket(null);
    }
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => useContext(SocketContext);
