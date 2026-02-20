import React, { useState } from 'react';
import {
  Card, CardContent, CardActions, Typography, Button, Chip, Box, CircularProgress,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import StarIcon from '@mui/icons-material/Star';
import { templatesAPI, rulesAPI } from '../services/api';

export default function TemplateCard({ template, onUse }) {
  const [loading, setLoading] = useState(false);

  const handleUse = async () => {
    setLoading(true);
    try {
      // Create a rule from template
      const ruleData = {
        name: template.name,
        description: template.description,
        trigger: template.ruleTemplate.trigger,
        conditions: template.ruleTemplate.conditions || [],
        actions: template.ruleTemplate.actions,
        templateId: template._id,
      };
      await rulesAPI.create(ruleData);
      await templatesAPI.use(template._id);
      chrome.runtime.sendMessage({ type: 'SYNC_RULES' });
      onUse?.();
    } catch {
      // silent
    }
    setLoading(false);
  };

  return (
    <Card sx={{ mb: 1, bgcolor: 'background.paper' }} variant="outlined">
      <CardContent sx={{ pb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ fontSize: '1rem' }}>
            {template.icon} {template.name}
          </Typography>
          <Chip label={template.category} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
        </Box>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          {template.description}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            <DownloadIcon sx={{ fontSize: 12, mr: 0.3, verticalAlign: 'middle' }} />
            {template.usageCount || 0} uses
          </Typography>
          {template.rating > 0 && (
            <Typography variant="caption" color="text.secondary">
              <StarIcon sx={{ fontSize: 12, mr: 0.3, verticalAlign: 'middle', color: 'warning.main' }} />
              {template.rating.toFixed(1)}
            </Typography>
          )}
        </Box>
      </CardContent>
      <CardActions sx={{ pt: 0 }}>
        <Button size="small" variant="contained" onClick={handleUse} disabled={loading}>
          {loading ? <CircularProgress size={16} /> : 'Use Template'}
        </Button>
      </CardActions>
    </Card>
  );
}
