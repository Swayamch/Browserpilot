import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, List, ListItem, ListItemText, ListItemSecondaryAction,
  IconButton, Switch, Typography, Chip, CircularProgress, Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { rulesAPI } from '../services/api';

const TRIGGER_COLORS = {
  time: 'primary',
  url: 'secondary',
  manual: 'default',
  startup: 'success',
};

export default function RulesList({ refreshKey }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await rulesAPI.list();
      setRules(res.data.rules || []);
    } catch {
      // silent
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules, refreshKey]);

  const handleToggle = async (rule) => {
    try {
      const res = await rulesAPI.toggle(rule._id);
      setRules((prev) =>
        prev.map((r) => (r._id === rule._id ? res.data.rule : r))
      );
      chrome.runtime.sendMessage({ type: 'SYNC_RULES' });
    } catch {
      // silent
    }
  };

  const handleDelete = async (id) => {
    try {
      await rulesAPI.delete(id);
      setRules((prev) => prev.filter((r) => r._id !== id));
      chrome.runtime.sendMessage({ type: 'SYNC_RULES' });
    } catch {
      // silent
    }
  };

  const handleExecute = async (rule) => {
    chrome.runtime.sendMessage({ type: 'EXECUTE_RULE', rule });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (!rules.length) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary" variant="body2">
          No rules yet. Use the AI chat above to create one!
        </Typography>
      </Box>
    );
  }

  return (
    <List dense sx={{ px: 1 }}>
      {rules.map((rule) => (
        <ListItem
          key={rule._id}
          sx={{
            borderRadius: 1,
            mb: 0.5,
            bgcolor: rule.enabled ? 'action.hover' : 'transparent',
            opacity: rule.enabled ? 1 : 0.6,
          }}
        >
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 160 }}>
                  {rule.name}
                </Typography>
                <Chip
                  label={rule.trigger?.type}
                  size="small"
                  color={TRIGGER_COLORS[rule.trigger?.type] || 'default'}
                  sx={{ height: 18, fontSize: '0.65rem' }}
                />
              </Box>
            }
            secondary={
              <Typography variant="caption" color="text.secondary" noWrap>
                {rule.actions?.length || 0} action{rule.actions?.length !== 1 ? 's' : ''}
                {rule.executionCount ? ` · ran ${rule.executionCount}×` : ''}
              </Typography>
            }
          />
          <ListItemSecondaryAction>
            <Tooltip title="Run now">
              <IconButton size="small" onClick={() => handleExecute(rule)}>
                <PlayArrowIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Switch
              size="small"
              checked={rule.enabled}
              onChange={() => handleToggle(rule)}
            />
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => handleDelete(rule._id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );
}
