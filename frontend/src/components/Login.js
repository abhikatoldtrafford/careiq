import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Divider,
  CircularProgress,
  InputAdornment,
  IconButton,
  Tab,
  Tabs
} from '@mui/material';
import {
  Google,
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Person
} from '@mui/icons-material';
import { toast } from 'react-toastify';

function Login() {
  const navigate = useNavigate();
  const { login, signup, loginWithGoogle } = useAuth();
  const [tab, setTab] = useState(0); // 0 = login, 1 = signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tab === 0) {
        // Login
        await login(email, password);
        toast.success('Welcome back!');
      } else {
        // Signup
        if (!name.trim()) {
          setError('Name is required');
          setLoading(false);
          return;
        }
        await signup(email, password, name);
        toast.success('Account created successfully!');
      }
      navigate('/');
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      await loginWithGoogle();
      toast.success('Welcome!');
      navigate('/');
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('demo@careiq.com');
    setPassword('demo123');
    try {
      await login('demo@careiq.com', 'demo123');
      toast.success('Welcome to demo!');
      navigate('/');
    } catch (error) {
      toast.error('Demo account not available');
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      px: 2
    }}>
      <Paper elevation={3} sx={{ 
        width: '100%',
        p: 3,
        borderRadius: 3
      }}>
        {/* Logo/Title */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" color="primary">
            CareIQ
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Support Worker Progress Notes
          </Typography>
        </Box>

        {/* Tabs */}
        <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="fullWidth" sx={{ mb: 3 }}>
          <Tab label="Login" />
          <Tab label="Sign Up" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {tab === 1 && (
            <TextField
              fullWidth
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person />
                  </InputAdornment>
                ),
              }}
            />
          )}

          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
            autoComplete="email"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            autoComplete={tab === 0 ? 'current-password' : 'new-password'}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 3, mb: 2, height: 48 }}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              tab === 0 ? 'Login' : 'Sign Up'
            )}
          </Button>
        </form>

        <Divider sx={{ my: 2 }}>OR</Divider>

        {/* Google Login */}
        <Button
          fullWidth
          variant="outlined"
          size="large"
          onClick={handleGoogleLogin}
          startIcon={<Google />}
          sx={{ mb: 2, height: 48 }}
          disabled={loading}
        >
          Continue with Google
        </Button>

        {/* Demo Account */}
        {tab === 0 && (
          <Button
            fullWidth
            variant="text"
            onClick={handleDemoLogin}
            sx={{ mb: 2 }}
            disabled={loading}
          >
            Try Demo Account
          </Button>
        )}

        {/* Footer */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            By continuing, you agree to our Terms of Service
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

export default Login;