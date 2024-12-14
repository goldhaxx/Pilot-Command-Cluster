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
        toast.error("Authentication Required", {
          description: "Please log in to continue.",
          duration: 3000,
        });
        sessionStorage.setItem('returnPath', location.pathname);
        navigate('/login');
        return;
      }

      try {
        // First verify the auth token
        await AuthService.verifyToken(token);
        
        // Then get EVE access token
        const eveToken = await AuthService.getEveAccessToken();
        if (eveToken) {
          await navigator.clipboard.writeText(eveToken);
          toast.success("Token Copied", {
            description: "The token has been copied to your clipboard.",
            duration: 2000,
          });
        } else {
          toast.error("Token Error", {
            description: "Could not retrieve EVE access token. Please try logging in again.",
            duration: 3000,
          });
          AuthService.clearToken();
          sessionStorage.setItem('returnPath', location.pathname);
          navigate('/login');
        }
      } catch (error) {
        console.error('Token verification/refresh error:', error);
        toast.error("Authentication Error", {
          description: "Your session has expired. Please log in again.",
          duration: 3000,
        });
        AuthService.clearToken();
        sessionStorage.setItem('returnPath', location.pathname);
        navigate('/login');
      }
    } catch (error) {
      console.error('Error in handleCopyToken:', error);
      toast.error("Unexpected Error", {
        description: "An error occurred while copying the token.",
        duration: 3000,
      });
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