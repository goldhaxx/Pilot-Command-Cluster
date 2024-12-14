import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthService } from '../services/auth.service';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { Toaster } from './ui/sonner';

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    AuthService.clearToken();
    navigate('/login');
  };

  const handleCopyToken = async () => {
    try {
      const token = AuthService.getToken();
      if (!token) {
        sessionStorage.setItem('returnPath', location.pathname);
        navigate('/login');
        return;
      }

      const eveToken = await AuthService.getEveAccessToken();
      if (eveToken) {
        await navigator.clipboard.writeText(eveToken);
        toast.success("Token Copied", {
          description: "The token has been copied to your clipboard.",
          duration: 2000,
        });
      } else {
        sessionStorage.setItem('returnPath', location.pathname);
        navigate('/login');
      }
    } catch (error) {
      console.error('Error copying token:', error);
      sessionStorage.setItem('returnPath', location.pathname);
      navigate('/login');
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 eve-window border-b">
        <div className="flex items-center">
          <span className="eve-text-primary text-eve-large uppercase tracking-wider font-medium">
            Pilot Command Cluster
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className={cn(
              "px-4 py-2 text-eve-normal uppercase tracking-wider transition-colors",
              "hover:eve-hover rounded",
              isActive('/dashboard') 
                ? "bg-accent/10 text-eve.blue eve-border" 
                : "text-white"
            )}
          >
            Dashboard
          </button>
          
          <button
            onClick={() => navigate('/profile')}
            className={cn(
              "px-4 py-2 text-eve-normal uppercase tracking-wider transition-colors",
              "hover:eve-hover rounded",
              isActive('/profile') 
                ? "bg-accent/10 text-eve.blue eve-border" 
                : "text-white"
            )}
          >
            Profile
          </button>

          <button
            onClick={handleCopyToken}
            className="px-4 py-2 text-eve-normal uppercase tracking-wider
                     bg-accent/10 text-eve.blue border border-accent/30
                     hover:bg-accent/20 hover:border-accent/40
                     transition-colors rounded"
          >
            Copy Token
          </button>
          
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-eve-normal uppercase tracking-wider
                     bg-destructive/10 text-eve.red border border-destructive/30
                     hover:bg-destructive/20 hover:border-destructive/40
                     transition-colors rounded"
          >
            Logout
          </button>
        </div>
      </nav>
      <Toaster />
    </>
  );
};

export default Navigation; 