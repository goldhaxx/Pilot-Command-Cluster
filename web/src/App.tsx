import React, { StrictMode } from 'react';
import './styles/globals.css';
import { 
  Route, 
  Navigate,
  createBrowserRouter,
  RouterProvider,
  createRoutesFromElements
} from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';
import ProfilePage from './pages/ProfilePage';
import Dashboard from './pages/Dashboard';
import PlanetaryIndustry from './pages/PlanetaryIndustry';
import { AuthService } from './services/auth.service';

// Protected Route wrapper
const ProtectedRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  return AuthService.isAuthenticated() ? element : <Navigate to="/login" />;
};

// Create router with all v7 future flags enabled
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth-callback" element={<AuthCallback />} />
      <Route path="/profile" element={<ProtectedRoute element={<ProfilePage />} />} />
      <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
      <Route path="/planetary-industry" element={<ProtectedRoute element={<PlanetaryIndustry />} />} />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Route>
  ),
  {
    basename: '/'
  }
);

const App: React.FC = () => {
  return (
    <StrictMode>
      <div style={styles.app}>
        <RouterProvider router={router} />
      </div>
    </StrictMode>
  );
};

const styles = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    color: '#ffffff',
  },
};

export default App; 