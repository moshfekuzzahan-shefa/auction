import { Card } from './Card';
import { Badge } from './Badge';
import { Avatar } from './Avatar';
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
        bg: 'from-purple-900 via-fuchsia-950 to-slate-950',
        badgeBg: 'from-pink-500 to-fuchsia-600 shadow-[0_0_15px_rgba(236,72,153,0.6)]',
        border: 'border-fuchsia-500/40',
        flag: '🇫🇷',
        country: 'France',
        badgeText: 'text-pink-300'
      };
    }
    if (name.includes('gold')) {
      return {
        bg: 'from-emerald-800 via-green-950 to-slate-950',
        badgeBg: 'from-emerald-400 to-lime-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]',
        border: 'border-emerald-500/40',
        flag: '🇧🇷',
        country: 'Brazil',
        badgeText: 'text-emerald-300'
      };
    }
    if (name.includes('silver')) {
      return {
        bg: 'from-blue-900 via-slate-950 to-slate-950',
        badgeBg: 'from-cyan-400 to-blue-500 shadow-[0_0_15px_rgba(6,182,212,0.6)]',
        border: 'border-cyan-500/40',
        flag: '🇺🇦',
        country: 'Ukraine',
        badgeText: 'text-cyan-300'
      };
    }
    // Bronze / Default
    return {
      bg: 'from-amber-900 via-orange-950 to-slate-950',
      badgeBg: 'from-amber-400 to-orange-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]',
      border: 'border-amber-500/40',
      flag: '🇧🇩',
      country: 'Bangladesh',
      badgeText: 'text-amber-300'
    };
  };

  const theme = getCardTheme(player.category?.name);
  const jerseyNum = player.studentId ? player.studentId.slice(-2) : '20';

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
      className={`transition-all duration-500 group overflow-hidden relative flex flex-col justify-between rounded-3xl border-2 shadow-2xl cursor-pointer bg-gradient-to-b ${theme.bg} ${theme.border} ${
        isAssignPodiumAdminMode 
          ? 'ring-4 ring-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.7)] scale-[1.02]' 
          : 'hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]'
      }`}
    >
      {/* Background Watermark Soccer Ball Graphic */}
      <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none z-0">
        <svg className="w-64 h-64 text-white fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 13v1c0 1.1.9 2 2 2v2.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
      </div>

      {/* Top Ambient Glow Aura */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content Area */}
      <div className="relative z-10 p-4 space-y-4">
        
        {/* 1. Top Bar: Flag & Country/Team Name */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl leading-none drop-shadow-md">{theme.flag}</span>
            <span className="text-sm font-black tracking-wide text-white drop-shadow-sm truncate max-w-[120px]">
              {player.team?.name || theme.country}
            </span>
          </div>

          {isPodiumAdmin && (
            <Badge className="bg-purple-950/90 text-purple-300 border border-purple-500/60 font-black text-[9px] px-2 py-0.5 shadow-[0_0_12px_rgba(168,85,247,0.5)] animate-pulse flex items-center gap-1">
              <Crown className="w-3 h-3 text-purple-400" />
              <span>PODIUM ADMIN</span>
            </Badge>
          )}
        </div>

        {/* 2. Middle: Player Avatar Silhouette / Photo */}
        <div className="relative flex justify-center items-end h-44 pt-2">
          <div className="w-36 h-40 relative flex justify-center items-end group-hover:scale-105 transition-transform duration-300">
            <Avatar 
              src={player.imageUrl || player.publicId} 
              alt={player.user?.name} 
              fallback={player.user?.name?.charAt(0)}
              size="xl" 
              className="w-full h-full object-cover rounded-2xl drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]"
            />
          </div>

          {player.isSold && (
            <div className="absolute top-0 right-0 z-20">
              <Badge className="bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 text-[10px] font-extrabold px-2 py-0.5 shadow-lg flex items-center gap-1">
                <Trophy className="w-3 h-3 text-emerald-400" />
                <span>{player.team?.name}</span>
              </Badge>
            </div>
          )}
        </div>

        {/* 3. Bottom Dark Overlay Dock (Reference Image Exact Match) */}
        <div className="bg-slate-950/90 border border-white/10 rounded-2xl p-4 pt-6 relative backdrop-blur-xl shadow-2xl space-y-3">
          
          {/* Center Overlapping Number Badge */}
          <div className={`absolute -top-4 left-1/2 -translate-x-1/2 w-11 h-9 rounded-xl bg-gradient-to-r ${theme.badgeBg} flex items-center justify-center font-black text-white text-base shadow-lg border border-white/30`}>
            {jerseyNum}
          </div>

          {/* Side Stats Row (PAS 89 | 78 DEF) */}
          <div className="flex justify-between items-center text-xs font-black px-2 pt-1 border-b border-slate-800 pb-2">
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
            <h3 className="font-black text-xl text-white tracking-tight leading-none truncate drop-shadow-md">
              {player.user?.name}
            </h3>
          </div>

          {/* Bottom Pills Tag Box */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-black uppercase tracking-wider">
              {player.primaryPos || 'CM'}
            </span>
            <span className={`px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 ${theme.badgeText} text-[10px] font-black uppercase tracking-wider`}>
              {player.category?.name || 'UNASSIGNED'}
            </span>
          </div>

        </div>

      </div>

      {/* 4. Admin Category Tier Selector Footer */}
      <div className="p-3 border-t border-white/10 bg-slate-950/95 relative z-10">
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
          <div className="mt-2 text-center text-[10px] font-black uppercase tracking-wider text-purple-300 bg-purple-950/90 p-1.5 rounded-xl border border-purple-600/50 animate-pulse shadow-lg">
            Click Card to Assign Podium Admin
          </div>
        )}
      </div>
    </Card>
  );
};
