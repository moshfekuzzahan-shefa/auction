import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../services/api';

export const TournamentAdmin = () => {
  const queryClient = useQueryClient();
  const [selectedMatch, setSelectedMatch] = useState<string>('');

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

  const allMatches = [...(matches.live || []), ...(matches.upcoming || [])];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold">Tournament Match Engine</h1>

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
        <CardHeader>
          <CardTitle>Manage Matches</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            {allMatches.map((match: any) => (
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
                    <>
                      <Button variant="destructive" onClick={() => updateStatusMutation.mutate({ matchId: match.id, status: 'FINISHED' })}>
                        End Match
                      </Button>
                      <Button variant="secondary" onClick={() => setSelectedMatch(match.id)}>
                        Log Event
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedMatch && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Log Event (Match ID: {selectedMatch})</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const match = allMatches.find((m: any) => m.id === selectedMatch);
              const homeTeamData = teamsData?.find((t: any) => t.id === match?.homeTeamId);
              const awayTeamData = teamsData?.find((t: any) => t.id === match?.awayTeamId);
              
              const allPlayers = [
                ...(homeTeamData?.players || []).map((p: any) => ({ ...p, teamName: homeTeamData.name })),
                ...(awayTeamData?.players || []).map((p: any) => ({ ...p, teamName: awayTeamData.name }))
              ];

              return (
                <form 
                  className="flex gap-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    logEventMutation.mutate({
                      type: formData.get('type'),
                      minute: Number(formData.get('minute')),
                      playerId: formData.get('playerId'),
                    });
                  }}
                >
                  <select name="type" className="flex h-10 rounded-md border border-input bg-background px-3" required>
                    <option value="GOAL">Goal</option>
                    <option value="YELLOW_CARD">Yellow Card</option>
                    <option value="RED_CARD">Red Card</option>
                    <option value="OWN_GOAL">Own Goal</option>
                  </select>
                  
                  <input name="minute" type="number" placeholder="Minute (e.g. 45)" required className="flex h-10 w-24 rounded-md border border-input bg-background px-3" />
                  
                  <select name="playerId" className="flex-1 h-10 rounded-md border border-input bg-background px-3" required>
                    <option value="">Select Player...</option>
                    {allPlayers.map((player: any) => (
                      <option key={player.userId} value={player.userId}>
                        {player.user.name} ({player.teamName})
                      </option>
                    ))}
                  </select>
                  
                  <Button type="submit" disabled={logEventMutation.isPending}>Submit Event</Button>
                </form>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
