import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthService } from '../services/auth.service';

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const eveAccessToken = searchParams.get('eveAccessToken');
      const refreshToken = searchParams.get('refreshToken');
      const expiresIn = searchParams.get('expiresIn');
      
      if (!token || !eveAccessToken || !refreshToken) {
        setError('Authentication tokens not received');
        return;
      }

      try {
        await AuthService.verifyToken(token);
        AuthService.setToken(
          token, 
          eveAccessToken, 
          refreshToken, 
          expiresIn ? parseInt(expiresIn) : 1200
        );
        const returnPath = sessionStorage.getItem('returnPath');
        sessionStorage.removeItem('returnPath');
        navigate(returnPath || '/dashboard');
      } catch (error) {
        console.error('Authentication error:', error);
        setError('Failed to verify authentication token');
        AuthService.clearToken();
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <main className="flex items-center justify-center min-h-screen bg-eve-gradient">
      <div className="eve-window p-8 text-center max-w-md w-full mx-4">
        {error ? (
          <>
            <h2 className="text-eve.red text-eve-xl font-medium mb-4">
              Authentication Error
            </h2>
            <p className="text-eve.gray text-eve-normal mb-8">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="bg-eve.blue text-white px-6 py-3 rounded
                       text-eve-normal uppercase tracking-wide
                       transition-all duration-200
                       hover:bg-opacity-90 hover:eve-text-shadow"
            >
              Return to Login
            </button>
          </>
        ) : (
          <>
            <h2 className="eve-text-primary text-eve-xl font-medium mb-4">
              Authenticating...
            </h2>
            <p className="text-eve.gray text-eve-normal">
              Please wait while we complete your authentication.
            </p>
          </>
        )}
      </div>
    </main>
  );
};

export default AuthCallback; 