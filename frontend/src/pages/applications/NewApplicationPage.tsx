import { useState, useEffect } from 'react';
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
  ListItemSecondaryAction,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Business as BusinessIcon,
  Public as PublicIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Upload as UploadIcon,
  ExpandMore as ExpandMoreIcon,
  Description as DescriptionIcon,
  Gavel as GavelIcon,
  VerifiedUser as VerifiedUserIcon,
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import api, { applicationsApi, referenceApi, nzbnApi } from '../../services/api';
import {
  Entity,
  EntityType,
  CDDLevel,
  NZBNSearchResult,
  BeneficialOwner,
  PersonActingOnBehalf,
  Person,
  OwnershipBasis,
  PEPStatus,
  VerificationStatus,
  RiskRating,
} from '../../types';

const steps = [
  'Entity Identification',
  'CDD Level Determination',
  'Beneficial Ownership',
  'Persons Acting on Behalf',
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

interface BeneficialOwnerForm {
  fullName: string;
  dateOfBirth: string;
  residentialStreet: string;
  residentialCity: string;
  residentialPostcode: string;
  residentialCountry: string;
  nationality: string;
  ownershipPercentage: number;
  ownershipBasis: OwnershipBasis[];
  isNominee: boolean;
  pepStatus: PEPStatus;
}

interface PersonActingForm {
  fullName: string;
  dateOfBirth: string;
  residentialStreet: string;
  residentialCity: string;
  residentialPostcode: string;
  residentialCountry: string;
  nationality: string;
  roleTitle: string;
  authorityDocumentType: string;
  pepStatus: PEPStatus;
}

interface DocumentUpload {
  id: string;
  file: File;
  documentType: string;
  documentCategory: string;
  uploading: boolean;
  uploaded: boolean;
  error?: string;
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
  const [isSaving, setIsSaving] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  // Beneficial Owners state
  const [beneficialOwners, setBeneficialOwners] = useState<BeneficialOwnerForm[]>([]);
  const [showBODialog, setShowBODialog] = useState(false);
  const [editingBOIndex, setEditingBOIndex] = useState<number | null>(null);
  const [boForm, setBoForm] = useState<BeneficialOwnerForm>({
    fullName: '',
    dateOfBirth: '',
    residentialStreet: '',
    residentialCity: '',
    residentialPostcode: '',
    residentialCountry: 'New Zealand',
    nationality: 'New Zealand',
    ownershipPercentage: 0,
    ownershipBasis: [],
    isNominee: false,
    pepStatus: 'NOT_PEP',
  });

  // Persons Acting on Behalf state
  const [personsActing, setPersonsActing] = useState<PersonActingForm[]>([]);
  const [showPADialog, setShowPADialog] = useState(false);
  const [editingPAIndex, setEditingPAIndex] = useState<number | null>(null);
  const [paForm, setPaForm] = useState<PersonActingForm>({
    fullName: '',
    dateOfBirth: '',
    residentialStreet: '',
    residentialCity: '',
    residentialPostcode: '',
    residentialCountry: 'New Zealand',
    nationality: 'New Zealand',
    roleTitle: '',
    authorityDocumentType: '',
    pepStatus: 'NOT_PEP',
  });

  // Risk Assessment state
  const [riskAssessment, setRiskAssessment] = useState<{
    rating: RiskRating;
    score: number;
    factors: { category: string; description: string; points: number }[];
  } | null>(null);

  // NZBN data for auto-import
  const [nzbnData, setNzbnData] = useState<{
    shareholders: Array<{
      shareholderName: string;
      shareholderType: 'Individual' | 'Company';
      numberOfShares: number;
      totalShares?: number;
      allocationDate: string;
    }>;
    directors: Array<{
      directorNumber: string;
      fullName: string;
      appointmentDate: string;
      residentialAddress?: string;
    }>;
  } | null>(null);

  // Documents state
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [requiredDocuments, setRequiredDocuments] = useState<string[]>([
    'Certificate of Incorporation',
    'Company Constitution',
    'Register of Directors',
    'Register of Shareholders',
    'Board Resolution',
  ]);

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
      const response = await nzbnApi.search(searchQuery.trim());
      if (response.data.success) {
        setSearchResults(response.data.data.items || []);
      } else {
        setSearchResults([]);
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
      // First, get/create entity in our database
      const entityResponse = await api.get(`/entities/nzbn/${nzbn}`);
      if (entityResponse.data.success) {
        setSelectedEntity(entityResponse.data.data);
        await determineCDDLevel(entityResponse.data.data);
      }

      // Then, fetch full NZBN details including shareholders and directors
      const nzbnResponse = await nzbnApi.getByNzbn(nzbn);
      if (nzbnResponse.data.success && nzbnResponse.data.data) {
        const nzbnDetails = nzbnResponse.data.data;

        // Store NZBN data for later import
        setNzbnData({
          shareholders: nzbnDetails.shareholders || [],
          directors: nzbnDetails.directors || [],
        });

        // Auto-populate beneficial owners from shareholders with >25% ownership
        const totalShares = nzbnDetails.shareholders?.reduce(
          (sum: number, s: any) => sum + s.numberOfShares, 0
        ) || 1;

        const autoPopulatedBOs: BeneficialOwnerForm[] = [];
        const autoPopulatedPAs: PersonActingForm[] = [];

        // Add shareholders with >25% as beneficial owners
        for (const shareholder of nzbnDetails.shareholders || []) {
          const shareholderTotal = shareholder.totalShares || totalShares;
          const ownershipPct = (shareholder.numberOfShares / shareholderTotal) * 100;

          if (ownershipPct >= 25) {
            autoPopulatedBOs.push({
              fullName: shareholder.shareholderName,
              dateOfBirth: '',
              residentialStreet: '',
              residentialCity: '',
              residentialPostcode: '',
              residentialCountry: 'New Zealand',
              nationality: 'New Zealand',
              ownershipPercentage: Math.round(ownershipPct * 100) / 100,
              ownershipBasis: ['ULTIMATE_OWNERSHIP'],
              isNominee: false,
              pepStatus: 'NOT_PEP',
            });
          }
        }

        // Add directors as persons acting on behalf
        for (const director of nzbnDetails.directors || []) {
          autoPopulatedPAs.push({
            fullName: director.fullName,
            dateOfBirth: '',
            residentialStreet: '',
            residentialCity: '',
            residentialPostcode: '',
            residentialCountry: 'New Zealand',
            nationality: 'New Zealand',
            roleTitle: 'Director',
            authorityDocumentType: 'Companies Office Registration',
            pepStatus: 'NOT_PEP',
          });
        }

        setBeneficialOwners(autoPopulatedBOs);
        setPersonsActing(autoPopulatedPAs);
      }

      setActiveStep(1);
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

    if (determination.simplifiedAssessment.some(a => a.met)) {
      determination.level = 'SIMPLIFIED';
      determination.reason = determination.simplifiedAssessment.find(a => a.met)?.criteria || '';
      determination.legalReferences = ['Section 18, AML/CFT Act 2009'];
    }

    if (determination.enhancedTriggers.some(t => t.triggered)) {
      determination.level = 'ENHANCED';
      determination.reason = determination.enhancedTriggers.filter(t => t.triggered).map(t => t.trigger).join('; ');
      determination.legalReferences = ['Section 22, AML/CFT Act 2009'];
    }

    setCddDetermination(determination);
  };

  // Calculate risk assessment based on public data only
  const calculateRiskAssessment = () => {
    const factors: { category: string; description: string; points: number }[] = [];
    let totalScore = 0;

    // Entity risk factors (0-35 points)
    if (selectedEntity?.entityType === 'TRUST') {
      factors.push({ category: 'Entity', description: 'Entity type: Trust (higher risk)', points: 20 });
      totalScore += 20;
    } else if (selectedEntity?.entityType === 'FOUNDATION') {
      factors.push({ category: 'Entity', description: 'Entity type: Foundation', points: 15 });
      totalScore += 15;
    } else if (selectedEntity?.entityType === 'NZ_LIMITED_PARTNERSHIP') {
      factors.push({ category: 'Entity', description: 'Entity type: Limited Partnership', points: 8 });
      totalScore += 8;
    }

    // Ownership complexity
    if (beneficialOwners.length > 4) {
      factors.push({ category: 'Entity', description: 'Complex ownership structure', points: 15 });
      totalScore += 15;
    } else if (beneficialOwners.length > 2) {
      factors.push({ category: 'Entity', description: 'Moderate ownership complexity', points: 8 });
      totalScore += 8;
    }

    // Geographic risk factors (0-35 points)
    if (selectedEntity?.countryOfIncorporation && selectedEntity.countryOfIncorporation !== 'NZ') {
      factors.push({ category: 'Geographic', description: 'Overseas entity incorporation', points: 15 });
      totalScore += 15;
    }

    // Beneficial owner risk factors (0-30 points)
    const hasPEP = beneficialOwners.some(bo => bo.pepStatus !== 'NOT_PEP');
    if (hasPEP) {
      factors.push({ category: 'Beneficial Owners', description: 'PEP involvement detected', points: 18 });
      totalScore += 18;
    }

    const hasNominee = beneficialOwners.some(bo => bo.isNominee);
    if (hasNominee) {
      factors.push({ category: 'Beneficial Owners', description: 'Nominee arrangements present', points: 12 });
      totalScore += 12;
    }

    // Determine rating (adjusted thresholds)
    let rating: RiskRating = 'LOW';
    if (totalScore >= 61) {
      rating = 'HIGH';
    } else if (totalScore >= 36) {
      rating = 'MEDIUM';
    }

    setRiskAssessment({ rating, score: totalScore, factors });
  };

  // Run risk calculation when relevant data changes
  useEffect(() => {
    if (activeStep >= 4 && selectedEntity) {
      calculateRiskAssessment();
    }
  }, [activeStep, beneficialOwners, selectedEntity]);

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

  const getRiskColor = (rating: RiskRating) => {
    switch (rating) {
      case 'LOW': return 'success';
      case 'MEDIUM': return 'warning';
      case 'HIGH': return 'error';
      case 'PROHIBITED': return 'error';
      default: return 'default';
    }
  };

  // Beneficial Owner handlers
  const handleAddBO = () => {
    setEditingBOIndex(null);
    setBoForm({
      fullName: '',
      dateOfBirth: '',
      residentialStreet: '',
      residentialCity: '',
      residentialPostcode: '',
      residentialCountry: 'New Zealand',
      nationality: 'New Zealand',
      ownershipPercentage: 0,
      ownershipBasis: [],
      isNominee: false,
      pepStatus: 'NOT_PEP',
    });
    setShowBODialog(true);
  };

  const handleEditBO = (index: number) => {
    setEditingBOIndex(index);
    setBoForm(beneficialOwners[index]);
    setShowBODialog(true);
  };

  const handleSaveBO = () => {
    if (editingBOIndex !== null) {
      const updated = [...beneficialOwners];
      updated[editingBOIndex] = boForm;
      setBeneficialOwners(updated);
    } else {
      setBeneficialOwners([...beneficialOwners, boForm]);
    }
    setShowBODialog(false);
  };

  const handleDeleteBO = (index: number) => {
    setBeneficialOwners(beneficialOwners.filter((_, i) => i !== index));
  };

  // Person Acting handlers
  const handleAddPA = () => {
    setEditingPAIndex(null);
    setPaForm({
      fullName: '',
      dateOfBirth: '',
      residentialStreet: '',
      residentialCity: '',
      residentialPostcode: '',
      residentialCountry: 'New Zealand',
      nationality: 'New Zealand',
      roleTitle: '',
      authorityDocumentType: '',
      pepStatus: 'NOT_PEP',
    });
    setShowPADialog(true);
  };

  const handleEditPA = (index: number) => {
    setEditingPAIndex(index);
    setPaForm(personsActing[index]);
    setShowPADialog(true);
  };

  const handleSavePA = () => {
    if (editingPAIndex !== null) {
      const updated = [...personsActing];
      updated[editingPAIndex] = paForm;
      setPersonsActing(updated);
    } else {
      setPersonsActing([...personsActing, paForm]);
    }
    setShowPADialog(false);
  };

  const handleDeletePA = (index: number) => {
    setPersonsActing(personsActing.filter((_, i) => i !== index));
  };

  // Document handlers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const newDoc: DocumentUpload = {
      id: `doc-${Date.now()}`,
      file,
      documentType,
      documentCategory: 'ENTITY_IDENTIFICATION',
      uploading: false,
      uploaded: false,
    };
    setDocuments([...documents, newDoc]);
  };

  const handleRemoveDocument = (id: string) => {
    setDocuments(documents.filter(d => d.id !== id));
  };

  // Submit application
  const handleSubmitApplication = async () => {
    if (!selectedEntity || !cddDetermination) return;

    setIsSaving(true);
    setError(null);

    try {
      // Create the application
      const appResponse = await applicationsApi.create({
        entityId: selectedEntity.id,
        applicationType: 'NEW_CUSTOMER',
        cddLevel: cddDetermination.level,
        cddLevelJustification: cddDetermination.reason,
      });

      if (appResponse.data.success) {
        const appId = appResponse.data.data.id;

        // Update with risk assessment data
        await applicationsApi.update(appId, {
          riskRating: riskAssessment?.rating,
          riskScore: riskAssessment?.score,
        });

        // Submit for approval
        await applicationsApi.submit(appId);

        navigate('/applications');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit application');
    } finally {
      setIsSaving(false);
    }
  };

  // Render Step 0: Entity Identification
  const renderStep0_EntityIdentification = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Step 1 of 7: Entity Identification
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

  // Render Step 1: CDD Determination
  const renderStep1_CDDDetermination = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Step 2 of 7: CDD Level Determination
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

  // Render Step 2: Beneficial Ownership
  const renderStep2_BeneficialOwnership = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Step 3 of 7: Beneficial Ownership
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Section 15, AML/CFT Act 2009:</strong> You must identify all individuals who own more than 25% of the entity,
          have effective control, or are persons on whose behalf the transaction is conducted.
        </Typography>
      </Alert>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Beneficial Owners ({beneficialOwners.length})
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddBO}
          >
            Add Beneficial Owner
          </Button>
        </Box>

        {beneficialOwners.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            No beneficial owners added yet. Click "Add Beneficial Owner" to begin.
          </Typography>
        ) : (
          <List>
            {beneficialOwners.map((bo, index) => (
              <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <PersonIcon color="primary" sx={{ mt: 0.5 }} />
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {bo.fullName}
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
                        {bo.pepStatus !== 'NOT_PEP' && (
                          <Chip label="PEP" size="small" color="error" />
                        )}
                      </Box>
                      <Chip
                        label="Not Verified"
                        size="small"
                        color="default"
                        icon={<WarningIcon />}
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Box>
                  <Box>
                    <IconButton onClick={() => handleEditBO(index)} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteBO(index)} size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            ))}
          </List>
        )}
      </Paper>

      {/* Beneficial Owner Dialog */}
      <Dialog open={showBODialog} onClose={() => setShowBODialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingBOIndex !== null ? 'Edit Beneficial Owner' : 'Add Beneficial Owner'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Full Legal Name"
                required
                value={boForm.fullName}
                onChange={(e) => setBoForm({ ...boForm, fullName: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                InputLabelProps={{ shrink: true }}
                required
                value={boForm.dateOfBirth}
                onChange={(e) => setBoForm({ ...boForm, dateOfBirth: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Nationality"
                value={boForm.nationality}
                onChange={(e) => setBoForm({ ...boForm, nationality: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Residential Address"
                value={boForm.residentialStreet}
                onChange={(e) => setBoForm({ ...boForm, residentialStreet: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="City"
                value={boForm.residentialCity}
                onChange={(e) => setBoForm({ ...boForm, residentialCity: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Postcode"
                value={boForm.residentialPostcode}
                onChange={(e) => setBoForm({ ...boForm, residentialPostcode: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Country"
                value={boForm.residentialCountry}
                onChange={(e) => setBoForm({ ...boForm, residentialCountry: e.target.value })}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Ownership Details
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Ownership Percentage"
                type="number"
                InputProps={{ inputProps: { min: 0, max: 100 } }}
                value={boForm.ownershipPercentage}
                onChange={(e) => setBoForm({ ...boForm, ownershipPercentage: Number(e.target.value) })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>PEP Status</InputLabel>
                <Select
                  value={boForm.pepStatus}
                  label="PEP Status"
                  onChange={(e) => setBoForm({ ...boForm, pepStatus: e.target.value as PEPStatus })}
                >
                  <MenuItem value="NOT_PEP">Not a PEP</MenuItem>
                  <MenuItem value="DOMESTIC_PEP">Domestic PEP</MenuItem>
                  <MenuItem value="FOREIGN_PEP">Foreign PEP</MenuItem>
                  <MenuItem value="INTERNATIONAL_ORG_PEP">International Organisation PEP</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Basis for Beneficial Ownership (select all that apply):
              </Typography>
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={boForm.ownershipBasis.includes('ULTIMATE_OWNERSHIP')}
                      onChange={(e) => {
                        const newBasis = e.target.checked
                          ? [...boForm.ownershipBasis, 'ULTIMATE_OWNERSHIP' as OwnershipBasis]
                          : boForm.ownershipBasis.filter(b => b !== 'ULTIMATE_OWNERSHIP');
                        setBoForm({ ...boForm, ownershipBasis: newBasis });
                      }}
                    />
                  }
                  label="Ultimate Ownership (>25%)"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={boForm.ownershipBasis.includes('EFFECTIVE_CONTROL')}
                      onChange={(e) => {
                        const newBasis = e.target.checked
                          ? [...boForm.ownershipBasis, 'EFFECTIVE_CONTROL' as OwnershipBasis]
                          : boForm.ownershipBasis.filter(b => b !== 'EFFECTIVE_CONTROL');
                        setBoForm({ ...boForm, ownershipBasis: newBasis });
                      }}
                    />
                  }
                  label="Effective Control"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={boForm.ownershipBasis.includes('PERSON_ON_WHOSE_BEHALF')}
                      onChange={(e) => {
                        const newBasis = e.target.checked
                          ? [...boForm.ownershipBasis, 'PERSON_ON_WHOSE_BEHALF' as OwnershipBasis]
                          : boForm.ownershipBasis.filter(b => b !== 'PERSON_ON_WHOSE_BEHALF');
                        setBoForm({ ...boForm, ownershipBasis: newBasis });
                      }}
                    />
                  }
                  label="Person on Whose Behalf"
                />
              </FormGroup>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={boForm.isNominee}
                    onChange={(e) => setBoForm({ ...boForm, isNominee: e.target.checked })}
                  />
                }
                label="This person is a nominee shareholder/director"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBODialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveBO}
            disabled={!boForm.fullName || !boForm.dateOfBirth || boForm.ownershipBasis.length === 0}
          >
            {editingBOIndex !== null ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  // Render Step 3: Persons Acting on Behalf
  const renderStep3_PersonsActing = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Step 4 of 7: Persons Acting on Behalf
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Section 11(1)(c), AML/CFT Act 2009:</strong> You must verify the identity of any person who is
          authorised to act on behalf of the customer and who seeks to conduct the transaction.
        </Typography>
      </Alert>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Authorised Persons ({personsActing.length})
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddPA}
          >
            Add Person
          </Button>
        </Box>

        {personsActing.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            No persons acting on behalf added yet. Add at least one authorised signatory.
          </Typography>
        ) : (
          <List>
            {personsActing.map((pa, index) => (
              <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <PersonIcon color="primary" sx={{ mt: 0.5 }} />
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {pa.fullName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Role: {pa.roleTitle}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Authority: {pa.authorityDocumentType || 'Not specified'}
                      </Typography>
                      {pa.pepStatus !== 'NOT_PEP' && (
                        <Chip label="PEP" size="small" color="error" sx={{ mt: 1 }} />
                      )}
                    </Box>
                  </Box>
                  <Box>
                    <IconButton onClick={() => handleEditPA(index)} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeletePA(index)} size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            ))}
          </List>
        )}
      </Paper>

      {/* Person Acting Dialog */}
      <Dialog open={showPADialog} onClose={() => setShowPADialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPAIndex !== null ? 'Edit Person Acting on Behalf' : 'Add Person Acting on Behalf'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Full Legal Name"
                required
                value={paForm.fullName}
                onChange={(e) => setPaForm({ ...paForm, fullName: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                InputLabelProps={{ shrink: true }}
                required
                value={paForm.dateOfBirth}
                onChange={(e) => setPaForm({ ...paForm, dateOfBirth: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Nationality"
                value={paForm.nationality}
                onChange={(e) => setPaForm({ ...paForm, nationality: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Residential Address"
                value={paForm.residentialStreet}
                onChange={(e) => setPaForm({ ...paForm, residentialStreet: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="City"
                value={paForm.residentialCity}
                onChange={(e) => setPaForm({ ...paForm, residentialCity: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Postcode"
                value={paForm.residentialPostcode}
                onChange={(e) => setPaForm({ ...paForm, residentialPostcode: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Country"
                value={paForm.residentialCountry}
                onChange={(e) => setPaForm({ ...paForm, residentialCountry: e.target.value })}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Authority Details
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Role/Title"
                required
                value={paForm.roleTitle}
                onChange={(e) => setPaForm({ ...paForm, roleTitle: e.target.value })}
                placeholder="e.g., Director, Company Secretary, Finance Manager"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Authority Document Type</InputLabel>
                <Select
                  value={paForm.authorityDocumentType}
                  label="Authority Document Type"
                  onChange={(e) => setPaForm({ ...paForm, authorityDocumentType: e.target.value })}
                >
                  <MenuItem value="BOARD_RESOLUTION">Board Resolution</MenuItem>
                  <MenuItem value="POWER_OF_ATTORNEY">Power of Attorney</MenuItem>
                  <MenuItem value="MANDATE_LETTER">Mandate Letter</MenuItem>
                  <MenuItem value="COMPANIES_OFFICE_RECORD">Companies Office Record</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>PEP Status</InputLabel>
                <Select
                  value={paForm.pepStatus}
                  label="PEP Status"
                  onChange={(e) => setPaForm({ ...paForm, pepStatus: e.target.value as PEPStatus })}
                >
                  <MenuItem value="NOT_PEP">Not a PEP</MenuItem>
                  <MenuItem value="DOMESTIC_PEP">Domestic PEP</MenuItem>
                  <MenuItem value="FOREIGN_PEP">Foreign PEP</MenuItem>
                  <MenuItem value="INTERNATIONAL_ORG_PEP">International Organisation PEP</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPADialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSavePA}
            disabled={!paForm.fullName || !paForm.dateOfBirth || !paForm.roleTitle}
          >
            {editingPAIndex !== null ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  // Render Step 4: Risk Assessment
  const renderStep4_RiskAssessment = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Step 5 of 7: Risk Assessment
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Section 58, AML/CFT Act 2009:</strong> Reporting entities must assess the risk of money laundering
          and terrorism financing.
        </Typography>
      </Alert>

      {riskAssessment && (
        <>
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Overall Risk Rating:
              </Typography>
              <Chip
                label={riskAssessment.rating}
                color={getRiskColor(riskAssessment.rating) as any}
                sx={{ fontWeight: 600, fontSize: '1rem' }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Risk Score: {riskAssessment.score}/100
              </Typography>
              <LinearProgress
                variant="determinate"
                value={riskAssessment.score}
                color={getRiskColor(riskAssessment.rating) as any}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 4, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 16, bgcolor: 'success.main', borderRadius: 1 }} />
                <Typography variant="body2">Low (0-39)</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 16, bgcolor: 'warning.main', borderRadius: 1 }} />
                <Typography variant="body2">Medium (40-69)</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 16, bgcolor: 'error.main', borderRadius: 1 }} />
                <Typography variant="body2">High (70+)</Typography>
              </Box>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Risk Factor Breakdown
            </Typography>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell>Factor</TableCell>
                    <TableCell align="right">Points</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {riskAssessment.factors.map((factor, index) => (
                    <TableRow key={index}>
                      <TableCell>{factor.category}</TableCell>
                      <TableCell>{factor.description}</TableCell>
                      <TableCell align="right">{factor.points}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={2}><strong>Total</strong></TableCell>
                    <TableCell align="right"><strong>{riskAssessment.score}</strong></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  );

  // Render Step 5: Documents
  const renderStep5_Documents = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Step 6 of 7: Document Upload
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Upload all required documents to support the CDD application. Documents will be securely stored and encrypted.
        </Typography>
      </Alert>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Required Documents
        </Typography>

        <List>
          {requiredDocuments.map((docType, index) => {
            const uploadedDoc = documents.find(d => d.documentType === docType);
            return (
              <ListItem key={index} divider={index < requiredDocuments.length - 1}>
                <ListItemIcon>
                  {uploadedDoc ? (
                    <CheckIcon color="success" />
                  ) : (
                    <DescriptionIcon color="action" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={docType}
                  secondary={uploadedDoc ? uploadedDoc.file.name : 'Not uploaded'}
                />
                <ListItemSecondaryAction>
                  {uploadedDoc ? (
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveDocument(uploadedDoc.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  ) : (
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<UploadIcon />}
                      size="small"
                    >
                      Upload
                      <input
                        type="file"
                        hidden
                        onChange={(e) => handleFileUpload(e, docType)}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      />
                    </Button>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
        </List>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Beneficial Owner ID Documents
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Upload identity documents for each beneficial owner (passport, driver's license, or national ID).
        </Typography>

        {beneficialOwners.map((bo, index) => {
          const boDocType = `BO_ID_${index}`;
          const uploadedDoc = documents.find(d => d.documentType === boDocType);
          return (
            <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {uploadedDoc ? (
                    <CheckIcon color="success" />
                  ) : (
                    <PersonIcon color="action" />
                  )}
                  <Box>
                    <Typography variant="subtitle2">{bo.fullName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {uploadedDoc ? uploadedDoc.file.name : 'ID document required'}
                    </Typography>
                  </Box>
                </Box>
                {uploadedDoc ? (
                  <IconButton onClick={() => handleRemoveDocument(uploadedDoc.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                ) : (
                  <Button
                    variant="outlined"
                    component="label"
                    size="small"
                    startIcon={<UploadIcon />}
                  >
                    Upload
                    <input
                      type="file"
                      hidden
                      onChange={(e) => handleFileUpload(e, boDocType)}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                  </Button>
                )}
              </Box>
            </Paper>
          );
        })}
      </Paper>
    </Box>
  );

  // Render Step 6: Review & Submit
  const renderStep6_Review = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Step 7 of 7: Review & Submit
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Review all information before submitting. Once submitted, the application will be sent for approval.
      </Alert>

      {/* Entity Summary */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessIcon color="primary" />
            <Typography fontWeight={600}>Entity Details</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {selectedEntity && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" color="text.secondary">Legal Name</Typography>
                <Typography variant="body1">{selectedEntity.legalName}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" color="text.secondary">Entity Type</Typography>
                <Typography variant="body1">{selectedEntity.entityType}</Typography>
              </Grid>
              {selectedEntity.nzbn && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="body2" color="text.secondary">NZBN</Typography>
                  <Typography variant="body1">{selectedEntity.nzbn}</Typography>
                </Grid>
              )}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" color="text.secondary">Country</Typography>
                <Typography variant="body1">{selectedEntity.countryOfIncorporation}</Typography>
              </Grid>
            </Grid>
          )}
        </AccordionDetails>
      </Accordion>

      {/* CDD Level */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GavelIcon color="primary" />
            <Typography fontWeight={600}>CDD Level & Risk Assessment</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body2" color="text.secondary">CDD Level</Typography>
              <Chip
                label={cddDetermination?.level || 'Not determined'}
                color={getCDDLevelColor(cddDetermination?.level || 'STANDARD') as any}
                sx={{ mt: 0.5 }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body2" color="text.secondary">Risk Rating</Typography>
              <Chip
                label={riskAssessment?.rating || 'Not assessed'}
                color={getRiskColor(riskAssessment?.rating || 'LOW') as any}
                sx={{ mt: 0.5 }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="body2" color="text.secondary">Risk Score</Typography>
              <Typography variant="body1">{riskAssessment?.score || 0}/100</Typography>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Beneficial Owners */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon color="primary" />
            <Typography fontWeight={600}>Beneficial Owners ({beneficialOwners.length})</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {beneficialOwners.map((bo, index) => (
            <Paper key={index} variant="outlined" sx={{ p: 2, mb: 1 }}>
              <Typography variant="subtitle2">{bo.fullName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {bo.ownershipPercentage}% ownership | {bo.ownershipBasis.join(', ')}
              </Typography>
            </Paper>
          ))}
          {beneficialOwners.length === 0 && (
            <Typography variant="body2" color="text.secondary">No beneficial owners added</Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Persons Acting */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VerifiedUserIcon color="primary" />
            <Typography fontWeight={600}>Persons Acting on Behalf ({personsActing.length})</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {personsActing.map((pa, index) => (
            <Paper key={index} variant="outlined" sx={{ p: 2, mb: 1 }}>
              <Typography variant="subtitle2">{pa.fullName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {pa.roleTitle} | Authority: {pa.authorityDocumentType || 'Not specified'}
              </Typography>
            </Paper>
          ))}
          {personsActing.length === 0 && (
            <Typography variant="body2" color="text.secondary">No persons acting on behalf added</Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Documents */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DescriptionIcon color="primary" />
            <Typography fontWeight={600}>Documents ({documents.length})</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {documents.length > 0 ? (
            <List dense>
              {documents.map((doc) => (
                <ListItem key={doc.id}>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={doc.documentType}
                    secondary={doc.file.name}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">No documents uploaded</Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Compliance Checklist */}
      <Paper variant="outlined" sx={{ p: 3, mt: 3, bgcolor: 'background.default' }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          AML/CFT Compliance Checklist
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              {selectedEntity ? <CheckIcon color="success" /> : <CancelIcon color="error" />}
            </ListItemIcon>
            <ListItemText primary="Entity identification (Section 14)" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              {beneficialOwners.length > 0 ? <CheckIcon color="success" /> : <WarningIcon color="warning" />}
            </ListItemIcon>
            <ListItemText primary="Beneficial ownership (Section 15)" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              {personsActing.length > 0 ? <CheckIcon color="success" /> : <WarningIcon color="warning" />}
            </ListItemIcon>
            <ListItemText primary="Persons acting on behalf (Section 11)" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              {riskAssessment ? <CheckIcon color="success" /> : <CancelIcon color="error" />}
            </ListItemIcon>
            <ListItemText primary="Risk assessment (Section 58)" />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderStep0_EntityIdentification();
      case 1:
        return renderStep1_CDDDetermination();
      case 2:
        return renderStep2_BeneficialOwnership();
      case 3:
        return renderStep3_PersonsActing();
      case 4:
        return renderStep4_RiskAssessment();
      case 5:
        return renderStep5_Documents();
      case 6:
        return renderStep6_Review();
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
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmitApplication}
                disabled={isSaving}
              >
                {isSaving ? <CircularProgress size={24} /> : 'Submit for Approval'}
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default NewApplicationPage;
