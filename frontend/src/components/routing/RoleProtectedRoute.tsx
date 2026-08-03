import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';

interface RoleProtectedRouteProps {
  allowedRoles: Array<'SUPER_ADMIN' | 'PODIUM_ADMIN' | 'TEAM_MANAGER' | 'PLAYER'>;
}

export const RoleProtectedRoute = ({ allowedRoles }: RoleProtectedRouteProps) => {
  const { user } = useAppSelector((state) => state.auth);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
