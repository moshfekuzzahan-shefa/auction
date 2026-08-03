import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Calendar, Shield } from 'lucide-react';
import api from '../../services/api';

export const PlayerSchedulesPage = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'my-team' | 'live' | 'finished'>('all');

  const { data: myProfile } = useQuery({
    queryKey: ['player', 'me'],
    queryFn: async () => {
      try {
        const res = await api.get('/player/me');
        return res.data.data;
      } catch {
        return null;
      }
    }
  });

  const { data: landingData, isLoading } = useQuery({
    queryKey: ['public', 'landing'],
    queryFn: async () => {
      const res = await api.get('/public/landing');
      return res.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const matchesData = landingData?.matches || {};
  const allMatches: any[] = [
    ...(matchesData.live || []),
    ...(matchesData.upcoming || []),
    ...(matchesData.finished || [])
  ];

  const myTeamId = myProfile?.team?.id;

  const filteredMatches = allMatches.filter((m: any) => {
    if (activeTab === 'my-team') {
      return myTeamId && (m.homeTeamId === myTeamId || m.awayTeamId === myTeamId || m.homeTeam?.id === myTeamId || m.awayTeam?.id === myTeamId);
    }
    if (activeTab === 'live') return m.status === 'LIVE';
    if (activeTab === 'finished') return m.status === 'FINISHED';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <span>Match Schedule & Fixtures</span>
            <Calendar className="w-6 h-6 text-emerald-400" />
          </h1>
          <p className="text-slate-400 text-sm">Official Tournament Match Timetable & Live Fixture Tracking.</p>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          <Button 
            variant={activeTab === 'all' ? 'primary' : 'ghost'} 
            size="sm"
            onClick={() => setActiveTab('all')}
            className="px-3 rounded-xl text-xs font-bold"
          >
            All Matches ({allMatches.length})
          </Button>
          <Button 
            variant={activeTab === 'my-team' ? 'primary' : 'ghost'} 
            size="sm"
            onClick={() => setActiveTab('my-team')}
            className="px-3 rounded-xl text-xs font-bold text-emerald-400"
          >
            My Team Matches
          </Button>
          <Button 
            variant={activeTab === 'live' ? 'primary' : 'ghost'} 
            size="sm"
            onClick={() => setActiveTab('live')}
            className="px-3 rounded-xl text-xs font-bold text-red-400"
          >
            Live Matches ({matchesData.live?.length || 0})
          </Button>
          <Button 
            variant={activeTab === 'finished' ? 'primary' : 'ghost'} 
            size="sm"
            onClick={() => setActiveTab('finished')}
            className="px-3 rounded-xl text-xs font-bold"
          >
            Finished
          </Button>
        </div>
      </div>

      {filteredMatches.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-12 text-center text-slate-400">
            No matches found matching filter "{activeTab}".
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.map((m: any) => {
            const isMyMatch = myTeamId && (m.homeTeamId === myTeamId || m.awayTeamId === myTeamId || m.homeTeam?.id === myTeamId || m.awayTeam?.id === myTeamId);

            return (
              <Card 
                key={m.id}
                className={`bg-slate-900/90 border-2 shadow-xl transition-all duration-300 ${isMyMatch ? 'border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-slate-800'}`}
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{m.round || 'Tournament Match'}</span>
                    
                    {m.status === 'LIVE' ? (
                      <Badge className="bg-red-950 text-red-400 border border-red-800 animate-pulse font-bold text-xs">
                        LIVE MATCH
                      </Badge>
                    ) : m.status === 'FINISHED' ? (
                      <Badge variant="outline" className="bg-slate-950 text-slate-400 border-slate-700 text-xs">
                        FINISHED
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-emerald-950/60 text-emerald-300 border-emerald-800 text-xs font-bold">
                        UPCOMING
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-around py-2">
                    <div className="text-center space-y-1.5 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 p-1.5 mx-auto flex items-center justify-center">
                        {m.homeTeam?.logoUrl ? (
                          <img src={m.homeTeam.logoUrl} alt={m.homeTeam.name} className="w-full h-full object-contain" />
                        ) : (
                          <Shield className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <p className="font-extrabold text-sm text-white truncate max-w-[120px] mx-auto">{m.homeTeam?.name || 'Home'}</p>
                    </div>

                    <div className="text-center px-4">
                      <div className="font-mono font-black text-2xl text-emerald-400 bg-slate-950 px-4 py-1.5 rounded-xl border border-slate-800 shadow-inner">
                        {m.status === 'UPCOMING' ? 'VS' : `${m.homeScore || 0} - ${m.awayScore || 0}`}
                      </div>
                    </div>

                    <div className="text-center space-y-1.5 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 p-1.5 mx-auto flex items-center justify-center">
                        {m.awayTeam?.logoUrl ? (
                          <img src={m.awayTeam.logoUrl} alt={m.awayTeam.name} className="w-full h-full object-contain" />
                        ) : (
                          <Shield className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <p className="font-extrabold text-sm text-white truncate max-w-[120px] mx-auto">{m.awayTeam?.name || 'Away'}</p>
                    </div>
                  </div>

                  {isMyMatch && (
                    <div className="p-2 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-center">
                      <span className="text-xs font-bold text-emerald-300">★ Official Match For Your Franchise Squad</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
