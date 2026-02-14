import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#141414',
          color: '#fff',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '3rem', color: '#e50914' }}>Whoops!</h1>
          <p>Something went wrong displaying this page.</p>
          <button 
            onClick={() => window.location.href = '/'}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#f1c40f',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Go Back Home
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;