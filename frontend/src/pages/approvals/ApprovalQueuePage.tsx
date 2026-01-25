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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Undo as ReturnIcon,
  Visibility as ViewIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  PriorityHigh as HighPriorityIcon,
  Schedule as PendingIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchApplications } from '../../store/slices/applicationSlice';
import { useAuth } from '../../hooks/useAuth';
import { applicationsApi } from '../../services/api';
import { format, formatDistanceToNow } from 'date-fns';
import { CDDApplication, WorkflowState, RiskRating, CDDLevel } from '../../types';

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

const getPriorityIndicator = (app: CDDApplication) => {
  if (app.cddLevel === 'ENHANCED' || app.riskRating === 'HIGH') {
    return { icon: <HighPriorityIcon color="error" />, label: 'High Priority', color: 'error' };
  }
  if (app.riskRating === 'MEDIUM' || app.cddLevel === 'STANDARD') {
    return { icon: <PendingIcon color="warning" />, label: 'Medium Priority', color: 'warning' };
  }
  return { icon: <PendingIcon color="success" />, label: 'Low Priority', color: 'success' };
};

const ApprovalQueuePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user, canApprove } = useAuth();
  const { applications, isLoading } = useSelector((state: RootState) => state.applications);

  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [filterCDDLevel, setFilterCDDLevel] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<CDDApplication | null>(null);
  const [actionDialog, setActionDialog] = useState<'approve' | 'return' | 'reject' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (canApprove) {
      dispatch(fetchApplications({
        workflowState: tabValue === 0 ? 'SUBMITTED' : tabValue === 1 ? 'UNDER_REVIEW' : undefined,
        limit: 100
      }));
    }
  }, [dispatch, canApprove, tabValue]);

  const pendingApplications = applications.filter(
    (app: CDDApplication) => app.workflowState === 'SUBMITTED' || app.workflowState === 'UNDER_REVIEW'
  );

  const filteredApplications = pendingApplications.filter((app: CDDApplication) => {
    const matchesSearch =
      app.applicationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.entity?.legalName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCDDLevel = filterCDDLevel === 'all' || app.cddLevel === filterCDDLevel;
    const matchesRisk = filterRisk === 'all' || app.riskRating === filterRisk;

    const matchesTab =
      tabValue === 0 ? app.workflowState === 'SUBMITTED' :
      tabValue === 1 ? app.workflowState === 'UNDER_REVIEW' :
      true;

    return matchesSearch && matchesCDDLevel && matchesRisk && matchesTab;
  });

  // Sort by priority (Enhanced CDD and High Risk first)
  const sortedApplications = [...filteredApplications].sort((a, b) => {
    const getPriorityScore = (app: CDDApplication) => {
      let score = 0;
      if (app.cddLevel === 'ENHANCED') score += 10;
      if (app.riskRating === 'HIGH') score += 10;
      if (app.riskRating === 'MEDIUM') score += 5;
      return score;
    };
    return getPriorityScore(b) - getPriorityScore(a);
  });

  const handleApprove = async () => {
    if (!selectedApp) return;
    setIsProcessing(true);
    setError(null);

    try {
      await applicationsApi.approve(selectedApp.id);
      setSuccessMessage(`Application ${selectedApp.applicationNumber} has been approved.`);
      setActionDialog(null);
      setSelectedApp(null);
      dispatch(fetchApplications({ workflowState: 'SUBMITTED', limit: 100 }));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to approve application');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReturn = async () => {
    if (!selectedApp || !actionReason.trim()) return;
    setIsProcessing(true);
    setError(null);

    try {
      await applicationsApi.return(selectedApp.id, actionReason);
      setSuccessMessage(`Application ${selectedApp.applicationNumber} has been returned for corrections.`);
      setActionDialog(null);
      setSelectedApp(null);
      setActionReason('');
      dispatch(fetchApplications({ workflowState: 'SUBMITTED', limit: 100 }));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to return application');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp || !actionReason.trim()) return;
    setIsProcessing(true);
    setError(null);

    try {
      await applicationsApi.reject(selectedApp.id, actionReason);
      setSuccessMessage(`Application ${selectedApp.applicationNumber} has been rejected.`);
      setActionDialog(null);
      setSelectedApp(null);
      setActionReason('');
      dispatch(fetchApplications({ workflowState: 'SUBMITTED', limit: 100 }));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reject application');
    } finally {
      setIsProcessing(false);
    }
  };

  const openActionDialog = (app: CDDApplication, action: 'approve' | 'return' | 'reject') => {
    setSelectedApp(app);
    setActionDialog(action);
    setActionReason('');
    setError(null);
  };

  if (!canApprove) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
        <WarningIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Access Denied
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          You do not have permission to access the approval queue.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/dashboard')}>
          Return to Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Approval Queue
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Review and approve CDD applications submitted for approval
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Awaiting Review
              </Typography>
              <Typography variant="h3" fontWeight={700}>
                {applications.filter((a: CDDApplication) => a.workflowState === 'SUBMITTED').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Under Review
              </Typography>
              <Typography variant="h3" fontWeight={700}>
                {applications.filter((a: CDDApplication) => a.workflowState === 'UNDER_REVIEW').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Enhanced CDD
              </Typography>
              <Typography variant="h3" fontWeight={700} color="warning.main">
                {pendingApplications.filter((a: CDDApplication) => a.cddLevel === 'ENHANCED').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                High Risk
              </Typography>
              <Typography variant="h3" fontWeight={700} color="error.main">
                {pendingApplications.filter((a: CDDApplication) => a.riskRating === 'HIGH').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                placeholder="Search by entity name or application number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>CDD Level</InputLabel>
                <Select
                  value={filterCDDLevel}
                  label="CDD Level"
                  onChange={(e) => setFilterCDDLevel(e.target.value)}
                >
                  <MenuItem value="all">All Levels</MenuItem>
                  <MenuItem value="SIMPLIFIED">Simplified</MenuItem>
                  <MenuItem value="STANDARD">Standard</MenuItem>
                  <MenuItem value="ENHANCED">Enhanced</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Risk Rating</InputLabel>
                <Select
                  value={filterRisk}
                  label="Risk Rating"
                  onChange={(e) => setFilterRisk(e.target.value)}
                >
                  <MenuItem value="all">All Ratings</MenuItem>
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSearchQuery('');
                  setFilterCDDLevel('all');
                  setFilterRisk('all');
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs
          value={tabValue}
          onChange={(_, value) => setTabValue(value)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab
            label={`Submitted (${applications.filter((a: CDDApplication) => a.workflowState === 'SUBMITTED').length})`}
          />
          <Tab
            label={`Under Review (${applications.filter((a: CDDApplication) => a.workflowState === 'UNDER_REVIEW').length})`}
          />
          <Tab label="All Pending" />
        </Tabs>

        <CardContent>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : sortedApplications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No applications pending approval
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All caught up! Check back later for new submissions.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Priority</TableCell>
                    <TableCell>Entity</TableCell>
                    <TableCell>Application</TableCell>
                    <TableCell>CDD Level</TableCell>
                    <TableCell>Risk</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Specialist</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedApplications.map((app: CDDApplication) => {
                    const priority = getPriorityIndicator(app);
                    return (
                      <TableRow key={app.id} hover>
                        <TableCell>
                          <Tooltip title={priority.label}>
                            {priority.icon}
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <BusinessIcon color="action" fontSize="small" />
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {app.entity?.legalName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {app.entity?.entityType?.replace(/_/g, ' ')}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {app.applicationNumber}
                          </Typography>
                          <Chip
                            label={app.workflowState.replace(/_/g, ' ')}
                            size="small"
                            color={getStatusColor(app.workflowState)}
                            sx={{ mt: 0.5 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={app.cddLevel}
                            size="small"
                            color={getCDDLevelColor(app.cddLevel)}
                          />
                        </TableCell>
                        <TableCell>
                          {app.riskRating ? (
                            <Chip
                              label={app.riskRating}
                              size="small"
                              color={getRiskColor(app.riskRating)}
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              Not assessed
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {app.submittedDate ? format(new Date(app.submittedDate), 'dd/MM/yyyy') : '-'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {app.submittedDate ? formatDistanceToNow(new Date(app.submittedDate), { addSuffix: true }) : ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon color="action" fontSize="small" />
                            <Typography variant="body2">
                              {app.assignedSpecialist?.firstName} {app.assignedSpecialist?.lastName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => navigate(`/applications/${app.id}`)}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Approve">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => openActionDialog(app, 'approve')}
                              >
                                <ApproveIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Return for Corrections">
                              <IconButton
                                size="small"
                                color="warning"
                                onClick={() => openActionDialog(app, 'return')}
                              >
                                <ReturnIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => openActionDialog(app, 'reject')}
                              >
                                <RejectIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={actionDialog === 'approve'} onClose={() => setActionDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Application</DialogTitle>
        <DialogContent>
          {selectedApp && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                You are about to approve this application. This action will mark the CDD as complete.
              </Alert>

              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Application Details
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Entity"
                      secondary={selectedApp.entity?.legalName}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Application Number"
                      secondary={selectedApp.applicationNumber}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="CDD Level"
                      secondary={selectedApp.cddLevel}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Risk Rating"
                      secondary={selectedApp.riskRating || 'Not assessed'}
                    />
                  </ListItem>
                </List>
              </Paper>

              {selectedApp.cddLevel === 'ENHANCED' && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  This is an Enhanced CDD application. Please ensure all additional verification requirements have been met.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleApprove}
            disabled={isProcessing}
            startIcon={isProcessing ? <CircularProgress size={20} /> : <ApproveIcon />}
          >
            Approve Application
          </Button>
        </DialogActions>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={actionDialog === 'return'} onClose={() => setActionDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Return for Corrections</DialogTitle>
        <DialogContent>
          {selectedApp && (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                The application will be returned to the specialist for corrections.
              </Alert>

              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Application: {selectedApp.applicationNumber}
                </Typography>
                <Typography variant="body2">
                  Entity: {selectedApp.entity?.legalName}
                </Typography>
              </Paper>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Reason for Return"
                placeholder="Please provide details on what needs to be corrected..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                required
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleReturn}
            disabled={isProcessing || !actionReason.trim()}
            startIcon={isProcessing ? <CircularProgress size={20} /> : <ReturnIcon />}
          >
            Return Application
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={actionDialog === 'reject'} onClose={() => setActionDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Application</DialogTitle>
        <DialogContent>
          {selectedApp && (
            <Box>
              <Alert severity="error" sx={{ mb: 2 }}>
                This action will permanently reject the application. This cannot be undone.
              </Alert>

              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Application: {selectedApp.applicationNumber}
                </Typography>
                <Typography variant="body2">
                  Entity: {selectedApp.entity?.legalName}
                </Typography>
              </Paper>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Reason for Rejection"
                placeholder="Please provide the reason for rejecting this application..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                required
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={isProcessing || !actionReason.trim()}
            startIcon={isProcessing ? <CircularProgress size={20} /> : <RejectIcon />}
          >
            Reject Application
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApprovalQueuePage;
