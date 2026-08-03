import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

type Phase = 'SETUP' | 'REGISTRATION' | 'AUCTION' | 'TOURNAMENT';

interface SystemState {
  currentPhase: Phase;
  totalBudget: number;
  minRoster: number;
  maxRoster: number;
}

const initialState: SystemState = {
  currentPhase: 'SETUP',
  totalBudget: 10000,
  minRoster: 11,
  maxRoster: 15,
};

const systemSlice = createSlice({
  name: 'system',
  initialState,
  reducers: {
    setSystemState: (state, action: PayloadAction<SystemState>) => {
      return { ...state, ...action.payload };
    },
    setPhase: (state, action: PayloadAction<Phase>) => {
      state.currentPhase = action.payload;
    }
  },
});

export const { setSystemState, setPhase } = systemSlice.actions;
export default systemSlice.reducer;
