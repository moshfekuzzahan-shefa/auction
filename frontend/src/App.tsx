import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { PublicLayout } from './layouts/PublicLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { ProtectedRoute } from './components/routing/ProtectedRoute';
import { RoleProtectedRoute } from './components/routing/RoleProtectedRoute';
import { PhaseProtectedRoute } from './components/routing/PhaseProtectedRoute';
import { useQuery } from '@tanstack/react-query';
import { useAppDispatch } from './store/hooks';
import { setPhase } from './store/systemSlice';
import api from './services/api';

// Lazy loaded pages (handling named exports)
const LandingPage = lazy(() => import('./features/landing/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./features/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegistrationPage = lazy(() => import('./features/registration/RegistrationPage').then(m => ({ default: m.RegistrationPage })));
const AdminDashboard = lazy(() => import('./features/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const PlayerListAdminPage = lazy(() => import('./features/admin/PlayerListAdminPage').then(m => ({ default: m.PlayerListAdminPage })));
const TeamDashboard = lazy(() => import('./features/team/TeamDashboard').then(m => ({ default: m.TeamDashboard })));
const LiveAuction = lazy(() => import('./features/auction/LiveAuction').then(m => ({ default: m.LiveAuction })));
const AuctionAdminPage = lazy(() => import('./features/auction/AuctionAdminPage').then(m => ({ default: m.AuctionAdminPage })));
const TournamentAdmin = lazy(() => import('./features/tournament/TournamentAdmin').then(m => ({ default: m.TournamentAdmin })));
const DashboardHome = lazy(() => import('./features/dashboard/DashboardHome').then(m => ({ default: m.DashboardHome })));
const PlayerDashboard = lazy(() => import('./features/player/PlayerDashboard').then(m => ({ default: m.PlayerDashboard })));

const ForgotPasswordPage = lazy(() => import('./features/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./features/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));

// Removed inline DashboardHome

const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const GlobalSystemLoader = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();
  const { isLoading } = useQuery({
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

  // Optional: We could return a loader here, but returning children allows the app to load while fetching
  // If we want to block until we know the phase:
  if (isLoading) return <PageLoader />;
  
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

          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardHome />} />
              
              <Route element={<RoleProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/players" element={<PlayerListAdminPage />} />
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
