// src/pages/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import { forgotPassword } from '../api/auth';
import { toast } from 'react-toastify';
import './LoginPage.css'; // Reuse login styles

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      toast.success("Reset link sent! (Check Backend Console in Dev)");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2>Reset Password</h2>
        <p style={{color: '#666', marginBottom: '20px', fontSize: '0.9rem'}}>Enter your email to receive a reset link.</p>
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Enter email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send Link'}</button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;