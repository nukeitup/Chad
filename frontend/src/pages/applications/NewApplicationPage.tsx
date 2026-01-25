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
  Slider,
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
  AccountBalance as AccountBalanceIcon,
  Description as DescriptionIcon,
  Gavel as GavelIcon,
  VerifiedUser as VerifiedUserIcon,
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import api, { applicationsApi, referenceApi } from '../../services/api';
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

interface Product {
  code: string;
  name: string;
  description: string;
  riskWeight: number;
  selected: boolean;
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

  // Nature & Purpose state
  const [naturePurpose, setNaturePurpose] = useState({
    relationshipPurpose: '',
    primaryBusinessActivity: '',
    expectedTransactionTypes: [] as string[],
    geographicFocus: [] as string[],
    sourceOfFunds: '',
    sourceOfWealth: '',
  });

  // Products & Volumes state
  const [products, setProducts] = useState<Product[]>([
    { code: 'TRANSACTION_ACCOUNT', name: 'Transaction Account', description: 'Business current account', riskWeight: 5, selected: false },
    { code: 'SAVINGS_ACCOUNT', name: 'Savings Account', description: 'Business savings account', riskWeight: 3, selected: false },
    { code: 'TERM_DEPOSIT', name: 'Term Deposit', description: 'Fixed-term deposit', riskWeight: 3, selected: false },
    { code: 'BUSINESS_LOAN', name: 'Business Loan', description: 'Commercial lending', riskWeight: 10, selected: false },
    { code: 'OVERDRAFT', name: 'Overdraft Facility', description: 'Overdraft on account', riskWeight: 8, selected: false },
    { code: 'FOREIGN_EXCHANGE', name: 'Foreign Exchange', description: 'Currency exchange services', riskWeight: 15, selected: false },
    { code: 'TRADE_FINANCE', name: 'Trade Finance', description: 'Letters of credit, trade facilities', riskWeight: 20, selected: false },
    { code: 'MERCHANT_SERVICES', name: 'Merchant Services', description: 'Payment processing', riskWeight: 12, selected: false },
  ]);
  const [anticipatedVolumes, setAnticipatedVolumes] = useState({
    monthlyTransactionCount: 0,
    monthlyTransactionValue: 0,
    largestSingleTransaction: 0,
    internationalTransactions: false,
    internationalCountries: [] as string[],
  });

