import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Tabs, Tab } from '@mui/material';
import TemplateCard from './TemplateCard';
import { templatesAPI } from '../services/api';

const CATEGORIES = ['all', 'focus', 'productivity', 'night', 'work', 'custom'];

export default function Templates({ onRuleCreated }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const res = await templatesAPI.list();
        setTemplates(res.data.templates || []);
      } catch {
        // silent
      }
      setLoading(false);
    })();
  }, []);

  const filtered = category === 'all'
    ? templates
    : templates.filter((t) => t.category === category);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ px: 1, mb: 0.5 }}>
        📦 Templates
      </Typography>

      <Tabs
        value={category}
        onChange={(_, v) => setCategory(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ minHeight: 32, mb: 1, '& .MuiTab-root': { minHeight: 32, py: 0, fontSize: '0.7rem' } }}
      >
        {CATEGORIES.map((c) => (
          <Tab key={c} value={c} label={c.charAt(0).toUpperCase() + c.slice(1)} />
        ))}
      </Tabs>

      {filtered.length === 0 ? (
        <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
          No templates in this category
        </Typography>
      ) : (
        <Box sx={{ px: 1 }}>
          {filtered.map((t) => (
            <TemplateCard key={t._id} template={t} onUse={onRuleCreated} />
          ))}
        </Box>
      )}
    </Box>
  );
}
