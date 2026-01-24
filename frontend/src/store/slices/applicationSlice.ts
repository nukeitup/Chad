import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { applicationsApi } from '../../services/api';
import { CDDApplication, ApplicationStats } from '../../types';

interface ApplicationState {
  applications: CDDApplication[];
  currentApplication: CDDApplication | null;
  stats: ApplicationStats | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    status?: string;
    cddLevel?: string;
    riskRating?: string;
    assignedToMe?: boolean;
    pendingApproval?: boolean;
  };
}

const initialState: ApplicationState = {
  applications: [],
  currentApplication: null,
  stats: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {},
};

// Async thunks
export const fetchApplications = createAsyncThunk(
  'applications/fetchAll',
  async (params: Record<string, string | number | boolean> | undefined, { rejectWithValue }) => {
    try {
      const response = await applicationsApi.list(params);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch applications');
    }
  }
);

export const fetchApplicationById = createAsyncThunk(
  'applications/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await applicationsApi.getById(id);
      return response.data.data.application;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch application');
    }
  }
);

export const createApplication = createAsyncThunk(
  'applications/create',
  async (
    data: {
      entityId: string;
      applicationType: string;
      cddLevel: string;
      cddLevelJustification?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await applicationsApi.create(data);
      return response.data.data.application;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Failed to create application');
    }
  }
);

export const updateApplication = createAsyncThunk(
  'applications/update',
  async ({ id, data }: { id: string; data: Record<string, unknown> }, { rejectWithValue }) => {
    try {
      const response = await applicationsApi.update(id, data);
      return response.data.data.application;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Failed to update application');
    }
  }
);

export const submitApplication = createAsyncThunk(
  'applications/submit',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await applicationsApi.submit(id);
      return response.data.data.application;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Failed to submit application');
    }
  }
);

export const approveApplication = createAsyncThunk(
  'applications/approve',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await applicationsApi.approve(id);
      return response.data.data.application;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Failed to approve application');
    }
  }
);

export const returnApplication = createAsyncThunk(
  'applications/return',
  async ({ id, reason }: { id: string; reason: string }, { rejectWithValue }) => {
    try {
      const response = await applicationsApi.return(id, reason);
      return response.data.data.application;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Failed to return application');
    }
  }
);

export const rejectApplication = createAsyncThunk(
  'applications/reject',
  async ({ id, reason }: { id: string; reason: string }, { rejectWithValue }) => {
    try {
      const response = await applicationsApi.reject(id, reason);
      return response.data.data.application;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Failed to reject application');
    }
  }
);

export const fetchApplicationStats = createAsyncThunk(
  'applications/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await applicationsApi.getStats();
      return response.data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch stats');
    }
  }
);

const applicationSlice = createSlice({
  name: 'applications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<ApplicationState['filters']>) => {
      state.filters = action.payload;
    },
    clearCurrentApplication: (state) => {
      state.currentApplication = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch applications
    builder.addCase(fetchApplications.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchApplications.fulfilled, (state, action) => {
      state.isLoading = false;
      state.applications = action.payload.data;
      state.pagination = action.payload.pagination;
    });
    builder.addCase(fetchApplications.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch by ID
    builder.addCase(fetchApplicationById.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchApplicationById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentApplication = action.payload;
    });
    builder.addCase(fetchApplicationById.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Create
    builder.addCase(createApplication.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(createApplication.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentApplication = action.payload;
      state.applications.unshift(action.payload);
    });
    builder.addCase(createApplication.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Update
    builder.addCase(updateApplication.fulfilled, (state, action) => {
      state.currentApplication = action.payload;
      const index = state.applications.findIndex((a) => a.id === action.payload.id);
      if (index !== -1) {
        state.applications[index] = action.payload;
      }
    });

    // Submit
    builder.addCase(submitApplication.fulfilled, (state, action) => {
      state.currentApplication = action.payload;
      const index = state.applications.findIndex((a) => a.id === action.payload.id);
      if (index !== -1) {
        state.applications[index] = action.payload;
      }
    });

    // Approve
    builder.addCase(approveApplication.fulfilled, (state, action) => {
      state.currentApplication = action.payload;
      const index = state.applications.findIndex((a) => a.id === action.payload.id);
      if (index !== -1) {
        state.applications[index] = action.payload;
      }
    });

    // Stats
    builder.addCase(fetchApplicationStats.fulfilled, (state, action) => {
      state.stats = action.payload;
    });
  },
});

export const { clearError, setFilters, clearCurrentApplication } = applicationSlice.actions;
export default applicationSlice.reducer;
