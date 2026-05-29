import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('OpenChat encountered an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100vh', width: '100vw', backgroundColor: '#09090b', color: '#ededed',
          fontFamily: 'Inter, system-ui, sans-serif', padding: '20px', textAlign: 'center'
        }}>
          <AlertTriangle size={64} color="#ef4444" style={{ marginBottom: '24px' }} />
          <h1 style={{ fontSize: '2rem', marginBottom: '16px', fontWeight: '600' }}>Something went wrong</h1>
          <p style={{ color: '#a1a1aa', maxWidth: '500px', marginBottom: '32px', lineHeight: '1.6' }}>
            We're sorry, but the application crashed. An unexpected error occurred in the OpenChat interface.
          </p>
          <div style={{
            backgroundColor: '#18181b', padding: '16px', borderRadius: '8px', 
            border: '1px solid #27272a', maxWidth: '600px', width: '100%',
            overflowX: 'auto', textAlign: 'left', marginBottom: '32px',
            color: '#ef4444', fontFamily: 'monospace', fontSize: '0.875rem'
          }}>
            {this.state.error?.toString()}
          </div>
          <button 
            onClick={() => window.location.reload()}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              backgroundColor: '#fafafa', color: '#18181b', border: 'none',
              padding: '12px 24px', borderRadius: '6px', fontSize: '1rem',
              fontWeight: '500', cursor: 'pointer', transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e4e4e7'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
          >
            <RefreshCw size={18} />
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
