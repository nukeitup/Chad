import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { store } from './store';
import theme from './theme';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import Dashboard from './pages/Dashboard';
import ApplicationsPage from './pages/applications/ApplicationsPage';
import NewApplicationPage from './pages/applications/NewApplicationPage';
import ApplicationDetailPage from './pages/applications/ApplicationDetailPage';
import ApprovalQueuePage from './pages/approvals/ApprovalQueuePage';
import OwnershipTreePage from './pages/entities/OwnershipTreePage';
import ReportsPage from './pages/ReportsPage'; // Import the new page

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="applications" element={<ApplicationsPage />} />
              <Route path="applications/new" element={<NewApplicationPage />} />
              <Route path="applications/:id" element={<ApplicationDetailPage />} />
              <Route path="entities" element={<div>Entities (Coming Soon)</div>} />
              <Route path="entities/ownership-tree/:id" element={<OwnershipTreePage />} /> {/* New route */}
              <Route path="reports" element={<ReportsPage />} /> {/* New route */}
              <Route path="approvals" element={<ApprovalQueuePage />} />
              <Route path="users" element={<div>Users (Coming Soon)</div>} />
              <Route path="settings" element={<div>Settings (Coming Soon)</div>} />
              <Route path="profile" element={<div>Profile (Coming Soon)</div>} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}

export default App;