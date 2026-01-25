import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert, Chip } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchApplicationById } from '../../store/slices/applicationSlice';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';

interface TreeNodeData {
  name: string;
  type: 'entity' | 'beneficial_owner';
  ownership?: string;
  basis?: string[];
  children?: TreeNodeData[];
}

// Simple tree visualization component using CSS
const TreeVisualization: React.FC<{ data: TreeNodeData[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return <Typography color="text.secondary">No ownership data to display.</Typography>;
  }

  const renderNode = (node: TreeNodeData, level: number = 0) => (
    <Box
      key={node.name}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      {/* Node */}
      <Paper
        elevation={3}
        sx={{
          p: 2,
          minWidth: 200,
          textAlign: 'center',
          bgcolor: node.type === 'entity' ? 'primary.main' : 'background.paper',
          color: node.type === 'entity' ? 'primary.contrastText' : 'text.primary',
          border: node.type === 'beneficial_owner' ? '2px solid' : 'none',
          borderColor: 'primary.main',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
          {node.type === 'entity' ? <BusinessIcon /> : <PersonIcon />}
          <Typography variant="subtitle1" fontWeight="bold">
            {node.name}
          </Typography>
        </Box>
        {node.ownership && (
          <Chip
            label={node.ownership}
            size="small"
            color="primary"
            variant={node.type === 'entity' ? 'filled' : 'outlined'}
          />
        )}
        {node.basis && node.basis.length > 0 && (
          <Box sx={{ mt: 1 }}>
            {node.basis.map((b, i) => (
              <Typography key={i} variant="caption" display="block" color="text.secondary">
                {b.replace(/_/g, ' ')}
              </Typography>
            ))}
          </Box>
        )}
      </Paper>

      {/* Children */}
      {node.children && node.children.length > 0 && (
        <>
          {/* Vertical connector line */}
          <Box
            sx={{
              width: 2,
              height: 30,
              bgcolor: 'divider',
            }}
          />
          {/* Horizontal connector for multiple children */}
          {node.children.length > 1 && (
            <Box
              sx={{
                height: 2,
                bgcolor: 'divider',
                width: `calc(${node.children.length * 220}px - 200px)`,
                position: 'relative',
              }}
            />
          )}
          {/* Children container */}
          <Box
            sx={{
              display: 'flex',
              gap: 3,
              mt: node.children.length > 1 ? 0 : 0,
            }}
          >
            {node.children.map((child) => (
              <Box key={child.name} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {node.children && node.children.length > 1 && (
                  <Box sx={{ width: 2, height: 30, bgcolor: 'divider' }} />
                )}
                {renderNode(child, level + 1)}
              </Box>
            ))}
          </Box>
        </>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', overflowX: 'auto', py: 3 }}>
      {data.map((node) => renderNode(node))}
    </Box>
  );
};

const OwnershipTreePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { currentApplication, isLoading, error } = useSelector((state: RootState) => state.applications);
  const [treeData, setTreeData] = useState<TreeNodeData[]>([]);

  useEffect(() => {
    if (id) {
      dispatch(fetchApplicationById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (currentApplication?.entity) {
      // Transform application data into a tree structure
      const rootNode: TreeNodeData = {
        name: currentApplication.entity.legalName,
        type: 'entity',
        children: [],
      };

      if (currentApplication.beneficialOwners && currentApplication.beneficialOwners.length > 0) {
        rootNode.children = currentApplication.beneficialOwners.map((bo: any) => ({
          name: bo.person?.fullName || 'Unknown',
          type: 'beneficial_owner' as const,
          ownership: bo.ownershipPercentage ? `${bo.ownershipPercentage}%` : undefined,
          basis: bo.ownershipBasis || [],
          children: [],
        }));
      }

      setTreeData([rootNode]);
    }
  }, [currentApplication]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!currentApplication) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h5" gutterBottom>
          <AccountTreeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Ownership Tree
        </Typography>
        <Alert severity="info">
          No application data found. Please select an application to view its ownership structure.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        <AccountTreeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Ownership Structure: {currentApplication.entity?.legalName}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Visual representation of beneficial ownership for compliance review.
      </Typography>
      <Paper sx={{ p: 3, mt: 2, minHeight: 400, overflow: 'auto' }}>
        <TreeVisualization data={treeData} />
      </Paper>
    </Box>
  );
};

export default OwnershipTreePage;
