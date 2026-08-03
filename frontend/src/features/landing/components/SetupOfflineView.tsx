import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { ShieldAlert } from 'lucide-react';
import { CountdownTimer } from '../../../components/ui/CountdownTimer';

interface SetupOfflineViewProps {
  message?: string;
  schedule?: {
    registrationStart?: string;
    registrationEnd?: string;
    auctionStart?: string;
    auctionEnd?: string;
  };
}

export const SetupOfflineView = ({ message = 'The platform is currently being configured by administrators. Please check back later.', schedule }: SetupOfflineViewProps) => {
  return (
    <div className="flex flex-col items-center justify-center mt-12 space-y-12 animate-in fade-in-50 zoom-in-95">
      {(() => {
        const now = new Date();
        const rStart = schedule?.registrationStart ? new Date(schedule.registrationStart) : null;
        const aStart = schedule?.auctionStart ? new Date(schedule.auctionStart) : null;

        if (rStart && rStart > now) {
          return (
            <div className="w-full">
              <CountdownTimer targetDate={schedule!.registrationStart!} label="Registration Opens In" />
            </div>
          );
        } else if (aStart && aStart > now) {
          return (
            <div className="w-full">
              <CountdownTimer targetDate={schedule!.auctionStart!} label="Auction Starts In" />
            </div>
          );
        }
        return null;
      })()}
      
      <Card className="max-w-md w-full text-center border-dashed bg-card/50">
        <CardHeader>
          <div className="mx-auto mb-4 bg-muted p-4 rounded-full w-16 h-16 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">System Offline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
};
