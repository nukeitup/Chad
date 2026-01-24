import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface UIState {
  sidebarOpen: boolean;
  notifications: Notification[];
  isGlobalLoading: boolean;
  currentStep: number;
  dialogOpen: {
    [key: string]: boolean;
  };
}

const initialState: UIState = {
  sidebarOpen: true,
  notifications: [],
  isGlobalLoading: false,
  currentStep: 0,
  dialogOpen: {},
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const id = Date.now().toString();
      state.notifications.push({ ...action.payload, id });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.isGlobalLoading = action.payload;
    },
    setCurrentStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },
    openDialog: (state, action: PayloadAction<string>) => {
      state.dialogOpen[action.payload] = true;
    },
    closeDialog: (state, action: PayloadAction<string>) => {
      state.dialogOpen[action.payload] = false;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  addNotification,
  removeNotification,
  clearNotifications,
  setGlobalLoading,
  setCurrentStep,
  openDialog,
  closeDialog,
} = uiSlice.actions;

export default uiSlice.reducer;
