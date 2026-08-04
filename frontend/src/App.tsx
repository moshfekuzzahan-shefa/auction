import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { PublicLayout } from './layouts/PublicLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { ProtectedRoute } from './components/routing/ProtectedRoute';
import { RoleProtectedRoute } from './components/routing/RoleProtectedRoute';
import { PhaseProtectedRoute } from './components/routing/PhaseProtectedRoute';
import { useQuery } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { setPhase } from './store/systemSlice';
import { setCredentials, setInitializing, logout } from './store/authSlice';
import api from './services/api';

// Lazy loaded pages (handling named exports)
const LandingPage = lazy(() => import('./features/landing/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./features/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegistrationPage = lazy(() => import('./features/registration/RegistrationPage').then(m => ({ default: m.RegistrationPage })));
const AdminDashboard = lazy(() => import('./features/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminTeamRequestsPage = lazy(() => import('./features/admin/AdminTeamRequestsPage').then(m => ({ default: m.AdminTeamRequestsPage })));
const AdminPodiumRequestsPage = lazy(() => import('./features/admin/AdminPodiumRequestsPage').then(m => ({ default: m.AdminPodiumRequestsPage })));
const PlayerListAdminPage = lazy(() => import('./features/admin/PlayerListAdminPage').then(m => ({ default: m.PlayerListAdminPage })));
const TeamDashboard = lazy(() => import('./features/team/TeamDashboard').then(m => ({ default: m.TeamDashboard })));
const LiveAuction = lazy(() => import('./features/auction/LiveAuction').then(m => ({ default: m.LiveAuction })));
const AuctionAdminPage = lazy(() => import('./features/auction/AuctionAdminPage').then(m => ({ default: m.AuctionAdminPage })));
const TournamentAdmin = lazy(() => import('./features/tournament/TournamentAdmin').then(m => ({ default: m.TournamentAdmin })));
const DashboardHome = lazy(() => import('./features/dashboard/DashboardHome').then(m => ({ default: m.DashboardHome })));
const PlayerDashboard = lazy(() => import('./features/player/PlayerDashboard').then(m => ({ default: m.PlayerDashboard })));
const PlayerMyTeamPage = lazy(() => import('./features/player/PlayerMyTeamPage').then(m => ({ default: m.PlayerMyTeamPage })));
const PlayerTeamsDirectoryPage = lazy(() => import('./features/player/PlayerTeamsDirectoryPage').then(m => ({ default: m.PlayerTeamsDirectoryPage })));
const PlayerSchedulesPage = lazy(() => import('./features/player/PlayerSchedulesPage').then(m => ({ default: m.PlayerSchedulesPage })));
const SpectatorViewPage = lazy(() => import('./features/spectator/SpectatorViewPage').then(m => ({ default: m.SpectatorViewPage })));

const ForgotPasswordPage = lazy(() => import('./features/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./features/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));

const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const GlobalSystemLoader = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();
  const { isInitializing } = useAppSelector((state) => state.auth);

  const { isLoading: isPhaseLoading } = useQuery({
    queryKey: ['system', 'phase'],
    queryFn: async () => {
      try {
        const res = await api.get('/public/landing');
        const phase = res.data.data.phase;
        if (phase) dispatch(setPhase(phase));
        return phase;
      } catch (err) {
        return null;
      }
    }
  });

  // Re-hydrate Auth State on initial load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      dispatch(setInitializing(false));
      return;
    }

    api.get('/auth/me')
      .then((res) => {
        const user = res.data?.data?.user;
        if (user) {
          dispatch(setCredentials({ user, token }));
        } else {
          dispatch(setInitializing(false));
        }
      })
      .catch(() => {
        api.get('/player/me')
          .then((res) => {
            const user = res.data?.data?.user || res.data?.data;
            if (user) {
              dispatch(setCredentials({ user, token }));
            } else {
              dispatch(logout());
            }
          })
          .catch(() => {
            dispatch(logout());
          });
      });
  }, [dispatch]);

  if (isPhaseLoading || isInitializing) return <PageLoader />;
  
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Suspense fallback={<PageLoader />}>
        <GlobalSystemLoader>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
            </Route>

            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route element={<PhaseProtectedRoute allowedPhases={['REGISTRATION']} />}>
                <Route path="/register/player" element={<RegistrationPage />} />
              </Route>
            </Route>

            {/* Public Spectator Routes (No Login Required) */}
            <Route element={<DashboardLayout />}>
              <Route path="/spectator" element={<SpectatorViewPage />} />
              <Route path="/podium" element={<SpectatorViewPage />} />
              <Route path="/schedules" element={<PlayerSchedulesPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<DashboardHome />} />
                <Route path="/dashboard/my-team" element={<PlayerMyTeamPage />} />
                <Route path="/dashboard/teams" element={<PlayerTeamsDirectoryPage />} />
                <Route path="/dashboard/schedules" element={<PlayerSchedulesPage />} />
              
              <Route element={<RoleProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/players" element={<PlayerListAdminPage />} />
                <Route path="/admin/team-requests" element={<AdminTeamRequestsPage />} />
                <Route path="/admin/podium-requests" element={<AdminPodiumRequestsPage />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={['TEAM_MANAGER']} />}>
                <Route path="/team" element={<TeamDashboard />} />
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={['PLAYER']} />}>
                <Route path="/player" element={<PlayerDashboard />} />
              </Route>
              
              <Route element={<PhaseProtectedRoute allowedPhases={['AUCTION']} />}>
                <Route path="/auction" element={<LiveAuction />} />
                <Route element={<RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'PODIUM_ADMIN']} />}>
                  <Route path="/auction/admin" element={<AuctionAdminPage />} />
                </Route>
              </Route>

              <Route element={<RoleProtectedRoute allowedRoles={['SUPER_ADMIN', 'PODIUM_ADMIN']} />}>
                <Route element={<PhaseProtectedRoute allowedPhases={['TOURNAMENT']} />}>
                  <Route path="/tournament/admin" element={<TournamentAdmin />} />
                </Route>
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </GlobalSystemLoader>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
