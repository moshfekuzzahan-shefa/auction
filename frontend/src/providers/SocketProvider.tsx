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
    // Determine target socket server URL
    const rawUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://auctionbyshefa.onrender.com');
    const cleanUrl = rawUrl.replace(/\/+$/, '').replace(/\/api$/, '');

    if (!socketInstance) {
      socketInstance = io(cleanUrl, {
        auth: { token: token || '' },
        transports: ['websocket'],
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      setSocket(socketInstance);

      socketInstance.on('connect', () => {
        console.log('Connected to WebSocket server:', cleanUrl);
        setSocket(socketInstance);
      });

      socketInstance.on('connect_error', (err) => {
        console.warn('Socket connection error (deferring):', err.message);
      });

      socketInstance.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
      });
    } else {
      // Update token on existing socket connection if user logged in or token refreshed
      socketInstance.auth = { token: token || '' };
      if (!socketInstance.connected) {
        socketInstance.connect();
      }
      setSocket(socketInstance);
    }
  }, [token, isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => useContext(SocketContext);
