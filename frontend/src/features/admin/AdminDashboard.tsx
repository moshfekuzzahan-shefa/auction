import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/Dialog';
import api from '../../services/api';
import { TeamManagerForm } from './TeamManagerForm';
import { useAppDispatch } from '../../store/hooks';
import { setPhase } from '../../store/systemSlice';

export const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const [nukeLevel, setNukeLevel] = useState<number>(0);
  const [nukeConfirm, setNukeConfirm] = useState('');
  
  const [budgetConfig, setBudgetConfig] = useState({ totalBudget: 10000, minRoster: 11 });
  const [scheduleConfig, setScheduleConfig] = useState({
    registrationStart: '',
    registrationEnd: '',
    auctionStart: '',
    auctionEnd: ''
  });

  const { data: systemState, isLoading } = useQuery({
    queryKey: ['system', 'state'],
    queryFn: async () => {
      const res = await api.get('/system');
      return res.data.data;
    }
  });

  // Keep internal state in sync with fetched state initially
  useEffect(() => {
    if (systemState) {
      setBudgetConfig({ 
        totalBudget: systemState.totalBudget, 
        minRoster: systemState.minRoster 
      });
      setScheduleConfig({
        registrationStart: systemState.registrationStart ? new Date(systemState.registrationStart).toISOString().slice(0, 16) : '',
        registrationEnd: systemState.registrationEnd ? new Date(systemState.registrationEnd).toISOString().slice(0, 16) : '',
        auctionStart: systemState.auctionStart ? new Date(systemState.auctionStart).toISOString().slice(0, 16) : '',
        auctionEnd: systemState.auctionEnd ? new Date(systemState.auctionEnd).toISOString().slice(0, 16) : '',
      });
    }
  }, [systemState]);

  const changePhaseMutation = useMutation({
    mutationFn: async (phase: string) => {
      const res = await api.put('/system/phase', { phase });
      return res.data;
    },
    onSuccess: (_, variables) => {
      toast.success('System Phase updated successfully');
      dispatch(setPhase(variables as any));
      queryClient.invalidateQueries({ queryKey: ['system'] });
      queryClient.invalidateQueries({ queryKey: ['public'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update phase');
    }
  });

  const nukeMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/reset/nuke', {
        level: Number(nukeLevel),
        confirmationString: nukeConfirm
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      setNukeConfirm('');
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Nuke Protocol failed');
    }
  });

  const handleNuke = () => {
    if (!nukeConfirm) {
      toast.error('Please enter the confirmation string');
      return;
    }
    nukeMutation.mutate();
  };

  if (isLoading) return <div className="p-8">Loading System Config...</div>;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">System Configuration</h1>
        <div className="px-4 py-2 bg-primary/10 text-primary font-medium rounded-md border border-primary/20">
          Current Phase: {systemState?.currentPhase}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Lifecycle Control</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          {['SETUP', 'REGISTRATION', 'AUCTION', 'TOURNAMENT'].map((phase) => (
            <Button
              key={phase}
              variant={systemState?.currentPhase === phase ? 'primary' : 'outline'}
              onClick={() => changePhaseMutation.mutate(phase)}
              disabled={changePhaseMutation.isPending}
            >
              {phase}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Event Schedule & Countdowns</CardTitle>
          <p className="text-sm text-muted-foreground">Set public countdown timers. Leaving a field blank disables the countdown.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Registration Start</label>
              <Input 
                type="datetime-local"
                value={scheduleConfig.registrationStart}
                onChange={(e) => setScheduleConfig(prev => ({ ...prev, registrationStart: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Registration End</label>
              <Input 
                type="datetime-local"
                value={scheduleConfig.registrationEnd}
                onChange={(e) => setScheduleConfig(prev => ({ ...prev, registrationEnd: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Auction Start</label>
              <Input 
                type="datetime-local"
                value={scheduleConfig.auctionStart}
                onChange={(e) => setScheduleConfig(prev => ({ ...prev, auctionStart: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Auction End</label>
              <Input 
                type="datetime-local"
                value={scheduleConfig.auctionEnd}
                onChange={(e) => setScheduleConfig(prev => ({ ...prev, auctionEnd: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button 
              onClick={() => {
                api.put('/system/schedule', scheduleConfig)
                  .then(() => {
                    toast.success('Schedule saved');
                    queryClient.invalidateQueries();
                  })
                  .catch(() => toast.error('Failed to save schedule'));
              }}
            >
              Save Schedule
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Budget & Roster Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Total Team Budget ($)</label>
              <Input 
                type="number"
                value={budgetConfig.totalBudget}
                onChange={(e) => setBudgetConfig(prev => ({ ...prev, totalBudget: Number(e.target.value) }))}
              />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Minimum Roster Size</label>
              <Input 
                type="number"
                value={budgetConfig.minRoster}
                onChange={(e) => setBudgetConfig(prev => ({ ...prev, minRoster: Number(e.target.value) }))}
              />
            </div>
            <Button 
              onClick={() => {
                api.put('/system/config', budgetConfig)
                  .then(() => {
                    toast.success('Config saved');
                    queryClient.invalidateQueries();
                  })
                  .catch(() => toast.error('Failed to save config'));
              }}
            >
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      <TeamManagerForm />

      <Card>
        <CardHeader>
          <CardTitle>Advanced Configuration (JSON)</CardTitle>
          <p className="text-sm text-muted-foreground">Update Base Prices (Categories) and Bid Tiers (Rules) directly.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Categories Array (JSON)</label>
            <textarea 
              className="w-full h-32 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
              placeholder={'[\n  { "name": "A", "basePrice": 1000 },\n  { "name": "B", "basePrice": 500 }\n]'}
              id="categories-json"
            />
            <Button 
              size="sm"
              onClick={() => {
                try {
                  const val = (document.getElementById('categories-json') as HTMLTextAreaElement).value;
                  const parsed = JSON.parse(val);
                  api.put('/system/categories', parsed)
                    .then(() => toast.success('Categories updated'))
                    .catch((err) => toast.error(err.response?.data?.message || 'Error updating'));
                } catch (e) {
                  toast.error('Invalid JSON');
                }
              }}
            >
              Update Categories
            </Button>
          </div>
          <div className="space-y-2 pt-4">
            <label className="text-sm font-medium">Bid Rules Array (JSON)</label>
            <textarea 
              className="w-full h-32 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
              placeholder={'[\n  { "minBudgetPercent": 0.0, "maxBudgetPercent": 0.03, "raisePercent": 0.0015 },\n  { "minBudgetPercent": 0.03, "maxBudgetPercent": 1.0, "raisePercent": 0.005 }\n]'}
              id="rules-json"
            />
            <Button 
              size="sm"
              onClick={() => {
                try {
                  const val = (document.getElementById('rules-json') as HTMLTextAreaElement).value;
                  const parsed = JSON.parse(val);
                  api.put('/system/rules', parsed)
                    .then(() => toast.success('Rules updated'))
                    .catch((err) => toast.error(err.response?.data?.message || 'Error updating'));
                } catch (e) {
                  toast.error('Invalid JSON');
                }
              }}
            >
              Update Bid Rules
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive shadow-sm">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone: Nuke Protocols</CardTitle>
          <p className="text-sm text-muted-foreground">These actions are completely irreversible. Proceed with extreme caution.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border border-destructive/30 bg-destructive/5 rounded-lg flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-destructive">Level 1: Tournament Wipe</h4>
                <p className="text-sm text-muted-foreground mt-2 mb-4">Deletes all matches, scores, points tables, and stats. Reverts the event back to the end of the Auction.</p>
              </div>
              <Button variant="destructive" className="w-full" onClick={() => setNukeLevel(1)}>Execute Level 1</Button>
            </div>
            
            <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-lg flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-destructive">Level 2: Roster Wipe</h4>
                <p className="text-sm text-muted-foreground mt-2 mb-4">Deletes all players, teams, ledgers, and Cloudinary images. Reverts the event back to Pre-Registration.</p>
              </div>
              <Button variant="destructive" className="w-full" onClick={() => setNukeLevel(2)}>Execute Level 2</Button>
            </div>

            <div className="p-4 border-2 border-destructive bg-destructive/20 rounded-lg flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-destructive">Level 3: Factory Reset</h4>
                <p className="text-sm text-muted-foreground mt-2 mb-4">Drops all tables and completely wipes the database. Retains only Super Admin credentials.</p>
              </div>
              <Button variant="destructive" className="w-full" onClick={() => setNukeLevel(3)}>Execute Level 3</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={nukeLevel > 0} onOpenChange={(open) => !open && setNukeLevel(0)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Confirm Nuke Protocol Level {nukeLevel}</DialogTitle>
            <DialogDescription>
              This action is irreversible. It will permanently delete database records and associated media assets.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm font-medium">To confirm, please type the following exactly as shown:</p>
            <div className="p-2 bg-muted rounded text-center font-mono text-destructive select-all">
              CONFIRM_NUKE_LEVEL_{nukeLevel}
            </div>
            <Input 
              placeholder={`Type CONFIRM_NUKE_LEVEL_${nukeLevel}`}
              value={nukeConfirm}
              onChange={(e) => setNukeConfirm(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNukeLevel(0)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleNuke}
              disabled={nukeMutation.isPending || nukeConfirm !== `CONFIRM_NUKE_LEVEL_${nukeLevel}`}
            >
              Confirm & Execute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
