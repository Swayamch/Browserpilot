import React, { useState, useCallback } from 'react';
import {
  Box, Tabs, Tab, Typography, CssBaseline, CircularProgress,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ListAltIcon from '@mui/icons-material/ListAlt';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import SettingsIcon from '@mui/icons-material/Settings';

import { AuthProvider, useAuth } from '../context/AuthContext';
import Login from '../components/Login';
import ChatInput from '../components/ChatInput';
import RulesList from '../components/RulesList';
import Dashboard from '../components/Dashboard';
import Templates from '../components/Templates';
import Settings from '../components/Settings';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#6C63FF' },
    background: { default: '#1a1a2e', paper: '#16213e' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    fontSize: 13,
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 },
      },
    },
  },
});

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [tab, setTab] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRuleCreated = useCallback(() => {
    setRefreshKey((k) => k + 1);
    setTab(1); // switch to rules tab
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box sx={{ px: 2, pt: 1.5, pb: 0.5, bgcolor: 'primary.main', color: '#fff' }}>
        <Typography variant="h6" fontWeight={800} fontSize="1rem">
          🚀 BrowserPilot
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          AI-Powered Browser Automation
        </Typography>
      </Box>

      {/* Navigation */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="fullWidth"
        sx={{
          minHeight: 36,
          '& .MuiTab-root': { minHeight: 36, py: 0, fontSize: '0.7rem' },
        }}
      >
        <Tab icon={<AutoFixHighIcon sx={{ fontSize: 16 }} />} label="AI" />
        <Tab icon={<ListAltIcon sx={{ fontSize: 16 }} />} label="Rules" />
        <Tab icon={<ViewModuleIcon sx={{ fontSize: 16 }} />} label="Templates" />
        <Tab icon={<DashboardIcon sx={{ fontSize: 16 }} />} label="Stats" />
        <Tab icon={<SettingsIcon sx={{ fontSize: 16 }} />} label="Settings" />
      </Tabs>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {tab === 0 && (
          <Box>
            <ChatInput onRuleCreated={handleRuleCreated} />
            <RulesList refreshKey={refreshKey} />
          </Box>
        )}
        {tab === 1 && <RulesList refreshKey={refreshKey} />}
        {tab === 2 && <Templates onRuleCreated={handleRuleCreated} />}
        {tab === 3 && <Dashboard />}
        {tab === 4 && <Settings />}
      </Box>
    </Box>
  );
}

export default function Popup() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
