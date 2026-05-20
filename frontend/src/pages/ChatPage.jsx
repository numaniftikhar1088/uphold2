import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import chatService from '../services/chatService';
import useChatSocket from '../hooks/useChatSocket';

const MAX_DOC_BYTES = 5 * 1024 * 1024;

const compressImage = (file, maxW = 900, q = 0.75) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('File read error'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Image load error'));
      img.onload = () => {
        let { width: w, height: h } = img;
        if (w > maxW) { h = Math.round((h * maxW) / w); w = maxW; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', q));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('File read error'));
    reader.onload  = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });

const MessageBubble = ({ message, myId }) => {
  const isMine = message.senderId === myId;
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${isMine ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-200'}`}>
        <p className="text-[11px] font-semibold opacity-70 mb-1">{message.isAdmin ? 'Customer Support' : message.senderName}</p>
        {message.content && <p className="leading-relaxed">{message.content}</p>}
        {message.fileData && message.fileType?.startsWith('image/') && (
          <img
            src={message.fileData}
            alt={message.fileName || 'attachment'}
            className="mt-2 max-w-full rounded-xl cursor-zoom-in"
            onClick={() => window.open(message.fileData, '_blank')}
          />
        )}
        {message.fileData && !message.fileType?.startsWith('image/') && (
          <a
            href={message.fileData}
            download={message.fileName || 'file'}
            className="mt-2 flex items-center gap-2 rounded-lg bg-black/20 px-3 py-2 text-xs font-medium hover:bg-black/30 transition"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            {message.fileName || 'Download file'}
          </a>
        )}
        <p className="text-[10px] opacity-50 mt-1.5 text-right">{new Date(message.createdAt).toLocaleTimeString()}</p>
      </div>
    </div>
  );
};

const ChatPage = () => {
  const { user, token } = useAuth();
  const [input, setInput]         = useState('');
  const [attachment, setAttachment] = useState(null);
  const [attachErr, setAttachErr]   = useState('');
  const [loading, setLoading]       = useState(false);
  const fileRef   = useRef(null);
  const bottomRef = useRef(null);

  const { connected, sendMessage, addMessages, messages } = useChatSocket({ token, user, roomId: user?.id });

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    chatService.getMyConversation()
      .then(({ messages: existing }) => addMessages(existing))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id, addMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAttachErr('');
    try {
      if (file.type.startsWith('image/')) {
        const compressed = await compressImage(file);
        setAttachment({ fileData: compressed, fileType: 'image/jpeg', fileName: file.name, preview: compressed });
      } else {
        if (file.size > MAX_DOC_BYTES) { setAttachErr('File too large (max 5 MB).'); return; }
        const b64 = await fileToBase64(file);
        setAttachment({ fileData: b64, fileType: file.type, fileName: file.name, preview: null });
      }
    } catch (err) {
      setAttachErr(err.message);
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const clearAttachment = () => setAttachment(null);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() && !attachment) return;
    sendMessage({ content: input.trim(), ...(attachment || {}) });
    setInput('');
    setAttachment(null);
  };

  return (
    <div className="min-h-screen bg-[#070B12] px-3 pt-3 pb-4 text-slate-100 md:px-5 md:py-7">
      <div className="mx-auto max-w-2xl space-y-3">

        {/* Header */}
        <div className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Help</p>
            <h1 className="text-lg font-bold text-white mt-0.5">Support Chat</h1>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${connected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/60 text-slate-500'}`}>
            {connected ? 'Connected' : 'Connecting...'}
          </span>
        </div>

        {/* Chat window */}
        <div className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] overflow-hidden flex flex-col">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-h-[52vh] md:max-h-[520px]">
            {loading ? (
              <p className="text-sm text-slate-500">Loading messages...</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-slate-500">No messages yet. Send a message below and an admin will respond.</p>
            ) : (
              messages.map((m) => <MessageBubble key={m._id} message={m} myId={user?.id} />)
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-slate-800/60 px-4 py-3 space-y-2">
            {attachErr && <p className="text-xs text-red-400">{attachErr}</p>}
            {attachment && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700/40">
                {attachment.preview
                  ? <img src={attachment.preview} alt="preview" className="w-10 h-10 rounded-lg object-cover" />
                  : <svg className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                }
                <span className="text-xs text-slate-300 flex-1 truncate">{attachment.fileName}</span>
                <button onClick={clearAttachment} className="text-slate-500 hover:text-red-400 transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            )}
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <input type="file" ref={fileRef} onChange={handleFileChange} className="hidden" accept="image/*,.pdf,.doc,.docx,.txt" />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="shrink-0 rounded-xl p-2.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 rounded-xl border border-slate-700/40 bg-slate-800/40 px-4 py-2.5 text-sm text-white outline-none focus:border-slate-500 placeholder-slate-600 transition"
              />
              <button
                type="submit"
                disabled={!input.trim() && !attachment}
                className="shrink-0 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Send
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ChatPage;
