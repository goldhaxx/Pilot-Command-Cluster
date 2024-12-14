import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthService } from '../services/auth.service';
import { ESIService } from '../services/esi.service';
import Navigation from '../components/Navigation';
import { Sidebar } from '../components/Sidebar';
import styles from './PlanetaryIndustry.module.css';
import { InstallationType, INSTALLATION_INFO, EVE_TYPE_ID_TO_INSTALLATION } from '../constants/installations';
import { PLANET_TYPE_IDS } from '../constants/planets';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "../components/ui/drawer";
import NetworkVisualization from '../components/NetworkVisualization';

interface PlanetDetails {
  links: Array<{
    destination_pin_id: number;
    link_level: number;
    source_pin_id: number;
  }>;
  pins: Array<{
    contents: Array<{ 
      amount: number; 
      type_id: number;
      type_name?: string;
    }>;
    latitude: number;
    longitude: number;
    pin_id: number;
    type_id: number;
    type_name?: string;
    last_cycle_start?: string;
    schematic_id?: number;
    expiry_time?: string;
    install_time?: string;
    extractor_details?: {
      cycle_time: number;
      heads: Array<{ head_id: number; latitude: number; longitude: number }>;
      product_type_id: number;
      product_type_name?: string;
      qty_per_cycle: number;
    };
  }>;
  routes: Array<{
    content_type_id: number;
    content_type_name?: string;
    destination_pin_id: number;
    quantity: number;
    route_id: number;
    source_pin_id: number;
    waypoints: any[];
  }>;
}

interface Planet {
  id: string;
  name: string;
  type: string;
  installations: Installation[];
  isColonized: boolean;
  upgrade_level: number;
  num_pins: number;
  last_update: string;
}

interface Installation {
  id: string;
  type: InstallationType;
  type_id: number;
  type_name: string;
  status: 'active' | 'inactive';
  contents?: Array<{ amount: number; type_id: number }>;
  last_cycle_start?: string;
  expiry_time?: string;
  extractor_details?: {
    cycle_time: number;
    heads: Array<{ head_id: number; latitude: number; longitude: number }>;
    product_type_id: number;
    product_type_name?: string;
    qty_per_cycle: number;
  };
}

// Group installations by their category
const groupInstallations = (installations: Installation[]) => {
  console.log('Grouping installations:', installations.map(i => ({
    id: i.id,
    type_id: i.type_id,
    type_name: i.type_name,
    mapped_type: i.type
  })));
  
  return {
    extraction: installations.filter(i => i.type === InstallationType.EXTRACTOR),
    storage: installations.filter(i => 
      i.type === InstallationType.STORAGE || 
      i.type === InstallationType.SPACEPORT || 
      i.type === InstallationType.COMMAND_CENTER
    ),
    production: installations.filter(i => 
      i.type === InstallationType.PROCESSOR || 
      i.type === InstallationType.FACTORY
    ),
  };
};

const getPlanetImageUrl = (planetType: string): string => {
  const typeId = PLANET_TYPE_IDS[planetType.toLowerCase()] || PLANET_TYPE_IDS.unknown;
  // Use icon variation for planets as render is not available
  return `https://images.evetech.net/types/${typeId}/icon`;
};

const getTypeImageUrl = (typeId: number, variation: string = 'icon'): string => {
  // EVE image server URL format: https://images.evetech.net/{category}/{id}/{variation}
  // For planetary installations, we need to use 'types' category
  return `https://images.evetech.net/types/${typeId}/${variation}?size=32`;
};

