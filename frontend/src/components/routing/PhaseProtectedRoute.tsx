import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';

interface PhaseProtectedRouteProps {
  allowedPhases: Array<'SETUP' | 'REGISTRATION' | 'AUCTION' | 'TOURNAMENT'>;
}

export const PhaseProtectedRoute = ({ allowedPhases }: PhaseProtectedRouteProps) => {
  const { currentPhase } = useAppSelector((state) => state.system);

  if (!allowedPhases.includes(currentPhase)) {
    return <Navigate to="/" replace />; // Or a specific "Phase Not Active" page
  }

  return <Outlet />;
};
