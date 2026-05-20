import api from './api';

const getMyConversation = async () => {
  const { data } = await api.get('/chat/conversation');
  return data;
};

const getConversationByUser = async (userId) => {
  const { data } = await api.get(`/chat/conversation/${userId}`);
  return data;
};

const getConversations = async () => {
  const { data } = await api.get('/chat/conversations');
  return data;
};

export default {
  getMyConversation,
  getConversationByUser,
  getConversations,
};
