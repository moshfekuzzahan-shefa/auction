import React from 'react';

interface PlayerAttributesCardProps {
  overall?: number;
  pace?: number;
  passing?: number;
  dribbling?: number;
  stamina?: number;
}

export const PlayerAttributesCard = React.memo(({ 
  overall = 88, 
  pace = 87, 
  passing = 85, 
  dribbling = 90, 
  stamina = 89 
}: PlayerAttributesCardProps) => {
  return (
    <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 flex justify-between">
        <span>ATTRIBUTES RATINGS</span>
        <span className="text-emerald-400 font-bold">OVERALL: {overall}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="flex justify-between text-[11px] text-slate-300 font-semibold mb-0.5">
            <span>Pace / Speed</span>
            <span className="text-emerald-400 font-bold">{pace}</span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pace}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-slate-300 font-semibold mb-0.5">
            <span>Passing & Vision</span>
            <span className="text-emerald-400 font-bold">{passing}</span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${passing}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-slate-300 font-semibold mb-0.5">
            <span>Dribbling</span>
            <span className="text-emerald-400 font-bold">{dribbling}</span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${dribbling}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-slate-300 font-semibold mb-0.5">
            <span>Stamina</span>
            <span className="text-emerald-400 font-bold">{stamina}</span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${stamina}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
});

PlayerAttributesCard.displayName = 'PlayerAttributesCard';
