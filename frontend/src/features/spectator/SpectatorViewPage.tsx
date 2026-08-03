import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { LiveAuctionPublicPodium } from '../landing/components/LiveAuctionPublicPodium';
import { PodiumAdminApplicationModal } from './PodiumAdminApplicationModal';
import { Button } from '../../components/ui/Button';
import { Crown } from 'lucide-react';
import api from '../../services/api';

export const SpectatorViewPage = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  const { data: landingData, isLoading } = useQuery({
    queryKey: ['public', 'landing'],
    queryFn: async () => {
      const res = await api.get('/public/landing');
      return res.data.data;
    },
    refetchInterval: 10000
  });

  const handleApplyClick = () => {
    if (!user) {
      navigate('/login?redirect=/spectator');
    } else {
      setIsApplyModalOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-2 md:p-4 relative">
      {/* Top Banner Action for Podium Admin Application */}
      <div className="mb-3 flex justify-end">
        <Button 
          onClick={handleApplyClick}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-4 py-2 rounded-xl shadow-lg shadow-purple-950/50 text-xs flex items-center gap-2 border border-purple-400/30"
        >
          <Crown className="w-4 h-4 text-purple-300" />
          <span>Want to conduct auctions? Apply as Podium Admin</span>
        </Button>
      </div>

      <LiveAuctionPublicPodium data={landingData} schedule={landingData?.schedule} />

      <PodiumAdminApplicationModal 
        isOpen={isApplyModalOpen} 
        onClose={() => setIsApplyModalOpen(false)} 
      />
    </div>
  );
};
