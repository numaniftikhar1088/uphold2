import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNotifications } from '../contexts/NotificationContext';

const BellIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const typeIcon = (type) => {
  if (type?.includes('deposit'))  return '💰';
  if (type?.includes('withdraw')) return '💸';
  if (type?.includes('kyc'))      return '🪪';
  if (type?.includes('trade'))    return '📈';
  if (type?.includes('chat'))     return '💬';
  if (type?.includes('password')) return '🔒';
  if (type?.includes('bank'))     return '🏦';
  return '🔔';
};

const NotificationDropdown = ({ chatOnly = false }) => {
  const { notifications: allNotifications, unreadCount: allUnreadCount, markNotificationAsRead, markAllNotificationsAsRead } = useNotifications();

  const notifications = chatOnly
    ? allNotifications.filter((n) => n.type === 'new_chat_message')
    : allNotifications;
  const unreadCount = chatOnly
    ? notifications.filter((n) => !n.read).length
    : allUnreadCount;
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({});
  const buttonRef = useRef(null);
  const panelRef  = useRef(null);

  const PANEL_W = 320; // w-80

  const calcCoords = () => {
    if (!buttonRef.current) return;
    const rect  = buttonRef.current.getBoundingClientRect();
    const top   = rect.bottom + 8;
    const vw    = window.innerWidth;

    // If button's centre is on the right half → align panel right-edge to button right-edge.
    // If button's centre is on the left half  → align panel left-edge  to button left-edge,
    // but clamp so it never goes off the right edge of the viewport.
    if ((rect.left + rect.right) / 2 > vw / 2) {
      setCoords({ top, right: vw - rect.right });
    } else {
      const left = Math.min(rect.left, vw - PANEL_W - 8);
      setCoords({ top, left });
    }
  };

  const toggle = () => {
    if (isOpen) { setIsOpen(false); return; }
    calcCoords();
    setIsOpen(true);
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (
        panelRef.current  && !panelRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Keep panel aligned on scroll / resize
  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('scroll', calcCoords, true);
    window.addEventListener('resize', calcCoords);
    return () => {
      window.removeEventListener('scroll', calcCoords, true);
      window.removeEventListener('resize', calcCoords);
    };
  }, [isOpen]);

  const panel = (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        top:      coords.top,
        ...(coords.right !== undefined ? { right: coords.right } : { left: coords.left }),
        zIndex:   999999,
      }}
      className="w-80 bg-[#0D1421] border border-slate-700/40 rounded-2xl shadow-2xl shadow-slate-950/80 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BellIcon className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-white">{chatOnly ? 'New Messages' : 'Notifications'}</span>
          {unreadCount > 0 && (
            <span className="bg-rose-500/20 text-rose-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsAsRead}
            className="text-xs text-emerald-400 hover:text-emerald-300 transition font-medium"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 gap-2">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
              <BellIcon className="w-5 h-5 text-slate-600" />
            </div>
            <p className="text-sm text-slate-500">{chatOnly ? 'No new messages' : 'No notifications yet'}</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => { if (!n.read) markNotificationAsRead(n._id); }}
              className={`px-4 py-3 border-b border-slate-800/50 cursor-pointer transition-colors ${
                !n.read ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : 'hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span className="text-base mt-0.5 shrink-0">{typeIcon(n.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={`text-sm font-semibold leading-snug truncate ${
                      !n.read ? 'text-white' : 'text-slate-300'
                    }`}>
                      {n.title}
                    </p>
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-slate-600 mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggle}
        className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/70 transition-all"
        aria-label="Notifications"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center text-[9px] font-bold text-white bg-rose-500 rounded-full ring-1 ring-[#070B12]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && createPortal(panel, document.body)}
    </>
  );
};

export default NotificationDropdown;
