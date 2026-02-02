import React from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches render errors and displays a recovery UI instead of a blank screen.
 */
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Particle Life error:', error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#000',
            color: '#e0e0e0',
            fontFamily: 'system-ui, sans-serif',
            textAlign: 'center',
            padding: '2rem',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            🌊 Something went wrong
          </h1>
          <p style={{ color: '#888', marginBottom: '1.5rem', maxWidth: '400px' }}>
            The simulation encountered an error. This can happen with extreme settings.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: '10px 24px',
              background: '#33ff77',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ↺ Reload
          </button>
          {this.state.error && (
            <pre
              style={{
                marginTop: '1.5rem',
                fontSize: '11px',
                color: '#666',
                maxWidth: '80vw',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
              }}
            >
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
