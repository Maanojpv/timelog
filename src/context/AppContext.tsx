import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import { AppState, Client, Project, Task, TimeLog, PaymentRecord, Settings } from './types';
import { saveState, loadState } from '../utils/storage';

type Action =
  | { type: 'SET_ACTIVE_CLIENT'; payload: string }
  | { type: 'ADD_CLIENT'; payload: Client }
  | { type: 'UPDATE_CLIENT'; payload: Client }
  | { type: 'DELETE_CLIENT'; payload: string }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'ADD_LOG'; payload: TimeLog }
  | { type: 'UPDATE_LOG'; payload: TimeLog }
  | { type: 'DELETE_LOG'; payload: string }
  | { type: 'RECORD_PAYMENT'; payload: PaymentRecord }
  | { type: 'UPDATE_PAYMENT'; payload: PaymentRecord }
  | { type: 'UPDATE_SETTINGS'; payload: Settings }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'ADD_TAG'; payload: string }
  | { type: 'DELETE_TAG'; payload: string }
  | { type: 'RENAME_TAG'; payload: { oldName: string; newName: string } }
  | { type: 'RESET_ALL' }
  | { type: 'HYDRATE'; payload: AppState };

const initialState: AppState = {
  clients: [],
  projects: [],
  tasks: [],
  logs: [],
  payments: [],
  activeClientId: null,
  settings: { userName: '', currency: 'USD', currencySymbol: '$', defaultRate: 0 },
  onboardingComplete: false,
  tags: [],
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return {
        ...initialState,
        ...action.payload,
        settings: { ...initialState.settings, ...(action.payload.settings ?? {}) },
        tags: action.payload.tags ?? [],
      };
    case 'SET_ACTIVE_CLIENT':
      return { ...state, activeClientId: action.payload };
    case 'ADD_CLIENT':
      return { ...state, clients: [...state.clients, action.payload] };
    case 'UPDATE_CLIENT':
      return { ...state, clients: state.clients.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_CLIENT':
      return { ...state, clients: state.clients.filter(c => c.id !== action.payload) };
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    case 'UPDATE_PROJECT':
      return { ...state, projects: state.projects.map(p => p.id === action.payload.id ? action.payload : p) };
    case 'DELETE_PROJECT':
      return { ...state, projects: state.projects.filter(p => p.id !== action.payload) };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return { ...state, tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t) };
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };
    case 'ADD_LOG':
      return { ...state, logs: [...state.logs, action.payload] };
    case 'UPDATE_LOG':
      return { ...state, logs: state.logs.map(l => l.id === action.payload.id ? action.payload : l) };
    case 'DELETE_LOG':
      return { ...state, logs: state.logs.filter(l => l.id !== action.payload) };
    case 'RECORD_PAYMENT':
      return { ...state, payments: [...state.payments, action.payload] };
    case 'UPDATE_PAYMENT':
      return { ...state, payments: state.payments.map(p => p.id === action.payload.id ? action.payload : p) };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: action.payload };
    case 'COMPLETE_ONBOARDING':
      return { ...state, onboardingComplete: true };
    case 'ADD_TAG':
      if (state.tags.includes(action.payload)) return state;
      return { ...state, tags: [...state.tags, action.payload] };
    case 'DELETE_TAG':
      return { ...state, tags: state.tags.filter(t => t !== action.payload) };
    case 'RENAME_TAG': {
      const { oldName, newName } = action.payload;
      return {
        ...state,
        tags: state.tags.map(t => t === oldName ? newName : t),
        logs: state.logs.map(l => ({
          ...l,
          tags: l.tags?.map(t => t === oldName ? newName : t),
        })),
      };
    }
    case 'RESET_ALL':
      return { ...initialState };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  activeClient: Client | null;
  projectsForClient: (clientId: string) => Project[];
  tasksForProject: (projectId: string) => Task[];
  logsForDate: (clientId: string, date: string) => TimeLog[];
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = React.useState(false);

  useEffect(() => {
    loadState().then(saved => {
      if (saved) dispatch({ type: 'HYDRATE', payload: saved });
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  const activeClient = useMemo(
    () => state.clients.find(c => c.id === state.activeClientId) ?? null,
    [state.clients, state.activeClientId]
  );

  const projectsForClient = useMemo(
    () => (clientId: string) => state.projects.filter(p => p.clientId === clientId),
    [state.projects]
  );

  const tasksForProject = useMemo(
    () => (projectId: string) => state.tasks.filter(t => t.projectId === projectId),
    [state.tasks]
  );

  const logsForDate = useMemo(
    () => (clientId: string, date: string) =>
      state.logs.filter(l => l.clientId === clientId && l.date === date),
    [state.logs]
  );

  if (!hydrated) return null;

  return (
    <AppContext.Provider value={{ state, dispatch, activeClient, projectsForClient, tasksForProject, logsForDate }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
