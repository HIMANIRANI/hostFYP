import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  Alert,
  CircularProgress,
  Box,
  Container,
  Tab,
  Tabs,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  PeopleAlt as PeopleIcon,
  Star as StarIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  Message as MessageIcon,
  Feedback as FeedbackIcon,
  CheckCircle as CheckCircleIcon,
  Star as StarRatingIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <Card sx={{ height: '100%', bgcolor: color || 'background.paper', boxShadow: 2 }}>
    <CardContent>
      <Box display="flex" alignItems="center" mb={2}>
        <Icon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div">
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        console.log('Fetching admin data with token:', token ? 'exists' : 'missing');

        if (!token) {
          throw new Error('No access token found');
        }

        const [statsResponse, usersResponse, messagesResponse, feedbackResponse] = await Promise.all([
          axios.get('http://localhost:8000/admin/stats', {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          axios.get('http://localhost:8000/admin/users', {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          axios.get('http://localhost:8000/contact/admin/messages', {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          axios.get('http://localhost:8000/contact/admin/feedback', {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        ]);

        console.log('Stats response:', statsResponse.data);
        console.log('Users response:', usersResponse.data);
        console.log('Messages response:', messagesResponse.data);
        console.log('Feedback response:', feedbackResponse.data);

        setStats(statsResponse.data);
        setUsers(usersResponse.data);
        setMessages(messagesResponse.data);
        setFeedback(feedbackResponse.data);
      } catch (err) {
        console.error('Error fetching admin data:', err.response?.data || err.message);
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('access_token');
          navigate('/admin/login');
        } else {
          setError('Failed to load admin data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleMarkAsRead = async (type, id) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token found');
      }

      const endpoint = type === 'message' 
        ? `http://localhost:8000/contact/admin/messages/${id}/read`
        : `http://localhost:8000/contact/admin/feedback/${id}/read`;

      await axios.put(endpoint, {}, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (type === 'message') {
        setMessages(messages.map(msg => 
          msg._id === id ? { ...msg, is_read: true } : msg
        ));
      } else {
        setFeedback(feedback.map(fb => 
          fb._id === id ? { ...fb, is_read: true } : fb
        ));
      }
    } catch (err) {
      console.error('Error marking as read:', err.response?.data || err.message);
      setError('Failed to mark as read');
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getFeedbackTypeColor = (type) => {
    const colors = {
      bug: 'error',
      feature: 'info',
      complaint: 'warning',
      praise: 'success'
    };
    return colors[type] || 'default';
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token found');
      }

      await axios.post('http://localhost:8000/admin/logout', {}, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Clear local storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_profile');
      
      // Show success message
      toast.success('Logged out successfully');
      
      // Close modal and redirect
      setShowLogoutModal(false);
      navigate('/admin/login');
    } catch (err) {
      console.error('Error logging out:', err.response?.data || err.message);
      toast.error('Failed to logout');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1">
        Admin Dashboard
      </Typography>
        <Button
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats?.total_users || 0}
            icon={PeopleIcon}
            color="#f5f5f5"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Premium Users"
            value={stats?.premium_users || 0}
            icon={StarIcon}
            color="#fff3e0"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Messages"
            value={messages.length}
            icon={MessageIcon}
            color="#e8f5e9"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Feedback"
            value={feedback.length}
            icon={FeedbackIcon}
            color="#e3f2fd"
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab icon={<PeopleIcon />} label="Users" />
          <Tab icon={<MessageIcon />} label="Messages" />
          <Tab icon={<FeedbackIcon />} label="Feedback" />
        </Tabs>
      </Box>

      {/* Users Table */}
      {activeTab === 0 && (
        <Card sx={{ boxShadow: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              User Management
            </Typography>
            <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'primary.light' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Premium Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.email} hover>
                      <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.is_premium ? "Premium" : "Standard"}
                          color={user.is_premium ? "success" : "default"}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Messages Tab */}
      {activeTab === 1 && (
        <Card sx={{ boxShadow: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              User Messages
            </Typography>
            <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'primary.light' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Subject</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Message</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {messages.map((msg) => (
                    <TableRow key={msg._id} hover>
                      <TableCell>{msg.email}</TableCell>
                      <TableCell>{msg.subject}</TableCell>
                      <TableCell>{msg.message}</TableCell>
                      <TableCell>{formatDate(msg.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Feedback Tab */}
      {activeTab === 2 && (
        <Card sx={{ boxShadow: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              User Feedback
            </Typography>
            <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'primary.light' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Message</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Rating</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {feedback.map((item) => (
                    <TableRow key={item._id} hover>
                      <TableCell>{item.email}</TableCell>
                      <TableCell>
                        <Chip 
                          label={item.feedback_type} 
                          color={getFeedbackTypeColor(item.feedback_type)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{item.message}</TableCell>
                      <TableCell>
                        {item.rating && (
                          <Box display="flex" alignItems="center">
                            <StarRatingIcon sx={{ color: 'gold', mr: 0.5 }} />
                            {item.rating}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(item.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Logout Confirmation Modal */}
      <Dialog
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
      >
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to log out? You will need to log in again to access the admin dashboard.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLogoutModal(false)}>Cancel</Button>
          <Button onClick={confirmLogout} color="error" variant="contained">
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard; 