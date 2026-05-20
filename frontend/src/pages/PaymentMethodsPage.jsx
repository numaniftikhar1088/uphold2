import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bankService from '../services/bankService';
import { useAuth } from '../context/AuthContext';
import KycGateModal from '../components/KycGateModal';

const EMPTY_FORM = { name: '', accountNumber: '', bankName: '', bankBranch: '', ifscCode: '', transactionPassword: '' };

const PaymentMethodsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    bankService.getMyBankAccounts()
      .then(({ accounts: list }) => setAccounts(list))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAdd = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.name || !form.accountNumber) { setError('Name and account number are required.'); return; }
    if (!form.transactionPassword) { setError('Transaction password is required.'); return; }
    setSaving(true);
    try {
      const { account } = await bankService.addBankAccount(form);
      setAccounts((prev) => [account, ...prev]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      setSuccess('Bank account added successfully.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to add bank account.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this bank account?')) return;
    try {
      await bankService.deleteBankAccount(id);
      setAccounts((prev) => prev.filter((a) => a._id !== id));
    } catch {
      setError('Failed to remove account.');
    }
  };

  const inputClass = 'w-full rounded-xl border border-slate-700/60 bg-slate-800/50 px-3.5 py-3 text-sm text-slate-100 outline-none focus:border-emerald-500 placeholder-slate-600 transition';

  const kycBlocked = user?.kycStatus !== 'verified';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {kycBlocked && <KycGateModal status={user?.kycStatus} />}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
        <button onClick={() => navigate(-1)} className="p-1 text-slate-400 hover:text-white transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-base font-semibold">Payment Methods</span>
        <button
          onClick={() => { setShowForm((v) => !v); setError(''); setSuccess(''); }}
          className="rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition"
        >
          {showForm ? 'Cancel' : '+ Add New'}
        </button>
      </div>

      <div className="px-4 py-6 space-y-4 max-w-lg mx-auto">

        {/* Global messages */}
        {error   && <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}
        {success && <div className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">{success}</div>}

        {/* Add New form */}
        {showForm && (
          <div className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white">Add New</h2>

            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Name</label>
                <input name="name" value={form.name} onChange={handleChange}
                  placeholder="Enter the name" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Account Number</label>
                <input name="accountNumber" value={form.accountNumber} onChange={handleChange}
                  placeholder="Enter Bank Account Number" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Bank Name</label>
                <input name="bankName" value={form.bankName} onChange={handleChange}
                  placeholder="Enter Bank Name" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Bank Branch</label>
                <input name="bankBranch" value={form.bankBranch} onChange={handleChange}
                  placeholder="Enter Bank Branch" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">IFSC Code</label>
                <input name="ifscCode" value={form.ifscCode} onChange={handleChange}
                  placeholder="Please enter IFSC Code" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Transaction Password</label>
                <input type="password" name="transactionPassword" value={form.transactionPassword}
                  onChange={handleChange} placeholder="Please enter the transaction password" className={inputClass} />
              </div>

              {error && <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition mt-2"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </form>
          </div>
        )}

        {/* Saved accounts list */}
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading...</div>
        ) : accounts.length === 0 && !showForm ? (
          <div className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] p-8 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm">No payment methods added yet.</p>
            <button
              onClick={() => setShowForm(true)}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition"
            >
              Add your first bank account
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((acct) => (
              <div key={acct._id} className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{acct.name}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        {'•'.repeat(Math.max(0, acct.accountNumber.length - 4))}{acct.accountNumber.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(acct._id)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Details */}
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs border-t border-slate-800/60 pt-3">
                  {acct.bankName && (
                    <div>
                      <span className="text-slate-600">Bank</span>
                      <p className="text-slate-300 mt-0.5">{acct.bankName}</p>
                    </div>
                  )}
                  {acct.bankBranch && (
                    <div>
                      <span className="text-slate-600">Branch</span>
                      <p className="text-slate-300 mt-0.5">{acct.bankBranch}</p>
                    </div>
                  )}
                  {acct.ifscCode && (
                    <div>
                      <span className="text-slate-600">IFSC</span>
                      <p className="text-slate-300 font-mono mt-0.5">{acct.ifscCode}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentMethodsPage;
