import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Modal from '../components/Modal';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Tabs,
  Tab,
  MenuItem,
  Alert,
  Snackbar,
  Rating,
  FormControl,
  InputLabel,
  Select,
  Divider
} from '@mui/material';
import { Send as SendIcon, Feedback as FeedbackIcon } from '@mui/icons-material';

const FAQS = [
  {
    q: 'What is NEPSE Navigator?',
    a: 'NEPSE Navigator is a finance chatbot built for educational purposes, providing information and insights using data from the Nepal Stock Exchange (NEPSE).',
  },
  {
    q: 'Where does the data come from?',
    a: 'All data is sourced from the official NEPSE (Nepal Stock Exchange) APIs and is updated after the market closes each trading day.',
  },
  {
    q: 'Is the information real-time and accurate?',
    a: 'No, the data is not real-time. It is for educational use only and may not reflect the latest market changes. Always verify with official sources before making decisions.',
  },
  {
    q: 'Can I use this chatbot for trading decisions?',
    a: 'No. The chatbot is for educational purposes only and should not be relied upon for real-time trading or investment decisions.',
  },
  {
    q: 'Is my personal data safe?',
    a: 'Yes. NEPSE Navigator does not store or sell any personal data you provide through this page.',
  },
];

const FEEDBACK_TYPES = [
  'Bug Report',
  'Feature Request',
  'General Feedback',
];

const ContactUs = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [message, setMessage] = useState({
    email: '',
    subject: '',
    message: ''
  });
  const [feedback, setFeedback] = useState({
    email: '',
    feedback_type: '',
    message: '',
    rating: 0
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // FAQ open/close state
  const [openFaq, setOpenFaq] = useState(null);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleMessageChange = (e) => {
    setMessage({
      ...message,
      [e.target.name]: e.target.value
    });
  };

  const handleFeedbackChange = (e) => {
    setFeedback({
      ...feedback,
      [e.target.name]: e.target.value
    });
  };

  const handleRatingChange = (event, newValue) => {
    setFeedback({
      ...feedback,
      rating: newValue
    });
  };

  const handleMessageSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/contact/message', message);
      setSnackbar({
        open: true,
        message: 'Message sent successfully!',
        severity: 'success'
      });
      setMessage({ email: '', subject: '', message: '' });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Failed to send message',
        severity: 'error'
      });
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/contact/feedback', feedback);
      setSnackbar({
        open: true,
        message: 'Feedback submitted successfully!',
        severity: 'success'
      });
      setFeedback({ email: '', feedback_type: '', message: '', rating: 0 });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Failed to submit feedback',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 md:px-0">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Contact Us</h1>
        <p className="text-gray-600">We welcome your inquiries, feedback, and suggestions. Reach out to us below!</p>
      </div>

      {/* Contact and Feedback Forms */}
      <Paper elevation={3} sx={{ p: 4, mb: 6 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} centered>
            <Tab icon={<SendIcon />} label="Send Message" />
            <Tab icon={<FeedbackIcon />} label="Submit Feedback" />
          </Tabs>
        </Box>

        {activeTab === 0 && (
          <form onSubmit={handleMessageSubmit}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={message.email}
              onChange={handleMessageChange}
              required
              margin="normal"
            />
            <TextField
              fullWidth
              label="Subject"
              name="subject"
              value={message.subject}
              onChange={handleMessageChange}
              required
              margin="normal"
            />
            <TextField
              fullWidth
              label="Message"
              name="message"
              value={message.message}
              onChange={handleMessageChange}
              required
              multiline
              rows={4}
              margin="normal"
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
              startIcon={<SendIcon />}
            >
              Send Message
            </Button>
          </form>
        )}

        {activeTab === 1 && (
          <form onSubmit={handleFeedbackSubmit}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={feedback.email}
              onChange={handleFeedbackChange}
              required
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Feedback Type</InputLabel>
              <Select
                name="feedback_type"
                value={feedback.feedback_type}
                onChange={handleFeedbackChange}
                required
                label="Feedback Type"
              >
                <MenuItem value="bug">Bug Report</MenuItem>
                <MenuItem value="feature">Feature Request</MenuItem>
                <MenuItem value="complaint">Complaint</MenuItem>
                <MenuItem value="praise">Praise</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Message"
              name="message"
              value={feedback.message}
              onChange={handleFeedbackChange}
              required
              multiline
              rows={4}
              margin="normal"
            />
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography component="legend">Rating (Optional)</Typography>
              <Rating
                name="rating"
                value={feedback.rating}
                onChange={handleRatingChange}
              />
            </Box>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
              startIcon={<FeedbackIcon />}
            >
              Submit Feedback
            </Button>
          </form>
        )}
      </Paper>

      {/* FAQ Section */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4 text-customBlue">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {FAQS.map((faq, idx) => (
            <div key={idx} className="border rounded-lg bg-white">
              <button
                className="w-full flex justify-between items-center px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-customBlue"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                aria-expanded={openFaq === idx}
                aria-controls={`faq-content-${idx}`}
              >
                <span className="font-medium text-gray-800">{faq.q}</span>
                <span className="ml-2 text-customBlue">{openFaq === idx ? '-' : '+'}</span>
              </button>
              {openFaq === idx && (
                <div id={`faq-content-${idx}`} className="px-4 pb-4 text-gray-600 animate-fade-in">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Privacy & Disclaimer Note */}
      <div className="mb-8 bg-blue-50 border-l-4 border-customBlue p-4 rounded">
        <h3 className="font-semibold text-customBlue mb-1">Privacy & Disclaimer</h3>
        <ul className="list-disc ml-6 text-gray-700 space-y-1">
          <li>The chatbot is for <b>educational use only</b>.</li>
          <li>No personal data is stored or sold.</li>
          <li>Do not rely on it for real-time trading decisions.</li>
        </ul>
      </div>

      {/* Support Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2 text-customBlue">Support</h2>
        <div className="text-gray-700 space-y-1">
          <div>Email: <a href="mailto:support@nepsenavigator.com" className="text-customBlue underline">support@nepsenavigator.com</a></div>
          <div>Telegram: <a href="https://t.me/nepsenavigator" target="_blank" rel="noopener noreferrer" className="text-customBlue underline">Join our Telegram Group</a></div>
        </div>
      </div>

      {/* Version & Data Info */}
      <div className="text-center text-gray-500 text-sm mb-4">
        <div>App version: <b>v1.0</b> &nbsp;|&nbsp; Last updated: <b>2024-06-01</b></div>
        <div>
          Developed by <a href="https://github.com/himanis01" target="_blank" rel="noopener noreferrer" className="text-customBlue underline">Himani Shrestha</a>
        </div>
      </div>

      {/* Terms and Conditions Link */}
      <div className="text-center">
        <Link to="/terms" className="text-customBlue underline font-medium">Read our Terms and Conditions</Link>
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ContactUs;
