import { Card } from './Card';
import { Badge } from './Badge';
import { Trophy, Crown, GraduationCap } from 'lucide-react';

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

  // Category-based Theme Gradient and Styling
  const getCardTheme = (catName?: string) => {
    const name = (catName || '').toLowerCase();
    if (name.includes('platinum')) {
      return {
        bgGradient: 'from-purple-950 via-fuchsia-950/80 to-slate-950',
        badgeBg: 'from-pink-500 to-fuchsia-600 shadow-[0_0_15px_rgba(236,72,153,0.8)]',
        border: 'border-fuchsia-500/50',
        dropdownBg: 'bg-fuchsia-950/90 text-pink-300 border-fuchsia-500/60',
        badgeText: 'text-pink-300'
      };
    }
    if (name.includes('gold')) {
      return {
        bgGradient: 'from-emerald-950 via-green-950/80 to-slate-950',
        badgeBg: 'from-emerald-400 to-lime-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]',
        border: 'border-emerald-500/50',
        dropdownBg: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60',
        badgeText: 'text-emerald-300'
      };
    }
    if (name.includes('silver')) {
      return {
        bgGradient: 'from-slate-900 via-blue-950/80 to-slate-950',
        badgeBg: 'from-cyan-400 to-blue-500 shadow-[0_0_15px_rgba(6,182,212,0.8)]',
        border: 'border-cyan-500/50',
        dropdownBg: 'bg-slate-900/90 text-cyan-300 border-cyan-500/60',
        badgeText: 'text-cyan-300'
      };
    }
    // Bronze / Default
    return {
      bgGradient: 'from-orange-950 via-amber-950/80 to-slate-950',
      badgeBg: 'from-amber-400 to-orange-500 shadow-[0_0_15px_rgba(245,158,11,0.8)]',
      border: 'border-amber-500/50',
      dropdownBg: 'bg-amber-950/90 text-amber-300 border-amber-500/60',
      badgeText: 'text-amber-300'
    };
  };

  const theme = getCardTheme(player.category?.name);
  const jerseyNum = player.jerseyName || (player.studentId ? player.studentId.slice(-2) : '10');
  const rawPhotoUrl = player.imageUrl || player.publicId || player.avatarUrl || player.user?.avatarUrl;

  const handleCardClick = () => {
    if (isAssignPodiumAdminMode && onTogglePodiumAdmin) {
      onTogglePodiumAdmin(player);
    } else {
      onSelectPlayer(player);
    }
  };

  const secondaryPosList = player.secondaryPos && Array.isArray(player.secondaryPos)
    ? player.secondaryPos.filter((p: string) => p && p !== player.primaryPos)
    : [];

  return (
    <Card 
      onClick={handleCardClick}
      className={`transition-all duration-500 group overflow-hidden relative flex flex-col justify-between rounded-3xl border-2 shadow-2xl cursor-pointer min-h-[430px] ${
        isAssignPodiumAdminMode 
          ? 'ring-4 ring-purple-500 shadow-[0_0_35px_rgba(168,85,247,0.8)] scale-[1.02] border-purple-400' 
          : `${theme.border} hover:-translate-y-2 hover:shadow-[0_0_35px_rgba(255,255,255,0.2)]`
      }`}
    >
      {/* LAYER 1: Category Gradient Backdrop */}
      <div className={`absolute inset-0 bg-gradient-to-b ${theme.bgGradient} z-0`} />

      {/* LAYER 2: Soccer Ball Watermark Pattern */}
      <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none z-1">
        <svg className="w-72 h-72 text-white fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 13v1c0 1.1.9 2 2 2v2.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
      </div>

      {/* Ambient Top Glow */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none z-1" />

      {/* LAYER 3: Player Card Image Avatar (Enlarged w-48 h-48 sm:w-52 sm:h-52 completely covering watermark) */}
      <div className="absolute inset-0 flex items-center justify-center pt-8 pb-32 pointer-events-none z-2 bg-transparent">
        <div className="relative mx-auto w-48 h-48 sm:w-52 sm:h-52 rounded-full overflow-hidden border-2 border-white/20 shadow-xl flex items-center justify-center bg-zinc-800">
          <img 
            src={rawPhotoUrl || "/default-avatar.png"} 
            alt={player.user?.name || player.name || "Player"} 
            className="w-full h-full object-cover scale-110"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="%2394a3b8"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';
            }}
          />
        </div>
      </div>

      {/* Top & Bottom Dark Overlay Gradients */}
      <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none z-3" />
      <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent pointer-events-none z-3" />

      {/* LAYER 4: UniFootball Header & Category Selector */}
      <div className="relative z-10 p-4 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-black tracking-tight text-white drop-shadow-md flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
            <span>ID: {player.studentId || 'N/A'}</span>
          </span>
          <span className="text-[10px] font-bold text-slate-400 tracking-wide pl-4">
            Session: {player.session || '2021-22'}
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

          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <select
              value={player.categoryId || player.category?.id || ''}
              onChange={(e) => {
                e.stopPropagation();
                onCategoryChange(player.id || player.userId, e.target.value);
              }}
              className={`h-7 px-2.5 rounded-full border text-[10px] font-black uppercase tracking-wider focus:outline-none cursor-pointer shadow-md transition-all appearance-none pr-6 ${theme.dropdownBg}`}
            >
              <option value="" className="bg-slate-900 text-amber-400 font-semibold">Unassigned</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id} className="bg-slate-900 text-white font-bold">
                  {cat.name} (${cat.basePrice})
                </option>
              ))}
            </select>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[9px] font-black text-slate-300">▼</span>
          </div>
        </div>
      </div>

      <div className="flex-1 z-10" />

      {/* GLASSMORPHIC BOTTOM DETAILS CONTAINER */}
      <div className="relative z-10 p-4 pt-6">
        <div className="bg-slate-950/40 border border-white/10 rounded-2xl p-4 pt-6 relative backdrop-blur-md shadow-2xl space-y-2.5">
          <div className={`absolute -top-4 left-1/2 -translate-x-1/2 h-9 px-3.5 rounded-xl bg-gradient-to-r ${theme.badgeBg} flex items-center justify-center font-black text-white text-sm shadow-xl border border-white/40 tracking-wider`}>
            #{jerseyNum}
          </div>

          <div className="text-center pt-1">
            <h3 className="font-black text-xl text-white tracking-tight leading-none truncate drop-shadow-md">
              {player.user?.name}
            </h3>
            {player.jerseyName && (
              <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest mt-1">
                "{player.jerseyName}"
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 flex-wrap pt-0.5">
            <span className="px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-wider shadow-sm">
              Primary: {player.primaryPos || 'CM'}
            </span>

            {secondaryPosList.map((pos: string) => (
              <span key={pos} className="px-2.5 py-1 rounded-xl bg-slate-900/60 border border-slate-700/60 text-slate-300 text-[10px] font-bold uppercase">
                {pos}
              </span>
            ))}
          </div>

          {isAssignPodiumAdminMode && (
            <div className="mt-2 text-center text-[10px] font-black uppercase tracking-wider text-purple-300 bg-purple-950/80 p-1.5 rounded-xl border border-purple-600/50 animate-pulse">
              Click Card to Assign Podium Admin
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
