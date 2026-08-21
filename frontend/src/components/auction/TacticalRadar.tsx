import React from 'react';

interface TacticalRadarProps {
  primaryPos?: string;
}

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

export const TacticalRadar = React.memo(({ primaryPos }: TacticalRadarProps) => {
  const coords = getPitchCoords(primaryPos);

  return (
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
        TACTICAL RADAR: {primaryPos || 'CM'}
      </div>
    </div>
  );
});

TacticalRadar.displayName = 'TacticalRadar';
