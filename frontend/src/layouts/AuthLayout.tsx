import { Outlet, Link } from 'react-router-dom';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left pane: Branding/Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12 relative overflow-hidden">
        <div className="relative z-10">
          <Link to="/" className="text-3xl font-bold tracking-tight text-primary-foreground">
            UniFootball
          </Link>
          <p className="mt-4 text-primary-foreground/80 max-w-md">
            The premier platform for university football tournaments, team management, and live auctions.
          </p>
        </div>
        
        {/* Abstract decorative elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-primary-foreground/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-primary-foreground/10 blur-3xl"></div>
        
        <div className="relative z-10 text-primary-foreground/60 text-sm">
          © {new Date().getFullYear()} University Football Franchise.
        </div>
      </div>

      {/* Right pane: Form content */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:w-1/2 lg:px-20 xl:px-24 bg-background">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="text-3xl font-bold tracking-tight text-primary">
              UniFootball
            </Link>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};
