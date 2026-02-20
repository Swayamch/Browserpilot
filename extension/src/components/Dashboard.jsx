import React, { useState, useEffect } from 'react';
import {
  Box, Typography, CircularProgress, Paper, Grid, Divider,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import RuleIcon from '@mui/icons-material/Rule';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { analyticsAPI } from '../services/api';

function StatCard({ icon, label, value, color }) {
  return (
    <Paper sx={{ p: 1.5, textAlign: 'center', flex: 1, minWidth: 80 }} variant="outlined">
      <Box sx={{ color: color || 'primary.main', mb: 0.5 }}>{icon}</Box>
      <Typography variant="h6" fontWeight={700} fontSize="1.1rem">{value}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Paper>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [dashRes, recentRes] = await Promise.all([
          analyticsAPI.dashboard({ days: 30 }),
          analyticsAPI.recent({ limit: 10 }),
        ]);
        setData(dashRes.data);
        setRecent(recentRes.data.records || []);
      } catch {
        // silent
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary" variant="body2">
          No analytics data yet. Start using rules to see stats!
        </Typography>
      </Box>
    );
  }

  const { summary, topRules, actionDistribution } = data;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
        📊 Last 30 Days
      </Typography>

      {/* Stats row */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <StatCard
          icon={<TrendingUpIcon />}
          label="Executions"
          value={summary.totalExecutions}
          color="primary.main"
        />
        <StatCard
          icon={<CheckCircleIcon />}
          label="Success Rate"
          value={`${summary.successRate}%`}
          color="success.main"
        />
        <StatCard
          icon={<RuleIcon />}
          label="Active Rules"
          value={`${summary.activeRules}/${summary.totalRules}`}
          color="info.main"
        />
      </Box>

      {/* Top rules */}
      {topRules && topRules.length > 0 && (
        <>
          <Typography variant="caption" fontWeight={600} color="text.secondary">
            TOP RULES
          </Typography>
          {topRules.slice(0, 5).map((r, i) => (
            <Box
              key={r._id}
              sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}
            >
              <Typography variant="caption" noWrap sx={{ maxWidth: 180 }}>
                {i + 1}. {r.ruleName || 'Unnamed'}
              </Typography>
              <Typography variant="caption" fontWeight={600}>
                {r.count}×
              </Typography>
            </Box>
          ))}
          <Divider sx={{ my: 1 }} />
        </>
      )}

      {/* Action distribution */}
      {actionDistribution && actionDistribution.length > 0 && (
        <>
          <Typography variant="caption" fontWeight={600} color="text.secondary">
            ACTION TYPES
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
            {actionDistribution.map((a) => (
              <Paper key={a._id} sx={{ px: 1, py: 0.3 }} variant="outlined">
                <Typography variant="caption">
                  {(a._id || 'unknown').replace(/_/g, ' ')}: <strong>{a.count}</strong>
                </Typography>
              </Paper>
            ))}
          </Box>
          <Divider sx={{ my: 1 }} />
        </>
      )}

      {/* Recent activity */}
      <Typography variant="caption" fontWeight={600} color="text.secondary">
        RECENT ACTIVITY
      </Typography>
      {recent.length === 0 ? (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          No recent activity
        </Typography>
      ) : (
        recent.slice(0, 5).map((r) => (
          <Box
            key={r._id}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, py: 0.3 }}
          >
            {r.success ? (
              <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />
            ) : (
              <ErrorIcon sx={{ fontSize: 14, color: 'error.main' }} />
            )}
            <Typography variant="caption" noWrap sx={{ flex: 1 }}>
              {r.ruleName || 'Rule'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(r.executedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Box>
        ))
      )}
    </Box>
  );
}
