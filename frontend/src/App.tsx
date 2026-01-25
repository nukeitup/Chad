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
...
            <Route path="entities/ownership-tree/:id" element={<OwnershipTreePage />} />
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