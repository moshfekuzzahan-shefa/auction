import { useState, useEffect } from 'react';
import { Card, CardContent } from './Card';

interface CountdownTimerProps {
  targetDate: string | Date;
  label: string;
}

export const CountdownTimer = ({ targetDate, label }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer(); // Initial call
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) return null;

  return (
    <div className="flex flex-col items-center space-y-4 my-8 animate-in fade-in zoom-in duration-500">
      <h3 className="text-xl font-medium text-muted-foreground uppercase tracking-widest">{label}</h3>
      <div className="flex gap-2 md:gap-4">
        <TimeUnit value={timeLeft.days} label="Days" />
        <TimeUnit value={timeLeft.hours} label="Hours" />
        <TimeUnit value={timeLeft.minutes} label="Minutes" />
        <TimeUnit value={timeLeft.seconds} label="Seconds" />
      </div>
    </div>
  );
};

const TimeUnit = ({ value, label }: { value: number; label: string }) => (
  <Card className="border-primary/20 shadow-md bg-card">
    <CardContent className="p-3 md:p-6 flex flex-col items-center justify-center min-w-[70px] md:min-w-[100px]">
      <span className="text-3xl md:text-5xl font-black font-mono tabular-nums text-primary">
        {value.toString().padStart(2, '0')}
      </span>
      <span className="text-[10px] md:text-sm font-medium text-muted-foreground mt-2 uppercase tracking-wide">
        {label}
      </span>
    </CardContent>
  </Card>
);
