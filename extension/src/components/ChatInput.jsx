import React, { useState } from 'react';
import {
  Box, TextField, IconButton, CircularProgress, Paper, Typography, Button, Chip,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { aiAPI, rulesAPI } from '../services/api';

const SUGGESTIONS = [
  'Block social media during work hours',
  'Remind me to take a break every 30 minutes',
  'Mute all tabs at night',
  'Close YouTube tabs after 5 PM',
];

export default function ChatInput({ onRuleCreated }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');

  const handleGenerate = async (text) => {
    const input = text || prompt;
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    setPreview(null);
    try {
      const res = await aiAPI.generate(input.trim());
      setPreview(res.data.rule);
    } catch (err) {
      setError(err.response?.data?.error || 'AI generation failed');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!preview) return;
    setLoading(true);
    try {
      await rulesAPI.create(preview);
      // Notify background to re-sync
      chrome.runtime.sendMessage({ type: 'SYNC_RULES' });
      setPreview(null);
      setPrompt('');
      onRuleCreated?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save rule');
    }
    setLoading(false);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Describe what you want to automate..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleGenerate()}
          disabled={loading}
          InputProps={{
            startAdornment: <AutoFixHighIcon sx={{ mr: 1, color: 'primary.main' }} />,
          }}
        />
        <IconButton color="primary" onClick={() => handleGenerate()} disabled={loading || !prompt.trim()}>
          {loading ? <CircularProgress size={20} /> : <SendIcon />}
        </IconButton>
      </Box>

      {/* Quick suggestions */}
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
        {SUGGESTIONS.map((s) => (
          <Chip
            key={s}
            label={s}
            size="small"
            variant="outlined"
            onClick={() => { setPrompt(s); handleGenerate(s); }}
            sx={{ fontSize: '0.7rem' }}
          />
        ))}
      </Box>

      {error && (
        <Typography color="error" variant="caption">{error}</Typography>
      )}

      {/* Rule preview */}
      {preview && (
        <Paper sx={{ p: 1.5, mt: 1, bgcolor: 'action.hover' }}>
          <Typography variant="subtitle2" fontWeight={600}>{preview.name}</Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {preview.description}
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
            Trigger: <strong>{preview.trigger?.type}</strong>
            {preview.trigger?.value ? ` — ${preview.trigger.value}` : ''}
          </Typography>
          <Typography variant="caption" display="block">
            Actions: {preview.actions?.map((a) => a.type.replace(/_/g, ' ')).join(', ')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Button size="small" variant="contained" onClick={handleSave} disabled={loading}>
              Save Rule
            </Button>
            <Button size="small" variant="outlined" onClick={() => setPreview(null)}>
              Discard
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
