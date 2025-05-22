import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Box, CircularProgress } from '@mui/material';

const ProtectedRoute = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const verifyAdminAccess = async () => {
      const token = localStorage.getItem('access_token');
      console.log('Token from localStorage:', token ? 'exists' : 'missing');
      
      if (!token) {
        console.log('No token found, redirecting to login');
        setIsAuthorized(false);
        return;
      }

      try {
        console.log('Attempting admin verification with token');
        const response = await axios.get('http://localhost:8000/admin/verify', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('Admin verification response:', response.data);
        setIsAuthorized(response.data.status === 'authorized');
      } catch (err) {
        console.error('Admin verification error:', err.response?.data || err.message);
        console.error('Error status:', err.response?.status);
        setIsAuthorized(false);
        // Don't remove the token immediately, let's debug first
        // localStorage.removeItem('access_token');
      }
    };

    verifyAdminAccess();
  }, []);

  if (isAuthorized === null) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute; 