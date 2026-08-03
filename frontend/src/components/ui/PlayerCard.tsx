import { Card, CardContent } from './Card';
import { Badge } from './Badge';
import { Avatar } from './Avatar';
import { PlayerPitchPosition } from './PlayerPitchPosition';
import { getCategoryTheme } from '../../utils/categoryTheme';

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

  return (
    <Card 
      className={`transition-all duration-300 group overflow-hidden bg-gradient-to-br ${theme.bgGradient} ${theme.border} ${theme.glow} shadow-xl relative flex flex-col justify-between hover:scale-[1.02]`}
    >
      <div>
        {/* 1. Header Row: Pitch Icon (Top-Left) & Category Badge (Top-Right) */}
        <div className="flex items-center justify-between p-3 border-b border-white/10 bg-slate-950/40">
          <PlayerPitchPosition position={player.primaryPos} compact className="shadow-sm border-white/40" />
          
          {player.category ? (
            <Badge variant="outline" className={`${theme.badge} font-bold text-xs shadow-sm`}>
              {player.category.name} (${player.category.basePrice})
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-slate-800/90 text-slate-300 border-slate-700 font-bold text-[10px]">
              Unassigned Tier
            </Badge>
          )}
        </div>

        {/* 2. Avatar Section: Clean Flex Layout (NO ABSOLUTE OVERLAPPING!) */}
        <div 
          className="pt-4 pb-2 px-4 flex flex-col items-center cursor-pointer"
          onClick={() => onSelectPlayer(player)}
        >
          <div className={`w-20 h-20 rounded-full border-2 ${theme.border} bg-slate-950 shadow-xl overflow-hidden flex justify-center items-center ${theme.glow}`}>
            <Avatar 
              src={player.imageUrl || player.publicId} 
              alt={player.user?.name} 
              fallback={player.user?.name?.charAt(0)}
              size="xl" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* 3. Info Section: Non-overlapping typography & Pill Badges */}
        <CardContent className="pt-0 px-4 pb-3 text-center space-y-2 cursor-pointer" onClick={() => onSelectPlayer(player)}>
          <div>
            <h3 className={`font-black text-lg leading-tight truncate px-1 ${theme.accentText}`}>
              {player.user?.name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              {player.jerseyName ? `${player.jerseyName} • ` : ''}ID: {player.studentId || 'N/A'}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            <Badge variant="default" className="text-[11px] font-bold bg-slate-950 text-slate-200 border border-slate-800 px-2.5 py-0.5">
              {player.primaryPos}
            </Badge>
            {player.isSold && (
              <Badge variant="secondary" className="bg-emerald-950 text-emerald-300 border-emerald-800 text-[10px] font-bold px-2 py-0.5">
                Sold ({player.team?.name})
              </Badge>
            )}
          </div>
        </CardContent>
      </div>

      {/* 4. Simplified Category Dropdown (NO 'CATEGORY TIER SELECTOR' TEXT LABEL!) */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
        <select 
          value={player.categoryId || player.category?.id || ''}
          onChange={(e) => {
            e.stopPropagation();
            onCategoryChange(player.id || player.userId, e.target.value);
          }}
          className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900/90 text-white text-xs font-bold focus:outline-none focus:border-emerald-500 shadow-inner"
        >
          <option value="" className="bg-slate-900 text-slate-400 font-semibold">-- Unassigned Tier --</option>
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
