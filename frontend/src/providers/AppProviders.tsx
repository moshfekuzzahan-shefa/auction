import type { ReactNode } from 'react';
import { ReduxProvider } from './ReduxProvider';
import { QueryProvider } from './QueryProvider';
import { SocketProvider } from './SocketProvider';
import { ThemeProvider } from './ThemeProvider';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <ThemeProvider>
      <ReduxProvider>
        <QueryProvider>
          <SocketProvider>
            {children}
          </SocketProvider>
        </QueryProvider>
      </ReduxProvider>
    </ThemeProvider>
  );
};
