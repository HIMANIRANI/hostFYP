import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GetStarted from '../getStarted/getstarted';

const RootRoute = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      navigate('/homepage');
    }
  }, [navigate]);

  return <GetStarted />;
};

export default RootRoute; 