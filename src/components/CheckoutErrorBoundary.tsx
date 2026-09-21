import * as React from 'react';

export default class CheckoutErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(_error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("CheckoutErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if ((this as any).state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', color: '#fff', background: '#0c0c0e', borderRadius: '8px' }}>
          <h3>Checkout Modal Error</h3>
          <p style={{ color: '#a1a1aa', fontSize: '14px' }}>Failed to load checkout interface.</p>
          <button onClick={() => (this as any).setState({ hasError: false })} style={{ marginTop: '10px', padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Try Again
          </button>
        </div>
      );
    }
    return (this as any).props.children;
  }
}
