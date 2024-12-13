import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { cn } from '../lib/utils';

interface DashboardCardProps {
  title: string;
  description: string;
  onClick?: () => void;
  comingSoon?: boolean;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  description,
  onClick,
  comingSoon
}) => (
  <div
    onClick={onClick}
    className={cn(
      "eve-window p-6 relative transition-all duration-200",
      "hover:eve-hover hover:-translate-y-1",
      onClick && "cursor-pointer"
    )}
  >
    <h3 className="eve-text-primary text-eve-normal uppercase tracking-wide mb-4">
      {title}
    </h3>
    <p className="text-eve.gray text-eve-small leading-relaxed">
      {description}
    </p>
    {comingSoon && (
      <span className="absolute top-4 right-4 bg-[#ff9800]/20 text-[#ff9800] 
                     px-2 py-1 rounded text-eve-small uppercase tracking-wider">
        Coming Soon
      </span>
    )}
  </div>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-eve-gradient p-8">
        <div className="eve-window max-w-6xl mx-auto">
          <div className="text-center p-8 border-b border-border/20">
            <h1 className="eve-text-primary text-eve-xl uppercase tracking-wider mb-4">
              Welcome to Pilot Command Cluster
            </h1>
            <p className="text-eve.gray text-eve-normal max-w-2xl mx-auto">
              Your centralized hub for EVE Online tools and utilities. Access your character information,
              manage your assets, and stay connected with your corporation.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-8">
            <DashboardCard
              title="Character Profile"
              description="View your character details, skills, and current location"
              onClick={() => navigate('/profile')}
            />
            
            <DashboardCard
              title="Corporation Tools"
              description="Access corporation management tools and utilities"
              comingSoon
            />
            
            <DashboardCard
              title="Market Analysis"
              description="Track market trends and manage your trading operations"
              comingSoon
            />
            
            <DashboardCard
              title="Fleet Operations"
              description="Coordinate fleet movements and manage operations"
              comingSoon
            />
          </div>
        </div>
      </main>
    </>
  );
};

export default Dashboard; 