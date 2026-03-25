import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Gavel as GavelIcon,
  AccountTree as AccountTreeIcon,
  Shield as ShieldIcon,
  Storage as StorageIcon,
  CloudQueue as CloudIcon,
  Lock as LockIcon,
  VerifiedUser as VerifiedUserIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  Search as SearchIcon,
  Rule as RuleIcon,
  Api as ApiIcon,
} from '@mui/icons-material';

const AboutPage: React.FC = () => {
  const workflowSteps = [
    {
      label: 'Entity Identification',
      description: 'Search NZBN registry or manually enter overseas entity details. System auto-populates company data, directors, and shareholders.',
    },
    {
      label: 'CDD Level Determination',
      description: 'Automated assessment determines Simplified, Standard, or Enhanced CDD based on entity type, ownership structure, and risk factors.',
    },
    {
      label: 'Beneficial Ownership',
      description: 'Identify all beneficial owners (>25% ownership or effective control). System screens against PEP and sanctions lists.',
    },
    {
      label: 'Risk Assessment',
      description: 'Automated risk scoring based on entity, geographic, product, transaction, and beneficial owner factors.',
    },
    {
      label: 'Documentation',
      description: 'Upload and verify required documents. System generates compliance checklist with legislative references.',
    },
    {
      label: 'Approval Workflow',
      description: 'Submit for approval. Team Managers review standard cases; Compliance Officers handle enhanced/high-risk cases.',
    },
  ];

  const cddLevels = [
    {
      level: 'Simplified CDD',
      color: '#4caf50',
      section: 'Section 18',
      criteria: [
        'NZX Listed Companies',
        'NZ Government Departments',
        'NZ Local Authorities',
        'NZ State Enterprises',
        'Overseas Government Bodies (FATF members)',
      ],
      requirements: ['Confirm entity status', 'Document basis for simplified CDD'],
    },
    {
      level: 'Standard CDD',
      color: '#2196f3',
      section: 'Sections 14-17',
      criteria: [
        'All entities not qualifying for Simplified CDD',
        'No Enhanced CDD triggers present',
      ],
      requirements: [
        'Verify entity identity',
        'Identify beneficial owners (>25%)',
        'Verify beneficial owner identities',
        'Obtain nature & purpose of relationship',
        'Conduct risk assessment',
      ],
    },
    {
      level: 'Enhanced CDD',
      color: '#f44336',
      section: 'Section 22',
      criteria: [
        'FATF high-risk jurisdictions',
        'Complex ownership (>3 layers)',
        'PEP involvement',
        'Nominee arrangements',
        'Trust structures',
        'Bearer shares',
      ],
      requirements: [
        'All Standard CDD requirements PLUS:',
        'Source of Wealth documentation',
        'Source of Funds verification',
        'Enhanced verification procedures',
        'Senior Management approval',
        'Enhanced ongoing monitoring',
      ],
    },
  ];

  const riskFactors = [
    { category: 'Entity', factors: ['Entity type (Trust +15pts)', 'Ownership complexity', 'Business age'], maxPoints: 30 },
    { category: 'Geographic', factors: ['Country of incorporation', 'FATF status', 'International operations'], maxPoints: 30 },
    { category: 'Product', factors: ['Foreign exchange (+10pts)', 'Trade finance', 'Cash-intensive'], maxPoints: 20 },
    { category: 'Transaction', factors: ['Monthly value >$1M (+15pts)', 'Volume patterns'], maxPoints: 20 },
    { category: 'Beneficial Owner', factors: ['PEP status (+15pts)', 'Sanctions matches', 'Adverse media'], maxPoints: 20 },
  ];

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)', color: 'white' }}>
        <Typography variant="h3" gutterBottom fontWeight="bold">
          AML/CFT Compliance System
        </Typography>
        <Typography variant="h5" sx={{ opacity: 0.9 }}>
          Entity Onboarding & Customer Due Diligence Platform
        </Typography>
        <Typography variant="body1" sx={{ mt: 2, opacity: 0.8 }}>
          Automated compliance with New Zealand's Anti-Money Laundering and Countering Financing of Terrorism Act 2009
        </Typography>
      </Paper>

      {/* Section 1: How It Works */}
      <Paper sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <AccountTreeIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
          <Typography variant="h4">How It Works</Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          The system automates the Customer Due Diligence (CDD) process for entity onboarding, ensuring full compliance with AML/CFT regulations.
        </Typography>

        <Stepper orientation="vertical">
          {workflowSteps.map((step, index) => (
            <Step key={step.label} active={true}>
              <StepLabel>
                <Typography variant="h6">{step.label}</Typography>
              </StepLabel>
              <StepContent>
                <Typography color="text.secondary">{step.description}</Typography>
                <Box sx={{ mb: 2 }} />
              </StepContent>
            </Step>
          ))}
        </Stepper>

        {/* Visual Workflow Diagram */}
        <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>System Flow</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            {[
              { icon: <SearchIcon />, label: 'NZBN Search' },
              { icon: <BusinessIcon />, label: 'Entity Created' },
              { icon: <RuleIcon />, label: 'CDD Determined' },
              { icon: <PersonIcon />, label: 'BO Identified' },
              { icon: <AssessmentIcon />, label: 'Risk Scored' },
              { icon: <DescriptionIcon />, label: 'Docs Uploaded' },
              { icon: <VerifiedUserIcon />, label: 'Approved' },
            ].map((item, i) => (
              <React.Fragment key={item.label}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 1
                  }}>
                    {item.icon}
                  </Box>
                  <Typography variant="caption">{item.label}</Typography>
                </Box>
                {i < 6 && <Typography sx={{ color: 'primary.main', fontWeight: 'bold' }}>→</Typography>}
              </React.Fragment>
            ))}
          </Box>
        </Box>
      </Paper>

      {/* Section 2: Systems & Security */}
      <Paper sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <SecurityIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
          <Typography variant="h4">Systems & Security Architecture</Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Architecture Diagram */}
          <Grid item xs={12}>
            <Box sx={{ p: 3, bgcolor: 'grey.900', borderRadius: 2, color: 'white' }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.light' }}>
                Technical Architecture
              </Typography>
              <Grid container spacing={2}>
                {/* Frontend */}
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}>
                    <Typography variant="subtitle2" sx={{ color: 'info.light' }}>PRESENTATION LAYER</Typography>
                    <Divider sx={{ my: 1, bgcolor: 'rgba(255,255,255,0.2)' }} />
                    <Typography variant="body2">• React 19 + TypeScript</Typography>
                    <Typography variant="body2">• Material-UI Components</Typography>
                    <Typography variant="body2">• Redux State Management</Typography>
                    <Typography variant="body2">• React Hook Form + Zod</Typography>
                  </Paper>
                </Grid>
                {/* Backend */}
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}>
                    <Typography variant="subtitle2" sx={{ color: 'success.light' }}>APPLICATION LAYER</Typography>
                    <Divider sx={{ my: 1, bgcolor: 'rgba(255,255,255,0.2)' }} />
                    <Typography variant="body2">• Node.js + Express</Typography>
                    <Typography variant="body2">• CDD Determination Engine</Typography>
                    <Typography variant="body2">• Risk Assessment Engine</Typography>
                    <Typography variant="body2">• Workflow Manager</Typography>
                  </Paper>
                </Grid>
                {/* Data */}
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}>
                    <Typography variant="subtitle2" sx={{ color: 'warning.light' }}>DATA LAYER</Typography>
                    <Divider sx={{ my: 1, bgcolor: 'rgba(255,255,255,0.2)' }} />
                    <Typography variant="body2">• PostgreSQL (Neon)</Typography>
                    <Typography variant="body2">• Prisma ORM</Typography>
                    <Typography variant="body2">• Encrypted at Rest</Typography>
                    <Typography variant="body2">• Audit Trail Logging</Typography>
                  </Paper>
                </Grid>
                {/* Infrastructure */}
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}>
                    <Typography variant="subtitle2" sx={{ color: 'error.light' }}>INFRASTRUCTURE LAYER</Typography>
                    <Divider sx={{ my: 1, bgcolor: 'rgba(255,255,255,0.2)' }} />
                    <Typography variant="body2">• Vercel Edge Network</Typography>
                    <Typography variant="body2">• Serverless Functions</Typography>
                    <Typography variant="body2">• Automatic HTTPS / TLS</Typography>
                    <Typography variant="body2">• Zero-trust secret storage</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* Security Features */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ShieldIcon sx={{ color: 'success.main', mr: 1 }} />
                  <Typography variant="h6">Security Features</Typography>
                </Box>
                <List dense>
                  {[
                    { icon: <LockIcon />, text: 'JWT Authentication with secure token handling' },
                    { icon: <VerifiedUserIcon />, text: 'Role-Based Access Control (RBAC)' },
                    { icon: <SecurityIcon />, text: 'TLS 1.3 encryption in transit (enforced by Vercel)' },
                    { icon: <StorageIcon />, text: 'AES-256 encryption at rest (Neon PostgreSQL)' },
                    { icon: <ApiIcon />, text: 'Rate limiting & request validation' },
                    { icon: <CloudIcon />, text: 'API keys stored as Vercel environment secrets — never exposed in source code or client' },
                    { icon: <ShieldIcon />, text: 'Vercel DDoS protection & edge firewall' },
                    { icon: <LockIcon />, text: 'CORS policy restricts requests to authorised origins only' },
                  ].map((item, i) => (
                    <ListItem key={i}>
                      <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.text} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Integrations */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CloudIcon sx={{ color: 'info.main', mr: 1 }} />
                  <Typography variant="h6">External Integrations</Typography>
                </Box>
                <List dense>
                  {[
                    { text: 'NZBN API (Companies Office)', desc: 'Entity verification & director/shareholder data' },
                    { text: 'PEP/Sanctions Screening', desc: 'Real-time screening against watchlists' },
                    { text: 'FATF Jurisdiction Data', desc: 'High-risk country identification' },
                    { text: 'Core Banking System', desc: 'Customer creation on approval' },
                  ].map((item, i) => (
                    <ListItem key={i}>
                      <ListItemText
                        primary={item.text}
                        secondary={item.desc}
                        primaryTypographyProps={{ fontWeight: 'medium' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Audit & Compliance */}
          <Grid item xs={12}>
            <Alert severity="info" icon={<GavelIcon />}>
              <Typography variant="subtitle2">Comprehensive Audit Trail</Typography>
              <Typography variant="body2">
                Every action is logged with user ID, timestamp, IP address, and before/after values.
                Audit logs are retained for 7 years per AML/CFT Act requirements (Section 49).
              </Typography>
            </Alert>
          </Grid>
        </Grid>
      </Paper>

      {/* Section 3: AML/CFT Mapping Logic */}
      <Paper sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <GavelIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
          <Typography variant="h4">AML/CFT Legislative Mapping</Typography>
        </Box>

        <Alert severity="warning" sx={{ mb: 4 }}>
          <Typography variant="subtitle2">Regulatory Framework</Typography>
          <Typography variant="body2">
            This system implements requirements from the Anti-Money Laundering and Countering Financing of Terrorism Act 2009,
            AML/CFT Regulations 2011, AIVCOP 2013, and RBNZ Guidelines (April 2024).
          </Typography>
        </Alert>

        {/* CDD Levels */}
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          CDD Level Determination
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {cddLevels.map((cdd) => (
            <Grid item xs={12} md={4} key={cdd.level}>
              <Card sx={{ height: '100%', borderTop: `4px solid ${cdd.color}` }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Chip
                      label={cdd.section}
                      size="small"
                      sx={{ bgcolor: cdd.color, color: 'white', mr: 1 }}
                    />
                    <Typography variant="h6">{cdd.level}</Typography>
                  </Box>

                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Eligibility Criteria:
                  </Typography>
                  <List dense>
                    {cdd.criteria.map((c, i) => (
                      <ListItem key={i} sx={{ py: 0 }}>
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <CheckCircleIcon sx={{ fontSize: 16, color: cdd.color }} />
                        </ListItemIcon>
                        <ListItemText primary={c} primaryTypographyProps={{ variant: 'body2' }} />
                      </ListItem>
                    ))}
                  </List>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Requirements:
                  </Typography>
                  <List dense>
                    {cdd.requirements.map((r, i) => (
                      <ListItem key={i} sx={{ py: 0 }}>
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <DescriptionIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        </ListItemIcon>
                        <ListItemText primary={r} primaryTypographyProps={{ variant: 'body2' }} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Risk Rating */}
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          Risk Rating Methodology
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Per Section 58, AML/CFT Act 2009 - Risk-based approach to customer due diligence
        </Typography>

        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell><strong>Risk Category</strong></TableCell>
                <TableCell><strong>Factors Assessed</strong></TableCell>
                <TableCell align="center"><strong>Max Points</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {riskFactors.map((rf) => (
                <TableRow key={rf.category}>
                  <TableCell><Chip label={rf.category} size="small" /></TableCell>
                  <TableCell>{rf.factors.join(', ')}</TableCell>
                  <TableCell align="center">{rf.maxPoints}</TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell colSpan={2}><strong>Total Maximum Score</strong></TableCell>
                <TableCell align="center"><strong>120</strong></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Grid container spacing={2}>
          {[
            { rating: 'LOW', range: '0-39', color: '#4caf50', action: 'Standard procedures, biennial review' },
            { rating: 'MEDIUM', range: '40-69', color: '#ff9800', action: 'Standard procedures, annual review' },
            { rating: 'HIGH', range: '70-99', color: '#f44336', action: 'Enhanced CDD, quarterly review, senior approval' },
            { rating: 'PROHIBITED', range: '100+', color: '#9c27b0', action: 'Account opening prohibited, escalate to Compliance' },
          ].map((r) => (
            <Grid item xs={6} md={3} key={r.rating}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: r.color, color: 'white' }}>
                <Typography variant="h6">{r.rating}</Typography>
                <Typography variant="body2">Score: {r.range}</Typography>
                <Divider sx={{ my: 1, bgcolor: 'rgba(255,255,255,0.3)' }} />
                <Typography variant="caption">{r.action}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Legislative References */}
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          Key Legislative References
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white' }}><strong>Section</strong></TableCell>
                <TableCell sx={{ color: 'white' }}><strong>Requirement</strong></TableCell>
                <TableCell sx={{ color: 'white' }}><strong>System Implementation</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[
                { section: 'Section 11', requirement: 'Conduct CDD', implementation: 'Automated CDD workflow with all required steps' },
                { section: 'Section 14', requirement: 'Verify customer identity', implementation: 'NZBN integration + document verification' },
                { section: 'Section 15', requirement: 'Beneficial ownership', implementation: 'BO identification with >25% threshold detection' },
                { section: 'Section 16', requirement: 'Nature & purpose', implementation: 'Mandatory fields for relationship purpose' },
                { section: 'Section 17', requirement: 'Ongoing CDD', implementation: 'Review triggers based on risk rating' },
                { section: 'Section 18', requirement: 'Simplified CDD', implementation: 'Auto-detection of eligible entity types' },
                { section: 'Section 22', requirement: 'Enhanced CDD', implementation: 'Trigger detection with SoW/SoF requirements' },
                { section: 'Section 49', requirement: 'Record keeping', implementation: '7-year audit trail retention' },
                { section: 'Section 58', requirement: 'Risk assessment', implementation: 'Automated scoring with 5 risk categories' },
                { section: 'AIVCOP 2013', requirement: 'Identity verification', implementation: 'Document type validation per code' },
              ].map((row) => (
                <TableRow key={row.section} hover>
                  <TableCell><Chip label={row.section} size="small" variant="outlined" /></TableCell>
                  <TableCell>{row.requirement}</TableCell>
                  <TableCell>{row.implementation}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Footer */}
      <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.100' }}>
        <Typography variant="body2" color="text.secondary">
          AML/CFT Compliance System v1.0 | Built for Business & Corporate Banking
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Compliant with AML/CFT Act 2009, Regulations 2011, AIVCOP 2013, and RBNZ Guidelines (April 2024)
        </Typography>
      </Paper>
    </Box>
  );
};

export default AboutPage;