const calculateTimeRemaining = (startTime: string, cycleDuration: number): string => {
  const cycleStart = new Date(startTime).getTime();
  const now = new Date().getTime();
  const elapsed = now - cycleStart;
  const currentCycleElapsed = elapsed % (cycleDuration * 1000);
  const remaining = cycleDuration * 1000 - currentCycleElapsed;
  
  const minutes = Math.floor(remaining / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
  
  return `${minutes}m ${seconds}s`;
};

const calculateExpiryRemaining = (expiryTime: string): string => {
  const expiry = new Date(expiryTime).getTime();
  const now = new Date().getTime();
  const remaining = expiry - now;
  
  if (remaining <= 0) return 'Expired';
  
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
};

interface InstallationProps {
  installation: Installation;
}

const InstallationComponent: React.FC<InstallationProps> = ({ installation }) => {
  const [cycleTime, setCycleTime] = useState<string | null>(null);
  const installationInfo = INSTALLATION_INFO[installation.type];

  useEffect(() => {
    // Handle cycle timers for both extractors and production facilities
    if (installation.last_cycle_start && 
       (installation.type === InstallationType.EXTRACTOR || 
        installation.type === InstallationType.PROCESSOR || 
        installation.type === InstallationType.FACTORY)) {
      
      // Get cycle duration based on installation type
      let cycleDuration = 900; // Default 15 minutes
      if (installation.type === InstallationType.EXTRACTOR) {
        cycleDuration = installation.extractor_details?.cycle_time || 900;
      } else if (installation.type === InstallationType.PROCESSOR) {
        cycleDuration = 1800; // 30 minutes for basic industry
      } else if (installation.type === InstallationType.FACTORY) {
        cycleDuration = 3600; // 60 minutes for advanced industry
      }

      // Initial calculation
      setCycleTime(calculateTimeRemaining(installation.last_cycle_start, cycleDuration));

      // Update every second
      const timer = setInterval(() => {
        setCycleTime(calculateTimeRemaining(installation.last_cycle_start!, cycleDuration));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [installation.last_cycle_start, installation.type, installation.extractor_details?.cycle_time]);

  // Show expiry timer for extractors only
  const expiryRemaining = installation.type === InstallationType.EXTRACTOR && installation.expiry_time
    ? calculateExpiryRemaining(installation.expiry_time)
    : null;

  // Get the display name, preferring the API type name over our mapping
  const displayName = installation.type_name || installationInfo?.name || `Type ${installation.type_id}`;

  // Determine if we should show the cycle timer
  const showCycleTimer = cycleTime && (
    (installation.type === InstallationType.EXTRACTOR && 
     installation.expiry_time && 
     new Date(installation.expiry_time) > new Date()) ||
    installation.type === InstallationType.PROCESSOR ||
    installation.type === InstallationType.FACTORY
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div 
            className={`${styles.installation} ${installation.status === 'inactive' ? styles.inactive : ''}`}
            data-cycle={cycleTime}
            data-expiry={expiryRemaining}
          >
            <img
              src={getTypeImageUrl(installation.type_id)}
              alt={displayName}
              className={`w-8 h-8 ${installation.status === 'inactive' ? 'opacity-50' : ''}`}
              onError={(e) => {
                console.error('Failed to load image:', e.currentTarget.src);
                e.currentTarget.src = getTypeImageUrl(installation.type_id, 'render');
              }}
            />
            {showCycleTimer && (
              <div className="absolute -bottom-6 left-0 right-0 text-center text-xs text-eve.blue">
                {cycleTime}
              </div>
            )}
            {expiryRemaining && (
              <div className="absolute -top-6 left-0 right-0 text-center text-xs text-eve.red">
                {expiryRemaining}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="p-2">
            <h4 className="font-medium text-white">{displayName}</h4>
            <p className="text-sm text-eve.gray">{installationInfo?.description || 'Planetary installation'}</p>
            <p className="text-sm text-eve.blue mt-1">Status: {installation.status}</p>
            {installation.type === InstallationType.EXTRACTOR && installation.extractor_details && (
              <>
                <p className="text-sm text-eve.blue">
                  Product: {installation.extractor_details.product_type_name || `Type ${installation.extractor_details.product_type_id}`}
                </p>
                <p className="text-sm text-eve.gray">
                  Heads: {installation.extractor_details.heads.length}
                </p>
                {cycleTime && installation.expiry_time && new Date(installation.expiry_time) > new Date() && (
                  <p className="text-sm text-eve.blue">Cycle: {cycleTime}</p>
                )}
                {expiryRemaining && (
                  <p className="text-sm text-eve.red">Expires: {expiryRemaining}</p>
                )}
              </>
            )}
            {(installation.type === InstallationType.PROCESSOR || installation.type === InstallationType.FACTORY) && cycleTime && (
              <p className="text-sm text-eve.blue">Cycle: {cycleTime}</p>
            )}
            {installation.contents && installation.contents.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-eve.blue mb-1">Contents:</p>
                {installation.contents.map((content, idx) => (
                  <div key={idx} className="text-sm text-eve.gray flex justify-between">
                    <span>Type {content.type_id}</span>
                    <span>{content.amount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const PlanetaryIndustry: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [planets, setPlanets] = useState<Planet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [networkDrawerOpen, setNetworkDrawerOpen] = useState(false);
  const [planetDetails, setPlanetDetails] = useState<PlanetDetails | null>(null);

  const PlanetImage: React.FC<{ planet: Planet }> = React.memo(({ planet }) => {
    if (!planet.isColonized) {
      return (
        <div className="w-32 h-32 flex items-center justify-center">
          <span className="text-4xl text-eve.gray">+</span>
        </div>
      );
    }

    return (
      <img
        src={getPlanetImageUrl(planet.type)}
        alt={planet.name}
        className="w-32 h-32 object-cover rounded-md"
      />
    );
  });

  useEffect(() => {
    const loadPlanetaryData = async () => {
      try {
        const token = AuthService.getToken();
        if (!token) {
          sessionStorage.setItem('returnPath', location.pathname);
          navigate('/login');
          setLoading(false);
          return;
        }

        try {
          const userData = await AuthService.verifyToken(token);
          const planetList = await ESIService.getInstance().getCharacterPlanets(userData.characterId);
          
          const planetDetailsPromises = planetList.map(planet => 
            ESIService.getInstance().getPlanetDetails(userData.characterId, planet.planet_id)
          );
          
          const planetDetails = await Promise.all(planetDetailsPromises);
          
          const transformedPlanets = planetList.map((planet, index) => {
            const details = planetDetails[index];
            const installations = details.pins
              .map(pin => {
                console.log('Pin data:', {
                  pin_id: pin.pin_id,
                  type_id: pin.type_id,
                  type_name: pin.type_name,
                  mapped_type: EVE_TYPE_ID_TO_INSTALLATION[pin.type_id],
                  has_extractor: !!pin.extractor_details,
                  last_cycle: pin.last_cycle_start,
                  expiry: pin.expiry_time
                });
                
                // Get the installation type from the type ID mapping
                const installationType = EVE_TYPE_ID_TO_INSTALLATION[pin.type_id];
                console.log('Type mapping:', {
                  type_id: pin.type_id,
                  mapped_type: installationType,
                  fallback: InstallationType.PROCESSOR
                });
                
                // Include all pins, even if we don't recognize the type
                const installation = {
                  id: pin.pin_id.toString(),
                  type: installationType || InstallationType.PROCESSOR, // Default to PROCESSOR if type not recognized
                  type_id: pin.type_id,
                  type_name: pin.type_name,
                  status: pin.last_cycle_start ? 'active' : 'inactive',
                  contents: pin.contents || [],
                  last_cycle_start: pin.last_cycle_start,
                  expiry_time: pin.expiry_time,
                  extractor_details: pin.extractor_details
                } as Installation;
                
                console.log('Created installation:', installation);
                return installation;
              });

            console.log('Final installations for planet:', installations);

            return {
              id: planet.planet_id.toString(),
              name: `Planet ${planet.planet_id} - ${planet.planet_type}`,
              type: planet.planet_type,
              installations,
              isColonized: true,
              upgrade_level: planet.upgrade_level,
              num_pins: planet.num_pins,
              last_update: planet.last_update
            };
          });

          // Add empty planet slots to reach 5 total
          while (transformedPlanets.length < 5) {
            transformedPlanets.push({
              id: `uncolonized-${transformedPlanets.length}`,
              name: 'Unestablished Colony',
              type: 'unknown',
              installations: [],
              isColonized: false,
              upgrade_level: 0,
              num_pins: 0,
              last_update: ''
            });
          }

          setPlanets(transformedPlanets);
        } catch (err) {
          console.error('Error loading planetary data:', err);
          setError('Failed to load planetary information');
        } finally {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading planetary data:', err);
        setError('Failed to load planetary information');
      } finally {
        setLoading(false);
      }
    };

    loadPlanetaryData();
  }, []);

  const handlePlanetSelect = async (planet: Planet) => {
    if (!planet.isColonized) {
      return;
    }

    setSelectedPlanet(planet);

    try {
      const userData = await AuthService.verifyToken(AuthService.getToken()!);
      const details = await ESIService.getInstance().getPlanetDetails(
        userData.characterId,
        parseInt(planet.id)
      );

      // Log raw pin data
      console.log('Raw pin data:', details.pins.map(pin => ({
        id: pin.pin_id,
        lat: pin.latitude,
        lon: pin.longitude,
        type: pin.type_id,
        type_name: pin.type_name
      })));

      // Create a map of pin IDs to their locations
      const pinLocations = new Map(
        details.pins.map(pin => [
          pin.pin_id,
          { latitude: pin.latitude, longitude: pin.longitude }
        ])
      );

      console.log('Pin location map:', 
        Array.from(pinLocations.entries()).map(([id, loc]) => ({
          id,
          lat: loc.latitude,
          lon: loc.longitude
        }))
      );

      // Enhance links with endpoint locations
      const enhancedLinks = details.links.map(link => {
        const source = pinLocations.get(link.source_pin_id);
        const dest = pinLocations.get(link.destination_pin_id);
        
        console.log('Enhancing link:', {
          source_id: link.source_pin_id,
          dest_id: link.destination_pin_id,
          source_loc: source,
          dest_loc: dest
        });

        return {
          ...link,
          source_location: source,
          destination_location: dest
        };
      });

      // Enhance routes with endpoint locations
      const enhancedRoutes = details.routes.map(route => {
        const source = pinLocations.get(route.source_pin_id);
        const dest = pinLocations.get(route.destination_pin_id);
        
        console.log('Enhancing route:', {
          source_id: route.source_pin_id,
          dest_id: route.destination_pin_id,
          source_loc: source,
          dest_loc: dest,
          content: route.content_type_id,
          quantity: route.quantity
        });

        return {
          ...route,
          source_location: source,
          destination_location: dest
        };
      });

      // Update the details with enhanced data
      const enhancedDetails = {
        ...details,
        links: enhancedLinks,
        routes: enhancedRoutes
      };

      console.log('Final enhanced data:', {
        pins: enhancedDetails.pins.length,
        links: enhancedDetails.links.map(l => ({
          source: l.source_pin_id,
          dest: l.destination_pin_id,
          has_coords: !!(l.source_location && l.destination_location)
        })),
        routes: enhancedDetails.routes.map(r => ({
          source: r.source_pin_id,
          dest: r.destination_pin_id,
          has_coords: !!(r.source_location && r.destination_location)
        }))
      });

      setPlanetDetails(enhancedDetails);
      setDrawerOpen(true);
    } catch (err) {
      console.error('Error fetching planet details:', err);
      setError('Failed to load planet details');
    }
  };

  const renderInstallation = (installation: Installation) => {
    return <InstallationComponent key={installation.id} installation={installation} />;
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar className="w-64 border-r" />
        <div className="flex-1">
          <Navigation />
          <main className="min-h-screen bg-eve-gradient p-8">
            <div className="eve-window max-w-3xl mx-auto p-8">
              <h2 className="eve-text-primary text-eve-xl mb-8">Loading Planetary Industry...</h2>
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
            <div className="eve-window max-w-3xl mx-auto p-8">
              <h2 className="text-eve.red text-eve-xl mb-4">Error</h2>
              <p className="text-eve.gray">{error}</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen">
        <Sidebar className="w-64 border-r" />
        <div className="flex-1">
          <Navigation />
          <main className="min-h-screen bg-eve-gradient p-8">
            <div className="eve-window max-w-5xl mx-auto">
              <div className="eve-header">
                <h2 className="eve-text-primary text-eve-xl">Planetary Industry</h2>
              </div>
              
              <div className="p-8 space-y-6">
                {planets.map((planet) => (
                  <div 
                    key={planet.id} 
                    className={`${styles.planetCard} ${selectedPlanet?.id === planet.id ? styles.selected : ''}`}
                    onClick={() => handlePlanetSelect(planet)}
                    style={{ cursor: planet.isColonized ? 'pointer' : 'default' }}
                  >
                    <div className="flex items-start gap-4 p-4">
                      <div className={styles.planetImage}>
                        <PlanetImage planet={planet} />
                      </div>

                      {/* Planet Info */}
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className={styles.planetName}>
                            {planet.name}
                          </h3>
                          {planet.isColonized && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlanetSelect(planet);
                                setNetworkDrawerOpen(true);
                              }}
                              className="bg-eve.blue hover:bg-eve.blue/80 text-white px-4 py-2 rounded text-sm"
                            >
                              View Network
                            </button>
                          )}
                        </div>

                        {planet.isColonized ? (
                          <div className="relative min-h-[300px]">
                            <div className="grid grid-cols-2 gap-8">
                              {/* Left Column */}
                              <div className="space-y-8">
                                {/* Extraction Section */}
                                <div className="bg-[rgba(0,0,0,0.3)] p-4 rounded-md">
                                  <h4 className="text-eve.blue text-sm font-medium mb-4 flex items-center">
                                    <span className="mr-2">⚒️</span> Extraction
                                  </h4>
                                  <div className={styles.installationGrid}>
                                    {groupInstallations(planet.installations).extraction.map(renderInstallation)}
                                  </div>
                                </div>
                                
                                {/* Storage Section */}
                                <div className="bg-[rgba(0,0,0,0.3)] p-4 rounded-md">
                                  <h4 className="text-eve.blue text-sm font-medium mb-4 flex items-center">
                                    <span className="mr-2">📦</span> Storage
                                  </h4>
                                  <div className={styles.installationGrid}>
                                    {groupInstallations(planet.installations).storage.map(renderInstallation)}
                                  </div>
                                </div>
                              </div>

                              {/* Right Column - Production Section */}
                              <div className="bg-[rgba(0,0,0,0.3)] p-4 rounded-md">
                                <h4 className="text-eve.blue text-sm font-medium mb-4 flex items-center">
                                  <span className="mr-2">⚙️</span> Production
                                </h4>
                                <div className={styles.installationGrid}>
                                  {groupInstallations(planet.installations).production.map(renderInstallation)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className={styles.uncolonized}>
                            Bring a corresponding Command Center to any planet to establish a colony
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 flex justify-end">
                <button className={styles.actionButton}>Set Destination</button>
              </div>
            </div>
          </main>
        </div>
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader className="select-text">
            <DrawerTitle>Planet Details</DrawerTitle>
            <DrawerDescription>
              {selectedPlanet?.name}
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 overflow-y-auto max-h-[calc(75vh-80px)] select-text">
            {planetDetails && (
              <div className="space-y-8">
                {/* Connections Visualization */}
                <div className="relative h-[600px] bg-[rgba(0,0,0,0.2)] rounded-lg overflow-hidden">
                  <NetworkVisualization
                    links={planetDetails.links.map(l => ({
                      source_id: l.source_pin_id.toString(),
                      dest_id: l.destination_pin_id.toString()
                    }))}
                    routes={planetDetails.routes.map(r => ({
                      source_id: r.source_pin_id.toString(),
                      dest_id: r.destination_pin_id.toString(),
                      content: r.content_type_id
                    }))}
                    installations={planetDetails.pins.map(pin => ({
                      id: pin.pin_id.toString(),
                      type: EVE_TYPE_ID_TO_INSTALLATION[pin.type_id],
                      type_id: pin.type_id,
                      type_name: pin.type_name || '',
                      status: 'active'
                    }))}
                    width={800}
                    height={600}
                  />
                </div>

                {/* Installation Grid */}
                <div className="grid grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Extraction Section */}
                    <div className="bg-[rgba(0,0,0,0.3)] p-4 rounded-md">
                      <h4 className="text-eve.blue text-sm font-medium mb-4 flex items-center">
                        <span className="mr-2">⚒️</span> Extraction
                      </h4>
                      <div className={styles.installationGrid}>
                        {selectedPlanet && groupInstallations(selectedPlanet.installations).extraction.map(renderInstallation)}
                      </div>
                    </div>
                    
                    {/* Storage Section */}
                    <div className="bg-[rgba(0,0,0,0.3)] p-4 rounded-md">
                      <h4 className="text-eve.blue text-sm font-medium mb-4 flex items-center">
                        <span className="mr-2">📦</span> Storage
                      </h4>
                      <div className={styles.installationGrid}>
                        {selectedPlanet && groupInstallations(selectedPlanet.installations).storage.map(renderInstallation)}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Production Section */}
                    <div className="bg-[rgba(0,0,0,0.3)] p-4 rounded-md">
                      <h4 className="text-eve.blue text-sm font-medium mb-4 flex items-center">
                        <span className="mr-2">⚙️</span> Production
                      </h4>
                      <div className={styles.installationGrid}>
                        {selectedPlanet && groupInstallations(selectedPlanet.installations).production.map(renderInstallation)}
                      </div>
                    </div>

                    {/* Links & Routes Section */}
                    <div className="bg-[rgba(0,0,0,0.3)] p-4 rounded-md">
                      <h4 className="text-eve.blue text-sm font-medium mb-4">Links & Routes</h4>
                      <div className="space-y-4">
                        {/* Links */}
                        <div>
                          <h5 className="text-white text-sm mb-2">Links</h5>
                          <div className="space-y-1">
                            {planetDetails.links.map((link, index) => (
                              <div key={index} className="text-sm text-eve.gray flex justify-between">
                                <span>Level {link.link_level}</span>
                                <span>{link.source_pin_id} → {link.destination_pin_id}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Routes */}
                        <div>
                          <h5 className="text-white text-sm mb-2">Routes</h5>
                          <div className="space-y-2">
                            {planetDetails.routes.map(route => (
                              <div key={route.route_id} className="p-2 border border-eve.darkgray/20 rounded">
                                <div className="text-sm text-eve.gray space-y-1">
                                  <div className="flex justify-between">
                                    <span>Content:</span>
                                    <span>{route.content_type_name || `Type ${route.content_type_id}`}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Quantity:</span>
                                    <span>{route.quantity}</span>
                                  </div>
                                  <div className="text-xs">
                                    {route.source_pin_id} → {route.destination_pin_id}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Network Visualization Drawer */}
      <Drawer open={networkDrawerOpen} onOpenChange={setNetworkDrawerOpen}>
        <DrawerContent>
          <DrawerHeader className="select-text">
            <DrawerTitle>Network Visualization</DrawerTitle>
            <DrawerDescription>
              {selectedPlanet?.name}
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 overflow-y-auto max-h-[calc(75vh-80px)] select-text">
            {planetDetails && (
              <div className="space-y-8">
                {/* Connections Visualization */}
                <div className="relative h-[600px] bg-[rgba(0,0,0,0.2)] rounded-lg overflow-hidden">
                  <NetworkVisualization
                    links={planetDetails.links.map(l => ({
                      source_id: l.source_pin_id.toString(),
                      dest_id: l.destination_pin_id.toString()
                    }))}
                    routes={planetDetails.routes.map(r => ({
                      source_id: r.source_pin_id.toString(),
                      dest_id: r.destination_pin_id.toString(),
                      content: r.content_type_id
                    }))}
                    installations={planetDetails.pins.map(pin => ({
                      id: pin.pin_id.toString(),
                      type: EVE_TYPE_ID_TO_INSTALLATION[pin.type_id],
                      type_id: pin.type_id,
                      type_name: pin.type_name || '',
                      status: 'active'
                    }))}
                    width={800}
                    height={600}
                  />
                </div>

                {/* Links & Routes Section */}
                <div className="bg-[rgba(0,0,0,0.3)] p-4 rounded-md">
                  <h4 className="text-eve.blue text-sm font-medium mb-4">Links & Routes</h4>
                  <div className="space-y-4">
                    {/* Links */}
                    <div>
                      <h5 className="text-white text-sm mb-2">Links</h5>
                      <div className="space-y-1">
                        {planetDetails.links.map((link, index) => (
                          <div key={index} className="text-sm text-eve.gray flex justify-between">
                            <span>Level {link.link_level}</span>
                            <span>{link.source_pin_id} → {link.destination_pin_id}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Routes */}
                    <div>
                      <h5 className="text-white text-sm mb-2">Routes</h5>
                      <div className="space-y-2">
                        {planetDetails.routes.map(route => (
                          <div key={route.route_id} className="p-2 border border-eve.darkgray/20 rounded">
                            <div className="text-sm text-eve.gray space-y-1">
                              <div className="flex justify-between">
                                <span>Content:</span>
                                <span>{route.content_type_name || `Type ${route.content_type_id}`}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Quantity:</span>
                                <span>{route.quantity}</span>
                              </div>
                              <div className="text-xs">
                                {route.source_pin_id} → {route.destination_pin_id}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </TooltipProvider>
  );
};

export default PlanetaryIndustry; 