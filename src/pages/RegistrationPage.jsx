import React, { useState } from 'react';
import apiClient from '../api/apiService';
import { useNavigate, Link } from 'react-router-dom';
import './RegistrationPage.css';

const RegistrationPage = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  
  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // New success state

  const navigate = useNavigate();

  const handleChange = (e) => {
    if (error) setError(null);
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Prevent Spam
    if (isLoading) return;

    // 2. Start Loading
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    
    try {
      await apiClient.post('/users/register', form);
      
      // 3. Show Success Message
      setSuccess("Registration successful! Redirecting to login...");
      
      // Short delay so user can read the message before redirect
      setTimeout(() => {
        navigate('/login');
      }, 1500);

    } catch (err) {
      console.error("Registration Error:", err);
      
      // 4. Safe Error Extraction
      let errorMessage = 'Registration failed. Please try again.';
      if (err.response && err.response.data) {
        const { message } = err.response.data;
        if (Array.isArray(message)) {
          errorMessage = message.join(', ');
        } else if (typeof message === 'string') {
          errorMessage = message;
        } else if (typeof err.response.data === 'string') {
           errorMessage = err.response.data;
        }
      }

      setError(errorMessage);
    } finally {
      // 5. Unlock button (unless success, then we redirecting anyway)
      if (!success) setIsLoading(false);
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-card">
        <h2>Register</h2>
        
        {/* INLINE ERROR */}
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

        {/* INLINE SUCCESS */}
        {success && (
          <div style={{ 
            backgroundColor: '#e8f5e9', 
            color: '#2e7d32', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '15px', 
            fontSize: '0.9rem',
            border: '1px solid #a5d6a7'
          }}>
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
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
              value={form.password}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading || success} 
            style={{ opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
          >
            {isLoading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="register-link" style={{ marginTop: '15px', fontSize: '0.9rem', color: '#ccc' }}>
          Already have an account? <Link to="/login" style={{ color: '#f1c40f' }}>Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default RegistrationPage;