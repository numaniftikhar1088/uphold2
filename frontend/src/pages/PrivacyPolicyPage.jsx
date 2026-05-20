import { Link } from 'react-router-dom';

const sections = [
  {
    number: '01',
    title: 'Authorized Access',
    color: 'emerald',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    body: `Access to UPhold is strictly reserved for registered users who have created an account through a valid referral invitation. Our platform operates on an invite-only basis to maintain a trusted and secure trading environment.

Any unauthorized attempts to bypass our login security, brute-force credentials, or exploit authentication flows will result in a permanent ban of the offending IP address and may be reported to relevant cybercrime authorities. UPhold reserves the right to terminate any account that is found to have been created through fraudulent means or without a legitimate referral.

By accessing this platform, you confirm that you are the rightful owner of your account and that all registration information provided is accurate and up to date.`,
  },
  {
    number: '02',
    title: 'Trading Risk',
    color: 'amber',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
    body: `Cryptocurrency and digital asset trading involve a substantial degree of risk and are not suitable for every investor. The value of digital assets can fluctuate significantly within short periods, and you may lose some or all of your invested capital.

UPhold provides trading tools, market data, and execution capabilities solely as a service. We do not provide financial advice, and nothing on this platform should be construed as a recommendation to buy, sell, or hold any particular asset.

Before executing any live trade, you are strongly advised to assess your financial situation, understand market volatility, and only invest what you can afford to lose. Past performance of any asset displayed on UPhold is not indicative of future results.`,
  },
  {
    number: '03',
    title: 'Privacy & Data',
    color: 'cyan',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    body: `Your privacy is of paramount importance to UPhold. All data transmitted between your device and our servers is protected using 256-bit SSL encryption, ensuring that your login credentials, wallet addresses, and personal information remain confidential at all times.

We do not sell, rent, or share your personal data, transaction history, or wallet details with any third parties, advertisers, or external entities. Data collected during registration and account activity is used solely for the purpose of operating and improving the UPhold platform.

UPhold stores only the minimum data necessary to provide our services. You may request deletion of your personal data at any time by contacting our support team. Upon account closure, all personally identifiable information will be permanently removed from our systems within 30 days, except where retention is required by law.`,
  },
  {
    number: '04',
    title: 'Compliance',
    color: 'violet',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
    body: `Users of UPhold are solely responsible for ensuring compliance with all applicable local, national, and international regulations governing the trading of digital assets and cryptocurrencies in their jurisdiction. It is your obligation to determine whether using this platform is legal in your country of residence before registering or conducting any trades.

UPhold maintains a zero-tolerance policy toward fraudulent activity, money laundering, market manipulation, or any other conduct that violates applicable law. We reserve the right to suspend or permanently close accounts that are suspected of engaging in such activities, without prior notice and without liability.

By using UPhold, you agree to cooperate fully with any compliance or verification process we initiate, including identity verification (KYC). UPhold may be required by law to report suspicious activity to relevant financial authorities.`,
  },
];

const colorMap = {
  emerald: {
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon:  'bg-emerald-500/10 text-emerald-400',
    bar:   'bg-emerald-500',
  },
  amber: {
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    icon:  'bg-amber-500/10 text-amber-400',
    bar:   'bg-amber-500',
  },
  cyan: {
    badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    icon:  'bg-cyan-500/10 text-cyan-400',
    bar:   'bg-cyan-500',
  },
  violet: {
    badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    icon:  'bg-violet-500/10 text-violet-400',
    bar:   'bg-violet-500',
  },
};

const PrivacyPolicyPage = () => (
  <div className="min-h-screen bg-[#070B12] text-slate-100">

    {/* Header bar */}
    <div className="sticky top-0 z-40 border-b border-slate-800/60 bg-[#070B12]/95 backdrop-blur-xl px-4 py-3 flex items-center gap-3">
      <Link to="/" className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </Link>
      <span className="text-sm font-semibold text-white">Privacy Policy</span>
    </div>

    <div className="mx-auto max-w-2xl px-4 py-10 space-y-8">

      {/* Hero */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-slate-500">Legal</p>
        <h1 className="text-3xl font-black text-white">Privacy Policy</h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          This policy outlines the terms of access, risk disclosures, data handling practices, and compliance obligations for all users of the UPhold platform. By creating an account or using our services, you agree to the terms described below.
        </p>
        <p className="text-xs text-slate-600">Last updated: May 2026</p>
      </div>

      <div className="h-px bg-slate-800/60" />

      {/* Sections */}
      <div className="space-y-5">
        {sections.map((s) => {
          const c = colorMap[s.color];
          return (
            <div key={s.number} className="rounded-2xl bg-[#0D1421] ring-1 ring-white/[0.06] overflow-hidden">
              {/* Colored top bar */}
              <div className={`h-0.5 w-full ${c.bar}`} />

              <div className="p-5 space-y-3">
                {/* Section header */}
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${c.icon}`}>
                    {s.icon}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${c.badge}`}>
                      {s.number}
                    </span>
                    <h2 className="text-base font-bold text-white">{s.title}</h2>
                  </div>
                </div>

                {/* Body */}
                <div className="space-y-3 pl-11">
                  {s.body.trim().split('\n\n').map((para, i) => (
                    <p key={i} className="text-sm text-slate-400 leading-relaxed">
                      {para}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="rounded-2xl bg-slate-800/30 border border-slate-700/30 px-5 py-4 text-center space-y-1">
        <p className="text-xs text-slate-500">Questions about this policy?</p>
        <Link to="/chat" className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition">
          Contact Support →
        </Link>
      </div>

      <p className="text-center text-xs text-slate-700 pb-4">© 2026 UPhold. All rights reserved.</p>
    </div>
  </div>
);

export default PrivacyPolicyPage;
