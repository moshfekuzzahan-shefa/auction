import { Card, CardContent } from './Card';
import { Badge } from './Badge';
import { Avatar } from './Avatar';
import { getCategoryTheme } from '../../utils/categoryTheme';
import { Trophy, Crown, Sparkles, Shield } from 'lucide-react';

interface PlayerCardProps {
  player: any;
  categories: any[];
  onSelectPlayer: (player: any) => void;
  onCategoryChange: (profileId: string, categoryId: string) => void;
  onTogglePodiumAdmin?: (player: any) => void;
  isAssignPodiumAdminMode?: boolean;
}

export const PlayerCard = ({
  player,
  categories,
  onSelectPlayer,
  onCategoryChange,
  onTogglePodiumAdmin,
  isAssignPodiumAdminMode = false
}: PlayerCardProps) => {
  const theme = getCategoryTheme(player.category?.name);
  const isPodiumAdmin = player.user?.role === 'PODIUM_ADMIN';

  // Calculate dynamic OVR & FIFA stats based on tier and position
  const getOvrRating = (catName?: string) => {
    const name = (catName || '').toLowerCase();
    if (name.includes('platinum')) return 89;
    if (name.includes('gold')) return 84;
    if (name.includes('silver')) return 78;
    return 74;
  };

  const ovr = getOvrRating(player.category?.name);

  const handleCardClick = () => {
    if (isAssignPodiumAdminMode && onTogglePodiumAdmin) {
      onTogglePodiumAdmin(player);
    } else {
      onSelectPlayer(player);
    }
  };

  return (
    <Card 
      onClick={handleCardClick}
      className={`transition-all duration-500 group overflow-hidden relative flex flex-col justify-between rounded-3xl border-2 shadow-2xl cursor-pointer ${
        isAssignPodiumAdminMode 
          ? 'border-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.5)] ring-2 ring-purple-400/80 scale-[1.01]' 
          : `${theme.border} ${theme.glow} ${theme.bgGradient} hover:-translate-y-1.5 hover:shadow-2xl`
      }`}
    >
      {/* Background Watermark Soccer Ball Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none z-0" />
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none z-0" />

      <div className="relative z-10 p-4 space-y-3">
        
        {/* 1. FUT Top Header Row: Flag/Team (Left) & Category Badge (Right) */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5 bg-slate-950/60 -mx-4 -mt-4 px-4 pt-3.5 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-base leading-none">🇧🇩</span>
            <span className="text-[10px] font-black tracking-widest text-slate-300 uppercase truncate max-w-[100px]">
              {player.team?.name || 'VARSITY CLUB'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isPodiumAdmin && (
              <Badge className="bg-purple-950/90 text-purple-300 border border-purple-500/60 font-black text-[9px] px-2 py-0.5 shadow-[0_0_10px_rgba(168,85,247,0.4)] animate-pulse flex items-center gap-1">
                <Crown className="w-3 h-3 text-purple-400" />
                <span>PODIUM ADMIN</span>
              </Badge>
            )}

            {player.category ? (
              <Badge variant="outline" className={`${theme.badge} font-black text-[10px] px-2.5 py-0.5 shadow-sm uppercase tracking-wider`}>
                {player.category.name} (${player.category.basePrice})
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-slate-900/90 text-slate-400 border-slate-700 font-bold text-[9px] px-2 py-0.5">
                Trial Pending
              </Badge>
            )}
          </div>
        </div>

        {/* 2. Middle: FIFA Player Avatar & Overlapping OVR Rating Badge */}
        <div className="relative flex justify-center items-center py-2">
          
          {/* Prominent OVR Rating Badge (Left Overlap) */}
          <div className="absolute left-2 top-2 flex flex-col items-center bg-slate-950/90 border border-white/20 rounded-2xl p-2 shadow-2xl z-20 backdrop-blur-md">
            <span className="text-2xl font-black text-amber-400 tracking-tighter leading-none">{ovr}</span>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-0.5">{player.primaryPos}</span>
          </div>

          {/* Centered Avatar Image */}
          <div className={`w-24 h-24 rounded-full border-2 ${theme.border} bg-slate-950 p-0.5 shadow-2xl overflow-hidden flex justify-center items-center ${theme.glow} group-hover:scale-105 transition-transform duration-300`}>
            <Avatar 
              src={player.imageUrl || player.publicId} 
              alt={player.user?.name} 
              fallback={player.user?.name?.charAt(0)}
              size="xl" 
              className="w-full h-full object-cover rounded-full"
            />
          </div>

          {/* Sold Team Badge overlay if sold */}
          {player.isSold && (
            <div className="absolute right-2 top-2 z-20">
              <Badge className="bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 text-[10px] font-extrabold px-2 py-0.5 shadow-lg flex items-center gap-1">
                <Trophy className="w-3 h-3 text-emerald-400" />
                <span>{player.team?.name}</span>
              </Badge>
            </div>
          )}
        </div>

        {/* 3. Name & Identity Section */}
        <div className="text-center space-y-1">
          <h3 className={`font-black text-xl tracking-tight leading-tight truncate drop-shadow-md ${theme.accentText}`}>
            {player.user?.name}
          </h3>
          <p className="text-xs text-slate-400 font-semibold truncate">
            {player.jerseyName ? `${player.jerseyName} • ` : ''}ID: {player.studentId || 'N/A'}
          </p>
        </div>

        {/* 4. FIFA Ultimate Team Attributes Grid Breakdown */}
        <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-2.5 grid grid-cols-3 gap-1.5 text-center text-[10px] font-extrabold backdrop-blur-md">
          <div className="bg-slate-900/60 p-1 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[9px]">PAC</span>
            <span className="text-emerald-400 font-black">{ovr - 2}</span>
          </div>
          <div className="bg-slate-900/60 p-1 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[9px]">PAS</span>
            <span className="text-emerald-400 font-black">{ovr - 4}</span>
          </div>
          <div className="bg-slate-900/60 p-1 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[9px]">DRI</span>
            <span className="text-emerald-400 font-black">{ovr + 1}</span>
          </div>
          <div className="bg-slate-900/60 p-1 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[9px]">DEF</span>
            <span className="text-emerald-400 font-black">{ovr - 5}</span>
          </div>
          <div className="bg-slate-900/60 p-1 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[9px]">PHY</span>
            <span className="text-emerald-400 font-black">{ovr - 3}</span>
          </div>
          <div className="bg-slate-900/60 p-1 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[9px]">OVR</span>
            <span className="text-amber-400 font-black">{ovr}</span>
          </div>
        </div>

      </div>

      {/* 5. Admin Category Tier Selector Footer */}
      <div className="p-3 border-t border-white/10 bg-slate-950/90 backdrop-blur-md relative z-10">
        <select 
          value={player.categoryId || player.category?.id || ''}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation();
            onCategoryChange(player.id || player.userId, e.target.value);
          }}
          className="w-full h-9 px-3 rounded-xl border border-slate-700 bg-slate-900/95 text-white text-xs font-bold focus:outline-none focus:border-emerald-500 shadow-inner transition-colors"
        >
          <option value="" className="bg-slate-900 text-amber-400 font-semibold">-- Unassigned Tier (Trial Pending) --</option>
          {categories.map((cat: any) => (
            <option key={cat.id} value={cat.id} className="bg-slate-900 text-white font-bold">
              {cat.name} Tier (${cat.basePrice})
            </option>
          ))}
        </select>

        {isAssignPodiumAdminMode && (
          <div className="mt-2 text-center text-[10px] font-black uppercase tracking-wider text-purple-300 bg-purple-950/80 p-1.5 rounded-xl border border-purple-600/50 animate-pulse">
            Click Card to Toggle Podium Admin
          </div>
        )}
      </div>
    </Card>
  );
};
