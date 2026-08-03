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
      socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        auth: { token },
        transports: ['websocket'],
      });

      socketInstance.on('connect', () => {
        console.log('Connected to socket server');
        setSocket(socketInstance);
      });

      socketInstance.on('disconnect', () => {
        console.log('Disconnected from socket server');
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
