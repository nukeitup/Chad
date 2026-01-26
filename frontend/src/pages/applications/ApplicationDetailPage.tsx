import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Description as DocumentIcon,
  Gavel as GavelIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Send as SubmitIcon,
  VerifiedUser as VerifiedUserIcon,
  Public as PublicIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchApplicationById } from '../../store/slices/applicationSlice';
import { useAuth } from '../../hooks/useAuth';
import { applicationsApi } from '../../services/api';
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

const ApplicationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user, canApprove } = useAuth();
  const { currentApplication, isLoading, error } = useSelector(
    (state: RootState) => state.applications
  );

  const [actionDialog, setActionDialog] = useState<'approve' | 'return' | 'reject' | 'submit' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      dispatch(fetchApplicationById(id));
    }
  }, [dispatch, id]);

  const application = currentApplication;

  const handleSubmit = async () => {
    if (!application) return;
    setIsProcessing(true);
    setLocalError(null);

    try {
      await applicationsApi.submit(application.id);
      setActionDialog(null);
      dispatch(fetchApplicationById(application.id));
    } catch (err: any) {
      setLocalError(err.response?.data?.error || 'Failed to submit application');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = async () => {
    if (!application) return;
    setIsProcessing(true);
    setLocalError(null);

    try {
      await applicationsApi.approve(application.id);
      setActionDialog(null);
      dispatch(fetchApplicationById(application.id));
    } catch (err: any) {
      setLocalError(err.response?.data?.error || 'Failed to approve application');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReturn = async () => {
    if (!application || !actionReason.trim()) return;
    setIsProcessing(true);
    setLocalError(null);

    try {
      await applicationsApi.return(application.id, actionReason);
      setActionDialog(null);
      setActionReason('');
      dispatch(fetchApplicationById(application.id));
    } catch (err: any) {
      setLocalError(err.response?.data?.error || 'Failed to return application');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!application || !actionReason.trim()) return;
    setIsProcessing(true);
    setLocalError(null);

    try {
      await applicationsApi.reject(application.id, actionReason);
      setActionDialog(null);
      setActionReason('');
      dispatch(fetchApplicationById(application.id));
    } catch (err: any) {
      setLocalError(err.response?.data?.error || 'Failed to reject application');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading || !application) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/applications')}>
          Back to Applications
        </Button>
      </Box>
    );
  }

  const canEdit = application.workflowState === 'DRAFT' || application.workflowState === 'RETURNED';
  const canSubmit = canEdit && application.workflowState !== 'SUBMITTED';
  const isOwner = application.assignedSpecialistId === user?.id;

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => navigate('/applications')}
        >
          Applications
        </Link>
        <Typography color="text.primary">{application.applicationNumber}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {application.entity?.legalName}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip
              label={application.workflowState.replace(/_/g, ' ')}
              color={getStatusColor(application.workflowState)}
            />
            <Chip
              label={`${application.cddLevel} CDD`}
              color={getCDDLevelColor(application.cddLevel)}
              variant="outlined"
            />
            {application.riskRating && (
              <Chip
                label={`${application.riskRating} Risk`}
                color={getRiskColor(application.riskRating)}
                variant="outlined"
              />
            )}
            <Typography variant="body2" color="text.secondary">
              {application.applicationNumber}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          {canEdit && isOwner && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/applications/${application.id}/edit`)}
            >
              Edit
            </Button>
          )}
          {canSubmit && isOwner && (
            <Button
              variant="contained"
              startIcon={<SubmitIcon />}
              onClick={() => setActionDialog('submit')}
            >
              Submit for Approval
            </Button>
          )}
          {canApprove && (application.workflowState === 'SUBMITTED' || application.workflowState === 'UNDER_REVIEW') && (
            <>
              <Button
                variant="contained"
                color="success"
                onClick={() => setActionDialog('approve')}
              >
                Approve
              </Button>
              <Button
                variant="outlined"
                color="warning"
                onClick={() => setActionDialog('return')}
              >
                Return
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => setActionDialog('reject')}
              >
                Reject
              </Button>
            </>
          )}
        </Box>
      </Box>

      {localError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setLocalError(null)}>
          {localError}
        </Alert>
      )}

      {application.workflowState === 'RETURNED' && application.returnedReason && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            Returned for Corrections
          </Typography>
          <Typography variant="body2">
            {application.returnedReason}
          </Typography>
        </Alert>
      )}

      {application.workflowState === 'REJECTED' && application.rejectedReason && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            Application Rejected
          </Typography>
          <Typography variant="body2">
            {application.rejectedReason}
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid size={{ xs: 12, lg: 8 }}>
          {/* Entity Details */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon color="primary" />
                <Typography fontWeight={600}>Entity Details</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="body2" color="text.secondary">Legal Name</Typography>
                  <Typography variant="body1" fontWeight={500}>{application.entity?.legalName}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="body2" color="text.secondary">Entity Type</Typography>
                  <Typography variant="body1">{application.entity?.entityType?.replace(/_/g, ' ')}</Typography>
                </Grid>
                {application.entity?.nzbn && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="body2" color="text.secondary">NZBN</Typography>
                    <Typography variant="body1">{application.entity.nzbn}</Typography>
                  </Grid>
                )}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="body2" color="text.secondary">Country of Incorporation</Typography>
                  <Typography variant="body1">{application.entity?.countryOfIncorporation}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Typography variant="body1">{application.entity?.entityStatus}</Typography>
                </Grid>
                {application.entity?.incorporationDate && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="body2" color="text.secondary">Incorporation Date</Typography>
                    <Typography variant="body1">
                      {format(new Date(application.entity.incorporationDate), 'dd/MM/yyyy')}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* CDD Level & Risk */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GavelIcon color="primary" />
                <Typography fontWeight={600}>CDD Level & Risk Assessment</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2" color="text.secondary">CDD Level</Typography>
                  <Chip
                    label={application.cddLevel}
                    color={getCDDLevelColor(application.cddLevel)}
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2" color="text.secondary">Risk Rating</Typography>
                  {application.riskRating ? (
                    <Chip
                      label={application.riskRating}
                      color={getRiskColor(application.riskRating)}
                      sx={{ mt: 0.5 }}
                    />
                  ) : (
                    <Typography variant="body1" color="text.secondary">Not assessed</Typography>
                  )}
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2" color="text.secondary">Risk Score</Typography>
                  <Typography variant="body1">{application.riskScore || 0}/100</Typography>
                </Grid>
                {application.cddLevelJustification && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" color="text.secondary">CDD Level Justification</Typography>
                    <Typography variant="body1">{application.cddLevelJustification}</Typography>
                  </Grid>
                )}
                {application.riskRatingJustification && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" color="text.secondary">Risk Rating Justification</Typography>
                    <Typography variant="body1">{application.riskRatingJustification}</Typography>
                  </Grid>
                )}
              </Grid>

              {/* Risk Factors */}
              {application.riskFactors && application.riskFactors.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Risk Factors
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Category</TableCell>
                          <TableCell>Factor</TableCell>
                          <TableCell align="right">Points</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {application.riskFactors.map((factor, index) => (
                          <TableRow key={index}>
                            <TableCell>{factor.factorCategory}</TableCell>
                            <TableCell>{factor.factorDescription}</TableCell>
                            <TableCell align="right">{factor.riskPoints}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Beneficial Owners */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon color="primary" />
                <Typography fontWeight={600}>
                  Beneficial Owners ({application.beneficialOwners?.length || 0})
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {application.beneficialOwners && application.beneficialOwners.length > 0 ? (
                <List>
                  {application.beneficialOwners.map((bo, index) => (
                    <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {bo.person?.fullName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Ownership: {bo.ownershipPercentage}%
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                            {bo.ownershipBasis.map((basis) => (
                              <Chip
                                key={basis}
                                label={basis.replace(/_/g, ' ')}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                            {bo.isNominee && (
                              <Chip label="Nominee" size="small" color="warning" />
                            )}
                          </Box>
                        </Box>
                        <Chip
                          label={bo.verificationStatus.replace(/_/g, ' ')}
                          size="small"
                          color={bo.verificationStatus === 'VERIFIED' ? 'success' : 'default'}
                          icon={bo.verificationStatus === 'VERIFIED' ? <CheckIcon /> : <ScheduleIcon />}
                        />
                      </Box>
                    </Paper>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No beneficial owners recorded
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Persons Acting on Behalf */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VerifiedUserIcon color="primary" />
                <Typography fontWeight={600}>
                  Persons Acting on Behalf ({application.personsActingOnBehalf?.length || 0})
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {application.personsActingOnBehalf && application.personsActingOnBehalf.length > 0 ? (
                <List>
                  {application.personsActingOnBehalf.map((pa, index) => (
                    <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {pa.person?.fullName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Role: {pa.roleTitle}
                          </Typography>
                          {pa.authorityDocumentType && (
                            <Typography variant="body2" color="text.secondary">
                              Authority: {pa.authorityDocumentType}
                            </Typography>
                          )}
                        </Box>
                        <Chip
                          label={pa.verificationStatus.replace(/_/g, ' ')}
                          size="small"
                          color={pa.verificationStatus === 'VERIFIED' ? 'success' : 'default'}
                        />
                      </Box>
                    </Paper>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No persons acting on behalf recorded
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Documents */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DocumentIcon color="primary" />
                <Typography fontWeight={600}>
                  Documents ({application.documents?.length || 0})
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {application.documents && application.documents.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Document Type</TableCell>
                        <TableCell>File Name</TableCell>
                        <TableCell>Uploaded</TableCell>
                        <TableCell>Uploaded By</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {application.documents.map((doc, index) => (
                        <TableRow key={index}>
                          <TableCell>{doc.documentType}</TableCell>
                          <TableCell>{doc.fileName}</TableCell>
                          <TableCell>{format(new Date(doc.uploadDate), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>
                            {doc.uploadedBy?.firstName} {doc.uploadedBy?.lastName}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No documents uploaded
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, lg: 4 }}>
          {/* Application Info */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Application Info
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Application Number"
                    secondary={application.applicationNumber}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Type"
                    secondary={application.applicationType.replace(/_/g, ' ')}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Created"
                    secondary={format(new Date(application.createdAt), 'dd/MM/yyyy HH:mm')}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Last Updated"
                    secondary={format(new Date(application.updatedAt), 'dd/MM/yyyy HH:mm')}
                  />
                </ListItem>
                {application.submittedDate && (
                  <ListItem>
                    <ListItemText
                      primary="Submitted"
                      secondary={format(new Date(application.submittedDate), 'dd/MM/yyyy HH:mm')}
                    />
                  </ListItem>
                )}
                {application.approvedDate && (
                  <ListItem>
                    <ListItemText
                      primary="Approved"
                      secondary={format(new Date(application.approvedDate), 'dd/MM/yyyy HH:mm')}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>

          {/* Team */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Team
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Assigned Specialist"
                    secondary={application.assignedSpecialist
                      ? `${application.assignedSpecialist.firstName} ${application.assignedSpecialist.lastName}`
                      : 'Not assigned'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <VerifiedUserIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Assigned Approver"
                    secondary={application.assignedApprover
                      ? `${application.assignedApprover.firstName} ${application.assignedApprover.lastName}`
                      : 'Not assigned'}
                  />
                </ListItem>
                {application.approvedBy && (
                  <ListItem>
                    <ListItemIcon>
                      <CheckIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Approved By"
                      secondary={`${application.approvedBy.firstName} ${application.approvedBy.lastName}`}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>

          {/* Compliance Checklist */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Compliance Checklist
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    {application.entity ? <CheckIcon color="success" /> : <CancelIcon color="error" />}
                  </ListItemIcon>
                  <ListItemText primary="Entity identified (S.14)" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    {application.beneficialOwners && application.beneficialOwners.length > 0
                      ? <CheckIcon color="success" />
                      : <WarningIcon color="warning" />}
                  </ListItemIcon>
                  <ListItemText primary="Beneficial owners (S.15)" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    {application.personsActingOnBehalf && application.personsActingOnBehalf.length > 0
                      ? <CheckIcon color="success" />
                      : <WarningIcon color="warning" />}
                  </ListItemIcon>
                  <ListItemText primary="Persons acting (S.11)" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    {application.riskRating
                      ? <CheckIcon color="success" />
                      : <CancelIcon color="error" />}
                  </ListItemIcon>
                  <ListItemText primary="Risk assessed (S.58)" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Submit Dialog */}
      <Dialog open={actionDialog === 'submit'} onClose={() => setActionDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Submit for Approval</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mt: 1 }}>
            This application will be submitted for review and approval. You will not be able to edit it
            unless it is returned for corrections.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isProcessing}
          >
            {isProcessing ? <CircularProgress size={24} /> : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={actionDialog === 'approve'} onClose={() => setActionDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Application</DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mt: 1 }}>
            You are about to approve this CDD application.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleApprove}
            disabled={isProcessing}
          >
            {isProcessing ? <CircularProgress size={24} /> : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={actionDialog === 'return'} onClose={() => setActionDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Return for Corrections</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 1, mb: 2 }}>
            The application will be returned to the specialist for corrections.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Reason for Return"
            placeholder="Please provide details on what needs to be corrected..."
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleReturn}
            disabled={isProcessing || !actionReason.trim()}
          >
            {isProcessing ? <CircularProgress size={24} /> : 'Return'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={actionDialog === 'reject'} onClose={() => setActionDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Application</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mt: 1, mb: 2 }}>
            This action will permanently reject the application.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Reason for Rejection"
            placeholder="Please provide the reason for rejecting this application..."
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={isProcessing || !actionReason.trim()}
          >
            {isProcessing ? <CircularProgress size={24} /> : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApplicationDetailPage;
