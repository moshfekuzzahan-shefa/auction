import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/Dialog';
import { Plus, Trash2, Shield, Save } from 'lucide-react';
import api from '../../services/api';
import { TeamManagerForm } from './TeamManagerForm';
import { useAppDispatch } from '../../store/hooks';
import { setPhase } from '../../store/systemSlice';

interface CategoryRow {
  name: string;
  basePrice: number | string;
}

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

  const [categoriesList, setCategoriesList] = useState<CategoryRow[]>([
    { name: 'Platinum', basePrice: 1000 },
    { name: 'Gold', basePrice: 750 },
    { name: 'Silver', basePrice: 500 },
    { name: 'Bronze', basePrice: 250 },
  ]);

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
      if (systemState.categories && Array.isArray(systemState.categories) && systemState.categories.length > 0) {
        setCategoriesList(systemState.categories.map((c: any) => ({ name: c.name, basePrice: c.basePrice })));
      }
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

  const updateCategoriesMutation = useMutation({
    mutationFn: async (payload: { name: string; basePrice: number }[]) => {
      const res = await api.put('/system/categories', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Category Base Prices updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['system'] });
      queryClient.invalidateQueries({ queryKey: ['public'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update categories');
    }
  });

  const handleAddCategoryRow = () => {
    setCategoriesList(prev => [...prev, { name: '', basePrice: 250 }]);
  };

  const handleRemoveCategoryRow = (index: number) => {
    if (categoriesList.length <= 1) {
      toast.error('You must keep at least one category tier.');
      return;
    }
    setCategoriesList(prev => prev.filter((_, i) => i !== index));
  };

  const handleCategoryRowChange = (index: number, field: 'name' | 'basePrice', value: string) => {
    setCategoriesList(prev => {
      const updated = [...prev];
      if (field === 'basePrice') {
        updated[index].basePrice = value;
      } else {
        updated[index].name = value;
      }
      return updated;
    });
  };

  const handleSaveCategories = () => {
    // Validate
    for (let i = 0; i < categoriesList.length; i++) {
      const cat = categoriesList[i];
      if (!cat.name.trim()) {
        toast.error(`Category row #${i + 1} name cannot be empty.`);
        return;
      }
      const priceNum = Number(cat.basePrice);
      if (isNaN(priceNum) || priceNum <= 0) {
        toast.error(`Category "${cat.name}" base price must be a positive number greater than 0.`);
        return;
      }
    }

    const payload = categoriesList.map(c => ({
      name: c.name.trim(),
      basePrice: Number(c.basePrice)
    }));

    updateCategoriesMutation.mutate(payload);
  };

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

  if (isLoading) return <div className="p-8 text-center text-slate-400">Loading System Config...</div>;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">System Configuration</h1>
        <div className="px-4 py-2 bg-primary/10 text-primary font-medium rounded-md border border-primary/20">
          Current Phase: {systemState?.currentPhase}
        </div>
      </div>

      {/* Event Lifecycle Control */}
      <Card>
        <CardHeader>
          <CardTitle>Event Lifecycle Control</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
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

      {/* Event Schedule & Countdowns */}
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

      {/* Budget & Roster Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Budget & Roster Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2 w-full">
              <label className="text-sm font-medium">Total Team Budget ($)</label>
              <Input 
                type="number"
                value={budgetConfig.totalBudget}
                onChange={(e) => setBudgetConfig(prev => ({ ...prev, totalBudget: Number(e.target.value) }))}
              />
            </div>
            <div className="flex-1 space-y-2 w-full">
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

      {/* Dynamic Player Categories & Base Prices Form */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader className="bg-slate-950/80 border-b border-slate-800">
          <CardTitle className="text-lg font-bold text-white flex items-center space-x-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span>Player Categories & Base Prices Configuration</span>
          </CardTitle>
          <p className="text-xs text-slate-400">
            Define player category tiers and their starting auction base prices.
          </p>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          
          {/* Header Labels */}
          <div className="grid grid-cols-12 gap-3 text-xs uppercase font-extrabold tracking-wider text-slate-400 px-1">
            <div className="col-span-6">Category Tier Name</div>
            <div className="col-span-5">Base Price ($)</div>
            <div className="col-span-1 text-center">Action</div>
          </div>

          {/* Dynamic Rows */}
          <div className="space-y-3">
            {categoriesList.map((row, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div className="col-span-6">
                  <Input 
                    value={row.name}
                    onChange={(e) => handleCategoryRowChange(idx, 'name', e.target.value)}
                    placeholder="e.g. Platinum, Gold, Silver"
                    className="h-10 bg-slate-900 border-slate-700 text-white text-sm font-semibold rounded-lg"
                  />
                </div>
                <div className="col-span-5">
                  <Input 
                    type="number"
                    value={row.basePrice}
                    onChange={(e) => handleCategoryRowChange(idx, 'basePrice', e.target.value)}
                    placeholder="Base Price ($)"
                    min={1}
                    className="h-10 bg-slate-900 border-slate-700 text-emerald-400 font-mono font-bold text-sm rounded-lg"
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveCategoryRow(idx)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors"
                    title="Remove Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons: Add Tier & Save */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={handleAddCategoryRow}
              className="w-full sm:w-auto h-10 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 font-bold text-xs flex items-center space-x-2"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Add Category Tier</span>
            </Button>

            <Button
              type="button"
              onClick={handleSaveCategories}
              disabled={updateCategoriesMutation.isPending}
              className="w-full sm:w-auto h-10 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 rounded-xl shadow-lg shadow-emerald-950/50 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Update Category Base Prices</span>
            </Button>
          </div>

        </CardContent>
      </Card>

      {/* Danger Zone: Nuke Protocols */}
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

      {/* Nuke Protocol Confirmation Modal */}
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
