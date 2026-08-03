import { Card } from './Card';
import { Badge } from './Badge';
import { Trophy, Crown } from 'lucide-react';

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
  const isPodiumAdmin = player.user?.role === 'PODIUM_ADMIN';

  // Category Color Palette matching reference image
  const getCardTheme = (catName?: string) => {
    const name = (catName || '').toLowerCase();
    if (name.includes('platinum')) {
      return {
        bgGradient: 'from-purple-900/80 via-fuchsia-950/80 to-slate-950',
        badgeBg: 'from-pink-500 to-fuchsia-600 shadow-[0_0_15px_rgba(236,72,153,0.7)]',
        border: 'border-fuchsia-500/50',
        flag: '🇫🇷',
        country: 'France',
        badgeText: 'text-pink-300'
      };
    }
    if (name.includes('gold')) {
      return {
        bgGradient: 'from-emerald-800/80 via-green-950/80 to-slate-950',
        badgeBg: 'from-emerald-400 to-lime-500 shadow-[0_0_15px_rgba(16,185,129,0.7)]',
        border: 'border-emerald-500/50',
        flag: '🇧🇷',
        country: 'Brazil',
        badgeText: 'text-emerald-300'
      };
    }
    if (name.includes('silver')) {
      return {
        bgGradient: 'from-blue-900/80 via-slate-950/80 to-slate-950',
        badgeBg: 'from-cyan-400 to-blue-500 shadow-[0_0_15px_rgba(6,182,212,0.7)]',
        border: 'border-cyan-500/50',
        flag: '🇺🇦',
        country: 'Ukraine',
        badgeText: 'text-cyan-300'
      };
    }
    // Bronze / Default
    return {
      bgGradient: 'from-amber-900/80 via-orange-950/80 to-slate-950',
      badgeBg: 'from-amber-400 to-orange-500 shadow-[0_0_15px_rgba(245,158,11,0.7)]',
      border: 'border-amber-500/50',
      flag: '🇧🇩',
      country: 'Bangladesh',
      badgeText: 'text-amber-300'
    };
  };

  const theme = getCardTheme(player.category?.name);
  const jerseyNum = player.studentId ? player.studentId.slice(-2) : '20';
  const playerPhoto = player.imageUrl || player.publicId;

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
      className={`transition-all duration-500 group overflow-hidden relative flex flex-col justify-between rounded-3xl border-2 shadow-2xl cursor-pointer min-h-[420px] bg-slate-950 ${theme.border} ${
        isAssignPodiumAdminMode 
          ? 'ring-4 ring-purple-500 shadow-[0_0_35px_rgba(168,85,247,0.8)] scale-[1.02]' 
          : 'hover:-translate-y-2 hover:shadow-[0_0_35px_rgba(255,255,255,0.2)]'
      }`}
    >
      {/* 1. FULL CARD BACKGROUND PLAYER PHOTO */}
      {playerPhoto ? (
        <img 
          src={playerPhoto} 
          alt={player.user?.name} 
          className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-b ${theme.bgGradient} flex items-center justify-center`}>
          {/* Soccer Ball Watermark Graphic */}
          <svg className="w-72 h-72 text-white/10 fill-current pointer-events-none" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 13v1c0 1.1.9 2 2 2v2.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
          <div className="absolute inset-0 flex items-end justify-center pb-20">
            <div className="w-48 h-60 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent rounded-t-full opacity-60" />
          </div>
        </div>
      )}

      {/* Ambient Gradient Color Wash Tint */}
      <div className={`absolute inset-0 bg-gradient-to-b ${theme.bgGradient} opacity-40 mix-blend-color-dodge pointer-events-none`} />

      {/* Top Gradient Overlay for Header Readability */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-slate-950/95 via-slate-950/60 to-transparent pointer-events-none z-10" />

      {/* Bottom Gradient Overlay for Dock Readability */}
      <div className="absolute bottom-0 inset-x-0 h-72 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent pointer-events-none z-10" />

      {/* 2. TOP BAR HEADER (Overlaid on top of image) */}
      <div className="relative z-20 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none drop-shadow-lg">{theme.flag}</span>
          <span className="text-sm font-black tracking-wide text-white drop-shadow-md truncate max-w-[120px]">
            {player.team?.name || theme.country}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isPodiumAdmin && (
            <Badge className="bg-purple-950/90 text-purple-300 border border-purple-500/60 font-black text-[9px] px-2 py-0.5 shadow-[0_0_12px_rgba(168,85,247,0.6)] animate-pulse flex items-center gap-1">
              <Crown className="w-3 h-3 text-purple-400" />
              <span>PODIUM ADMIN</span>
            </Badge>
          )}
          {player.isSold && (
            <Badge className="bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 text-[9px] font-extrabold px-2 py-0.5 shadow-lg flex items-center gap-1">
              <Trophy className="w-3 h-3 text-emerald-400" />
              <span>{player.team?.name}</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Empty Spacer */}
      <div className="flex-1" />

      {/* 3. BOTTOM OVERLAY DOCK (Overlaid on top of image at lower section) */}
      <div className="relative z-20 p-4 space-y-3 pt-6">
        
        {/* Reference Image Dock Box */}
        <div className="bg-slate-950/90 border border-white/15 rounded-2xl p-4 pt-6 relative backdrop-blur-xl shadow-2xl space-y-3">
          
          {/* Center Overlapping Number Badge */}
          <div className={`absolute -top-4 left-1/2 -translate-x-1/2 w-11 h-9 rounded-xl bg-gradient-to-r ${theme.badgeBg} flex items-center justify-center font-black text-white text-base shadow-xl border border-white/40`}>
            {jerseyNum}
          </div>

          {/* Side Stats Row (PAS 89 | 78 DEF) */}
          <div className="flex justify-between items-center text-xs font-black px-2 pt-1 border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="text-slate-400 font-bold text-[10px]">PAS</span>
              <span className="text-white text-sm font-black">89</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="text-white text-sm font-black">78</span>
              <span className="text-slate-400 font-bold text-[10px]">DEF</span>
            </div>
          </div>

          {/* Player Name */}
          <div className="text-center">
            <h3 className="font-black text-xl text-white tracking-tight leading-none truncate drop-shadow-lg">
              {player.user?.name}
            </h3>
          </div>

          {/* Bottom Pills Tag Box */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-200 text-[10px] font-black uppercase tracking-wider shadow-sm">
              {player.primaryPos || 'CM'}
            </span>
            <span className={`px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-700 ${theme.badgeText} text-[10px] font-black uppercase tracking-wider shadow-sm`}>
              {player.category?.name || 'UNASSIGNED'}
            </span>
          </div>

        </div>

        {/* 4. Admin Category Selector Footer */}
        <div className="bg-slate-950/95 p-2 rounded-xl border border-slate-800">
          <select 
            value={player.categoryId || player.category?.id || ''}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation();
              onCategoryChange(player.id || player.userId, e.target.value);
            }}
            className="w-full h-8 px-2.5 rounded-lg border border-slate-700 bg-slate-900 text-white text-[11px] font-bold focus:outline-none focus:border-emerald-500 shadow-inner"
          >
            <option value="" className="bg-slate-900 text-amber-400 font-semibold">-- Unassigned Tier (Trial Pending) --</option>
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id} className="bg-slate-900 text-white font-bold">
                {cat.name} Tier (${cat.basePrice})
              </option>
            ))}
          </select>

          {isAssignPodiumAdminMode && (
            <div className="mt-1.5 text-center text-[10px] font-black uppercase tracking-wider text-purple-300 bg-purple-950/90 p-1 rounded-lg border border-purple-600/50 animate-pulse">
              Click Card to Assign Podium Admin
            </div>
          )}
        </div>

      </div>
    </Card>
  );
};
