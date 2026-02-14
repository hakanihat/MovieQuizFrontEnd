import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const RequireAdmin = ({ children }) => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'admin') {
    return (
      <div style={{ padding: '50px', textAlign: 'center', color: '#fff' }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
        <button onClick={() => window.history.back()} style={{marginTop: '10px', padding: '10px'}}>Go Back</button>
      </div>
    );
  }

  return children;
};

export default RequireAdmin;