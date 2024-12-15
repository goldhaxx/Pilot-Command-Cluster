import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthService } from '../services/auth.service';
import Navigation from '../components/Navigation';
import { Sidebar } from '../components/Sidebar';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const token = AuthService.getToken();
        if (!token) {
          setError('No authentication token found');
          sessionStorage.setItem('returnPath', location.pathname);
          navigate('/login');
          return;
        }

        await AuthService.verifyToken(token);
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
        setError(errorMessage);
        console.error('Authentication error:', err);
        sessionStorage.setItem('returnPath', location.pathname);
        navigate('/login');
      }
    };

    verifyAuth();
  }, [navigate, location.pathname]);

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar className="w-64 border-r" />
        <div className="flex-1">
          <Navigation />
          <main className="min-h-screen bg-eve-gradient p-8">
            <div className="eve-window p-8">
              <h2 className="eve-text-primary text-eve-xl mb-4">Loading...</h2>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen">
        <Sidebar className="w-64 border-r" />
        <div className="flex-1">
          <Navigation />
          <main className="min-h-screen bg-eve-gradient p-8">
            <div className="eve-window p-8">
              <h2 className="text-eve.red text-eve-xl mb-4">Error</h2>
              <p className="text-eve.gray">{error}</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar className="w-64 border-r" />
      <div className="flex-1">
        <Navigation />
        <main className="min-h-screen bg-eve-gradient p-8">
          <div className="eve-window p-8">
            <h2 className="eve-text-primary text-eve-xl mb-8">Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Add dashboard content here */}
              <div className="eve-window p-6">
                <h3 className="text-eve.blue text-eve-large mb-4">Quick Actions</h3>
                <div className="space-y-4">
                  <button
                    onClick={() => navigate('/profile')}
                    className="w-full px-4 py-3 text-white hover:eve-hover rounded transition-colors"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => navigate('/planetary-industry')}
                    className="w-full px-4 py-3 text-white hover:eve-hover rounded transition-colors"
                  >
                    Planetary Industry
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage; 