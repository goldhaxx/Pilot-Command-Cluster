import React from 'react';
import { AuthService } from '../services/auth.service';

const LoginPage: React.FC = () => {
  const handleLogin = () => {
    AuthService.initiateLogin();
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