// src/pages/RegistrationPage.jsx
import React, { useState } from 'react';
import apiClient from '../api/apiService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './RegistrationPage.css';

const RegistrationPage = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  // Initialize error as null so we can check it easily
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    
    try {
      await apiClient.post('/users/register', form);
      
      // ✅ SUCCESS: Notify user
      toast.success('Registration successful! Please login.');
      navigate('/login'); 
    } catch (err) {
      console.error("Registration Error:", err);
      
      // 🛡️ SAFETY LOGIC: Extract the string message safely
      let errorMessage = 'Registration failed. Please try again.';
      
      if (err.response && err.response.data) {
        const { message } = err.response.data;
        
        // Scenario 1: Backend sends a simple string message
        if (typeof message === 'string') {
          errorMessage = message;
        } 
        // Scenario 2: Backend sends an array of messages (common in NestJS validation)
        else if (Array.isArray(message)) {
          errorMessage = message[0];
        }
        // Scenario 3: Fallback if the whole data is the error
        else if (typeof err.response.data === 'string') {
           errorMessage = err.response.data;
        }
      }

      // 🛑 FINAL CHECK: Ensure errorMessage is strictly a string
      if (typeof errorMessage !== 'string') {
        errorMessage = "An unexpected error occurred.";
      }

      // Now it is safe to set state
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-card">
        <h2>Register</h2>
        
        {/* Only render if error exists and is a string */}
        {error && <p className="error">{error}</p>}
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button type="submit">Register</button>
        </form>
      </div>
    </div>
  );
};

export default RegistrationPage;