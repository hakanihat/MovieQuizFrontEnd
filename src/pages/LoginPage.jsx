import React, { useState, useContext } from 'react';
import apiClient from '../api/apiService';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  
  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleChange = (e) => {
    if (error) setError(null);
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data } = await apiClient.post('/auth/login', credentials);
      
      const user = data.user || data; 
      const token = data.access_token || data.token;

      if (token) {
        const safeUser = user && (user.username || user.email) 
          ? user 
          : { username: credentials.username, ...user };

        login(safeUser, token);
        navigate('/'); 
      } else {
        throw new Error("No access token received.");
      }

    } catch (err) {
      console.error("Login Error:", err);
      
      // --- FIX: ROBUST ERROR EXTRACTION ---
      let displayMessage = 'Login failed. Please check your credentials.';

      if (err.response && err.response.data) {
        const { message, error: errorType } = err.response.data;

        // Case 1: 'message' exists (NestJS standard)
        if (message) {
            if (Array.isArray(message)) {
                // If it's an array ["email invalid", "password short"], join them
                displayMessage = message.join(', ');
            } else if (typeof message === 'string') {
                displayMessage = message;
            } else {
                // If it's an object, force it to string to PREVENT CRASH
                displayMessage = JSON.stringify(message);
            }
        } 
        // Case 2: Fallback to 'error' field (e.g. "Unauthorized")
        else if (errorType && typeof errorType === 'string') {
            displayMessage = errorType;
        }
      }

      // --- FINAL SAFETY NET ---
      // If for any reason displayMessage is still an object, force it to string.
      // This specifically fixes the "Minified React error #31" crash.
      if (typeof displayMessage !== 'string') {
          displayMessage = "An unexpected error occurred.";
      }

      setError(displayMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2>Login</h2>
        
        {/* INLINE ERROR BOX */}
        {error && (
          <div style={{ 
            backgroundColor: '#ffebee', 
            color: '#c62828', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '15px', 
            fontSize: '0.9rem',
            border: '1px solid #ef9a9a',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text" 
              name="username"
              placeholder="Username or Email"
              value={credentials.username}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={credentials.password}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading} 
            style={{ opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="register-link" style={{ marginTop: '15px', fontSize: '0.9rem', color: '#ccc' }}>
          Don't have an account? <Link to="/register" style={{ color: '#f1c40f' }}>Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;