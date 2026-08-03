import { Link } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { Menu } from 'lucide-react';
import { Button } from '../ui/Button';
// Removed Drawer imports

export const Navbar = () => {
  const { currentPhase } = useAppSelector((state) => state.system);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const NavLinks = () => (
    <>
      {currentPhase === 'REGISTRATION' && (
        <>
          <Link to="/register/player" className="text-sm font-medium hover:text-primary transition-colors">
            Register Player
          </Link>
          <Link to="/register/team" className="text-sm font-medium hover:text-primary transition-colors">
            Register Team
          </Link>
        </>
      )}
      {isAuthenticated ? (
        <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
          Dashboard
        </Link>
      ) : (
        <Link to="/login" className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
          Login
        </Link>
      )}
    </>
  );

  return (
    <header className="border-b bg-card sticky top-0 z-40 w-full backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight text-primary flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold">U</div>
          UniFootball
        </Link>
        
        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLinks />
        </nav>

        {/* Mobile Nav */}
        <div className="md:hidden">
           {/* Simple mobile menu using button + native state or generic wrapper */}
           <Button variant="ghost" size="sm" className="md:hidden" onClick={() => document.getElementById('mobile-menu')?.classList.toggle('hidden')}>
             <Menu className="h-5 w-5" />
           </Button>
        </div>
      </div>
      
      {/* Mobile Menu Dropdown (Simple implementation) */}
      <div id="mobile-menu" className="hidden md:hidden border-t bg-card px-4 py-4 space-y-4">
        <div className="flex flex-col space-y-4">
          <NavLinks />
        </div>
      </div>
    </header>
  );
};
