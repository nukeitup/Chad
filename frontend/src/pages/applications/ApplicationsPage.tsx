import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
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
  TablePagination,
  Chip,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  MoreVert as MoreIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchApplications, setFilters, deleteApplication } from '../../store/slices/applicationSlice';
import { format } from 'date-fns';
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

const ApplicationsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { applications, isLoading, error, pagination, filters } = useSelector(
    (state: RootState) => state.applications
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(
      fetchApplications({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      })
    );
  }, [dispatch, pagination.page, pagination.limit, filters]);

  const handlePageChange = (_: unknown, newPage: number) => {
    dispatch(
      fetchApplications({
        page: newPage + 1,
        limit: pagination.limit,
        ...filters,
      })
    );
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(
      fetchApplications({
        page: 1,
        limit: parseInt(event.target.value, 10),
        ...filters,
      })
    );
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined };
    dispatch(setFilters(newFilters));
    dispatch(
      fetchApplications({
        page: 1,
        limit: pagination.limit,
        ...newFilters,
      })
    );
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, appId: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedAppId(appId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAppId(null);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    setAnchorEl(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAppId) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await dispatch(deleteApplication(selectedAppId)).unwrap();
      setDeleteDialogOpen(false);
      setSelectedAppId(null);
    } catch (err: any) {
      setDeleteError(err || 'Failed to delete application');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedAppId(null);
    setDeleteError(null);
  };

  const filteredApplications = applications.filter(
    (app: CDDApplication) =>
      app.applicationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.entity?.legalName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Applications
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/applications/new')}
        >
          New Application
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flex: 1, minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <Tooltip title="Toggle filters">
              <IconButton onClick={() => setShowFilters(!showFilters)}>
                <FilterIcon color={showFilters ? 'primary' : 'inherit'} />
              </IconButton>
            </Tooltip>
          </Box>

          {showFilters && (
            <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status || ''}
                  label="Status"
                  onChange={(e: SelectChangeEvent) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="SUBMITTED">Submitted</MenuItem>
                  <MenuItem value="UNDER_REVIEW">Under Review</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                  <MenuItem value="RETURNED">Returned</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>CDD Level</InputLabel>
                <Select
                  value={filters.cddLevel || ''}
                  label="CDD Level"
                  onChange={(e: SelectChangeEvent) => handleFilterChange('cddLevel', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="SIMPLIFIED">Simplified</MenuItem>
                  <MenuItem value="STANDARD">Standard</MenuItem>
                  <MenuItem value="ENHANCED">Enhanced</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Risk Rating</InputLabel>
                <Select
                  value={filters.riskRating || ''}
                  label="Risk Rating"
                  onChange={(e: SelectChangeEvent) => handleFilterChange('riskRating', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="PROHIBITED">Prohibited</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <TableContainer component={Paper}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Application #</TableCell>
                    <TableCell>Entity Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>CDD Level</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Risk</TableCell>
                    <TableCell>Specialist</TableCell>
                    <TableCell>Updated</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredApplications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        <Typography color="text.secondary" py={3}>
                          No applications found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredApplications.map((app: CDDApplication) => (
                      <TableRow
                        key={app.id}
                        hover
                        onClick={() => navigate(`/applications/${app.id}`)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          <Typography fontWeight={500}>{app.applicationNumber}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight={500}>{app.entity?.legalName}</Typography>
                          {app.entity?.nzbn && (
                            <Typography variant="caption" color="text.secondary">
                              NZBN: {app.entity.nzbn}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {app.entity?.entityType?.replace(/_/g, ' ')}
                          </Typography>
                        </TableCell>
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
                          {app.assignedSpecialist && (
                            <Typography variant="body2">
                              {app.assignedSpecialist.firstName} {app.assignedSpecialist.lastName}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {format(new Date(app.updatedAt), 'dd/MM/yyyy HH:mm')}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, app.id)}
                          >
                            <MoreIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={pagination.total}
                page={pagination.page - 1}
                onPageChange={handlePageChange}
                rowsPerPage={pagination.limit}
                onRowsPerPageChange={handleRowsPerPageChange}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </>
          )}
        </TableContainer>
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            navigate(`/applications/${selectedAppId}`);
            handleMenuClose();
          }}
        >
          <ViewIcon fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate(`/applications/${selectedAppId}/edit`);
            handleMenuClose();
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={handleDeleteClick}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Application</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this application? This action cannot be undone.
          </DialogContentText>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={isDeleting}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApplicationsPage;
