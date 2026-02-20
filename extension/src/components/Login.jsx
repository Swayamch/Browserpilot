import React, { useState } from 'react';
import {
  Box, TextField, Button, Typography, Alert, Link, CircularProgress,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}
    >
      <Typography variant="h5" fontWeight={700} textAlign="center">
        🚀 BrowserPilot
      </Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center">
        {isRegister ? 'Create your account' : 'Sign in to continue'}
      </Typography>

      {error && <Alert severity="error" sx={{ py: 0 }}>{error}</Alert>}

      {isRegister && (
        <TextField
          label="Name"
          size="small"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
        />
      )}
      <TextField
        label="Email"
        type="email"
        size="small"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        fullWidth
      />
      <TextField
        label="Password"
        type="password"
        size="small"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
        inputProps={{ minLength: 6 }}
      />

      <Button type="submit" variant="contained" disabled={loading} fullWidth>
        {loading ? <CircularProgress size={22} /> : isRegister ? 'Register' : 'Sign In'}
      </Button>

      <Typography variant="body2" textAlign="center">
        {isRegister ? 'Already have an account? ' : "Don't have an account? "}
        <Link
          component="button"
          type="button"
          onClick={() => { setIsRegister(!isRegister); setError(''); }}
        >
          {isRegister ? 'Sign In' : 'Register'}
        </Link>
      </Typography>
    </Box>
  );
}
