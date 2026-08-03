import { Card, CardContent } from './Card';
import { Badge } from './Badge';
import { Avatar } from './Avatar';
import { PlayerPitchPosition } from './PlayerPitchPosition';
import { getCategoryTheme } from '../../utils/categoryTheme';
import { Trophy, Shield } from 'lucide-react';

interface PlayerCardProps {
  player: any;
  categories: any[];
  onSelectPlayer: (player: any) => void;
  onCategoryChange: (profileId: string, categoryId: string) => void;
}

export const PlayerCard = ({
  player,
  categories,
  onSelectPlayer,
  onCategoryChange
}: PlayerCardProps) => {
  const theme = getCategoryTheme(player.category?.name);
  const secondaryPosList = player.secondaryPos && Array.isArray(player.secondaryPos) 
    ? player.secondaryPos.filter((p: string) => p && p !== player.primaryPos)
    : [];

  return (
    <Card 
      className={`transition-all duration-300 group overflow-hidden bg-gradient-to-br ${theme.bgGradient} ${theme.border} ${theme.glow} border-2 rounded-3xl shadow-2xl relative flex flex-col justify-between hover:-translate-y-1 hover:shadow-2xl`}
    >
      {/* Gloss / Shimmer Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-0" />

      <div className="relative z-10">
        {/* 1. FUT Header Row: Tactical Mini Pitch (Left) & Category Badge (Right) */}
        <div className="flex items-center justify-between p-3.5 border-b border-white/10 bg-slate-950/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <PlayerPitchPosition position={player.primaryPos} compact className="shadow-md border-emerald-400/60" />
            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase hidden sm:inline-block">FUT CARD</span>
          </div>
          
          {player.category ? (
            <Badge variant="outline" className={`${theme.badge} font-black text-xs px-2.5 py-1 shadow-md tracking-wide uppercase`}>
              {player.category.name} (${player.category.basePrice})
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-slate-900/90 text-slate-400 border-slate-700 font-bold text-[10px] px-2 py-0.5">
              Unassigned Tier
            </Badge>
          )}
        </div>

        {/* 2. Centered Avatar Photo with Tier Metallic Rim Ring */}
        <div 
          className="pt-4 pb-2 px-4 flex flex-col items-center cursor-pointer group"
          onClick={() => onSelectPlayer(player)}
        >
          <div className={`w-20 h-20 rounded-full border-2 ${theme.border} bg-slate-950 p-0.5 shadow-2xl overflow-hidden flex justify-center items-center ${theme.glow} group-hover:scale-105 transition-transform duration-300`}>
            <Avatar 
              src={player.imageUrl || player.publicId} 
              alt={player.user?.name} 
              fallback={player.user?.name?.charAt(0)}
              size="xl" 
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        </div>

        {/* 3. Player Identity & Tactical Position Badges */}
        <CardContent className="pt-1 px-4 pb-3 text-center space-y-2 cursor-pointer" onClick={() => onSelectPlayer(player)}>
          <div>
            <h3 className={`font-black text-xl tracking-tight leading-tight truncate px-1 ${theme.accentText}`}>
              {player.user?.name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-semibold">
              {player.jerseyName ? `${player.jerseyName} • ` : ''}ID: {player.studentId || 'N/A'}
            </p>
          </div>
          
          {/* Primary Position Badge & Secondary Position Tags */}
          <div className="flex flex-col items-center gap-1.5 pt-1">
            <div className="flex items-center gap-1.5">
              <Badge variant="default" className="text-xs font-black bg-slate-950 text-emerald-400 border border-emerald-500/40 px-3 py-0.5 shadow-inner">
                {player.primaryPos}
              </Badge>
              {player.isSold && (
                <Badge variant="secondary" className="bg-emerald-950/90 text-emerald-300 border-emerald-700/60 text-[10px] font-bold px-2 py-0.5 flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-emerald-400" />
                  <span>{player.team?.name}</span>
                </Badge>
              )}
            </div>

            {secondaryPosList.length > 0 && (
              <p className="text-[11px] font-medium text-slate-400/90 truncate max-w-full px-2">
                <span className="text-slate-500">Sec:</span> {secondaryPosList.join(', ')}
              </p>
            )}
          </div>
        </CardContent>
      </div>

      {/* 4. Frosted Glass Admin Category Selector Footer */}
      <div className="p-3 border-t border-white/10 bg-slate-950/80 backdrop-blur-md relative z-10">
        <select 
          value={player.categoryId || player.category?.id || ''}
          onChange={(e) => {
            e.stopPropagation();
            onCategoryChange(player.id || player.userId, e.target.value);
          }}
          className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900/95 text-white text-xs font-bold focus:outline-none focus:border-emerald-500 shadow-inner transition-colors"
        >
          <option value="" className="bg-slate-900 text-amber-400 font-semibold">-- Unassigned Tier (Trial Pending) --</option>
          {categories.map((cat: any) => (
            <option key={cat.id} value={cat.id} className="bg-slate-900 text-white font-bold">
              {cat.name} Tier (${cat.basePrice})
            </option>
          ))}
        </select>
      </div>
    </Card>
  );
};
