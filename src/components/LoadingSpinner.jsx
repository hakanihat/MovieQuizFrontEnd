// src/components/LoadingSpinner.js
import React from "react";
import "./LoadingSpinner.css";

const LoadingSpinner = () => {
  return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <div className="loading-text">Loading Movies...</div>
    </div>
  );
};

export default LoadingSpinner;