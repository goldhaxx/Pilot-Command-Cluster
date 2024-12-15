import React, { useState } from 'react';
import { AuthService } from '../services/auth.service';
import { logErrorEvent, logLifecycleEvent } from '../utils/logger';

const LoginPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setError(null);
      
      logLifecycleEvent('LOGIN_INITIATED', {
        timestamp: new Date().toISOString(),
        location: window.location.href
      });
      
      await AuthService.initiateLogin();
      
      logLifecycleEvent('LOGIN_REDIRECT_STARTED', {
        timestamp: new Date().toISOString(),
        redirectUrl: AuthService.getLoginUrl()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate login';
      
      logErrorEvent(error, {
        context: 'LoginPage.handleLogin',
        timestamp: new Date().toISOString()
      });
      
      setError(errorMessage);
      console.error('Failed to initiate login:', error);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-eve-gradient">
      <div className="eve-window p-8 text-center max-w-md w-full mx-4">
        <h1 className="eve-text-primary text-eve-xl font-medium uppercase tracking-wider mb-4">
          Pilot Command Cluster
        </h1>
        <p className="text-eve.gray text-eve-normal mb-8">
          Sign in with your EVE Online account
        </p>
        {error && (
          <div className="bg-eve.red bg-opacity-20 border border-eve.red rounded p-4 mb-8">
            <p className="text-eve.red text-eve-normal">{error}</p>
          </div>
        )}
        <button
          onClick={handleLogin}
          className="bg-eve.blue text-white px-6 py-3 rounded
                   text-eve-normal uppercase tracking-wide
                   transition-all duration-200
                   hover:bg-opacity-90 hover:eve-text-shadow"
        >
          Login with EVE Online
        </button>
      </div>
    </main>
  );
};

export default LoginPage; 