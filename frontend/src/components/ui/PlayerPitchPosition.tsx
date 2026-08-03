import React from 'react';
import { cn } from '../../utils/cn';

export interface PlayerPitchPositionProps {
  position: string;
  className?: string;
  compact?: boolean;
}

// Maps position codes to [x%, y%] on a vertical pitch (top = attack, bottom = defense)
const POSITION_COORDS: Record<string, { x: number; y: number }> = {
  'GK': { x: 50, y: 88 },
  
  // Defenders
  'CB': { x: 50, y: 75 },
  'LB': { x: 22, y: 70 },
  'RB': { x: 78, y: 70 },
  'DF': { x: 50, y: 72 },
  
  // Midfielders
  'CDM': { x: 50, y: 60 },
  'CM': { x: 50, y: 48 },
  'CAM': { x: 50, y: 35 },
  'MF': { x: 50, y: 48 },
  
  // Attackers
  'LW': { x: 22, y: 24 },
  'RW': { x: 78, y: 24 },
  'ST': { x: 50, y: 16 },
  'FW': { x: 50, y: 16 },
};

export const PlayerPitchPosition: React.FC<PlayerPitchPositionProps> = ({ 
  position, 
  className,
  compact = false 
}) => {
  // Fallback to center if position not found
  const coords = POSITION_COORDS[position.toUpperCase()] || { x: 50, y: 50 };

  return (
    <div 
      className={cn(
        "relative bg-emerald-950/90 rounded-lg border border-emerald-500/50 overflow-hidden shadow-inner flex-shrink-0 backdrop-blur-sm",
        compact ? "w-11 h-14" : "w-32 h-44 sm:w-40 sm:h-56",
        className
      )}
    >
      {/* Pitch Lines */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-[25%] rounded-full border border-emerald-400/30" />
      <div className="absolute top-1/2 left-0 w-full h-px bg-emerald-400/30 -translate-y-1/2" />
      
      {/* Penalty Areas */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/6 border border-t-0 border-emerald-400/30" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1/6 border border-b-0 border-emerald-400/30" />

      {/* Pulsing Tactical Dot */}
      <div 
        className={cn(
          "absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400 flex items-center justify-center font-bold text-slate-950 shadow-[0_0_10px_rgba(52,211,153,0.9)] animate-pulse border border-white",
          compact ? "w-3.5 h-3.5" : "w-8 h-8 text-xs border-2 border-background"
        )}
        style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
      >
        {!compact && position}
      </div>
    </div>
  );
};
