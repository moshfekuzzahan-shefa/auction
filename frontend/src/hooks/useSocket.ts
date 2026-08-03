import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppSelector } from '../store/hooks';

// Singleton instance to prevent multiple connections
let socketInstance: Socket | null = null;

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(socketInstance);
  const { token, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Only connect if authenticated
    if (isAuthenticated && token && !socketInstance) {
      socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        auth: { token },
        transports: ['websocket'],
      });

      socketInstance.on('connect', () => {
        console.log('Connected to socket namespace');
        setSocket(socketInstance);
      });

      socketInstance.on('disconnect', () => {
        console.log('Disconnected from socket namespace');
        setSocket(null);
      });
    }

    return () => {
      // We don't necessarily want to disconnect on component unmount 
      // if it's a global hook, but we can do cleanup when the user logs out.
    };
  }, [isAuthenticated, token]);

  // Clean up if user logs out
  useEffect(() => {
    if (!isAuthenticated && socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
      setSocket(null);
    }
  }, [isAuthenticated]);

  return socket;
};
