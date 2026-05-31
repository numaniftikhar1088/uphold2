import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import requestService from '../services/requestService';
import tradeService from '../services/tradeService';
import chatService from '../services/chatService';
import kycService from '../services/kycService';

const useCountUp = (target) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) { setVal(0); return; }
    let frame = 0;
    const total = 30;
    const tick = () => {
      frame++;
      setVal(Math.round((frame / total) * target));
      if (frame < total) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target]);
  return val;
};

const StatCard = ({ label, value, to, color, delay = '' }) => {
  const count = useCountUp(value);
  return (
    <Link
      to={to}
      style={{ animationDelay: delay }}
      className={`rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] px-5 py-5 flex flex-col gap-2 hover:ring-white/[0.15] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30 transition-all duration-200 group animate-fade-up glow-card`}
    >
      <p className="text-xs uppercase tracking-widest text-slate-500">{label}</p>
      <p className={`text-4xl font-black tabular-nums ${color}`}>{count}</p>
      <div className="stat-bar" />
      <p className="text-xs text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all duration-200">View →</p>
    </Link>
  );
};

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats]   = useState({ withdraws: 0, deposits: 0, trades: 0, chats: 0, kyc: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [{ withdraws }, { deposits }, { trades }, { conversations }, { users: kycUsers }] = await Promise.all([
          requestService.getAllWithdraws(),
          requestService.getAllDeposits(),
          tradeService.getPendingTrades(),
          chatService.getConversations(),
          kycService.getPendingKyc(),
        ]);
        setStats({
          withdraws:   withdraws.filter((r) => r.status === 'pending').length,
          deposits:    deposits.filter((r) => r.status === 'pending').length,
          trades:      trades.length,
          chats:       conversations.filter((c) => c.lastMessage && !c.lastMessage.isAdmin).length,
          kyc:         kycUsers.length,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#070B12] px-4 py-6 text-slate-100">
      <div className="mx-auto max-w-4xl space-y-6">

        <div>
          <h1 className="mt-0.5 text-2xl font-bold text-white">Welcome</h1>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading stats...</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard label="Pending Withdrawals" value={stats.withdraws} to="/admin/withdraw" color="text-amber-400"  delay="0ms" />
            <StatCard label="Pending Deposits"    value={stats.deposits}  to="/admin/deposit"  color="text-emerald-400" delay="60ms" />
            <StatCard label="Pending KYC"         value={stats.kyc}       to="/admin/kyc"      color="text-sky-400"   delay="120ms" />
            <StatCard label="New Messages"         value={stats.chats}     to="/admin/support"  color="text-violet-400" delay="180ms" />
            <StatCard label="Pending Trades"      value={stats.trades}    to="/admin/trades"   color="text-cyan-400"  delay="240ms" />
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { to: '/admin/withdraw', label: 'Manage Withdrawals', desc: 'Review and approve user withdrawal requests', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
            { to: '/admin/deposit',  label: 'Manage Deposits',    desc: 'Review transaction certificates and credit accounts', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { to: '/admin/kyc',      label: 'KYC Verification',   desc: 'Review ID documents and approve or reject user KYC', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
            { to: '/admin/support',  label: 'User Support Chat',  desc: 'Reply to user messages in real time', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
            { to: '/admin/trades',    label: 'Pending Trades',     desc: 'Set profit or loss outcomes for user trades', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
            { to: '/admin/payments', label: 'Payment Methods',    desc: 'View all bank accounts added by users', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`rounded-2xl border ${item.bg} px-5 py-4 hover:opacity-90 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 transition-all duration-200`}
            >
              <p className={`text-sm font-bold ${item.color}`}>{item.label}</p>
              <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
};

export default AdminDashboardPage;
