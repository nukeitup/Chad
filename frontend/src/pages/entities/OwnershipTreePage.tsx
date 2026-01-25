import React from 'react';
import { Box, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchApplicationById } from '../../store/slices/applicationSlice';
import { Tree, TreeNode } from 'react-recharts'; // Assuming recharts will be used, placeholder

// Placeholder for the OwnershipTree component - this will be created later
const OwnershipTreeComponent: React.FC<{ data: any[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return <Typography>No ownership data to display.</Typography>;
  }
  // This is a very basic placeholder for the tree visualization
  // A real implementation would involve mapping data to Recharts Tree components
  // and customizing nodes/links.
  return (
    <Tree
      width={800}
      height={500}
      data={data}
      node={<TreeNode />}
      rootNode={{ x: 400, y: 50 }} // Placeholder
      layout="vertical"
    />
  );
};


const OwnershipTreePage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Application ID
  const dispatch = useDispatch<AppDispatch>();
  const { currentApplication, isLoading, error } = useSelector((state: RootState) => state.applications);
  const [treeData, setTreeData] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      dispatch(fetchApplicationById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (currentApplication) {
      // Transform application data into a tree structure suitable for Recharts Tree
      // This is a simplified example. A real transformation might be complex.
      const rootNode = {
        name: currentApplication.entity.legalName,
        attributes: { type: 'Entity', id: currentApplication.entity.id },
        children: [],
      };

      if (currentApplication.beneficialOwners && currentApplication.beneficialOwners.length > 0) {
        rootNode.children = currentApplication.beneficialOwners.map(bo => ({
          name: bo.person.fullName,
          attributes: { type: 'Beneficial Owner', ownership: bo.ownershipPercentage + '%' },
          children: [], // Could recursively add more layers if ownership is nested
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
        <Typography variant="h5" gutterBottom>Ownership Tree</Typography>
        <Typography>No application data found to build the ownership tree.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom>Ownership Tree for {currentApplication.entity.legalName}</Typography>
      <Paper sx={{ p: 3, mt: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <OwnershipTreeComponent data={treeData} />
      </Paper>
    </Box>
  );
};

export default OwnershipTreePage;
