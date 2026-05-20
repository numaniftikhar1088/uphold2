import { useEffect, useMemo, useRef, useState } from 'react';
import bankService from '../services/bankService';

const AdminPaymentMethodsPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const sectionRefs             = useRef({});

  useEffect(() => {
    bankService.getAllBankAccountsAdmin()
      .then(({ accounts: list }) => setAccounts(list))
      .catch((err) => setError(err?.response?.data?.message || 'Failed to load payment methods.'))
      .finally(() => setLoading(false));
  }, []);

  // Group accounts by user
  const grouped = useMemo(() => {
    const map = new Map();
    accounts.forEach((acc) => {
      const uid = acc.userId?._id || String(acc.userId);
      if (!map.has(uid)) map.set(uid, { user: acc.userId, accounts: [] });
      map.get(uid).accounts.push(acc);
    });
    return Array.from(map.values());
  }, [accounts]);

  // Live-filter by name or email; scroll to first match when search changes
  const filtered = useMemo(() => {
    if (!search.trim()) return grouped;
    const q = search.toLowerCase();
    return grouped.filter(
      (g) =>
        g.user?.name?.toLowerCase().includes(q) ||
        g.user?.email?.toLowerCase().includes(q)
    );
  }, [grouped, search]);

  // Scroll to the first filtered result whenever the search changes
  useEffect(() => {
    if (!search.trim() || filtered.length === 0) return;
    const firstId = filtered[0].user?._id;
    const el = sectionRefs.current[firstId];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [filtered, search]);

  return (
    <div className="min-h-screen bg-[#070B12] px-4 py-6 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Payment Methods</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {accounts.length} account{accounts.length !== 1 ? 's' : ''} across {grouped.length} user{grouped.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] px-4 py-3 flex items-center gap-3">
          <svg className="w-4 h-4 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user name or email..."
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder-slate-600"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-500 hover:text-slate-300 transition text-xs">
              Clear
            </button>
          )}
        </div>

        {error && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] px-5 py-10 text-center text-sm text-slate-500">
            {search ? `No users matching "${search}".` : 'No payment methods added yet.'}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((group) => {
              const uid = group.user?._id;
              return (
                <div
                  key={uid}
                  ref={(el) => { sectionRefs.current[uid] = el; }}
                  className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] overflow-hidden"
                >
                  {/* User header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60 bg-slate-800/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{group.user?.name || '—'}</p>
                        <p className="text-xs text-slate-500">{group.user?.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500">Balance</p>
                      <p className="text-sm font-bold text-white">${group.user?.balance?.toFixed(2) ?? '—'}</p>
                    </div>
                  </div>

                  {/* Accounts table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs text-slate-300">
                      <thead>
                        <tr className="text-left text-[10px] uppercase tracking-wider text-slate-600 border-b border-slate-800/60">
                          <th className="px-5 py-3">Account Holder</th>
                          <th className="px-5 py-3">Account Number</th>
                          <th className="px-5 py-3">Bank Branch</th>
                          <th className="px-5 py-3">IFSC Code</th>
                          <th className="px-5 py-3">Bank Name</th>
                          <th className="px-5 py-3">Added</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {group.accounts.map((acc) => (
                          <tr key={acc._id} className="hover:bg-slate-800/20 transition-colors">
                            <td className="px-5 py-3 font-semibold text-white whitespace-nowrap">{acc.name || '—'}</td>
                            <td className="px-5 py-3 font-mono whitespace-nowrap">{acc.accountNumber || '—'}</td>
                            <td className="px-5 py-3 text-slate-400 whitespace-nowrap">{acc.bankBranch || '—'}</td>
                            <td className="px-5 py-3 font-mono text-slate-400 whitespace-nowrap">{acc.ifscCode || '—'}</td>
                            <td className="px-5 py-3 text-slate-400 max-w-[200px] truncate">{acc.bankName || '—'}</td>
                            <td className="px-5 py-3 text-slate-600 whitespace-nowrap text-[11px]">
                              {new Date(acc.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Account count badge */}
                  <div className="px-5 py-2 border-t border-slate-800/40 flex items-center gap-1.5">
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                      {group.accounts.length} account{group.accounts.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPaymentMethodsPage;
