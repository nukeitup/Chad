import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Divider } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Approval as ApprovalIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Applications', icon: <AssignmentIcon />, path: '/applications' },
  { text: 'Approval Queue', icon: <ApprovalIcon />, path: '/approvals' },
  { text: 'Entities', icon: <PeopleIcon />, path: '/entities' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  { text: 'divider', icon: null, path: '' },
  { text: 'About', icon: <InfoIcon />, path: '/about' },
];

const Sidebar: React.FC = () => {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      <Toolbar />
      <List>
        {menuItems.map((item, index) =>
          item.text === 'divider' ? (
            <Divider key={index} sx={{ my: 1 }} />
          ) : (
            <ListItem button component={Link} to={item.path} key={item.text}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          )
        )}
      </List>
    </Drawer>
  );
};

export default Sidebar;
