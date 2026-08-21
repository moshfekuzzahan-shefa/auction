import React, { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { useSocketContext } from '../../providers/SocketProvider';

interface LiveCountdownProps {
  initialTimer?: number;
}

export const LiveCountdown = React.memo(({ initialTimer = 30 }: LiveCountdownProps) => {
  const { socket } = useSocketContext();
  const [timer, setTimer] = useState(initialTimer);

  useEffect(() => {
    // Sync initial timer
    setTimer(initialTimer);
  }, [initialTimer]);

  useEffect(() => {
    if (!socket) return;

    const handleTick = ({ timer: newTimer }: any) => {
      setTimer(newTimer);
    };

    socket.on('TIMER_TICK', handleTick);
    socket.on('timer_tick', handleTick);

    return () => {
      socket.off('TIMER_TICK', handleTick);
      socket.off('timer_tick', handleTick);
    };
  }, [socket]);

  // Timer Color Class
  const getTimerColorClass = (t: number) => {
    if (t <= 5) return 'text-red-400 bg-red-950/80 border-red-600 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.6)]';
    if (t <= 12) return 'text-amber-400 bg-amber-950/70 border-amber-600 shadow-[0_0_20px_rgba(245,158,11,0.4)]';
    return 'text-emerald-400 bg-slate-950/90 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]';
  };

  return (
    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
      <div className="flex items-center gap-2">
        <Flame className="w-5 h-5 text-amber-400 animate-bounce" />
        <span className="text-xs font-black uppercase text-slate-300 tracking-wider">AUCTION TIMER</span>
      </div>
      <div className={`text-2xl font-mono font-black px-4 py-1 rounded-xl border transition-all ${getTimerColorClass(timer)}`}>
        00:{timer.toString().padStart(2, '0')}
      </div>
    </div>
  );
});

LiveCountdown.displayName = 'LiveCountdown';
