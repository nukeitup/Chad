import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  Business as BusinessIcon,
  Public as PublicIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import api from '../../services/api';
import { Entity, EntityType, CDDLevel, NZBNSearchResult } from '../../types';

const steps = [
  'Entity Identification',
  'CDD Level Determination',
  'Beneficial Ownership',
  'Persons Acting on Behalf',
  'Nature & Purpose',
  'Products & Volumes',
  'Risk Assessment',
  'Documents',
  'Review & Submit',
];

interface CDDDetermination {
  level: CDDLevel;
  reason: string;
  legalReferences: string[];
  simplifiedAssessment: {
    criteria: string;
    met: boolean;
  }[];
  enhancedTriggers: {
    trigger: string;
    triggered: boolean;
    reference: string;
  }[];
}

const NewApplicationPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [activeStep, setActiveStep] = useState(0);
  const [entityLocation, setEntityLocation] = useState<'NZ' | 'OVERSEAS' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NZBNSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [cddDetermination, setCddDetermination] = useState<CDDDetermination | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form data for overseas entity
  const [overseasEntity, setOverseasEntity] = useState({
    legalName: '',
    entityType: '' as EntityType,
    countryOfIncorporation: '',
    registrationNumber: '',
    incorporationDate: '',
  });

  // Search NZ entities
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      // Check if it's an NZBN (13 digits)
      const isNZBN = /^\d{13}$/.test(searchQuery.trim());

      if (isNZBN) {
        const response = await api.get(`/entities/nzbn/${searchQuery.trim()}`);
        if (response.data.success && response.data.data) {
          setSearchResults([{
            nzbn: response.data.data.nzbn,
            entityName: response.data.data.legalName,
            entityTypeName: response.data.data.entityType,
            entityStatusDescription: response.data.data.entityStatus,
            registrationDate: response.data.data.incorporationDate,
          }]);
        } else {
          setSearchResults([]);
        }
      } else {
        const response = await api.get(`/entities/search?q=${encodeURIComponent(searchQuery)}`);
        if (response.data.success) {
          setSearchResults(response.data.data || []);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to search entities');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Select an NZ entity
  const handleSelectNZEntity = async (nzbn: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get(`/entities/nzbn/${nzbn}`);
      if (response.data.success) {
        setSelectedEntity(response.data.data);
        // Auto-determine CDD level
        await determineCDDLevel(response.data.data);
        setActiveStep(1);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch entity details');
    } finally {
      setIsLoading(false);
    }
  };

  // Create overseas entity
  const handleCreateOverseasEntity = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/entities/overseas', overseasEntity);
      if (response.data.success) {
        setSelectedEntity(response.data.data);
        await determineCDDLevel(response.data.data);
        setActiveStep(1);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create entity');
    } finally {
      setIsLoading(false);
    }
  };

  // Determine CDD level
  const determineCDDLevel = async (entity: Entity) => {
    // For now, use a simplified mock determination
    // In production, this would call the backend CDD determination API
    const determination: CDDDetermination = {
      level: 'STANDARD',
      reason: 'Entity does not meet Simplified CDD criteria',
      legalReferences: ['Sections 14-17, AML/CFT Act 2009'],
      simplifiedAssessment: [
        { criteria: 'Listed issuer on NZ stock exchange', met: entity.isListedIssuer || false },
        { criteria: 'NZ public service agency', met: entity.entityType === 'NZ_PUBLIC_SERVICE_AGENCY' },
        { criteria: 'NZ local authority', met: entity.entityType === 'NZ_LOCAL_AUTHORITY' },
        { criteria: 'NZ state enterprise', met: entity.entityType === 'NZ_STATE_ENTERPRISE' },
        { criteria: 'NZ government department', met: entity.entityType === 'NZ_GOVT_DEPARTMENT' },
      ],
      enhancedTriggers: [
        { trigger: 'High-risk jurisdiction', triggered: false, reference: 'Section 22(1)(a)' },
        { trigger: 'Complex ownership structure', triggered: false, reference: 'RBNZ Guideline' },
        { trigger: 'PEP involvement', triggered: false, reference: 'Section 22(1)(d)' },
        { trigger: 'Nominee arrangements', triggered: false, reference: 'Regulation 12' },
      ],
    };

    // Check for simplified eligibility
    if (determination.simplifiedAssessment.some(a => a.met)) {
      determination.level = 'SIMPLIFIED';
      determination.reason = determination.simplifiedAssessment.find(a => a.met)?.criteria || '';
      determination.legalReferences = ['Section 18, AML/CFT Act 2009'];
    }

    // Check for enhanced triggers
    if (determination.enhancedTriggers.some(t => t.triggered)) {
      determination.level = 'ENHANCED';
      determination.reason = determination.enhancedTriggers.filter(t => t.triggered).map(t => t.trigger).join('; ');
      determination.legalReferences = ['Section 22, AML/CFT Act 2009'];
    }

    setCddDetermination(determination);
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const getCDDLevelColor = (level: CDDLevel) => {
    switch (level) {
      case 'SIMPLIFIED': return 'info';
      case 'STANDARD': return 'success';
      case 'ENHANCED': return 'warning';
      default: return 'default';
    }
  };

  const renderStep0_EntityIdentification = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Step 1 of 9: Entity Identification
      </Typography>

      {!entityLocation && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="body1" gutterBottom>
            Select entity location:
          </Typography>
          <ToggleButtonGroup
            value={entityLocation}
            exclusive
            onChange={(_, value) => setEntityLocation(value)}
            sx={{ mt: 2 }}
          >
            <ToggleButton value="NZ" sx={{ px: 4, py: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <BusinessIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="subtitle1" fontWeight={600}>
                  New Zealand Entity
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Search Companies Office
                </Typography>
              </Box>
            </ToggleButton>
            <ToggleButton value="OVERSEAS" sx={{ px: 4, py: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <PublicIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="subtitle1" fontWeight={600}>
                  Overseas Entity
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Manual entry
                </Typography>
              </Box>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      {entityLocation === 'NZ' && (
        <Box sx={{ mt: 3 }}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Search New Zealand Entities
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Enter company name or NZBN (13 digits)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
              >
                {isSearching ? <CircularProgress size={24} /> : 'Search'}
              </Button>
            </Box>

            {searchResults.length > 0 && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Search Results:
                </Typography>
                {searchResults.map((result) => (
                  <Paper
                    key={result.nzbn}
                    variant="outlined"
                    sx={{
                      p: 2,
                      mb: 2,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    onClick={() => handleSelectNZEntity(result.nzbn)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {result.entityName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          NZBN: {result.nzbn}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Type: {result.entityTypeName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Status: {result.entityStatusDescription}
                        </Typography>
                      </Box>
                      <Button variant="outlined" size="small">
                        Select
                      </Button>
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Paper>
          <Button
            sx={{ mt: 2 }}
            onClick={() => setEntityLocation(null)}
          >
            Back to selection
          </Button>
        </Box>
      )}

      {entityLocation === 'OVERSEAS' && (
        <Box sx={{ mt: 3 }}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Enter Overseas Entity Details
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Legal Name"
                  required
                  value={overseasEntity.legalName}
                  onChange={(e) => setOverseasEntity({ ...overseasEntity, legalName: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Entity Type</InputLabel>
                  <Select
                    value={overseasEntity.entityType}
                    label="Entity Type"
                    onChange={(e) => setOverseasEntity({ ...overseasEntity, entityType: e.target.value as EntityType })}
                  >
                    <MenuItem value="OVERSEAS_COMPANY">Overseas Company</MenuItem>
                    <MenuItem value="TRUST">Trust</MenuItem>
                    <MenuItem value="FOUNDATION">Foundation</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Country of Incorporation"
                  required
                  value={overseasEntity.countryOfIncorporation}
                  onChange={(e) => setOverseasEntity({ ...overseasEntity, countryOfIncorporation: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Registration Number"
                  value={overseasEntity.registrationNumber}
                  onChange={(e) => setOverseasEntity({ ...overseasEntity, registrationNumber: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Incorporation Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={overseasEntity.incorporationDate}
                  onChange={(e) => setOverseasEntity({ ...overseasEntity, incorporationDate: e.target.value })}
                />
              </Grid>
            </Grid>
            <Button
              variant="contained"
              sx={{ mt: 3 }}
              onClick={handleCreateOverseasEntity}
              disabled={!overseasEntity.legalName || !overseasEntity.entityType || !overseasEntity.countryOfIncorporation}
            >
              Continue
            </Button>
          </Paper>
          <Button
            sx={{ mt: 2 }}
            onClick={() => setEntityLocation(null)}
          >
            Back to selection
          </Button>
        </Box>
      )}
    </Box>
  );

  const renderStep1_CDDDetermination = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Step 2 of 9: CDD Level Determination
      </Typography>

      {selectedEntity && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" color="text.secondary">
            Entity: <strong>{selectedEntity.legalName}</strong>
            {selectedEntity.nzbn && ` (NZBN: ${selectedEntity.nzbn})`}
          </Typography>
        </Box>
      )}

      {cddDetermination && (
        <>
          <Paper variant="outlined" sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <InfoIcon color="primary" />
              <Typography variant="subtitle1" fontWeight={600}>
                Automatic CDD Level Determination
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Chip
                label={`${cddDetermination.level} CDD`}
                color={getCDDLevelColor(cddDetermination.level) as any}
                size="medium"
                sx={{ fontWeight: 600, fontSize: '1rem', py: 2 }}
              />
            </Box>

            <Typography variant="body2" color="text.secondary" gutterBottom>
              Reason: {cddDetermination.reason}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Legal Reference: {cddDetermination.legalReferences.join(', ')}
            </Typography>
          </Paper>

          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Simplified CDD Assessment
            </Typography>
            <List dense>
              {cddDetermination.simplifiedAssessment.map((item, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {item.met ? (
                      <CheckIcon color="success" />
                    ) : (
                      <CancelIcon color="error" />
                    )}
                  </ListItemIcon>
                  <ListItemText primary={item.criteria} />
                </ListItem>
              ))}
            </List>
          </Paper>

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Enhanced CDD Assessment
            </Typography>
            <List dense>
              {cddDetermination.enhancedTriggers.map((item, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {item.triggered ? (
                      <WarningIcon color="warning" />
                    ) : (
                      <CheckIcon color="success" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.trigger}
                    secondary={item.reference}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </>
      )}
    </Box>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderStep0_EntityIdentification();
      case 1:
        return renderStep1_CDDDetermination();
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Step 3: Beneficial Ownership</Typography>
            <Typography color="text.secondary">Coming soon - Add beneficial owners with &gt;25% ownership</Typography>
          </Box>
        );
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Step 4: Persons Acting on Behalf</Typography>
            <Typography color="text.secondary">Coming soon - Add persons authorized to act</Typography>
          </Box>
        );
      case 4:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Step 5: Nature & Purpose</Typography>
            <Typography color="text.secondary">Coming soon - Business relationship details</Typography>
          </Box>
        );
      case 5:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Step 6: Products & Volumes</Typography>
            <Typography color="text.secondary">Coming soon - Products requested and transaction volumes</Typography>
          </Box>
        );
      case 6:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Step 7: Risk Assessment</Typography>
            <Typography color="text.secondary">Coming soon - Automated risk calculation</Typography>
          </Box>
        );
      case 7:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Step 8: Documents</Typography>
            <Typography color="text.secondary">Coming soon - Upload required documents</Typography>
          </Box>
        );
      case 8:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Step 9: Review & Submit</Typography>
            <Typography color="text.secondary">Coming soon - Review and submit for approval</Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        New CDD Application
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel>{index < 5 ? label : ''}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Card>
        <CardContent sx={{ p: 4 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            renderStepContent()
          )}

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              onClick={() => activeStep === 0 ? navigate('/applications') : handleBack()}
            >
              {activeStep === 0 ? 'Cancel' : 'Back'}
            </Button>
            {activeStep > 0 && activeStep < steps.length - 1 && (
              <Button variant="contained" onClick={handleNext}>
                Continue
              </Button>
            )}
            {activeStep === steps.length - 1 && (
              <Button variant="contained" color="primary">
                Submit for Approval
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default NewApplicationPage;
