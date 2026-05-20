import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const useChatSocket = ({ token, user, roomId }) => {
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token || !roomId) return;

    const socket = io(SOCKET_URL, {
      auth: { token, role: user?.role, name: user?.name },
    });

    socketRef.current = socket;

    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });
    socket.on('connect_error', (error) => {
      console.error('Socket connect error:', error.message || error);
    });

    socket.emit('join_room', roomId);

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, roomId, user]);

  // content is a string; fileData/fileType/fileName are optional attachment fields
  const sendMessage = useCallback(({ content = '', fileData, fileType, fileName } = {}) => {
    if (!socketRef.current) return;
    if (!content.trim() && !fileData) return;
    socketRef.current.emit('send_message', { room: roomId, content, fileData, fileType, fileName });
  }, [roomId]);

  const addMessages = useCallback((incomingMessages) => {
    setMessages(incomingMessages);
  }, []);

  return { messages, connected, sendMessage, addMessages };
};

export default useChatSocket;
