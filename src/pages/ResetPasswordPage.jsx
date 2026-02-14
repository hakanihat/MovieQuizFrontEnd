// src/pages/ResetPasswordPage.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../api/auth';
import { toast } from 'react-toastify';
import './LoginPage.css';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await resetPassword(token, password);
      toast.success("Password reset! Please login.");
      navigate('/login');
    } catch (error) {
      toast.error("Invalid or expired token");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2>New Password</h2>
        <form onSubmit={handleSubmit}>
          <input type="password" placeholder="New Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit">Reset Password</button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;