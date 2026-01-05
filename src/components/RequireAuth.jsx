// src/components/RequireAuth.js
import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const RequireAuth = ({ children }) => {
  // CORRECT: Check isAuthenticated
  const { isAuthenticated } = useContext(AuthContext); 
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default RequireAuth;