import { Outlet, Link } from 'react-router-dom';
import { FootballPitchSideHero } from '../components/layout/FootballPitchSideHero';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-950 text-white font-sans overflow-x-hidden">
      {/* Left Hero Banner (7 cols on desktop, hidden on mobile) */}
      <div className="hidden lg:flex lg:col-span-7 h-full min-h-screen">
        <FootballPitchSideHero 
          title="Where Champions Are Drafted"
          subtitle="Manage team budgets, execute real-time podium bids, or track live player rosters with seamless precision."
        />
      </div>

      {/* Right Form Section (5 cols on desktop, 100% on mobile) */}
      <div className="lg:col-span-5 flex flex-col justify-center min-h-screen w-full max-w-2xl mx-auto p-6 md:p-10 lg:p-12 bg-slate-900/60 backdrop-blur-xl border-l border-slate-800/80">
        <div className="lg:hidden mb-6 text-center">
          <Link to="/" className="inline-flex items-center space-x-2 text-2xl font-black text-emerald-400">
            <span>⚽</span>
            <span>UniFootball</span>
          </Link>
        </div>
        <Outlet />
      </div>
    </div>
  );
};
