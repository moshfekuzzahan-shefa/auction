import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';

export const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t py-8 text-center text-sm text-muted-foreground bg-card mt-auto">
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} University Football Franchise. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
