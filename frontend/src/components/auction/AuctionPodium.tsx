import { useEffect, useState } from 'react';
import { Badge } from '../ui/Badge';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Trophy, Gavel, Shield, Activity, Flame, ArrowUpRight, Zap, Crown } from 'lucide-react';
import { getCategoryTheme } from '../../utils/categoryTheme';

interface AuctionPodiumProps {
  auctionState: any;
  teams?: any[];
  userRole?: string;
  myTeam?: any;
  onPlaceBid?: (amount: number) => void;
  isReadOnly?: boolean;
}

export const AuctionPodium = ({
  auctionState,
  teams = [],
  userRole,
  myTeam,
  onPlaceBid,
  isReadOnly = false
}: AuctionPodiumProps) => {
  const [bidPulse, setBidPulse] = useState(false);
  const [bidHistory, setBidHistory] = useState<Array<{ teamName: string; amount: number; time: string }>>([]);

  const currentPlayer = auctionState?.currentPlayer;
  const currentBid = auctionState?.currentBid || 0;
  const timer = auctionState?.timer ?? 30;
  const status = auctionState?.status || 'IDLE';
  const currentLeaderId = auctionState?.currentLeaderId;
  const nextValidBid = auctionState?.nextValidBid || currentBid + 50;

  const categoryTheme = getCategoryTheme(currentPlayer?.category?.name);
  const leadingTeam = teams.find((t) => t.id === currentLeaderId);

  // Trigger pulse animation and history ticker on new bid
  useEffect(() => {
    if (currentBid > 0 && leadingTeam) {
      setBidPulse(true);
      const timer = setTimeout(() => setBidPulse(false), 600);

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setBidHistory((prev) => [
        { teamName: leadingTeam.name, amount: currentBid, time: timeStr },
        ...prev.slice(0, 9)
      ]);

      return () => clearTimeout(timer);
    }
  }, [currentBid, currentLeaderId]);

  // Position coordinates on 2D tactical pitch
  const getPitchCoords = (pos: string = 'CM') => {
    const code = pos.toUpperCase();
    if (code.includes('GK')) return { top: '82%', left: '50%' };
    if (code.includes('CB')) return { top: '68%', left: '50%' };
    if (code.includes('LB')) return { top: '68%', left: '20%' };
    if (code.includes('RB')) return { top: '68%', left: '80%' };
    if (code.includes('LW')) return { top: '28%', left: '22%' };
    if (code.includes('RW')) return { top: '28%', left: '78%' };
    if (code.includes('ST') || code.includes('CF')) return { top: '20%', left: '50%' };
    return { top: '48%', left: '50%' }; // Midfield CM/CAM/CDM
  };

  const coords = getPitchCoords(currentPlayer?.primaryPos);

  // Timer Color Class
  const getTimerColorClass = (t: number) => {
    if (t <= 5) return 'text-red-400 bg-red-950/80 border-red-600 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.6)]';
    if (t <= 12) return 'text-amber-400 bg-amber-950/70 border-amber-600 shadow-[0_0_20px_rgba(245,158,11,0.4)]';
    return 'text-emerald-400 bg-slate-950/90 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]';
  };

  if (status === 'IDLE' || !currentPlayer) {
    return (
      <div className="w-full min-h-[500px] bg-slate-950/90 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/10 via-transparent to-emerald-900/10 pointer-events-none" />
        <div className="w-20 h-20 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center text-4xl shadow-inner animate-pulse">
          ⚽
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight">Stage Prepared • Waiting For Next Lot</h2>
        <p className="text-slate-400 text-sm max-w-md">
          The auctioneer will initiate the next player lot onto the TV Broadcast Podium shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      
      {/* Dynamic Glassmorphic Broadcast Stage Container */}
      <div className={`relative rounded-3xl border-2 ${categoryTheme.border} ${categoryTheme.glow} bg-slate-950/95 overflow-hidden shadow-2xl transition-all duration-500 backdrop-blur-2xl p-4 md:p-6`}>
        
        {/* Ambient Tier Spotlight Aura */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/90 to-slate-950 pointer-events-none z-0" />
        <div className={`absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b ${categoryTheme.bgGradient} opacity-30 blur-3xl pointer-events-none z-0`} />

        {/* Studio Grid (Split 3-Column Layout) */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* LEFT PANEL: 3D FIFA Shield Player Card (3.5 Cols) */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center bg-slate-900/80 p-5 rounded-2xl border border-slate-800/80 shadow-2xl relative group">
            
            {/* Tier Spotlight Badge */}
            <div className="w-full flex justify-between items-center mb-3">
              <Badge variant="outline" className={`${categoryTheme.badge} font-black text-xs px-3 py-1 uppercase tracking-wider shadow-md`}>
                {currentPlayer.category?.name || 'Unassigned'} Tier
              </Badge>
              <span className="text-[10px] font-black tracking-widest text-slate-500 font-mono">FUT CARD #01</span>
            </div>

            {/* 3D Shield Player Avatar */}
            <div className={`w-44 h-44 md:w-52 md:h-52 rounded-full border-4 ${categoryTheme.border} ${categoryTheme.glow} bg-slate-950 p-1 shadow-2xl overflow-hidden relative group-hover:scale-105 transition-transform duration-500`}>
              {currentPlayer.publicId ? (
                <img src={currentPlayer.publicId} alt={currentPlayer.user?.name} className="w-full h-full object-cover rounded-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl text-slate-700 bg-slate-900 rounded-full">⚽</div>
              )}
            </div>

            {/* Player Main Info */}
            <div className="text-center mt-4 space-y-1">
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">{currentPlayer.user?.name}</h2>
              <p className="text-xs text-slate-400 font-semibold">
                ID: {currentPlayer.studentId || 'N/A'} • {currentPlayer.academicSession}
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Badge variant="default" className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black px-3 py-1">
                  {currentPlayer.primaryPos}
                </Badge>
                <Badge variant="outline" className="bg-slate-950 text-slate-300 border-slate-800 text-xs font-mono font-bold px-3 py-1">
                  Base: ${currentPlayer.category?.basePrice || 250}
                </Badge>
              </div>
            </div>
          </div>

          {/* CENTER PANEL: Holographic Tactical Pitch & Stat Matrix (4.5 Cols) */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
            
            {/* Holographic Mini Field Graphic */}
            <div className="relative w-full h-44 bg-emerald-950/40 border-2 border-emerald-500/30 rounded-xl overflow-hidden shadow-inner flex flex-col justify-between p-2">
              <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:12px_12px] opacity-20 pointer-events-none" />
              
              {/* Field Markings */}
              <div className="w-full h-full border border-emerald-500/20 rounded-lg relative">
                {/* Halfway Line */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-emerald-500/30" />
                {/* Center Circle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full border border-emerald-500/30" />
                
                {/* Radar Dot for Player Position */}
                <div 
                  className="absolute w-4 h-4 bg-emerald-400 rounded-full border-2 border-white shadow-[0_0_15px_#10b981] animate-ping"
                  style={{ top: coords.top, left: coords.left, transform: 'translate(-50%, -50%)' }}
                />
                <div 
                  className="absolute w-4 h-4 bg-emerald-400 rounded-full border-2 border-white shadow-[0_0_15px_#10b981]"
                  style={{ top: coords.top, left: coords.left, transform: 'translate(-50%, -50%)' }}
                />
              </div>

              <div className="absolute bottom-2 left-3 text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                TACTICAL RADAR: {currentPlayer.primaryPos}
              </div>
            </div>

            {/* Skill Matrix / Attribute Bars */}
            <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 flex justify-between">
                <span>ATTRIBUTES RATINGS</span>
                <span className="text-emerald-400 font-bold">OVERALL: 88</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 font-semibold mb-0.5">
                    <span>Pace / Speed</span>
                    <span className="text-emerald-400 font-bold">87</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full w-[87%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 font-semibold mb-0.5">
                    <span>Passing & Vision</span>
                    <span className="text-emerald-400 font-bold">85</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full w-[85%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 font-semibold mb-0.5">
                    <span>Dribbling</span>
                    <span className="text-emerald-400 font-bold">90</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full w-[90%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 font-semibold mb-0.5">
                    <span>Stamina</span>
                    <span className="text-emerald-400 font-bold">89</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full w-[89%]" />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT PANEL: Broadcast Bidding Engine & Live Countdown (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800/80 shadow-2xl">
            
            {/* Live Countdown Timer */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400 animate-bounce" />
                <span className="text-xs font-black uppercase text-slate-300 tracking-wider">AUCTION TIMER</span>
              </div>
              <div className={`text-2xl font-mono font-black px-4 py-1 rounded-xl border transition-all ${getTimerColorClass(timer)}`}>
                00:{timer.toString().padStart(2, '0')}
              </div>
            </div>

            {/* Current Highest Bid Typography */}
            <div className="text-center space-y-1 my-auto">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">CURRENT HIGHEST BID</span>
              <div className={`text-4xl lg:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 transition-transform duration-300 ${bidPulse ? 'scale-110' : 'scale-100'}`}>
                ${currentBid.toLocaleString()}
              </div>

              {/* Leading Team Display */}
              {leadingTeam ? (
                <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold shadow-lg animate-fade-in">
                  <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Leading: <span className="text-white font-extrabold">{leadingTeam.name}</span></span>
                </div>
              ) : (
                <p className="text-xs text-slate-500 font-semibold pt-1">No bids placed yet • Base Price Opening</p>
              )}
            </div>

            {/* Bidding Action Button for Managers */}
            {!isReadOnly && userRole === 'TEAM_MANAGER' && status === 'ACTIVE' && onPlaceBid && (
              <div className="pt-2">
                <Button 
                  size="lg"
                  onClick={() => onPlaceBid(nextValidBid)}
                  className="w-full h-12 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 border border-emerald-400/40"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Raise Bid to ${nextValidBid.toLocaleString()}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* BOTTOM TICKER BAR: Real-Time Bid Stream Ticker */}
      <div className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl p-2.5 px-4 flex items-center gap-3 overflow-hidden shadow-inner">
        <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-400 shrink-0 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-700/50">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>BID TICKER</span>
        </div>

        <div className="flex-1 overflow-x-auto whitespace-nowrap scrollbar-none text-xs text-slate-300 flex items-center gap-6 font-medium">
          {bidHistory.length > 0 ? (
            bidHistory.map((item, idx) => (
              <span key={idx} className="inline-flex items-center gap-1.5 shrink-0 bg-slate-900/60 px-3 py-1 rounded-md border border-slate-800">
                <span className="text-emerald-400 font-bold">{item.teamName}</span>
                <span className="text-slate-400">bid</span>
                <span className="text-white font-black">${item.amount.toLocaleString()}</span>
                <span className="text-[10px] text-slate-500">({item.time})</span>
              </span>
            ))
          ) : (
            <span className="text-slate-500 italic">Waiting for incoming bids from team managers...</span>
          )}
        </div>
      </div>

    </div>
  );
};
