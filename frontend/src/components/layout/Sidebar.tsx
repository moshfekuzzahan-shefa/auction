import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logout } from '../../store/authSlice';
import { LogOut, Home, Users, Trophy, Settings, Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import { useState } from 'react';

export const Sidebar = () => {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const NavContent = () => (
    <>
      <div className="h-16 flex items-center px-6 border-b shrink-0">
        <Link to="/" className="text-xl font-bold text-primary flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold">U</div>
          UniFootball
        </Link>
      </div>
      
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <Link 
          to="/dashboard" 
          onClick={() => setIsMobileOpen(false)}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
            location.pathname === '/dashboard' ? "bg-primary/10 text-primary" : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
          )}
        >
          <Home className="w-4 h-4" /> Overview
        </Link>
        
        {user?.role === 'SUPER_ADMIN' && (
          <>
            <Link 
              to="/admin" 
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                location.pathname === '/admin' ? "bg-primary/10 text-primary" : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
              )}
            >
              <Settings className="w-4 h-4" /> System Config
            </Link>
            <Link 
              to="/admin/players" 
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                location.pathname.startsWith('/admin/players') ? "bg-primary/10 text-primary" : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
              )}
            >
              <Users className="w-4 h-4" /> Players Directory
            </Link>
            <Link 
              to="/auction/admin" 
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                location.pathname.startsWith('/auction/admin') ? "bg-primary/10 text-primary" : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
              )}
            >
              <Trophy className="w-4 h-4" /> Podium Admin
            </Link>
          </>
        )}

        {user?.role === 'TEAM_MANAGER' && (
          <>
            <Link 
              to="/team" 
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                location.pathname.startsWith('/team') ? "bg-primary/10 text-primary" : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
              )}
            >
              <Users className="w-4 h-4" /> My Squad
            </Link>
            <Link 
              to="/auction" 
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                location.pathname.startsWith('/auction') ? "bg-primary/10 text-primary" : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
              )}
            >
              <Trophy className="w-4 h-4" /> Live Auction
            </Link>
          </>
        )}

        {(user?.role === 'SUPER_ADMIN' || user?.role === 'PODIUM_ADMIN') && (
          <Link 
            to="/tournament/admin"
            onClick={() => setIsMobileOpen(false)} 
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
              location.pathname.startsWith('/tournament/admin') ? "bg-primary/10 text-primary" : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
            )}
          >
            <Trophy className="w-4 h-4" /> Match Engine
          </Link>
        )}
      </nav>

      <div className="p-4 border-t shrink-0">
        <div className="mb-4 px-3">
          <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
        </div>
        <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Top Bar (visible only on small screens) */}
      <div className="md:hidden h-16 border-b bg-card flex items-center justify-between px-4 shrink-0">
        <Link to="/" className="text-lg font-bold text-primary flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">U</div>
          UniFootball
        </Link>
        <Button variant="ghost" size="sm" onClick={() => setIsMobileOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
          <aside className="relative z-50 w-72 h-full bg-card flex flex-col border-r shadow-xl animate-in slide-in-from-left">
            <Button variant="ghost" size="sm" className="absolute right-4 top-4" onClick={() => setIsMobileOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
            <NavContent />
          </aside>
        </div>
      )}

      {/* Desktop Sidebar (visible on md+) */}
      <aside className="hidden md:flex w-64 lg:w-72 border-r bg-card flex-col h-full shrink-0">
        <NavContent />
      </aside>
    </>
  );
};
