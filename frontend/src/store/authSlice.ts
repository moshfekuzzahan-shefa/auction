import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'PODIUM_ADMIN' | 'TEAM_MANAGER' | 'PLAYER';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
}

const savedToken = localStorage.getItem('token');
let savedUser: User | null = null;
try {
  const rawUser = localStorage.getItem('user');
  if (rawUser) savedUser = JSON.parse(rawUser);
} catch {
  savedUser = null;
}

const initialState: AuthState = {
  user: savedUser,
  token: savedToken,
  isAuthenticated: !!savedToken,
  isInitializing: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user?: User; token: string }>
    ) => {
      if (action.payload.user) {
        state.user = action.payload.user;
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      }
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isInitializing = false;
      localStorage.setItem('token', action.payload.token);
    },
    setInitializing: (state, action: PayloadAction<boolean>) => {
      state.isInitializing = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isInitializing = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
});

export const { setCredentials, setInitializing, logout } = authSlice.actions;
export default authSlice.reducer;
