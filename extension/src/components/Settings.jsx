import React, { useState } from 'react';
import {
  Box, Typography, Switch, FormControlLabel, Select, MenuItem,
  Button, Divider, Alert,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import SyncIcon from '@mui/icons-material/Sync';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user, logout, updateSettings } = useAuth();
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  const settings = user?.settings || { theme: 'system', notifications: true, autoSync: true };

  const handleChange = async (key, value) => {
    setSaving(true);
    setMessage('');
    try {
      await updateSettings({ [key]: value });
      setMessage('Settings saved');
      setTimeout(() => setMessage(''), 2000);
    } catch {
      setMessage('Failed to save');
    }
    setSaving(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'SYNC_RULES' }, resolve);
      });
      setMessage('Rules synced!');
      setTimeout(() => setMessage(''), 2000);
    } catch {
      setMessage('Sync failed');
    }
    setSyncing(false);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
        ⚙️ Settings
      </Typography>

      {message && (
        <Alert severity="success" sx={{ py: 0, mb: 1, fontSize: '0.75rem' }}>
          {message}
        </Alert>
      )}

      {/* Account info */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary">Account</Typography>
        <Typography variant="body2" fontWeight={600}>{user?.email}</Typography>
        <Typography variant="caption" color="text.secondary">
          Plan: {user?.subscription?.plan || 'free'}
        </Typography>
      </Box>

      <Divider sx={{ mb: 1.5 }} />

      {/* Theme */}
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="caption" fontWeight={600}>Theme</Typography>
        <Select
          value={settings.theme}
          onChange={(e) => handleChange('theme', e.target.value)}
          size="small"
          fullWidth
          sx={{ mt: 0.5 }}
          disabled={saving}
        >
          <MenuItem value="system">System</MenuItem>
          <MenuItem value="light">Light</MenuItem>
          <MenuItem value="dark">Dark</MenuItem>
        </Select>
      </Box>

      {/* Notifications */}
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={settings.notifications}
            onChange={(e) => handleChange('notifications', e.target.checked)}
            disabled={saving}
          />
        }
        label={<Typography variant="body2">Notifications</Typography>}
      />

      {/* Auto sync */}
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={settings.autoSync}
            onChange={(e) => handleChange('autoSync', e.target.checked)}
            disabled={saving}
          />
        }
        label={<Typography variant="body2">Auto-sync rules</Typography>}
      />

      <Divider sx={{ my: 1.5 }} />

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<SyncIcon />}
          onClick={handleSync}
          disabled={syncing}
        >
          Sync Now
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={logout}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );
}
