export const FootballPitchSideHero = ({ subtitle = 'Enter your credentials to manage teams, bid live, or view real-time player draft profiles.' }: { subtitle?: string }) => {
  return (
    <div className="relative hidden lg:flex flex-col justify-between p-10 overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-950 text-white rounded-l-2xl border-r border-emerald-800/40">
      {/* Stadium Floodlights Glow Effect */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-400/15 blur-3xl rounded-full pointer-events-none" />

      {/* SVG Tactical Football Field Background Overlay */}
      <svg
        className="absolute inset-0 w-full h-full opacity-15 pointer-events-none stroke-emerald-200"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 400 600"
        fill="none"
        strokeWidth="2"
      >
        {/* Pitch Outer Boundary */}
        <rect x="20" y="20" width="360" height="560" rx="8" />
        {/* Halfway Line */}
        <line x1="20" y1="300" x2="380" y2="300" />
        {/* Center Circle & Spot */}
        <circle cx="200" cy="300" r="60" />
        <circle cx="200" cy="300" r="4" fill="currentColor" />
        {/* Penalty Area Top */}
        <rect x="100" y="20" width="200" height="100" />
        <rect x="140" y="20" width="120" height="40" />
        <circle cx="200" cy="80" r="3" fill="currentColor" />
        {/* Penalty Area Bottom */}
        <rect x="100" y="480" width="200" height="100" />
        <rect x="140" y="540" width="120" height="40" />
        <circle cx="200" cy="520" r="3" fill="currentColor" />
      </svg>

      {/* Top Header Badge */}
      <div className="relative z-10 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-950/50">
          ⚽
        </div>
        <div>
          <h3 className="font-extrabold tracking-wider text-emerald-400 uppercase text-xs">University League</h3>
          <p className="font-bold text-lg text-white tracking-wide">UniFootball Platform</p>
        </div>
      </div>

      {/* Middle Hero Graphics & Text */}
      <div className="relative z-10 my-auto space-y-6">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Real-time Bidding & Roster Manager</span>
        </div>

        <h1 className="text-3xl xl:text-4xl font-black leading-tight tracking-tight text-white drop-shadow-md">
          Where Champions <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-green-300 to-teal-200">
            Are Drafted & Crowned
          </span>
        </h1>

        <p className="text-sm text-emerald-100/80 leading-relaxed max-w-sm">
          {subtitle}
        </p>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-emerald-900/40 border border-emerald-700/30 backdrop-blur-sm">
            <div className="text-xs text-emerald-300 font-medium">Auction System</div>
            <div className="text-sm font-bold text-white mt-0.5">Live Podium</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-900/40 border border-emerald-700/30 backdrop-blur-sm">
            <div className="text-xs text-emerald-300 font-medium">Franchise Teams</div>
            <div className="text-sm font-bold text-white mt-0.5">Smart Purse Math</div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 pt-6 border-t border-emerald-800/40 flex items-center justify-between text-xs text-emerald-300/80">
        <span>© {new Date().getFullYear()} UniFootball</span>
        <span className="flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Live Match Ready</span>
        </span>
      </div>
    </div>
  );
};
