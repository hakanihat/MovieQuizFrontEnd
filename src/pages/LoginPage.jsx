import React, { useState, useContext } from 'react';
import apiClient from '../api/apiService';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  
  // New UI states for better UX
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleChange = (e) => {
    // Clear error as soon as user types (improves feel)
    if (error) setError(null);
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Prevent Spam (Double Clicks)
    if (isLoading) return;

    // 2. Start Loading & Reset Errors
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await apiClient.post('/auth/login', credentials);
      
      // Extract User and Token safely
      const user = data.user || data; 
      const token = data.access_token || data.token;

      if (token) {
        const safeUser = user && (user.username || user.email) 
          ? user 
          : { username: credentials.username, ...user };

        // Save to Context/LocalStorage
        login(safeUser, token);

        // Redirect immediately
        navigate('/'); 
      } else {
        throw new Error("No access token received from server");
      }

    } catch (err) {
      console.error("Login Error:", err);
      
      // 3. Extract Specific Error Message
      let errorMessage = 'Login failed. Please check your credentials.';
      if (err.response && err.response.data) {
        const data = err.response.data;
        if (data.message) {
            errorMessage = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        } else if (data.error) {
            errorMessage = data.error;
        }
      }

      setError(errorMessage);
    } finally {
      // 4. Unlock button
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2>Login</h2>
        
        {/* INLINE ERROR MESSAGE */}
        {error && (
          <div style={{ 
            backgroundColor: '#ffebee', 
            color: '#c62828', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '15px', 
            fontSize: '0.9rem',
            border: '1px solid #ef9a9a'
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
              disabled={isLoading} // Lock input
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
              disabled={isLoading} // Lock input
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