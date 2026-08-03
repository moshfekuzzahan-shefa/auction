import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';

export const DashboardLayout = () => {
  const location = useLocation();
  const isSpectatorRoute = location.pathname === '/spectator' || location.pathname === '/podium';

  if (isSpectatorRoute) {
    return (
      <div className="min-h-screen bg-slate-950 w-full overflow-x-hidden">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden w-full h-full">
        {/* Desktop Top Header */}
        <header className="hidden md:flex h-16 border-b bg-card items-center px-8 shadow-sm shrink-0">
          <h1 className="text-lg font-semibold text-foreground">UniFootball Portal</h1>
        </header>
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto bg-background/50 p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
