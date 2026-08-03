import { Trophy, Shield, Zap, Sparkles } from 'lucide-react';

export const FootballPitchSideHero = ({ 
  title = 'Where Champions Are Drafted', 
  subtitle = 'Manage team budgets, execute real-time podium bids, or track live player rosters with seamless precision.' 
}: { 
  title?: string;
  subtitle?: string 
}) => {
  return (
    <div className="relative h-full w-full flex flex-col justify-between p-8 xl:p-12 overflow-hidden bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 text-white border-r border-slate-800/80">
      {/* Stadium Lighting Radial Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/15 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-600/10 blur-[100px] rounded-full pointer-events-none" />

      {/* SVG Tactical Football Pitch Lines Overlay */}
      <svg
        className="absolute inset-0 w-full h-full opacity-20 pointer-events-none stroke-emerald-400"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 500 700"
        fill="none"
        strokeWidth="1.5"
      >
        {/* Pitch Boundary */}
        <rect x="25" y="25" width="450" height="650" rx="12" />
        {/* Halfway Line */}
        <line x1="25" y1="350" x2="475" y2="350" />
        {/* Center Circle & Spot */}
        <circle cx="250" cy="350" r="75" />
        <circle cx="250" cy="350" r="4" fill="currentColor" />
        {/* Penalty Area Top */}
        <rect x="125" y="25" width="250" height="130" />
        <rect x="175" y="25" width="150" height="50" />
        <circle cx="250" cy="100" r="3" fill="currentColor" />
        {/* Penalty Area Bottom */}
        <rect x="125" y="545" width="250" height="130" />
        <rect x="175" y="625" width="150" height="50" />
        <circle cx="250" cy="600" r="3" fill="currentColor" />
        {/* Corner Arcs */}
        <path d="M 25,45 A 20,20 0 0,0 45,25" />
        <path d="M 455,25 A 20,20 0 0,0 475,45" />
        <path d="M 25,655 A 20,20 0 0,1 45,675" />
        <path d="M 455,675 A 20,20 0 0,1 475,655" />
      </svg>

      {/* Header Logo */}
      <div className="relative z-10 flex items-center space-x-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-400 p-0.5 shadow-lg shadow-emerald-950/50 flex items-center justify-center">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-emerald-400 font-extrabold text-xl">
            ⚽
          </div>
        </div>
        <div>
          <span className="inline-block text-[10px] font-extrabold tracking-widest text-emerald-400 uppercase">
            Official Franchise Portal
          </span>
          <h3 className="font-extrabold text-lg text-white tracking-tight">UniFootball League</h3>
        </div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 my-auto py-8 space-y-6">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Next-Gen Auction Engine</span>
        </div>

        <h1 className="text-3xl lg:text-4xl xl:text-5xl font-black leading-tight tracking-tight text-white">
          {title.split('&')[0]} <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-teal-200">
            & {title.split('&')[1] || 'Crowned'}
          </span>
        </h1>

        <p className="text-sm text-slate-300/80 leading-relaxed max-w-md">
          {subtitle}
        </p>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Live Bidding</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Real-time socket updates</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Purse Math</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Smart cap validation</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
        <span>© {new Date().getFullYear()} UniFootball</span>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-emerald-400 font-medium">System Online</span>
        </div>
      </div>
    </div>
  );
};
