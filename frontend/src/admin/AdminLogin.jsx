import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAdminAccess = async () => {
      const token = localStorage.getItem('access_token');
      console.log('Checking existing token:', token ? 'exists' : 'missing');
      
      if (!token) {
        setVerifying(false);
        return;
      }

      try {
        console.log('Verifying admin access with token');
        const response = await axios.get('http://localhost:8000/admin/verify', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('Admin verification response:', response.data);
        
        if (response.data.status === 'authorized') {
          navigate('/admin');
        }
      } catch (err) {
        console.error('Admin verification error:', err.response?.data || err.message);
        localStorage.removeItem('access_token');
      } finally {
        setVerifying(false);
      }
    };

    verifyAdminAccess();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting admin login with:', { email });
      
      // First, try to login
      const loginResponse = await axios.post('http://localhost:8000/auth/login', {
        email,
        password
      }, {
        withCredentials: true
      });

      console.log('Login response:', loginResponse.data);

      if (!loginResponse.data.access_token) {
        throw new Error('No access token received');
      }

      // Store the token
      localStorage.setItem('access_token', loginResponse.data.access_token);
      
      if (loginResponse.data.user) {
        localStorage.setItem('user_profile', JSON.stringify(loginResponse.data.user));
      }

      // Then verify if the user is an admin
      console.log('Verifying admin access');
      const verifyResponse = await axios.get('http://localhost:8000/admin/verify', {
        headers: { 
          'Authorization': `Bearer ${loginResponse.data.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Admin verification response:', verifyResponse.data);

      if (verifyResponse.data.status === 'authorized') {
        navigate('/admin');
      } else {
        setError('Access denied. Admin privileges required.');
        localStorage.removeItem('access_token');
      }
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      
      if (err.response?.status === 401) {
        setError('Invalid email or password');
      } else if (err.response?.status === 403) {
        setError('Access denied. Admin privileges required.');
      } else {
        setError('An error occurred. Please try again.');
      }
      localStorage.removeItem('access_token');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="background.default"
    >
      <Card sx={{ maxWidth: 400, width: '100%', mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
            <LockIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" component="h1" gutterBottom>
              Admin Login
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Enter your credentials to access the admin panel
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoFocus
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminLogin; 