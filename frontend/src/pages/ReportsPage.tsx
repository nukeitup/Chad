import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', applications: 4000, approvals: 2400 },
  { name: 'Feb', applications: 3000, approvals: 1398 },
  { name: 'Mar', applications: 2000, approvals: 9800 },
  { name: 'Apr', applications: 2780, approvals: 3908 },
  { name: 'May', applications: 1890, approvals: 4800 },
  { name: 'Jun', applications: 2390, approvals: 3800 },
  { name: 'Jul', applications: 3490, approvals: 4300 },
];

const ReportsPage: React.FC = () => {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom>Advanced Reports & Analytics</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Insights into application performance, risk trends, and operational efficiency.
      </Typography>

      <Grid container spacing={3}>
        {/* Applications Over Time */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Applications & Approvals Over Time</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="applications" stroke="#8884d8" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="approvals" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Risk Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Risk Distribution</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography variant="h4" color="text.secondary">Pie Chart (Coming Soon)</Typography>
                </div>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Processing Times */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Average Processing Times</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography variant="h4" color="text.secondary">Bar Chart (Coming Soon)</Typography>
                </div>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Export Options */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Data Export</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Export application data, audit logs, or screening results for further analysis.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1">Export Applications</Typography>
                  <Typography variant="body2" color="text.secondary">Download all application data in CSV or JSON format.</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1">Export Audit Logs</Typography>
                  <Typography variant="body2" color="text.secondary">Download audit trail data for compliance purposes.</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1">Export Screening Results</Typography>
                  <Typography variant="body2" color="text.secondary">Download detailed sanctions and PEP screening results.</Typography>
                </Paper>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportsPage;
