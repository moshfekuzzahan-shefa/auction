import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { toast } from 'sonner';
import api from '../../services/api';
import { Plus, Trash2, Save, X } from 'lucide-react';

interface MatchResultAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: any;
}

export const MatchResultAdminModal = ({ isOpen, onClose, match }: MatchResultAdminModalProps) => {
  const queryClient = useQueryClient();
  
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);
  const [events, setEvents] = useState<Array<{ id: string, type: string, playerId: string, assistId: string, minute: number }>>([]);
  const [motmPlayerId, setMotmPlayerId] = useState<string>('');

  // Fetch players for both teams
  const { data: homePlayers = [] } = useQuery({
    queryKey: ['teamPlayers', match?.homeTeamId],
    queryFn: async () => {
      if (!match?.homeTeamId) return [];
      const res = await api.get(`/teams/${match.homeTeamId}`);
      return res.data.data.players || [];
    },
    enabled: !!match?.homeTeamId && isOpen
  });

  const { data: awayPlayers = [] } = useQuery({
    queryKey: ['teamPlayers', match?.awayTeamId],
    queryFn: async () => {
      if (!match?.awayTeamId) return [];
      const res = await api.get(`/teams/${match.awayTeamId}`);
      return res.data.data.players || [];
    },
    enabled: !!match?.awayTeamId && isOpen
  });

  const allPlayers = [...homePlayers, ...awayPlayers];

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post(`/tournament/matches/${match.id}/result`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Match result and events submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['fixtures'] });
      queryClient.invalidateQueries({ queryKey: ['standings'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit result');
    }
  });

  const addEvent = () => {
    setEvents([...events, { id: Math.random().toString(), type: 'GOAL', playerId: '', assistId: '', minute: 1 }]);
  };

  const removeEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
  };

  const updateEvent = (id: string, field: string, value: any) => {
    setEvents(events.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out invalid events
    const validEvents = events.filter(e => e.playerId).map(e => ({
      type: e.type,
      playerId: e.playerId,
      assistId: e.assistId || undefined,
      minute: Number(e.minute)
    }));

    submitMutation.mutate({
      homeScore: Number(homeScore),
      awayScore: Number(awayScore),
      motmPlayerId: motmPlayerId || undefined,
      events: validEvents
    });
  };

  if (!match) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl bg-slate-900 border-slate-800 text-slate-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            ⚽ Submit Match Result
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          
          {/* Score Entry */}
          <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex flex-col items-center gap-3 w-1/3">
              <span className="font-bold text-lg text-emerald-400">{match.homeTeam?.name}</span>
              <Input 
                type="number" 
                min="0"
                value={homeScore}
                onChange={(e) => setHomeScore(Number(e.target.value))}
                className="w-24 text-center text-3xl font-black bg-slate-900 border-slate-700 h-16"
              />
            </div>
            
            <div className="text-xl font-bold text-slate-500">VS</div>
            
            <div className="flex flex-col items-center gap-3 w-1/3">
              <span className="font-bold text-lg text-sky-400">{match.awayTeam?.name}</span>
              <Input 
                type="number" 
                min="0"
                value={awayScore}
                onChange={(e) => setAwayScore(Number(e.target.value))}
                className="w-24 text-center text-3xl font-black bg-slate-900 border-slate-700 h-16"
              />
            </div>
          </div>

          {/* MOTM */}
          <div className="bg-amber-950/20 p-4 rounded-xl border border-amber-900/30">
            <label className="block text-sm font-bold text-amber-400 mb-2">⭐ Man of the Match</label>
            <Select
              value={motmPlayerId}
              onChange={(e) => setMotmPlayerId(e.target.value)}
              options={[
                { value: '', label: 'Select MOTM...' },
                ...allPlayers.map((p: any) => ({ value: p.id, label: `${p.user?.name} (${p.team?.name})` }))
              ]}
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>

          {/* Events Log */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Match Events Log</h3>
              <Button type="button" size="sm" variant="outline" onClick={addEvent} className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
                <Plus className="w-4 h-4 mr-2" /> Add Event
              </Button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
              {events.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm italic">
                  No events added yet. Click "Add Event" to log goals, assists, misses, or cards.
                </div>
              ) : (
                events.map((ev, index) => (
                  <div key={ev.id} className="flex items-start gap-3 p-3 bg-slate-900 border border-slate-800 rounded-lg">
                    <div className="w-16 shrink-0">
                      <Input
                        type="number"
                        min="1"
                        max="120"
                        placeholder="Min"
                        value={ev.minute}
                        onChange={(e) => updateEvent(ev.id, 'minute', e.target.value)}
                        className="h-9 bg-slate-950 text-center"
                      />
                    </div>
                    <div className="w-36 shrink-0">
                      <Select
                        value={ev.type}
                        onChange={(e) => updateEvent(ev.id, 'type', e.target.value)}
                        options={[
                          { value: 'GOAL', label: '⚽ Goal' },
                          { value: 'ASSIST', label: '🎯 Assist' },
                          { value: 'MISS', label: '❌ Big Chance Missed' },
                          { value: 'YELLOW_CARD', label: '🟨 Yellow Card' },
                          { value: 'RED_CARD', label: '🟥 Red Card' },
                          { value: 'CLEAN_SHEET', label: '🧤 Clean Sheet' }
                        ]}
                        className="h-9"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Select
                        value={ev.playerId}
                        onChange={(e) => updateEvent(ev.id, 'playerId', e.target.value)}
                        options={[
                          { value: '', label: 'Select Player...' },
                          ...allPlayers.map((p: any) => ({ value: p.id, label: `${p.user?.name} (${p.team?.name})` }))
                        ]}
                        className="h-9"
                      />
                      {ev.type === 'GOAL' && (
                        <Select
                          value={ev.assistId}
                          onChange={(e) => updateEvent(ev.id, 'assistId', e.target.value)}
                          options={[
                            { value: '', label: 'Optional: Assisted by...' },
                            ...allPlayers.filter(p => p.id !== ev.playerId).map((p: any) => ({ value: p.id, label: p.user?.name }))
                          ]}
                          className="h-9 bg-slate-950 border-slate-800 text-xs"
                        />
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEvent(ev.id)}
                      className="text-red-400 hover:bg-red-950/50 hover:text-red-300 h-9 px-2 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400">
              Cancel
            </Button>
            <Button type="submit" disabled={submitMutation.isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
              <Save className="w-4 h-4 mr-2" />
              {submitMutation.isPending ? 'Saving...' : 'Finalize & Submit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
