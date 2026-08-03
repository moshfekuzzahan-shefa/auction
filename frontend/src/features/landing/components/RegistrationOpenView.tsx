import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Link } from 'react-router-dom';
import { UserPlus, Calendar, Trophy } from 'lucide-react';
import { CountdownTimer } from '../../../components/ui/CountdownTimer';

interface RegistrationOpenViewProps {
  message?: string;
  data: any;
  schedule?: {
    registrationStart?: string;
    registrationEnd?: string;
    auctionStart?: string;
    auctionEnd?: string;
  };
}

export const RegistrationOpenView = ({ message, data, schedule }: RegistrationOpenViewProps) => {
  return (
    <div className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-4">
      {schedule?.registrationEnd && (
        <CountdownTimer targetDate={schedule.registrationEnd} label="Registration Closes In" />
      )}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-8 text-center space-y-6">
          <div className="mx-auto bg-primary text-primary-foreground p-4 rounded-full w-16 h-16 flex items-center justify-center">
            <UserPlus className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Player Portal is Open</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              {message || "Registration for the upcoming tournament is now live. Secure your spot in the auction pool today!"}
            </p>
          </div>
          
          <div className="pt-4">
            <Link to="/register/player">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6">
                Register as a Player Now
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Available Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.categories && data.categories.length > 0 ? (
              <ul className="grid grid-cols-2 gap-3">
                {data.categories.map((cat: any) => (
                  <li key={cat.id} className="flex items-center gap-2 text-sm bg-muted p-2 rounded-md">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    {cat.name} (Base: {cat.basePrice})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Categories are being finalized.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.positions && data.positions.length > 0 ? (
              <ul className="grid grid-cols-2 gap-3">
                {data.positions.map((pos: any) => (
                  <li key={pos.id} className="flex items-center gap-2 text-sm bg-muted p-2 rounded-md">
                    <span className="w-2 h-2 rounded-full bg-secondary-foreground" />
                    {pos.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Positions are being finalized.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
