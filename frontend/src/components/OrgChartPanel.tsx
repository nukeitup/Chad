import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import PublicIcon from '@mui/icons-material/Public';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OrgChartShareholder {
  name: string;
  type: 'Individual' | 'Company';
  percentage: number;
  country?: string;
  shareholders?: OrgChartShareholder[]; // recursive for multi-level trees
}

export interface OrgChartPanelProps {
  entityName: string;
  entityCountry?: string;
  shareholders: OrgChartShareholder[];
  loading?: boolean;
  error?: string | null;
}

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const NODE_MIN_WIDTH = 180;
const NODE_GAP = 28;
const LINE_H = 30;
const LINE_COLOR = '#90a4ae';

// ---------------------------------------------------------------------------
// Node colours
// ---------------------------------------------------------------------------

const nodeColor = (
  type: string,
  country: string | undefined,
  isMain: boolean
): { bg: string; icon: React.ReactNode } => {
  if (isMain)
    return { bg: '#1a3a5c', icon: <BusinessIcon sx={{ fontSize: 18 }} /> };
  if (type === 'Individual')
    return { bg: '#388e3c', icon: <PersonIcon sx={{ fontSize: 18 }} /> };
  const isNZ =
    !country || country === 'NZ' || country.toLowerCase().includes('new zealand');
  if (isNZ)
    return { bg: '#1565c0', icon: <BusinessIcon sx={{ fontSize: 18 }} /> };
  return { bg: '#e65100', icon: <PublicIcon sx={{ fontSize: 18 }} /> };
};

// ---------------------------------------------------------------------------
// Single node card
// ---------------------------------------------------------------------------

const NodeCard: React.FC<{
  name: string;
  type: string;
  percentage?: number;
  country?: string;
  isMain?: boolean;
}> = ({ name, type, percentage, country, isMain }) => {
  const { bg, icon } = nodeColor(type, country, !!isMain);

  return (
    <Paper
      elevation={isMain ? 6 : 3}
      sx={{
        minWidth: NODE_MIN_WIDTH,
        maxWidth: NODE_MIN_WIDTH + 40,
        p: 1.5,
        textAlign: 'center',
        bgcolor: bg,
        color: 'white',
        border: isMain ? '3px solid #90caf9' : 'none',
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>
        {icon}
      </Box>
      <Typography
        variant="caption"
        fontWeight="bold"
        sx={{ display: 'block', lineHeight: 1.3, wordBreak: 'break-word' }}
      >
        {name}
      </Typography>
      {percentage !== undefined && (
        <Chip
          label={`${percentage.toFixed(1)}%`}
          size="small"
          sx={{
            mt: 0.75,
            bgcolor: 'rgba(255,255,255,0.2)',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.7rem',
          }}
        />
      )}
      {!isMain && (
        <Typography
          variant="caption"
          display="block"
          sx={{ opacity: 0.75, mt: 0.25, fontSize: '0.65rem' }}
        >
          {type}
          {country && country !== 'NZ' && country !== 'New Zealand'
            ? ` · ${country}`
            : ''}
        </Typography>
      )}
    </Paper>
  );
};

// ---------------------------------------------------------------------------
// Vertical line helper
// ---------------------------------------------------------------------------

const VLine: React.FC = () => (
  <Box sx={{ width: 2, height: LINE_H, bgcolor: LINE_COLOR, mx: 'auto' }} />
);

// ---------------------------------------------------------------------------
// Horizontal connector spanning from centre of first to centre of last child
// mx: NODE_MIN_WIDTH/2 offsets from each side so the bar runs centre-to-centre
// ---------------------------------------------------------------------------

const HBar: React.FC = () => (
  <Box
    sx={{
      height: 2,
      bgcolor: LINE_COLOR,
      alignSelf: 'stretch',
      mx: `${NODE_MIN_WIDTH / 2}px`,
      mt: '-1px',
    }}
  />
);

// ---------------------------------------------------------------------------
// Recursive shareholder node renderer
// Renders children ABOVE, then this node BELOW.
// ---------------------------------------------------------------------------

const ShareholderNode: React.FC<{ node: OrgChartShareholder }> = ({ node }) => {
  const hasChildren = node.shareholders && node.shareholders.length > 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Shareholders of this node — rendered ABOVE */}
      {hasChildren && (
        <Box
          sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: `${NODE_GAP}px`,
              alignItems: 'flex-end',
            }}
          >
            {node.shareholders!.map((child, i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <ShareholderNode node={child} />
                <VLine />
              </Box>
            ))}
          </Box>
          {node.shareholders!.length > 1 && <HBar />}
          <VLine />
        </Box>
      )}

      {/* This node */}
      <NodeCard
        name={node.name}
        type={node.type}
        percentage={node.percentage}
        country={node.country}
      />
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Legend
// ---------------------------------------------------------------------------

const Legend: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      gap: 2,
      flexWrap: 'wrap',
      justifyContent: 'center',
      mt: 3,
      pt: 2,
      borderTop: '1px solid',
      borderColor: 'divider',
    }}
  >
    {[
      { bg: '#1a3a5c', label: 'Main Entity' },
      { bg: '#1565c0', label: 'NZ Company' },
      { bg: '#e65100', label: 'Overseas Company' },
      { bg: '#388e3c', label: 'Individual' },
    ].map(({ bg, label }) => (
      <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Box
          sx={{
            width: 14,
            height: 14,
            borderRadius: 0.5,
            bgcolor: bg,
          }}
        />
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </Box>
    ))}
  </Box>
);

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

const OrgChartPanel: React.FC<OrgChartPanelProps> = ({
  entityName,
  entityCountry,
  shareholders,
  loading,
  error,
}) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 1 }}>
        {error}
      </Alert>
    );
  }

  const hasShareholders = shareholders.length > 0;

  return (
    <Box
      sx={{
        overflowX: 'auto',
        overflowY: 'visible',
        py: 3,
        px: 2,
        minHeight: 200,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minWidth: 'fit-content',
          mx: 'auto',
        }}
      >
        {/* Shareholders row + connectors — ABOVE the main entity */}
        {hasShareholders && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                gap: `${NODE_GAP}px`,
                alignItems: 'flex-end',
              }}
            >
              {shareholders.map((sh, i) => (
                <Box
                  key={i}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <ShareholderNode node={sh} />
                  <VLine />
                </Box>
              ))}
            </Box>
            {shareholders.length > 1 && <HBar />}
            <VLine />
          </Box>
        )}

        {/* Main entity — at the BOTTOM */}
        <NodeCard
          name={entityName}
          type="Entity"
          country={entityCountry}
          isMain
        />

        {!hasShareholders && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            No shareholder data available.
          </Typography>
        )}
      </Box>

      <Legend />
    </Box>
  );
};

export default OrgChartPanel;
