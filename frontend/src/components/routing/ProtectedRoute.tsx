import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';

export const ProtectedRoute = () => {
  const { isAuthenticated, token, isInitializing } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (isInitializing) {
    return (
      <div className="flex-1 flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
