import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div style={{
      height: '80vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#fff',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '6rem', margin: 0, color: '#333' }}>404</h1>
      <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>Page Not Found</h2>
      <p style={{ color: '#888', marginBottom: '30px' }}>
        The movie reel you are looking for has been lost in the archives.
      </p>
      <Link to="/" style={{
        padding: '12px 30px',
        background: '#e50914',
        color: '#fff',
        borderRadius: '30px',
        fontWeight: 'bold'
      }}>
        Return Home
      </Link>
    </div>
  );
};

export default NotFoundPage;