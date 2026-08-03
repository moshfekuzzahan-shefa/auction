export interface CategoryTheme {
  name: string;
  bgGradient: string;
  border: string;
  badge: string;
  glow: string;
  accentText: string;
  tagBg: string;
}

export const getCategoryTheme = (categoryName?: string): CategoryTheme => {
  const normalized = categoryName?.toLowerCase().trim() || '';

  if (normalized.includes('platinum')) {
    return {
      name: 'Platinum',
      bgGradient: 'from-purple-950/60 via-slate-900 to-cyan-950/60',
      border: 'border-purple-400',
      badge: 'bg-purple-500/20 text-purple-300 border-purple-400/50',
      glow: 'shadow-[0_0_25px_rgba(168,85,247,0.35)]',
      accentText: 'text-purple-300',
      tagBg: 'bg-purple-500/10 text-purple-300 border-purple-400/30',
    };
  }

  if (normalized.includes('gold')) {
    return {
      name: 'Gold',
      bgGradient: 'from-amber-500/20 via-slate-900 to-yellow-500/10',
      border: 'border-amber-400',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-400/50',
      glow: 'shadow-[0_0_25px_rgba(245,158,11,0.35)]',
      accentText: 'text-amber-300',
      tagBg: 'bg-amber-500/10 text-amber-300 border-amber-400/30',
    };
  }

  if (normalized.includes('silver')) {
    return {
      name: 'Silver',
      bgGradient: 'from-slate-800/40 via-slate-900 to-slate-800/30',
      border: 'border-slate-400',
      badge: 'bg-slate-400/20 text-slate-200 border-slate-400/50',
      glow: 'shadow-[0_0_25px_rgba(148,163,184,0.35)]',
      accentText: 'text-slate-200',
      tagBg: 'bg-slate-400/10 text-slate-200 border-slate-400/30',
    };
  }

  if (normalized.includes('bronze')) {
    return {
      name: 'Bronze',
      bgGradient: 'from-orange-950/50 via-slate-900 to-amber-950/40',
      border: 'border-orange-700',
      badge: 'bg-orange-700/20 text-orange-400 border-orange-700/50',
      glow: 'shadow-[0_0_25px_rgba(194,65,12,0.35)]',
      accentText: 'text-orange-400',
      tagBg: 'bg-orange-700/10 text-orange-400 border-orange-700/30',
    };
  }

  // Fallback / Default theme (Unassigned)
  return {
    name: categoryName || 'Unassigned',
    bgGradient: 'from-slate-900 via-slate-900 to-slate-950',
    border: 'border-slate-800',
    badge: 'bg-slate-800/90 text-slate-300 border-slate-700',
    glow: 'shadow-[0_0_20px_rgba(148,163,184,0.15)]',
    accentText: 'text-slate-300',
    tagBg: 'bg-slate-800/50 text-slate-400 border-slate-700',
  };
};
