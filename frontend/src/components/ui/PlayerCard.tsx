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

  // Category-based Backdrop & Theme Gradient matching reference image
  const getCardTheme = (catName?: string) => {
    const name = (catName || '').toLowerCase();
    if (name.includes('platinum')) {
      return {
        bgGradient: 'from-purple-900 via-fuchsia-950 to-slate-950',
        badgeBg: 'from-pink-500 to-fuchsia-600 shadow-[0_0_15px_rgba(236,72,153,0.8)]',
        border: 'border-fuchsia-500/50',
        flag: '🇫🇷',
        country: 'France',
        badgeText: 'text-pink-300'
      };
    }
    if (name.includes('gold')) {
      return {
        bgGradient: 'from-emerald-800 via-green-950 to-slate-950',
        badgeBg: 'from-emerald-400 to-lime-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]',
        border: 'border-emerald-500/50',
        flag: '🇧🇷',
        country: 'Brazil',
        badgeText: 'text-emerald-300'
      };
    }
    if (name.includes('silver')) {
      return {
        bgGradient: 'from-blue-900 via-slate-950 to-slate-950',
        badgeBg: 'from-cyan-400 to-blue-500 shadow-[0_0_15px_rgba(6,182,212,0.8)]',
        border: 'border-cyan-500/50',
        flag: '🇺🇦',
        country: 'Ukraine',
        badgeText: 'text-cyan-300'
      };
    }
    // Bronze / Default
    return {
      bgGradient: 'from-amber-900 via-orange-950 to-slate-950',
      badgeBg: 'from-amber-400 to-orange-500 shadow-[0_0_15px_rgba(245,158,11,0.8)]',
      border: 'border-amber-500/50',
      flag: '🇧🇩',
      country: 'Bangladesh',
      badgeText: 'text-amber-300'
    };
  };

  const theme = getCardTheme(player.category?.name);
  const jerseyNum = player.studentId ? player.studentId.slice(-2) : '20';
  const rawPhotoUrl = player.imageUrl || player.publicId;

  // Cloudinary AI Background Removal Cutout URL Transformation helper
  const getCutoutUrl = (url?: string) => {
    if (!url) return null;
    if (url.includes('res.cloudinary.com') && !url.includes('e_background_removal')) {
      return url.replace('/upload/', '/upload/e_background_removal/');
    }
    return url;
  };

  const cutoutUrl = getCutoutUrl(rawPhotoUrl);

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
      className={`transition-all duration-500 group overflow-hidden relative flex flex-col justify-between rounded-3xl border-2 shadow-2xl cursor-pointer min-h-[420px] ${
        isAssignPodiumAdminMode 
          ? 'ring-4 ring-purple-500 shadow-[0_0_35px_rgba(168,85,247,0.8)] scale-[1.02] border-purple-400' 
          : `${theme.border} hover:-translate-y-2 hover:shadow-[0_0_35px_rgba(255,255,255,0.2)]`
      }`}
    >
      {/* 
        =========================================================
        LAYER 1 (Bottom): Category-Specific Backdrop Gradient
        =========================================================
      */}
      <div className={`absolute inset-0 bg-gradient-to-b ${theme.bgGradient} z-0`} />

      {/* 
        =========================================================
        LAYER 2 (Middle): Soccer Ball Watermark Pattern (Behind Cutout)
        =========================================================
      */}
      <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none z-1">
        <svg className="w-72 h-72 text-white fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 13v1c0 1.1.9 2 2 2v2.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
      </div>

      {/* Top Ambient Light Glow */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none z-1" />

      {/* 
        =========================================================
        LAYER 3: Dynamic "Cut-Out" Player Subject Image
        =========================================================
      */}
      <div className="absolute inset-0 flex items-center justify-center pt-8 pb-32 pointer-events-none z-2">
        {cutoutUrl ? (
          <img 
            src={cutoutUrl} 
            alt={player.user?.name} 
            className="w-48 h-56 object-contain object-bottom transition-transform duration-700 group-hover:scale-105 drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)]"
            onError={(e) => {
              // Fallback to original photo if background_removal transform is not cached
              if (rawPhotoUrl && (e.target as HTMLImageElement).src !== rawPhotoUrl) {
                (e.target as HTMLImageElement).src = rawPhotoUrl;
              }
            }}
          />
        ) : (
          /* Default Silhouette Cutout Graphic */
          <div className="w-44 h-52 bg-slate-950/80 rounded-t-full border border-white/10 flex items-end justify-center shadow-2xl overflow-hidden relative opacity-70">
            <svg className="w-36 h-44 text-slate-800 fill-current" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
        )}
      </div>

      {/* Top & Bottom Dark Gradient Overlays for UI Readability */}
      <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none z-3" />
      <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent pointer-events-none z-3" />

      {/* 
        =========================================================
        LAYER 4 (Top): UI Elements, Stats Dock & Controls
        =========================================================
      */}

      {/* 1. Top Bar: Flag & Country/Team Name */}
      <div className="relative z-10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none drop-shadow-md">{theme.flag}</span>
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

      <div className="flex-1 z-10" />

      {/* 2. Bottom Overlay Dock */}
      <div className="relative z-10 p-4 space-y-3 pt-6">
        
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

        {/* 3. Admin Category Tier Selector */}
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
