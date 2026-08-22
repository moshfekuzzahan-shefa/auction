import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import api from '../../services/api';
import { MatchResultAdminModal } from './MatchResultAdminModal';
import { TournamentLeaderboard } from './TournamentLeaderboard';
import { MatchSummaryModal } from '../../components/tournament/MatchSummaryModal';

export const TournamentAdmin = () => {
  const queryClient = useQueryClient();
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [selectedFinishedMatch, setSelectedFinishedMatch] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('matches');
  const [matchesFilter, setMatchesFilter] = useState('active');

  // We fetch public landing data to get the list of matches since it's already there
  const { data: landingData, isLoading } = useQuery({
    queryKey: ['public', 'landing'],
    queryFn: async () => {
      const res = await api.get('/public/landing');
      return res.data.data;
    }
  });

  const { data: teamsData } = useQuery({
    queryKey: ['teams', 'all'],
    queryFn: async () => {
      const res = await api.get('/teams');
      return res.data.data;
    }
  });

  const generateFixturesMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/tournament/fixtures', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Fixtures generated successfully');
      queryClient.invalidateQueries({ queryKey: ['public', 'landing'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate fixtures');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ matchId, status }: { matchId: string; status: string }) => {
      const res = await api.patch(`/tournament/matches/${matchId}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Match status updated');
      queryClient.invalidateQueries({ queryKey: ['public', 'landing'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Update failed');
    }
  });

  const logEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const res = await api.post(`/tournament/matches/${selectedMatch}/events`, eventData);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Event logged successfully');
      queryClient.invalidateQueries({ queryKey: ['public', 'landing'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to log event');
    }
  });

  if (isLoading) return <div className="p-8">Loading Tournament Data...</div>;

  const matches = landingData?.data?.matches;
  if (!matches) return <div className="p-8">No matches available.</div>;

  const activeMatches = [...(matches.live || []), ...(matches.upcoming || [])];
  const finishedMatches = matches.finished || [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tournament Match Engine</h1>
        
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="matches" active={activeTab === 'matches'} onTabChange={setActiveTab}>📅 Matches & Fixtures</TabsTrigger>
          <TabsTrigger value="leaderboard" active={activeTab === 'leaderboard'} onTabChange={setActiveTab}>🏆 Tournament Leaderboard</TabsTrigger>
        </TabsList>
      </div>

      {activeTab === 'leaderboard' && (
        <TournamentLeaderboard />
      )}

      {activeTab === 'matches' && (
        <>
          <Card>
        <CardHeader>
          <CardTitle>Generate Fixture</CardTitle>
        </CardHeader>
        <CardContent>
          <form 
            className="flex gap-4 items-end"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              generateFixturesMutation.mutate({
                homeTeamId: formData.get('homeTeamId'),
                awayTeamId: formData.get('awayTeamId'),
                type: formData.get('type'),
                round: formData.get('round'),
                scheduledTime: formData.get('scheduledTime'),
                venue: formData.get('venue')
              });
            }}
          >
            <div className="space-y-1 flex-1">
              <label className="text-sm font-medium">Home Team</label>
              <select name="homeTeamId" required className="flex h-10 w-full rounded-md border border-input bg-background px-3">
                <option value="">Select Home Team</option>
                {teamsData?.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1 flex-1">
              <label className="text-sm font-medium">Away Team</label>
              <select name="awayTeamId" required className="flex h-10 w-full rounded-md border border-input bg-background px-3">
                <option value="">Select Away Team</option>
                {teamsData?.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 w-32">
              <label className="text-sm font-medium">Type</label>
              <select name="type" required className="flex h-10 w-full rounded-md border border-input bg-background px-3">
                <option value="SINGLE">Single</option>
                <option value="LEGGED">Legged</option>
              </select>
            </div>

            <div className="space-y-1 w-40">
              <label className="text-sm font-medium">Round</label>
              <input name="round" placeholder="e.g. Group Stage" required className="flex h-10 w-full rounded-md border border-input bg-background px-3" />
            </div>

            <div className="space-y-1 flex-1">
              <label className="text-sm font-medium">Time</label>
              <input name="scheduledTime" type="datetime-local" className="flex h-10 w-full rounded-md border border-input bg-background px-3" />
            </div>

            <div className="space-y-1 flex-1">
              <label className="text-sm font-medium">Venue</label>
              <input name="venue" placeholder="e.g. Main Stadium" className="flex h-10 w-full rounded-md border border-input bg-background px-3" />
            </div>

            <Button type="submit" disabled={generateFixturesMutation.isPending}>
              Generate
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Manage Matches</CardTitle>
          <TabsList className="grid w-[300px] grid-cols-2">
            <TabsTrigger value="active" active={matchesFilter === 'active'} onTabChange={setMatchesFilter}>Active/Upcoming</TabsTrigger>
            <TabsTrigger value="finished" active={matchesFilter === 'finished'} onTabChange={setMatchesFilter}>Finished</TabsTrigger>
          </TabsList>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div className="grid gap-4">
            {matchesFilter === 'active' && activeMatches.length === 0 && (
              <div className="text-center text-muted-foreground p-4">No active or upcoming matches.</div>
            )}
            {matchesFilter === 'active' && activeMatches.map((match: any) => (
              <div key={match.id} className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <span className="font-bold">{match.homeTeam.name}</span>
                  <span className="mx-4 text-xl">{match.homeScore} - {match.awayScore}</span>
                  <span className="font-bold">{match.awayTeam.name}</span>
                  <div className="text-sm text-muted-foreground mt-1">Status: {match.status} | Round: {match.round}</div>
                </div>

                <div className="flex gap-2">
                  {match.status === 'UPCOMING' && (
                    <Button onClick={() => updateStatusMutation.mutate({ matchId: match.id, status: 'LIVE' })}>
                      Start Match
                    </Button>
                  )}
                  {match.status === 'LIVE' && (
                    <Button 
                      variant="secondary" 
                      onClick={() => {
                        setSelectedMatch(match);
                        setIsResultModalOpen(true);
                      }}
                    >
                      Enter Result / Log Events
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {matchesFilter === 'finished' && finishedMatches.length === 0 && (
              <div className="text-center text-muted-foreground p-4">No finished matches.</div>
            )}
            {matchesFilter === 'finished' && finishedMatches.map((match: any) => (
              <div 
                key={match.id} 
                className="flex items-center justify-between p-4 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedFinishedMatch(match)}
              >
                <div>
                  <span className="font-bold">{match.homeTeam.name}</span>
                  <span className="mx-4 text-xl font-bold text-primary">{match.homeScore} - {match.awayScore}</span>
                  <span className="font-bold">{match.awayTeam.name}</span>
                  <div className="text-sm text-muted-foreground mt-1">Status: {match.status} | Round: {match.round}</div>
                </div>
                <Button variant="outline" size="sm">View Recap</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
        </>
      )}

      {selectedFinishedMatch && (
        <MatchSummaryModal 
          isOpen={!!selectedFinishedMatch}
          onClose={() => setSelectedFinishedMatch(null)}
          match={selectedFinishedMatch}
        />
      )}

      {selectedMatch && (
        <MatchResultAdminModal
          isOpen={isResultModalOpen}
          onClose={() => {
            setIsResultModalOpen(false);
            setSelectedMatch(null);
          }}
          match={selectedMatch}
        />
      )}
    </div>
  );
};