  // Risk Assessment state
  const [riskAssessment, setRiskAssessment] = useState<{
    rating: RiskRating;
    score: number;
    factors: { category: string; description: string; points: number }[];
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

  // Calculate risk assessment
  const calculateRiskAssessment = () => {
    const factors: { category: string; description: string; points: number }[] = [];
    let totalScore = 0;

    // Entity risk factors
    if (selectedEntity?.entityType === 'TRUST') {
      factors.push({ category: 'Entity', description: 'Entity type: Trust (higher risk)', points: 15 });
      totalScore += 15;
    } else if (selectedEntity?.entityType === 'FOUNDATION') {
      factors.push({ category: 'Entity', description: 'Entity type: Foundation', points: 10 });
      totalScore += 10;
    } else {
      factors.push({ category: 'Entity', description: 'Entity type: Standard company', points: 5 });
      totalScore += 5;
    }

    // Beneficial owner risk factors
    const hasPEP = beneficialOwners.some(bo => bo.pepStatus !== 'NOT_PEP');
    if (hasPEP) {
      factors.push({ category: 'Beneficial Owners', description: 'PEP involvement detected', points: 20 });
      totalScore += 20;
    }

    const hasNominee = beneficialOwners.some(bo => bo.isNominee);
    if (hasNominee) {
      factors.push({ category: 'Beneficial Owners', description: 'Nominee arrangements present', points: 15 });
      totalScore += 15;
    }

    // Product risk factors
    const selectedProducts = products.filter(p => p.selected);
    const productRisk = selectedProducts.reduce((sum, p) => sum + p.riskWeight, 0);
    if (productRisk > 30) {
      factors.push({ category: 'Products', description: 'High-risk products selected', points: 15 });
      totalScore += 15;
    } else if (productRisk > 15) {
      factors.push({ category: 'Products', description: 'Moderate-risk products selected', points: 8 });
      totalScore += 8;
    } else {
      factors.push({ category: 'Products', description: 'Low-risk products selected', points: 3 });
      totalScore += 3;
    }

    // Transaction value risk
    if (anticipatedVolumes.monthlyTransactionValue > 1000000) {
      factors.push({ category: 'Transaction Volume', description: 'High monthly value (>$1M NZD)', points: 15 });
      totalScore += 15;
    } else if (anticipatedVolumes.monthlyTransactionValue > 500000) {
      factors.push({ category: 'Transaction Volume', description: 'Elevated monthly value ($500K-$1M NZD)', points: 10 });
      totalScore += 10;
    } else {
      factors.push({ category: 'Transaction Volume', description: 'Standard monthly value', points: 5 });
      totalScore += 5;
    }

    // International transactions
    if (anticipatedVolumes.internationalTransactions) {
      factors.push({ category: 'Geographic', description: 'International transactions expected', points: 10 });
      totalScore += 10;
    }

    // Determine rating
    let rating: RiskRating = 'LOW';
    if (totalScore >= 70) {
      rating = 'HIGH';
    } else if (totalScore >= 40) {
      rating = 'MEDIUM';
    }

    setRiskAssessment({ rating, score: totalScore, factors });
  };

  // Run risk calculation when relevant data changes
  useEffect(() => {
    if (activeStep >= 6 && selectedEntity) {
      calculateRiskAssessment();
    }
  }, [activeStep, beneficialOwners, products, anticipatedVolumes]);

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

        // Update with additional data
        await applicationsApi.update(appId, {
          naturePurposeRelationship: naturePurpose.relationshipPurpose,
          sourceOfFunds: naturePurpose.sourceOfFunds,
          sourceOfWealth: naturePurpose.sourceOfWealth,
          productsRequested: products.filter(p => p.selected).map(p => p.code),
          anticipatedMonthlyVolume: anticipatedVolumes.monthlyTransactionCount,
          anticipatedMonthlyValue: anticipatedVolumes.monthlyTransactionValue,
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

  // Render Step 1: CDD Determination
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

  // Render Step 2: Beneficial Ownership
  const renderStep2_BeneficialOwnership = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Step 3 of 9: Beneficial Ownership
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
        Step 4 of 9: Persons Acting on Behalf
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

  // Render Step 4: Nature & Purpose
  const renderStep4_NaturePurpose = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Step 5 of 9: Nature & Purpose of Business Relationship
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Section 16, AML/CFT Act 2009:</strong> You must obtain information on the nature and purpose of
          the proposed business relationship.
        </Typography>
      </Alert>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Purpose of Business Relationship"
              value={naturePurpose.relationshipPurpose}
              onChange={(e) => setNaturePurpose({ ...naturePurpose, relationshipPurpose: e.target.value })}
              placeholder="Describe why the customer requires banking services..."
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Primary Business Activity"
              value={naturePurpose.primaryBusinessActivity}
              onChange={(e) => setNaturePurpose({ ...naturePurpose, primaryBusinessActivity: e.target.value })}
              placeholder="Describe the customer's main business activities..."
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" gutterBottom>
              Expected Transaction Types
            </Typography>
            <FormGroup row>
              {['Domestic Payments', 'International Payments', 'Cash Deposits', 'Cash Withdrawals', 'Direct Debits', 'Payroll'].map((type) => (
                <FormControlLabel
                  key={type}
                  control={
                    <Checkbox
                      checked={naturePurpose.expectedTransactionTypes.includes(type)}
                      onChange={(e) => {
                        const types = e.target.checked
                          ? [...naturePurpose.expectedTransactionTypes, type]
                          : naturePurpose.expectedTransactionTypes.filter(t => t !== type);
                        setNaturePurpose({ ...naturePurpose, expectedTransactionTypes: types });
                      }}
                    />
                  }
                  label={type}
                />
              ))}
            </FormGroup>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" gutterBottom>
              Geographic Focus
            </Typography>
            <FormGroup row>
              {['New Zealand', 'Australia', 'Asia Pacific', 'Europe', 'North America', 'Other'].map((region) => (
                <FormControlLabel
                  key={region}
                  control={
                    <Checkbox
                      checked={naturePurpose.geographicFocus.includes(region)}
                      onChange={(e) => {
                        const regions = e.target.checked
                          ? [...naturePurpose.geographicFocus, region]
                          : naturePurpose.geographicFocus.filter(r => r !== region);
                        setNaturePurpose({ ...naturePurpose, geographicFocus: regions });
                      }}
                    />
                  }
                  label={region}
                />
              ))}
            </FormGroup>
          </Grid>

          {cddDetermination?.level === 'ENHANCED' && (
            <>
              <Grid size={{ xs: 12 }}>
                <Divider />
                <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2, mb: 1 }}>
                  Enhanced CDD Requirements
                </Typography>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Source of Wealth and Source of Funds information is required for Enhanced CDD applications.
                </Alert>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Source of Wealth"
                  value={naturePurpose.sourceOfWealth}
                  onChange={(e) => setNaturePurpose({ ...naturePurpose, sourceOfWealth: e.target.value })}
                  placeholder="Describe the origin of the customer's overall wealth (e.g., business profits, inheritance, investments)..."
                  required
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Source of Funds"
                  value={naturePurpose.sourceOfFunds}
                  onChange={(e) => setNaturePurpose({ ...naturePurpose, sourceOfFunds: e.target.value })}
                  placeholder="Describe the origin of the specific funds for transactions (e.g., business revenue, loan proceeds)..."
                  required
                />
              </Grid>
            </>
          )}
        </Grid>
      </Paper>
    </Box>
  );

