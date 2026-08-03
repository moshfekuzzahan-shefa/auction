import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useAppDispatch } from '../../store/hooks';
import { setPhase } from '../../store/systemSlice';
import { useEffect } from 'react';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';

// Views
import { SetupOfflineView } from './components/SetupOfflineView';
import { RegistrationOpenView } from './components/RegistrationOpenView';
import { LiveAuctionPublicPodium } from './components/LiveAuctionPublicPodium';
import { TournamentDashboardView } from './components/TournamentDashboardView';

export const LandingPage = () => {
  const dispatch = useAppDispatch();

  const { data: responseData, isLoading, error, refetch } = useQuery({
    queryKey: ['public', 'landing'],
    queryFn: async () => {
      const res = await api.get('/public/landing');
      return res.data.data; // Note: Assuming standard response { success, message, data: { phase, message, data } }
    }
  });

  const payload = responseData || {};
  const currentPhase = payload.phase;

  useEffect(() => {
    if (currentPhase) {
      dispatch(setPhase(currentPhase));
    }
  }, [currentPhase, dispatch]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 space-y-8">
        <Skeleton className="h-[100px] w-full max-w-3xl mx-auto rounded-xl" />
        <Skeleton className="h-[400px] w-full max-w-5xl mx-auto rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8 flex justify-center mt-20">
        <ErrorState 
          title="Unable to Connect"
          message="We couldn't retrieve the event data. Please ensure you are connected to the network and try again."
          onRetry={() => refetch()}
          className="max-w-md w-full"
        />
      </div>
    );
  }

  const renderPhaseView = () => {
    switch (currentPhase) {
      case 'SETUP':
        return <SetupOfflineView message={payload.message} schedule={payload.schedule} />;
      case 'REGISTRATION':
        return <RegistrationOpenView message={payload.message} data={payload.data} schedule={payload.schedule} />;
      case 'AUCTION':
        return <LiveAuctionPublicPodium message={payload.message} data={payload.data} schedule={payload.schedule} isReadOnly={true} />;
      case 'TOURNAMENT':
        return <TournamentDashboardView message={payload.message} data={payload.data} />;
      default:
        return <SetupOfflineView />;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-[calc(100vh-140px)]">
      {renderPhaseView()}
    </div>
  );
};
