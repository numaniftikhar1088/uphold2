import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import requestService from '../services/requestService';
import bankService from '../services/bankService';
import KycGateModal from '../components/KycGateModal';

const TRANSACTION_FEE = 3.00;
const CHAINS = ['TRC-20', 'BEP-20'];

const WithdrawPage = () => {
  const { user, token } = useAuth();

  const [method, setMethod]                         = useState('crypto'); // 'crypto' | 'bank'
  const [chain, setChain]                           = useState('TRC-20');
  const [withdrawalAddress, setWithdrawalAddress]   = useState('');
  const [amount, setAmount]                         = useState('');
  const [transactionPassword, setTransactionPassword] = useState('');
  const [error, setError]                           = useState('');
  const [success, setSuccess]                       = useState('');
  const [requests, setRequests]                     = useState([]);
  const [loading, setLoading]                       = useState(false);
  const [submitting, setSubmitting]                 = useState(false);

  const [bankAccounts, setBankAccounts]   = useState([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [loadingBanks, setLoadingBanks]   = useState(false);
  const [banksLoaded, setBanksLoaded]     = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    requestService.getMyWithdraws()
      .then(({ withdraws }) => setRequests(withdraws))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const loadBankAccounts = () => {
    if (banksLoaded) return;
    setLoadingBanks(true);
    bankService.getMyBankAccounts()
      .then(({ accounts }) => {
        setBankAccounts(accounts);
        if (accounts.length > 0) setSelectedBankId(accounts[0]._id);
      })
      .catch(console.error)
      .finally(() => { setLoadingBanks(false); setBanksLoaded(true); });
  };

  const handleMethodChange = (m) => {
    setMethod(m);
    setError(''); setSuccess('');
    if (m === 'bank') loadBankAccounts();
  };

  const handleAll = () => setAmount(Math.max(0, (user?.balance || 0) - TRANSACTION_FEE).toFixed(2));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const value = Number(amount);
    if (!value || value <= 0) { setError('Enter a valid amount.'); return; }
    if (!transactionPassword) { setError('Transaction password is required.'); return; }

    if (method === 'bank' && !selectedBankId) { setError('Please select a bank account.'); return; }
    if (method === 'crypto' && !withdrawalAddress.trim()) { setError('Withdrawal address is required.'); return; }

    setSubmitting(true);
    try {
      let withdraw;
      if (method === 'bank') {
        ({ withdraw } = await requestService.createBankWithdraw(value, selectedBankId, transactionPassword));
      } else {
        ({ withdraw } = await requestService.createWithdraw(value, chain, withdrawalAddress, transactionPassword));
      }
      setSuccess('Withdrawal request submitted successfully.');
      setRequests((prev) => [withdraw, ...prev]);
      setAmount(''); setWithdrawalAddress(''); setTransactionPassword('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to submit withdrawal request.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusStyle = (s) =>
    s === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
    s === 'rejected' ? 'bg-red-500/20 text-red-400' :
    'bg-amber-500/20 text-amber-400';

  const inputClass = 'w-full bg-transparent text-sm text-white outline-none placeholder-slate-600';

  const kycBlocked = user?.kycStatus !== 'verified';

  return (
    <div className="min-h-screen bg-[#070B12] px-3 py-5 text-slate-100 md:px-5 md:py-7">
      {kycBlocked && <KycGateModal status={user?.kycStatus} />}
      <div className="mx-auto max-w-lg space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Finance</p>
            <h1 className="mt-0.5 text-xl font-bold text-white">Withdraw</h1>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500">Available</p>
            <p className="text-lg font-bold text-white">${user?.balance?.toFixed(2)}</p>
          </div>
        </div>

        {/* Method selector */}
        <div className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] px-5 py-4 space-y-3">
          <p className="text-sm font-semibold text-white">Withdrawal Method</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleMethodChange('crypto')}
              className={`rounded-2xl px-5 py-2 text-sm font-bold transition ${
                method === 'crypto'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-800/70 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Crypto
            </button>
            <button
              type="button"
              onClick={() => handleMethodChange('bank')}
              className={`rounded-2xl px-5 py-2 text-sm font-bold transition ${
                method === 'bank'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-800/70 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Bank Transfer
            </button>
          </div>
        </div>

        {/* Form card */}
        <div className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] overflow-hidden">

          {error   && <div className="px-5 pt-4"><div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div></div>}
          {success && <div className="px-5 pt-4"><div className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">{success}</div></div>}

          <form onSubmit={handleSubmit} className="divide-y divide-slate-800/60">

            {method === 'crypto' ? (
              <>
                {/* Chain selector */}
                <div className="px-5 py-4 space-y-3">
                  <p className="text-sm font-semibold text-white">Select Chain</p>
                  <div className="flex gap-2">
                    {CHAINS.map((c) => (
                      <button
                        key={c} type="button"
                        onClick={() => setChain(c)}
                        className={`rounded-2xl px-5 py-2 text-sm font-bold transition ${
                          chain === c
                            ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                            : 'bg-slate-800/70 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Withdrawal address */}
                <div className="px-5 py-4 space-y-2">
                  <p className="text-sm font-semibold text-white">Withdrawal Address</p>
                  <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 px-4 py-3">
                    <input
                      value={withdrawalAddress}
                      onChange={(e) => setWithdrawalAddress(e.target.value)}
                      placeholder="Enter or Paste Wallet Address Here"
                      className={inputClass}
                    />
                  </div>
                </div>
              </>
            ) : (
              /* Bank account selection */
              <div className="px-5 py-4 space-y-3">
                <p className="text-sm font-semibold text-white">Select Bank Account</p>
                {loadingBanks ? (
                  <p className="text-sm text-slate-500">Loading bank accounts...</p>
                ) : bankAccounts.length === 0 ? (
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 space-y-1">
                    <p className="text-sm text-amber-400">No bank accounts found.</p>
                    <Link to="/profile/payments" className="text-xs text-amber-300 underline hover:text-white transition">
                      Add a payment method
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bankAccounts.map((acc) => (
                      <button
                        key={acc._id}
                        type="button"
                        onClick={() => setSelectedBankId(acc._id)}
                        className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                          selectedBankId === acc._id
                            ? 'border-emerald-500/50 bg-emerald-500/10'
                            : 'border-slate-700/40 bg-slate-800/40 hover:border-slate-500'
                        }`}
                      >
                        <p className="text-sm font-semibold text-white">{acc.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Account: {acc.accountNumber}</p>
                        {acc.bankBranch  && <p className="text-xs text-slate-500">Branch: {acc.bankBranch}</p>}
                        {acc.ifscCode    && <p className="text-xs text-slate-500">IFSC: {acc.ifscCode}</p>}
                        {acc.bankName    && <p className="text-xs text-slate-500">{acc.bankName}</p>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Amount */}
            <div className="px-5 py-4 space-y-2">
              <p className="text-sm font-semibold text-white">Amount</p>
              <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 px-4 py-3">
                <div className="flex items-center gap-2">
                  <input
                    type="number" step="any" min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Please Enter the Amount"
                    className={`${inputClass} flex-1`}
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-slate-400 font-mono">USDT</span>
                    <span className="text-slate-700">|</span>
                    <button type="button" onClick={handleAll}
                      className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition">
                      All
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Available Amount: <span className="font-semibold text-slate-300">{(user?.balance || 0).toFixed(6)} USDT</span>
                </p>
              </div>
            </div>

            {/* Transaction fee */}
            <div className="px-5 py-3.5 flex items-center justify-between">
              <p className="text-sm text-slate-400">Transaction Fee</p>
              <p className="text-sm font-bold text-emerald-400">{TRANSACTION_FEE.toFixed(2)} <span className="text-slate-400">USDT</span></p>
            </div>

            {/* Transaction password */}
            <div className="px-5 py-4 space-y-2">
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-sm font-semibold text-white">Transaction Password</p>
              </div>
              <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 px-4 py-3">
                <input
                  type="password" value={transactionPassword}
                  onChange={(e) => setTransactionPassword(e.target.value)}
                  placeholder="Enter your transaction password"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="px-5 py-3 space-y-1">
              <p className="text-xs text-slate-500">1. Make sure your account has completed identity verification.</p>
              <p className="text-xs text-slate-500">2. Make sure to use a secure network environment to prevent account theft.</p>
            </div>

            {/* Submit */}
            <div className="px-5 py-4">
              <button
                type="submit" disabled={submitting}
                className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-400 py-3.5 text-sm font-bold text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {submitting ? 'Submitting...' : 'Withdraw'}
              </button>
            </div>

          </form>
        </div>

        {/* History */}
        <section className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Withdrawal History</h2>
            <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] text-slate-400">{requests.length} requests</span>
          </div>
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-slate-500">No withdrawal requests yet.</p>
          ) : (
            <div className="space-y-2">
              {requests.map((r) => (
                <div key={r._id} className="rounded-xl bg-slate-800/30 border border-slate-800/60 px-4 py-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {r.withdrawMethod === 'bank' ? (
                        <span className="rounded-lg bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold text-blue-400">Bank</span>
                      ) : (
                        <span className="rounded-lg bg-slate-700/60 px-2 py-0.5 text-[10px] font-bold text-slate-300">{r.chain || '—'}</span>
                      )}
                      <span className="font-semibold text-white text-sm">${r.amount.toFixed(2)}</span>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyle(r.status)}`}>
                      {r.status}
                    </span>
                  </div>
                  {r.withdrawMethod === 'bank' && r.bankAccountSnapshot ? (
                    <p className="text-[11px] text-slate-400">{r.bankAccountSnapshot.name} · {r.bankAccountSnapshot.accountNumber}</p>
                  ) : r.withdrawalAddress ? (
                    <p className="text-[11px] text-slate-600 font-mono truncate">{r.withdrawalAddress}</p>
                  ) : null}
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-slate-600">{new Date(r.createdAt).toLocaleString()}</p>
                    {r.note && <p className="text-[11px] text-slate-500 italic">{r.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default WithdrawPage;
