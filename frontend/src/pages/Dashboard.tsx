import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Paper,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Assignment as ApplicationIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Schedule as PendingIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchApplications, fetchApplicationStats } from '../store/slices/applicationSlice';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';
import { CDDApplication, WorkflowState, RiskRating, CDDLevel } from '../types';

const getStatusColor = (status: WorkflowState) => {
  const colors: Record<WorkflowState, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
    DRAFT: 'default',
    SUBMITTED: 'info',
    UNDER_REVIEW: 'warning',
    RETURNED: 'error',
    APPROVED: 'success',
    REJECTED: 'error',
  };
  return colors[status] || 'default';
};

const getRiskColor = (risk: RiskRating | undefined) => {
  const colors: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
    LOW: 'success',
    MEDIUM: 'warning',
    HIGH: 'error',
    PROHIBITED: 'error',
  };
  return colors[risk || ''] || 'default';
};

const getCDDLevelColor = (level: CDDLevel) => {
  const colors: Record<CDDLevel, 'default' | 'info' | 'warning'> = {
    SIMPLIFIED: 'info',
    STANDARD: 'default',
    ENHANCED: 'warning',
  };
  return colors[level];
};

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user, canApprove } = useAuth();
  const { applications, stats, isLoading, error } = useSelector(
    (state: RootState) => state.applications
  );
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchApplications({ assignedToMe: true, limit: 10 }));
    dispatch(fetchApplicationStats());
  }, [dispatch]);

  const filteredApplications = applications.filter((app: CDDApplication) =>
    app.applicationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.entity?.legalName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const StatCard = ({
    title,
    value,
    icon,
    color,
  }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
  }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}.lighter`,
              borderRadius: 2,
              p: 1.5,
              color: `${color}.main`,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (isLoading && !applications.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Welcome back, {user?.firstName}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's an overview of your CDD applications
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search and New Application */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search by business name or application number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/applications/new')}
          >
            New Application
          </Button>
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Applications"
            value={stats?.total || 0}
            icon={<ApplicationIcon fontSize="large" />}
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Pending Approval"
            value={(stats?.byStatus.submitted || 0) + (stats?.byStatus.underReview || 0)}
            icon={<PendingIcon fontSize="large" />}
            color="warning"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Approved"
            value={stats?.byStatus.approved || 0}
            icon={<CheckIcon fontSize="large" />}
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Enhanced CDD"
            value={stats?.byCDDLevel.enhanced || 0}
            icon={<WarningIcon fontSize="large" />}
            color="error"
          />
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* My Applications Table */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  My Applications
                </Typography>
                <Button size="small" onClick={() => navigate('/applications')}>
                  View All
                </Button>
              </Box>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Entity Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>CDD Level</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Risk</TableCell>
                      <TableCell>Updated</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredApplications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography color="text.secondary" py={3}>
                            No applications found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredApplications.slice(0, 5).map((app: CDDApplication) => (
                        <TableRow
                          key={app.id}
                          hover
                          onClick={() => navigate(`/applications/${app.id}`)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>
                            <Typography fontWeight={500}>
                              {app.entity?.legalName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {app.applicationNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>{app.entity?.entityType?.replace(/_/g, ' ')}</TableCell>
                          <TableCell>
                            <Chip
                              label={app.cddLevel}
                              size="small"
                              color={getCDDLevelColor(app.cddLevel)}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={app.workflowState.replace(/_/g, ' ')}
                              size="small"
                              color={getStatusColor(app.workflowState)}
                            />
                          </TableCell>
                          <TableCell>
                            {app.riskRating && (
                              <Chip
                                label={app.riskRating}
                                size="small"
                                color={getRiskColor(app.riskRating)}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(app.updatedAt), 'dd/MM/yyyy')}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Tasks and Activity */}
        <Grid size={{ xs: 12, lg: 4 }}>
          {/* Tasks Requiring Attention */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Tasks Requiring Attention
              </Typography>
              <List dense>
                {applications
                  .filter((app: CDDApplication) => app.workflowState === 'RETURNED')
                  .slice(0, 3)
                  .map((app: CDDApplication) => (
                    <ListItem
                      key={app.id}
                      onClick={() => navigate(`/applications/${app.id}`)}
                      sx={{ cursor: 'pointer', borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
                    >
                      <ListItemIcon>
                        <WarningIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={app.entity?.legalName}
                        secondary={app.returnedReason || 'Returned for corrections'}
                      />
                    </ListItem>
                  ))}
                {applications.filter((app: CDDApplication) => app.workflowState === 'RETURNED').length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary="No tasks requiring attention"
                      sx={{ color: 'text.secondary' }}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>

          {/* Statistics by Risk */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Risk Distribution
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main' }} />
                    <Typography>Low Risk</Typography>
                  </Box>
                  <Typography fontWeight={600}>{stats?.byRiskRating.low || 0}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'warning.main' }} />
                    <Typography>Medium Risk</Typography>
                  </Box>
                  <Typography fontWeight={600}>{stats?.byRiskRating.medium || 0}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'error.main' }} />
                    <Typography>High Risk</Typography>
                  </Box>
                  <Typography fontWeight={600}>{stats?.byRiskRating.high || 0}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Approver-specific card */}
          {canApprove && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TrendingUpIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Approval Queue
                  </Typography>
                </Box>
                <Typography variant="h3" fontWeight={700} color="primary.main">
                  {(stats?.byStatus.submitted || 0) + (stats?.byStatus.underReview || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Applications awaiting your review
                </Typography>
                <Button
                  fullWidth
                  variant="outlined"
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/approvals')}
                >
                  Review Applications
                </Button>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