  // Render Step 5: Products & Volumes
  const renderStep5_ProductsVolumes = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Step 6 of 9: Products & Expected Transaction Volumes
      </Typography>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Products Requested
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select the banking products the customer requires:
        </Typography>

        <Grid container spacing={2}>
          {products.map((product, index) => (
            <Grid size={{ xs: 12, md: 6 }} key={product.code}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  bgcolor: product.selected ? 'primary.light' : 'transparent',
                  borderColor: product.selected ? 'primary.main' : 'divider',
                  '&:hover': { borderColor: 'primary.main' },
                }}
                onClick={() => {
                  const updated = [...products];
                  updated[index].selected = !updated[index].selected;
                  setProducts(updated);
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {product.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {product.description}
                    </Typography>
                  </Box>
                  <Checkbox checked={product.selected} />
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Anticipated Transaction Volumes
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" gutterBottom>
              Monthly Transaction Count: {anticipatedVolumes.monthlyTransactionCount.toLocaleString()}
            </Typography>
            <Slider
              value={anticipatedVolumes.monthlyTransactionCount}
              onChange={(_, value) => setAnticipatedVolumes({ ...anticipatedVolumes, monthlyTransactionCount: value as number })}
              min={0}
              max={10000}
              step={100}
              marks={[
                { value: 0, label: '0' },
                { value: 2500, label: '2.5K' },
                { value: 5000, label: '5K' },
                { value: 7500, label: '7.5K' },
                { value: 10000, label: '10K' },
              ]}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" gutterBottom>
              Monthly Transaction Value: ${anticipatedVolumes.monthlyTransactionValue.toLocaleString()} NZD
            </Typography>
            <Slider
              value={anticipatedVolumes.monthlyTransactionValue}
              onChange={(_, value) => setAnticipatedVolumes({ ...anticipatedVolumes, monthlyTransactionValue: value as number })}
              min={0}
              max={5000000}
              step={50000}
              marks={[
                { value: 0, label: '$0' },
                { value: 1000000, label: '$1M' },
                { value: 2500000, label: '$2.5M' },
                { value: 5000000, label: '$5M' },
              ]}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Largest Single Transaction (NZD)"
              type="number"
              value={anticipatedVolumes.largestSingleTransaction}
              onChange={(e) => setAnticipatedVolumes({ ...anticipatedVolumes, largestSingleTransaction: Number(e.target.value) })}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={anticipatedVolumes.internationalTransactions}
                  onChange={(e) => setAnticipatedVolumes({ ...anticipatedVolumes, internationalTransactions: e.target.checked })}
                />
              }
              label="Customer expects to make international transactions"
            />
          </Grid>

          {anticipatedVolumes.internationalTransactions && (
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Countries for International Transactions"
                placeholder="e.g., Australia, United States, United Kingdom"
                value={anticipatedVolumes.internationalCountries.join(', ')}
                onChange={(e) => setAnticipatedVolumes({
                  ...anticipatedVolumes,
                  internationalCountries: e.target.value.split(',').map(c => c.trim()).filter(c => c)
                })}
                helperText="Separate countries with commas"
              />
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );

  // Render Step 6: Risk Assessment
  const renderStep6_RiskAssessment = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Step 7 of 9: Risk Assessment
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

  // Render Step 7: Documents
  const renderStep7_Documents = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Step 8 of 9: Document Upload
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

  // Render Step 8: Review & Submit
  const renderStep8_Review = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Step 9 of 9: Review & Submit
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

      {/* Products */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceIcon color="primary" />
            <Typography fontWeight={600}>Products & Volumes</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="body2" color="text.secondary">Products Selected</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                {products.filter(p => p.selected).map(p => (
                  <Chip key={p.code} label={p.name} size="small" />
                ))}
                {products.filter(p => p.selected).length === 0 && (
                  <Typography variant="body2" color="text.secondary">No products selected</Typography>
                )}
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body2" color="text.secondary">Monthly Transaction Count</Typography>
              <Typography variant="body1">{anticipatedVolumes.monthlyTransactionCount.toLocaleString()}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body2" color="text.secondary">Monthly Transaction Value</Typography>
              <Typography variant="body1">${anticipatedVolumes.monthlyTransactionValue.toLocaleString()} NZD</Typography>
            </Grid>
          </Grid>
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
              {naturePurpose.relationshipPurpose ? <CheckIcon color="success" /> : <WarningIcon color="warning" />}
            </ListItemIcon>
            <ListItemText primary="Nature and purpose (Section 16)" />
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
        return renderStep4_NaturePurpose();
      case 5:
        return renderStep5_ProductsVolumes();
      case 6:
        return renderStep6_RiskAssessment();
      case 7:
        return renderStep7_Documents();
      case 8:
        return renderStep8_Review();
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
