import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getApiBase } from '@/lib/utils';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    const apiBase = getApiBase();
    
    console.log('Connecting to socket at:', apiBase);
    const newSocket = io(apiBase);
    setSocket(newSocket);

    newSocket.on('onlineUsersCount', (count) => {

      setOnlineCount(count);
    });

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (socket && user?.id) {
      socket.emit('auth:join', user.id);
    }
  }, [socket, user]);


  const value = useMemo(() => ({
    socket,
    onlineCount
  }), [socket, onlineCount]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
