import React from 'react';
import { cn } from '../../utils/cn';

export interface PlayerPitchPositionProps {
  position: string;
  className?: string;
  compact?: boolean;
}

// Maps position codes to [x%, y%] on a vertical pitch (top = attack, bottom = defense)
const POSITION_COORDS: Record<string, { x: number; y: number }> = {
  'GK': { x: 50, y: 92 },
  
  // Defenders
  'CB': { x: 50, y: 80 },
  'LB': { x: 20, y: 75 },
  'RB': { x: 80, y: 75 },
  'DF': { x: 50, y: 78 },
  
  // Midfielders
  'CDM': { x: 50, y: 65 },
  'CM': { x: 50, y: 50 },
  'CAM': { x: 50, y: 35 },
  'MF': { x: 50, y: 50 },
  
  // Attackers
  'LW': { x: 20, y: 25 },
  'RW': { x: 80, y: 25 },
  'ST': { x: 50, y: 15 },
  'FW': { x: 50, y: 15 },
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
        "relative bg-emerald-600 rounded-sm border-2 border-white/80 overflow-hidden shadow-inner flex-shrink-0",
        compact ? "w-12 h-16" : "w-32 h-44 sm:w-40 sm:h-56",
        className
      )}
    >
      {/* Pitch Lines */}
      {/* Center Circle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-[25%] rounded-full border-2 border-white/40" />
      {/* Center Line */}
      <div className="absolute top-1/2 left-0 w-full h-px bg-white/40 -translate-y-1/2" />
      
      {/* Penalty Areas */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/6 border-2 border-t-0 border-white/40" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1/6 border-2 border-b-0 border-white/40" />
      
      {/* Goal Areas */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/4 h-[8%] border-2 border-t-0 border-white/40" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/4 h-[8%] border-2 border-b-0 border-white/40" />

      {/* The Player Dot */}
      <div 
        className={cn(
          "absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary flex items-center justify-center font-bold text-primary-foreground shadow-md transition-all duration-700 ease-out",
          compact ? "w-4 h-4 text-[8px]" : "w-8 h-8 text-xs border-2 border-background animate-pulse"
        )}
        style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
      >
        {!compact && position}
      </div>
    </div>
  );
};
