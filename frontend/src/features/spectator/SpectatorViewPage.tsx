import { useQuery } from '@tanstack/react-query';
import { LiveAuctionPublicPodium } from '../landing/components/LiveAuctionPublicPodium';
import api from '../../services/api';

export const SpectatorViewPage = () => {
  const { data: landingData, isLoading } = useQuery({
    queryKey: ['public', 'landing'],
    queryFn: async () => {
      const res = await api.get('/public/landing');
      return res.data.data;
    },
    refetchInterval: 10000
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-2 md:p-4">
      <LiveAuctionPublicPodium data={landingData} schedule={landingData?.schedule} />
    </div>
  );
};
