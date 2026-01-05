import React, { useState, useContext } from 'react';
import apiClient from '../api/apiService';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { toast } from 'sonner'; 
import './LoginPage.css';

const LoginPage = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleChange = (e) =>
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // 1. Send 'username' directly
      const { data } = await apiClient.post('/auth/login', credentials);
      
      console.log("Login Response Data:", data);

      // 2. Extract User and Token
      // Handle the access_token structure seen in your logs
      const user = data.user || data; 
      const token = data.access_token || data.token;

      if (token) {
        // Create a safe user object to ensure context has a username
        const safeUser = user && (user.username || user.email) 
          ? user 
          : { username: credentials.username, ...user };

        // --- CRITICAL UPDATE: PERSIST BEFORE REDIRECT ---
        // This triggers AuthContext.login which saves the token to localStorage
        // This ensures subsequent requests (like Profile) have the token attached
        login(safeUser, token);

        toast.success('Welcome back!', {
          description: 'Login successful.',
          style: { border: '1px solid #2ecc71' }
        });

        // 3. Navigate to profile so you can immediately see data
        navigate('/profile'); 
      } else {
        throw new Error("No access token received from server");
      }

    } catch (err) {
      console.error("Login Error:", err);
      
      let errorMessage = 'Login failed. Please check your credentials.';

      // 4. ROBUST ERROR HANDLING
      if (err.response && err.response.data) {
        const data = err.response.data;

        if (data.message) {
            if (Array.isArray(data.message)) {
                errorMessage = data.message[0];
            } else if (typeof data.message === 'string') {
                errorMessage = data.message;
            }
        } else if (data.error && typeof data.error === 'string') {
            errorMessage = data.error;
        } else if (typeof data === 'string') {
            errorMessage = data;
        }
      }

      // Final safety check to ensure we never render an object in the Toast
      if (typeof errorMessage !== 'string') {
          errorMessage = 'An unexpected server error occurred.';
      }

      toast.error('Login Failed', {
        description: errorMessage,
        style: { border: '1px solid #e74c3c' }
      });
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2>Login</h2>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text" 
            name="username"
            placeholder="Username or Email"
            value={credentials.username}
            onChange={handleChange}
            required
          />
          
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={credentials.password}
            onChange={handleChange}
            required
          />
          
          <button type="submit">Login</button>
        </form>

        <p className="register-link" style={{ marginTop: '15px', fontSize: '0.9rem', color: '#ccc' }}>
          Don't have an account? <Link to="/register" style={{ color: '#f1c40f' }}>Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;