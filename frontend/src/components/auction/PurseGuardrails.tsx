import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { UserCheck, ArrowUpRight, ShieldAlert } from 'lucide-react';

interface PurseGuardrailsProps {
  currentBoughtCount: number;
  minRosterNeeded: number;
  remainingBudget: number;
  maxAllowableBid: number;
  nextValidBid: number;
  auctionStateStatus: string;
  incrementType: string;
  incrementValue: number;
  onPlaceBid: (amount: number) => void;
}

export const PurseGuardrails = React.memo(({
  currentBoughtCount,
  minRosterNeeded,
  remainingBudget,
  maxAllowableBid,
  nextValidBid,
  auctionStateStatus,
  incrementType,
  incrementValue,
  onPlaceBid
}: PurseGuardrailsProps) => {

  const handleBid = () => {
    onPlaceBid(nextValidBid);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader className="bg-slate-950/80 border-b border-slate-800 py-3">
          <CardTitle className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center justify-between">
            <span>My Team Purse Guardrails</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-2 text-xs">
          <div className="flex justify-between items-center p-2 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-400 font-medium">Players Bought:</span>
            <span className="font-extrabold text-white">{currentBoughtCount} / {minRosterNeeded} Needed</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-400 font-medium">Remaining Purse:</span>
            <span className="font-extrabold text-emerald-400">${remainingBudget.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-400 font-medium">Max Allowed Bid:</span>
            <span className="font-extrabold text-amber-400">${maxAllowableBid.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/90 border-slate-800 flex flex-col justify-center p-6 space-y-3">
        <h3 className="text-xs uppercase font-black tracking-wider text-slate-400">Quick Bid Action</h3>
        <Button 
          size="lg" 
          onClick={handleBid}
          disabled={nextValidBid > maxAllowableBid || auctionStateStatus !== 'ACTIVE'}
          className="w-full h-14 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-black text-base rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center space-x-2 border border-emerald-400/30"
        >
          <span>
            Place Bid ({incrementType === 'FIXED' ? `+$${(incrementValue || 100).toLocaleString()}` : `+${incrementValue || 10}%`} / ${nextValidBid.toLocaleString()})
          </span>
          <ArrowUpRight className="w-5 h-5" />
        </Button>

        {nextValidBid > maxAllowableBid && (
          <div className="p-2.5 bg-red-950/50 border border-red-800/50 text-red-300 text-xs font-semibold rounded-xl flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
            <span>Bid exceeds your Max Allowable Bid (${maxAllowableBid.toLocaleString()})!</span>
          </div>
        )}
      </Card>
    </div>
  );
});

PurseGuardrails.displayName = 'PurseGuardrails';
