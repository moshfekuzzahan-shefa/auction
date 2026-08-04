import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/Dialog';
import { Badge } from '../../components/ui/Badge';
import { 
  Plus, Trash2, Shield, Save, Settings, Users, Calendar, DollarSign, 
  Link2, Copy, ExternalLink, AlertTriangle, Crown, Trophy, PlayCircle,
  UserCheck, Flame, ChevronRight, Gavel, Clock, ListOrdered, Activity, Award, Megaphone
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { TeamManagerForm } from './TeamManagerForm';
import { useAppDispatch } from '../../store/hooks';
import { setPhase } from '../../store/systemSlice';

interface CategoryRow {
  name: string;
  basePrice: number | string;
}

interface SlabRuleRow {
  id?: string;
  minPrice: number;
  maxPrice: number;
  incrementType: 'PERCENT' | 'FIXED';
  incrementValue: number;
}

export const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  // Active Navigation Tab (Reflects Lifecycle Phase: SETUP | REGISTRATION | AUCTION | TOURNAMENT)
  const [activeTab, setActiveTab] = useState<'SETUP' | 'REGISTRATION' | 'AUCTION' | 'TOURNAMENT'>('SETUP');

  const [nukeLevel, setNukeLevel] = useState<number>(0);
  const [nukeConfirm, setNukeConfirm] = useState('');
  
  const [budgetConfig, setBudgetConfig] = useState({ totalBudget: 10000, minRoster: 11 });
  const [scheduleConfig, setScheduleConfig] = useState({
    registrationStart: '',
    registrationEnd: '',
    auctionStart: '',
    auctionEnd: ''
  });

  const [auctionRules, setAuctionRules] = useState({
    bidIncrement: 50,
    timerSeconds: 30,
    categoryOrder: 'PLATINUM,GOLD,SILVER,BRONZE'
  });

  const [tournamentRules, setTournamentRules] = useState({
    matchDuration: 90,
    pointsPerWin: 3,
    pointsPerDraw: 1
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

  const { data: allPlayers } = useQuery({
    queryKey: ['admin', 'players'],
    queryFn: async () => {
      const res = await api.get('/player/admin/all');
      return res.data.data;
    }
  });

  const { data: pendingTeamRequests } = useQuery({
    queryKey: ['admin', 'pending-teams'],
    queryFn: async () => {
      const res = await api.get('/teams/requests/pending');
      return res.data.data;
    }
  });

  const [announcementText, setAnnouncementText] = useState<string>('IPL & FUT Style Live Auction Podium');

  const [slabRules, setSlabRules] = useState<SlabRuleRow[]>([
    { minPrice: 0, maxPrice: 1000, incrementType: 'PERCENT', incrementValue: 10 },
    { minPrice: 1001, maxPrice: 5000, incrementType: 'PERCENT', incrementValue: 5 },
    { minPrice: 5001, maxPrice: 100000, incrementType: 'FIXED', incrementValue: 500 },
  ]);

  const { data: rulesData } = useQuery({
    queryKey: ['system', 'rules'],
    queryFn: async () => {
      const res = await api.get('/system/rules');
      return res.data.data;
    }
  });

  useEffect(() => {
    if (rulesData && Array.isArray(rulesData) && rulesData.length > 0) {
      setSlabRules(rulesData.map((r: any) => ({
        id: r.id,
        minPrice: r.minPrice,
        maxPrice: r.maxPrice,
        incrementType: r.incrementType || 'PERCENT',
        incrementValue: r.incrementValue || 10
      })));
    }
  }, [rulesData]);

  // Keep internal state in sync with fetched system state initially
  useEffect(() => {
    if (systemState) {
      setBudgetConfig({ 
        totalBudget: systemState.totalBudget, 
        minRoster: systemState.minRoster 
      });
      if (systemState.announcement !== undefined) {
        setAnnouncementText(systemState.announcement || '');
      }
      setScheduleConfig({
        registrationStart: systemState.registrationStart ? new Date(systemState.registrationStart).toISOString().slice(0, 16) : '',
        registrationEnd: systemState.registrationEnd ? new Date(systemState.registrationEnd).toISOString().slice(0, 16) : '',
        auctionStart: systemState.auctionStart ? new Date(systemState.auctionStart).toISOString().slice(0, 16) : '',
        auctionEnd: systemState.auctionEnd ? new Date(systemState.auctionEnd).toISOString().slice(0, 16) : '',
      });
      if (systemState.categories && Array.isArray(systemState.categories) && systemState.categories.length > 0) {
        setCategoriesList(systemState.categories.map((c: any) => ({ name: c.name, basePrice: c.basePrice })));
      }
      if (systemState.currentPhase) {
        setActiveTab(systemState.currentPhase as any);
      }
    }
  }, [systemState]);

  const changePhaseMutation = useMutation({
    mutationFn: async (phase: string) => {
      const res = await api.put('/system/phase', { phase });
      return res.data;
    },
    onSuccess: (_, variables) => {
      toast.success(`System Phase changed to ${variables}`);
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
      setNukeLevel(0);
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

  const copyRegistrationLink = () => {
    const link = `${window.location.origin}/register/player`;
    navigator.clipboard.writeText(link);
    toast.success('Registration link copied to clipboard!');
  };

  if (isLoading) return <div className="p-8 text-center text-slate-400">Loading System Config...</div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/90 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Settings className="w-8 h-8 text-emerald-400" />
            <span>System Configuration</span>
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Dynamic phase-based controls. Selecting a lifecycle tab renders context-specific parameters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge className="px-3.5 py-1.5 bg-emerald-950 text-emerald-300 border border-emerald-500/50 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg">
            Active Lifecycle Phase: {systemState?.currentPhase}
          </Badge>
        </div>
      </div>

      {/* 
        =========================================================
        DYNAMIC LIFECYCLE PHASE SWITCHER TABS:
        SETUP | REGISTRATION | AUCTION | TOURNAMENT
        =========================================================
      */}
      <div className="flex items-center justify-between bg-slate-950/80 p-2 rounded-2xl border border-slate-800 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('SETUP')}
          className={`flex-1 min-w-[140px] h-12 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'SETUP'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>1. Setup Phase</span>
        </button>

        <button
          onClick={() => setActiveTab('REGISTRATION')}
          className={`flex-1 min-w-[140px] h-12 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'REGISTRATION'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>2. Registration Phase</span>
        </button>

        <button
          onClick={() => setActiveTab('AUCTION')}
          className={`flex-1 min-w-[140px] h-12 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'AUCTION'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Gavel className="w-4 h-4" />
          <span>3. Auction Phase</span>
        </button>

        <button
          onClick={() => setActiveTab('TOURNAMENT')}
          className={`flex-1 min-w-[140px] h-12 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'TOURNAMENT'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 scale-[1.02]'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>4. Tournament Phase</span>
        </button>
      </div>

      {/* 
        =========================================================
        1. SETUP PHASE CONTROLS (activePhase === 'SETUP')
        SHOWS ONLY:
        - Category Tiers & Base Prices Configuration
        - Budget & Roster Rules
        - Danger Zone: Nuke Protocols
        =========================================================
      */}
      {activeTab === 'SETUP' && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Phase Activation Header */}
          <Card className="bg-slate-900/90 border-slate-800">
            <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-white text-sm">Event Phase: SETUP</h3>
                <p className="text-xs text-slate-400">Lock baseline tournament parameters before opening player registrations.</p>
              </div>
              <Button
                onClick={() => changePhaseMutation.mutate('SETUP')}
                disabled={systemState?.currentPhase === 'SETUP' || changePhaseMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 font-bold text-xs px-5 h-9 rounded-xl shadow-md shrink-0"
              >
                Set System to SETUP Phase
              </Button>
            </CardContent>
          </Card>

          {/* Public Page Custom Announcement Banner */}
          <Card className="bg-slate-900/90 border-slate-800 shadow-xl">
            <CardHeader className="bg-slate-950/80 border-b border-slate-800">
              <CardTitle className="text-lg font-bold text-white flex items-center space-x-2">
                <Megaphone className="w-5 h-5 text-emerald-400" />
                <span>Public Page Top Header Announcement</span>
              </CardTitle>
              <p className="text-xs text-slate-400">
                Set a custom broadcast announcement title to be displayed live at the top of the public landing and live auction pages.
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-300">Public Header Announcement Text</label>
                <Input 
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="e.g. IPL & FUT Style Live Auction Podium"
                  className="bg-slate-950 border-slate-700 text-white font-semibold text-sm h-11"
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button 
                  onClick={() => {
                    api.put('/system/announcement', { announcement: announcementText })
                      .then(() => {
                        toast.success('Public Header Announcement updated live!');
                        queryClient.invalidateQueries();
                      })
                      .catch(() => toast.error('Failed to update announcement'));
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 font-bold text-xs px-6 h-10 rounded-xl flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Header Announcement
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 1.1 Registration Schedule & Countdowns Setup */}
          <Card className="bg-slate-900/90 border-slate-800 shadow-xl">
            <CardHeader className="bg-slate-950/80 border-b border-slate-800">
              <CardTitle className="text-lg font-bold text-white flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <span>Registration Schedule & Countdowns</span>
              </CardTitle>
              <p className="text-xs text-slate-400">
                Configure player registration opening and closing dates before initiating the registration phase.
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-300">Registration Start Date & Time</label>
                  <Input 
                    type="datetime-local"
                    value={scheduleConfig.registrationStart}
                    onChange={(e) => setScheduleConfig(prev => ({ ...prev, registrationStart: e.target.value }))}
                    className="bg-slate-950 border-slate-700 text-white text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-300">Registration Deadline (End)</label>
                  <Input 
                    type="datetime-local"
                    value={scheduleConfig.registrationEnd}
                    onChange={(e) => setScheduleConfig(prev => ({ ...prev, registrationEnd: e.target.value }))}
                    className="bg-slate-950 border-slate-700 text-white text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button 
                  onClick={() => {
                    api.put('/system/schedule', scheduleConfig)
                      .then(() => {
                        toast.success('Registration Schedule saved!');
                        queryClient.invalidateQueries();
                      })
                      .catch(() => toast.error('Failed to save schedule'));
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 font-bold text-xs px-6 h-10 rounded-xl"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Registration Timers
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 1.2 Category Tiers & Base Prices Configuration */}
          <Card className="bg-slate-900/90 border-slate-800 shadow-xl">
            <CardHeader className="bg-slate-950/80 border-b border-slate-800">
              <CardTitle className="text-lg font-bold text-white flex items-center space-x-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span>Player Categories & Base Prices Configuration</span>
              </CardTitle>
              <p className="text-xs text-slate-400">
                Define player category tiers and starting auction base prices.
              </p>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-12 gap-3 text-xs uppercase font-extrabold tracking-wider text-slate-400 px-1">
                <div className="col-span-6">Category Tier Name</div>
                <div className="col-span-5">Base Price ($)</div>
                <div className="col-span-1 text-center">Action</div>
              </div>

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
                  <span>Save Category Base Prices</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 1.2 Budget & Roster Rules */}
          <Card className="bg-slate-900/90 border-slate-800 shadow-xl">
            <CardHeader className="bg-slate-950/80 border-b border-slate-800">
              <CardTitle className="text-lg font-bold text-white flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <span>Budget & Roster Rules</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2 w-full">
                  <label className="text-xs font-bold uppercase text-slate-300">Total Team Budget ($)</label>
                  <Input 
                    type="number"
                    value={budgetConfig.totalBudget}
                    onChange={(e) => setBudgetConfig(prev => ({ ...prev, totalBudget: Number(e.target.value) }))}
                    className="bg-slate-950 border-slate-700 text-emerald-400 font-mono font-bold text-sm"
                  />
                </div>
                <div className="flex-1 space-y-2 w-full">
                  <label className="text-xs font-bold uppercase text-slate-300">Minimum Roster Size</label>
                  <Input 
                    type="number"
                    value={budgetConfig.minRoster}
                    onChange={(e) => setBudgetConfig(prev => ({ ...prev, minRoster: Number(e.target.value) }))}
                    className="bg-slate-950 border-slate-700 text-white font-mono font-bold text-sm"
                  />
                </div>
                <Button 
                  onClick={() => {
                    api.put('/system/config', budgetConfig)
                      .then(() => {
                        toast.success('Budget & Roster Rules saved!');
                        queryClient.invalidateQueries();
                      })
                      .catch(() => toast.error('Failed to save config'));
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 font-bold text-xs px-6 h-10 rounded-xl"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 1.3 Danger Zone: Nuke Protocols */}
          <Card className="border-red-500/50 bg-slate-900/90 shadow-xl">
            <CardHeader className="bg-red-950/30 border-b border-red-500/30">
              <CardTitle className="text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span>Danger Zone: Nuke Protocols</span>
              </CardTitle>
              <p className="text-xs text-red-300/80">These actions are completely irreversible. Proceed with extreme caution.</p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border border-red-500/30 bg-red-950/20 rounded-xl flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-bold text-red-400 text-sm">Level 1: Tournament Wipe</h4>
                    <p className="text-xs text-slate-400 mt-1">Deletes all matches, scores, points tables, and stats. Reverts event back to end of Auction.</p>
                  </div>
                  <Button variant="destructive" className="w-full text-xs font-bold h-9 rounded-xl" onClick={() => setNukeLevel(1)}>Execute Level 1</Button>
                </div>
                
                <div className="p-4 border border-red-500/50 bg-red-950/40 rounded-xl flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-bold text-red-400 text-sm">Level 2: Roster Wipe</h4>
                    <p className="text-xs text-slate-400 mt-1">Deletes all players, teams, ledgers, and uploaded photos. Reverts event back to Pre-Registration.</p>
                  </div>
                  <Button variant="destructive" className="w-full text-xs font-bold h-9 rounded-xl" onClick={() => setNukeLevel(2)}>Execute Level 2</Button>
                </div>

                <div className="p-4 border-2 border-red-500 bg-red-950/60 rounded-xl flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-bold text-red-400 text-sm">Level 3: Factory Reset</h4>
                    <p className="text-xs text-slate-400 mt-1">Wipes all tables and resets database. Retains only Super Admin credentials.</p>
                  </div>
                  <Button variant="destructive" className="w-full text-xs font-bold h-9 rounded-xl" onClick={() => setNukeLevel(3)}>Execute Level 3</Button>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      )}

      {/* 
        =========================================================
        2. REGISTRATION PHASE CONTROLS (activePhase === 'REGISTRATION')
        SHOWS ONLY:
        - Registration Schedule & Countdown inputs
        - Public Share Link & Status
        - Team Creation & Franchise Roster Management settings
        - Player & Team Approval Shortcuts
        =========================================================
      */}
      {activeTab === 'REGISTRATION' && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Phase Activation Header */}
          <Card className="bg-slate-900/90 border-slate-800">
            <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-white text-sm">Event Phase: REGISTRATION</h3>
                <p className="text-xs text-slate-400">Open player profile submissions and franchise team manager registrations.</p>
              </div>
              <Button
                onClick={() => changePhaseMutation.mutate('REGISTRATION')}
                disabled={systemState?.currentPhase === 'REGISTRATION' || changePhaseMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 font-bold text-xs px-5 h-9 rounded-xl shadow-md shrink-0"
              >
                Set System to REGISTRATION Phase
              </Button>
            </CardContent>
          </Card>

          {/* 2.1 Registration Schedule & Countdown Inputs */}
          <Card className="bg-slate-900/90 border-slate-800 shadow-xl">
            <CardHeader className="bg-slate-950/80 border-b border-slate-800">
              <CardTitle className="text-lg font-bold text-white flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <span>Registration Schedule & Countdown Inputs</span>
              </CardTitle>
              <p className="text-xs text-slate-400">
                Set public countdown timers for player registrations.
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-300">Registration Start Date & Time</label>
                  <Input 
                    type="datetime-local"
                    value={scheduleConfig.registrationStart}
                    onChange={(e) => setScheduleConfig(prev => ({ ...prev, registrationStart: e.target.value }))}
                    className="bg-slate-950 border-slate-700 text-white text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-300">Registration Deadline (End)</label>
                  <Input 
                    type="datetime-local"
                    value={scheduleConfig.registrationEnd}
                    onChange={(e) => setScheduleConfig(prev => ({ ...prev, registrationEnd: e.target.value }))}
                    className="bg-slate-950 border-slate-700 text-white text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button 
                  onClick={() => {
                    api.put('/system/schedule', scheduleConfig)
                      .then(() => {
                        toast.success('Registration Schedule saved!');
                        queryClient.invalidateQueries();
                      })
                      .catch(() => toast.error('Failed to save schedule'));
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 font-bold text-xs px-6 h-10 rounded-xl"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Registration Timers
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 2.2 Public Registration Link */}
          <Card className="bg-slate-900/90 border-slate-800 shadow-xl">
            <CardHeader className="bg-slate-950/80 border-b border-slate-800">
              <CardTitle className="text-lg font-bold text-white flex items-center space-x-2">
                <Link2 className="w-5 h-5 text-emerald-400" />
                <span>Public Registration Form Link</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Input 
                  readOnly
                  value={`${window.location.origin}/register/player`}
                  className="bg-slate-950 border-slate-700 text-emerald-300 font-mono text-xs h-11"
                />
                <Button 
                  onClick={copyRegistrationLink}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-11 px-5 rounded-xl shrink-0 flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </Button>
                <Link to="/register/player" target="_blank">
                  <Button 
                    variant="outline"
                    className="w-full sm:w-auto border-slate-700 text-slate-300 hover:text-white h-11 px-4 rounded-xl flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Form</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* 2.3 Team Creation & Roster Management Settings */}
          <TeamManagerForm />

          {/* 2.4 Registration Approval Shortcuts */}
          <div className="grid md:grid-cols-3 gap-6">
            
            <Card className="bg-slate-900/90 border-slate-800 shadow-xl hover:border-emerald-500/50 transition-all group">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-emerald-950/80 rounded-2xl border border-emerald-500/40 text-emerald-400">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <Badge className="bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-mono font-bold text-xs">
                    {allPlayers?.length || 0} Registered
                  </Badge>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                    Players Roster & Categories
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Review registered player profiles and assign Category Tiers (Platinum/Gold/Silver).
                  </p>
                </div>
                <Link to="/admin/players" className="block pt-2">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10 rounded-xl flex items-center justify-center gap-2 shadow-md">
                    <span>Manage Players Directory</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/90 border-slate-800 shadow-xl hover:border-blue-500/50 transition-all group">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-blue-950/80 rounded-2xl border border-blue-500/40 text-blue-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <Badge className="bg-blue-950 text-blue-300 border border-blue-500/40 font-mono font-bold text-xs">
                    {pendingTeamRequests?.length || 0} Pending
                  </Badge>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                    Franchise Team Requests
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Approve or reject team manager applications and franchise registrations.
                  </p>
                </div>
                <Link to="/admin/team-requests" className="block pt-2">
                  <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-10 rounded-xl flex items-center justify-center gap-2 shadow-md">
                    <span>Review Team Requests</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/90 border-slate-800 shadow-xl hover:border-purple-500/50 transition-all group">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-purple-950/80 rounded-2xl border border-purple-500/40 text-purple-400">
                    <Crown className="w-6 h-6" />
                  </div>
                  <Badge className="bg-purple-950 text-purple-300 border border-purple-500/40 font-mono font-bold text-xs">
                    Podium Roles
                  </Badge>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                    Podium Admin Applications
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Approve Podium Admin privileges for auction room operators.
                  </p>
                </div>
                <Link to="/admin/podium-requests" className="block pt-2">
                  <Button className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs h-10 rounded-xl flex items-center justify-center gap-2 shadow-md">
                    <span>Review Podium Requests</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

          </div>

        </div>
      )}

      {/* 
        =========================================================
        3. AUCTION PHASE CONTROLS (activePhase === 'AUCTION')
        SHOWS ONLY:
        - Auction Start/End Timers
        - Auction Order & Lot Configuration
        - Live Auction Control Parameters & Podium Launch
        =========================================================
      */}
      {activeTab === 'AUCTION' && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Phase Activation Header */}
          <Card className="bg-slate-900/90 border-slate-800">
            <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-white text-sm">Event Phase: AUCTION</h3>
                <p className="text-xs text-slate-400">Launch live bidding rooms and activate real-time budget ledgers.</p>
              </div>
              <Button
                onClick={() => changePhaseMutation.mutate('AUCTION')}
                disabled={systemState?.currentPhase === 'AUCTION' || changePhaseMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 font-bold text-xs px-5 h-9 rounded-xl shadow-md shrink-0"
              >
                Set System to AUCTION Phase
              </Button>
            </CardContent>
          </Card>

          {/* 3.1 Auction Start/End Timers */}
          <Card className="bg-slate-900/90 border-slate-800 shadow-xl">
            <CardHeader className="bg-slate-950/80 border-b border-slate-800">
              <CardTitle className="text-lg font-bold text-white flex items-center space-x-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                <span>Auction Timers & Schedule</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-300">Auction Start Date & Time</label>
                  <Input 
                    type="datetime-local"
                    value={scheduleConfig.auctionStart}
                    onChange={(e) => setScheduleConfig(prev => ({ ...prev, auctionStart: e.target.value }))}
                    className="bg-slate-950 border-slate-700 text-white text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-300">Auction End Date & Time</label>
                  <Input 
                    type="datetime-local"
                    value={scheduleConfig.auctionEnd}
                    onChange={(e) => setScheduleConfig(prev => ({ ...prev, auctionEnd: e.target.value }))}
                    className="bg-slate-950 border-slate-700 text-white text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button 
                  onClick={() => {
                    api.put('/system/schedule', scheduleConfig)
                      .then(() => {
                        toast.success('Auction Schedule saved!');
                        queryClient.invalidateQueries();
                      })
                      .catch(() => toast.error('Failed to save schedule'));
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 font-bold text-xs px-6 h-10 rounded-xl"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Auction Schedule
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 3.2 Price Range Slabs & Bid Increment Rules */}
          <Card className="bg-slate-900/90 border-slate-800 shadow-xl">
            <CardHeader className="bg-slate-950/80 border-b border-slate-800">
              <CardTitle className="text-lg font-bold text-white flex items-center space-x-2">
                <Gavel className="w-5 h-5 text-emerald-400" />
                <span>Price Range Slabs & Bid Increment Rules</span>
              </CardTitle>
              <p className="text-xs text-slate-400">
                Define player price range slabs and dynamic minimum percentage (%) or fixed ($) bid increment rules.
              </p>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-12 gap-3 text-xs uppercase font-extrabold tracking-wider text-slate-400 px-1">
                <div className="col-span-3">Min Price ($)</div>
                <div className="col-span-3">Max Price ($)</div>
                <div className="col-span-3">Increment Type</div>
                <div className="col-span-2">Increment Value</div>
                <div className="col-span-1 text-center">Action</div>
              </div>

              <div className="space-y-3">
                {slabRules.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div className="col-span-3">
                      <Input 
                        type="number"
                        value={row.minPrice}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setSlabRules(prev => prev.map((r, i) => i === idx ? { ...r, minPrice: val } : r));
                        }}
                        placeholder="0"
                        className="h-10 bg-slate-900 border-slate-700 text-white font-mono text-xs rounded-lg"
                      />
                    </div>
                    <div className="col-span-3">
                      <Input 
                        type="number"
                        value={row.maxPrice}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setSlabRules(prev => prev.map((r, i) => i === idx ? { ...r, maxPrice: val } : r));
                        }}
                        placeholder="1000"
                        className="h-10 bg-slate-900 border-slate-700 text-white font-mono text-xs rounded-lg"
                      />
                    </div>
                    <div className="col-span-3">
                      <select
                        value={row.incrementType}
                        onChange={(e) => {
                          const val = e.target.value as 'PERCENT' | 'FIXED';
                          setSlabRules(prev => prev.map((r, i) => i === idx ? { ...r, incrementType: val } : r));
                        }}
                        className="w-full h-10 bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg px-2"
                      >
                        <option value="PERCENT">Percentage (%)</option>
                        <option value="FIXED">Fixed Amount ($)</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <Input 
                        type="number"
                        value={row.incrementValue}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setSlabRules(prev => prev.map((r, i) => i === idx ? { ...r, incrementValue: val } : r));
                        }}
                        placeholder="10"
                        className="h-10 bg-slate-900 border-slate-700 text-emerald-400 font-mono font-bold text-xs rounded-lg"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => setSlabRules(prev => prev.filter((_, i) => i !== idx))}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors"
                        title="Remove Rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const lastMax = slabRules.length > 0 ? slabRules[slabRules.length - 1].maxPrice : 0;
                    setSlabRules(prev => [...prev, { minPrice: lastMax + 1, maxPrice: lastMax + 5000, incrementType: 'PERCENT', incrementValue: 10 }]);
                  }}
                  className="w-full sm:w-auto h-10 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 font-bold text-xs flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>Add Price Slab Rule</span>
                </Button>

                <Button
                  type="button"
                  onClick={() => {
                    api.put('/system/rules', { rules: slabRules })
                      .then(() => {
                        toast.success('Auction Price Range Slabs saved successfully!');
                        queryClient.invalidateQueries();
                      })
                      .catch(() => toast.error('Failed to save bid rules'));
                  }}
                  className="w-full sm:w-auto h-10 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 rounded-xl shadow-lg flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Price Range Slabs</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 3.2 Auction Order & Lot Configuration */}
          <Card className="bg-slate-900/90 border-slate-800 shadow-xl">
            <CardHeader className="bg-slate-950/80 border-b border-slate-800">
              <CardTitle className="text-lg font-bold text-white flex items-center space-x-2">
                <ListOrdered className="w-5 h-5 text-emerald-400" />
                <span>Auction Order & Bidding Lot Parameters</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-300">Min Bid Increment ($)</label>
                  <Input 
                    type="number"
                    value={auctionRules.bidIncrement}
                    onChange={(e) => setAuctionRules(prev => ({ ...prev, bidIncrement: Number(e.target.value) }))}
                    className="bg-slate-950 border-slate-700 text-emerald-400 font-mono font-bold text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-300">Lot Countdown Timer (Seconds)</label>
                  <Input 
                    type="number"
                    value={auctionRules.timerSeconds}
                    onChange={(e) => setAuctionRules(prev => ({ ...prev, timerSeconds: Number(e.target.value) }))}
                    className="bg-slate-950 border-slate-700 text-white font-mono font-bold text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-300">Category Tier Bidding Order</label>
                  <Input 
                    value={auctionRules.categoryOrder}
                    onChange={(e) => setAuctionRules(prev => ({ ...prev, categoryOrder: e.target.value }))}
                    placeholder="PLATINUM,GOLD,SILVER,BRONZE"
                    className="bg-slate-950 border-slate-700 text-white font-mono font-semibold text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button 
                  onClick={() => toast.success('Auction Lot Rules saved!')}
                  className="bg-emerald-600 hover:bg-emerald-500 font-bold text-xs px-6 h-10 rounded-xl"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Auction Rules
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 3.3 Live Auction Control Parameters & Podium Launch */}
          <Card className="bg-slate-900/90 border-slate-800 shadow-xl border-2 border-emerald-500/30">
            <CardHeader className="bg-slate-950/80 border-b border-slate-800">
              <CardTitle className="text-lg font-bold text-white flex items-center space-x-2">
                <Gavel className="w-5 h-5 text-emerald-400" />
                <span>Live Auction Podium Launch</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-xs text-slate-300">
                Launch the interactive live bidding room to start timers, process team bids, and lock player sales.
              </p>
              <Link to="/auction/admin">
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-11 px-6 rounded-xl flex items-center gap-2 shadow-lg">
                  <PlayCircle className="w-4 h-4" />
                  <span>Launch Live Auction Podium</span>
                </Button>
              </Link>
            </CardContent>
          </Card>

        </div>
      )}

      {/* 
        =========================================================
        4. TOURNAMENT PHASE CONTROLS (activePhase === 'TOURNAMENT')
        SHOWS ONLY:
        - Match Scheduling & Fixture Generator Settings
        - Upcoming/Latest Match Controls & Quick Score Updates
        - Points Table Management & Standings
        =========================================================
      */}
      {activeTab === 'TOURNAMENT' && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Phase Activation Header */}
          <Card className="bg-slate-900/90 border-slate-800">
            <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-white text-sm">Event Phase: TOURNAMENT</h3>
                <p className="text-xs text-slate-400">Lock rosters and open tournament match fixtures and points tables.</p>
              </div>
              <Button
                onClick={() => changePhaseMutation.mutate('TOURNAMENT')}
                disabled={systemState?.currentPhase === 'TOURNAMENT' || changePhaseMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 font-bold text-xs px-5 h-9 rounded-xl shadow-md shrink-0"
              >
                Set System to TOURNAMENT Phase
              </Button>
            </CardContent>
          </Card>

          {/* 4.1 Match Scheduling & Fixture Generator Settings */}
          <Card className="bg-slate-900/90 border-slate-800 shadow-xl">
            <CardHeader className="bg-slate-950/80 border-b border-slate-800">
              <CardTitle className="text-lg font-bold text-white flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <span>Match Scheduling & Fixture Generator</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-300">Default Match Duration (Mins)</label>
                  <Input 
                    type="number"
                    value={tournamentRules.matchDuration}
                    onChange={(e) => setTournamentRules(prev => ({ ...prev, matchDuration: Number(e.target.value) }))}
                    className="bg-slate-950 border-slate-700 text-white font-mono font-bold text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-300">Points per Win</label>
                  <Input 
                    type="number"
                    value={tournamentRules.pointsPerWin}
                    onChange={(e) => setTournamentRules(prev => ({ ...prev, pointsPerWin: Number(e.target.value) }))}
                    className="bg-slate-950 border-slate-700 text-emerald-400 font-mono font-bold text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-300">Points per Draw</label>
                  <Input 
                    type="number"
                    value={tournamentRules.pointsPerDraw}
                    onChange={(e) => setTournamentRules(prev => ({ ...prev, pointsPerDraw: Number(e.target.value) }))}
                    className="bg-slate-950 border-slate-700 text-amber-400 font-mono font-bold text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button 
                  onClick={() => toast.success('Tournament Match Rules saved!')}
                  className="bg-emerald-600 hover:bg-emerald-500 font-bold text-xs px-6 h-10 rounded-xl"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Match Rules
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 4.2 Upcoming / Latest Match Controls & Score Updates */}
          <Card className="bg-slate-900/90 border-slate-800 shadow-xl">
            <CardHeader className="bg-slate-950/80 border-b border-slate-800">
              <CardTitle className="text-lg font-bold text-white flex items-center space-x-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <span>Upcoming & Live Match Controls</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-xs text-slate-300">
                Enter live scores, yellow/red cards, and goal scorers directly into match logs.
              </p>
              <Link to="/tournament/admin">
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-11 px-6 rounded-xl flex items-center gap-2 shadow-lg">
                  <Activity className="w-4 h-4" />
                  <span>Open Live Match Scoreboard</span>
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* 4.3 Points Table Management & Standings */}
          <Card className="bg-slate-900/90 border-slate-800 shadow-xl">
            <CardHeader className="bg-slate-950/80 border-b border-slate-800">
              <CardTitle className="text-lg font-bold text-white flex items-center space-x-2">
                <Award className="w-5 h-5 text-emerald-400" />
                <span>Points Table Management & Standings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-xs text-slate-300">
                Auto-calculate goal difference, points standings, and playoff qualification spots.
              </p>
              <Link to="/tournament/admin">
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-11 px-6 rounded-xl flex items-center gap-2 shadow-lg">
                  <Trophy className="w-4 h-4" />
                  <span>View & Manage Points Table</span>
                </Button>
              </Link>
            </CardContent>
          </Card>

        </div>
      )}

      {/* Nuke Protocol Confirmation Modal */}
      <Dialog open={nukeLevel > 0} onOpenChange={(open) => !open && setNukeLevel(0)}>
        <DialogContent className="bg-slate-950 border-red-500 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-400 font-black">Confirm Nuke Protocol Level {nukeLevel}</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              This action is completely irreversible. It will permanently delete database records and associated media assets.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-xs font-bold text-slate-300">To confirm, please type the following exactly as shown:</p>
            <div className="p-2.5 bg-slate-900 border border-red-500/40 rounded-xl text-center font-mono font-black text-red-400 text-sm select-all">
              CONFIRM_NUKE_LEVEL_{nukeLevel}
            </div>
            <Input 
              placeholder={`Type CONFIRM_NUKE_LEVEL_${nukeLevel}`}
              value={nukeConfirm}
              onChange={(e) => setNukeConfirm(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white font-mono text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNukeLevel(0)} className="border-slate-700 text-slate-300">Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleNuke}
              disabled={nukeMutation.isPending || nukeConfirm !== `CONFIRM_NUKE_LEVEL_${nukeLevel}`}
              className="font-bold text-xs"
            >
              Confirm & Execute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
