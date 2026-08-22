import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/Dialog';
import { Badge } from '../../components/ui/Badge';
import { Trophy, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Skeleton } from '../../components/ui/Skeleton';

interface MatchSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: any;
}

export const MatchSummaryModal = ({ isOpen, onClose, match }: MatchSummaryModalProps) => {
  // Fetch detailed match events since the standard list might not include them all
  const { data: detailedMatch, isLoading } = useQuery({
    queryKey: ['match', match?.id],
    queryFn: async () => {
      if (!match?.id) return null;
      // Note: We might not have a dedicated getMatch endpoint if it's included in getFixtures,
      // but assuming we pass the full match with events from the parent component, 
      // or we can just use the provided match object if it has events.
      return match; 
    },
    enabled: !!match?.id && isOpen
  });

  if (!match) return null;

  const events = match.events || [];
  const goals = events.filter((e: any) => e.type === 'GOAL' || e.type === 'OWN_GOAL');
  const cards = events.filter((e: any) => e.type === 'YELLOW_CARD' || e.type === 'RED_CARD');
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-slate-950 border-slate-800 p-0 overflow-hidden text-slate-200">
        
        {/* Match Header Scoreboard */}
        <div className="relative bg-slate-900 border-b border-slate-800 p-8 flex flex-col items-center">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-transparent to-sky-900/20 pointer-events-none" />
          
          <Badge variant="outline" className="mb-4 bg-slate-950 border-slate-700 text-slate-300 font-bold uppercase tracking-widest text-[10px]">
            {match.round} • FULL TIME
          </Badge>

          <div className="flex items-center justify-center gap-6 w-full z-10">
            {/* Home Team */}
            <div className="flex flex-col items-center flex-1 text-center">
              {match.homeTeam?.logoUrl ? (
                <img src={match.homeTeam.logoUrl} alt={match.homeTeam.name} className="w-16 h-16 object-contain mb-3" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-2xl mb-3">🛡️</div>
              )}
              <h2 className="text-xl font-black text-white leading-tight">{match.homeTeam?.name}</h2>
            </div>

            {/* Score */}
            <div className="flex items-center justify-center px-6">
              <div className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
                {match.homeScore} - {match.awayScore}
              </div>
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center flex-1 text-center">
              {match.awayTeam?.logoUrl ? (
                <img src={match.awayTeam.logoUrl} alt={match.awayTeam.name} className="w-16 h-16 object-contain mb-3" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-2xl mb-3">🛡️</div>
              )}
              <h2 className="text-xl font-black text-white leading-tight">{match.awayTeam?.name}</h2>
            </div>
          </div>
        </div>

        {/* MOTM Banner */}
        {match.motmPlayer && (
          <div className="bg-gradient-to-r from-amber-950/80 via-amber-900/40 to-amber-950/80 border-y border-amber-900/50 p-4 flex items-center justify-center gap-4">
            <Trophy className="w-6 h-6 text-amber-400" />
            <div className="text-center">
              <div className="text-xs font-black uppercase tracking-widest text-amber-500/80">Man of the Match</div>
              <div className="text-lg font-bold text-amber-100">{match.motmPlayer.user?.name}</div>
            </div>
          </div>
        )}

        {/* Timeline / Events */}
        <div className="p-6 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 text-center">Match Events</h3>
          
          {events.length === 0 ? (
            <div className="text-center text-slate-600 text-sm italic py-4">No events recorded for this match.</div>
          ) : (
            <div className="space-y-4 max-w-lg mx-auto relative before:absolute before:inset-0 before:ml-1/2 before:-translate-x-1/2 before:w-px before:bg-slate-800">
              
              {goals.map((goal: any) => {
                const isHome = goal.player?.teamId === match.homeTeamId;
                return (
                  <div key={goal.id} className={`flex items-center gap-4 relative z-10 ${isHome ? 'justify-start flex-row' : 'justify-start flex-row-reverse'}`}>
                    <div className={`w-1/2 flex ${isHome ? 'justify-end' : 'justify-end flex-row-reverse'} items-center gap-3`}>
                      <div className={`text-sm ${isHome ? 'text-right' : 'text-left'}`}>
                        <div className="font-bold text-white flex items-center gap-1">
                          {goal.type === 'OWN_GOAL' && <span className="text-red-400 text-xs">(OG)</span>}
                          {goal.player?.user?.name}
                        </div>
                        {goal.assist && (
                          <div className="text-xs text-slate-500">Assist: {goal.assist.user?.name}</div>
                        )}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 shadow-lg">
                        ⚽
                      </div>
                    </div>
                    
                    <div className="absolute left-1/2 -translate-x-1/2 bg-slate-950 px-2 py-1 rounded-md border border-slate-800 text-xs font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {goal.minute}'
                    </div>
                  </div>
                );
              })}
              
            </div>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
};
