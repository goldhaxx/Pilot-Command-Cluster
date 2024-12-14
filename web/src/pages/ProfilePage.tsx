import React, { useEffect, useState } from 'react';
import { AuthService } from '../services/auth.service';
import { ESIService } from '../services/esi.service';
import Navigation from '../components/Navigation';
import { Sidebar } from '../components/Sidebar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { CharacterNotification, CharacterPlanet } from '../services/esi.service';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../components/ui/pagination";

interface CharacterInfo {
  characterId: number;
  characterName: string;
}

interface LocationInfo {
  system_id: number;
  name: string;
}

interface CharacterPublicInfo {
  alliance_id?: number;
  birthday: string;
  bloodline_id: number;
  corporation_id: number;
  description: string;
  gender: string;
  name: string;
  race_id: number;
  security_status: number;
}

interface CharacterAttributes {
  charisma: number;
  intelligence: number;
  memory: number;
  perception: number;
  willpower: number;
  accrued_remap_cooldown_date: string;
  bonus_remaps: number;
  last_remap_date: string;
}

interface CorporationHistory {
  corporation_id: number;
  record_id: number;
  start_date: string;
  is_deleted?: boolean;
}

interface CharacterSkills {
  total_sp: number;
  unallocated_sp: number;
  skills: {
    skill_id: number;
    trained_skill_level: number;
    active_skill_level: number;
    skillpoints_in_skill: number;
  }[];
}

interface CharacterSkillQueueItem {
  finish_date: string;
  finished_level: number;
  level_end_sp: number;
  level_start_sp: number;
  queue_position: number;
  skill_id: number;
  start_date: string;
  training_start_sp: number;
}

interface CharacterOnlineStatus {
  last_login: string;
  last_logout: string;
  logins: number;
  online: boolean;
}

const ProfilePage: React.FC = () => {
  const [character, setCharacter] = useState<CharacterInfo | null>(null);
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [corpHistory, setCorpHistory] = useState<CorporationHistory[]>([]);
  const [attributes, setAttributes] = useState<CharacterAttributes | null>(null);
  const [publicInfo, setPublicInfo] = useState<CharacterPublicInfo | null>(null);
  const [skills, setSkills] = useState<CharacterSkills | null>(null);
  const [skillQueue, setSkillQueue] = useState<CharacterSkillQueueItem[]>([]);
  const [onlineStatus, setOnlineStatus] = useState<CharacterOnlineStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<CharacterNotification[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [planets, setPlanets] = useState<CharacterPlanet[]>([]);

  useEffect(() => {
    const loadCharacterInfo = async () => {
      try {
        const token = AuthService.getToken();
        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        const userData = await AuthService.verifyToken(token);
        setCharacter({
          characterId: userData.characterId,
          characterName: userData.characterName
        });

        try {
          const [
            locationData,
            historyData,
            attributesData,
            publicInfoData,
            skillsData,
            skillQueueData,
            onlineStatusData,
            notificationsData,
            planetsData
          ] = await Promise.all([
            ESIService.getInstance().getCharacterLocation(userData.characterId).catch(() => null),
            ESIService.getInstance().getCharacterCorpHistory(userData.characterId).catch(() => []),
            ESIService.getInstance().getCharacterAttributes(userData.characterId).catch(() => null),
            ESIService.getInstance().getCharacterPublicInfo(userData.characterId).catch(() => null),
            ESIService.getInstance().getCharacterSkills(userData.characterId).catch(() => null),
            ESIService.getInstance().getCharacterSkillQueue(userData.characterId).catch(() => []),
            ESIService.getInstance().getCharacterOnlineStatus(userData.characterId).catch(() => null),
            ESIService.getInstance().getCharacterNotifications(userData.characterId).catch(() => []),
            ESIService.getInstance().getCharacterPlanets(userData.characterId).catch(() => [])
          ]);

          if (locationData) setLocation(locationData);
          if (historyData.length) setCorpHistory(historyData);
          if (attributesData) setAttributes(attributesData);
          if (publicInfoData) setPublicInfo(publicInfoData);
          if (skillsData) setSkills(skillsData);
          if (skillQueueData.length) setSkillQueue(skillQueueData);
          if (onlineStatusData) setOnlineStatus(onlineStatusData);
          if (notificationsData.length) setNotifications(notificationsData);
          if (planetsData.length) setPlanets(planetsData);

        } catch (error) {
          if (error instanceof Error && error.message.includes('Authentication expired')) {
            AuthService.clearToken();
            window.location.href = '/login';
            return;
          }
          console.error('Error loading character data:', error);
        }
      } catch (err) {
        console.error('Error loading character info:', err);
        if (err instanceof Error && err.message.includes('Authentication expired')) {
          setError('Your session has expired. Please log in again.');
          setTimeout(() => {
            AuthService.clearToken();
            window.location.href = '/login';
          }, 2000);
        } else {
          setError('Failed to load character information');
        }
      } finally {
        setLoading(false);
      }
    };

    loadCharacterInfo();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateProgress = (current: number, start: number, end: number) => {
    if (end === start) return 100;
    return Math.round(((current - start) / (end - start)) * 100);
  };

  const getTimeRemaining = (finishDate: string) => {
    const now = new Date();
    const end = new Date(finishDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Complete';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const paginatedNotifications = notifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(notifications.length / itemsPerPage);

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar className="w-64 border-r" />
        <div className="flex-1">
          <Navigation />
          <main className="min-h-screen bg-eve-gradient p-8">
            <div className="eve-window max-w-3xl mx-auto p-8">
              <h2 className="eve-text-primary text-eve-xl mb-8">Loading Profile...</h2>
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
    <div className="flex h-screen">
      <Sidebar className="w-64 border-r" />
      <div className="flex-1">
        <Navigation />
        <main className="min-h-screen bg-eve-gradient p-8">
          <div className="eve-window max-w-3xl mx-auto">
            <div className="eve-header">
              <h2 className="eve-text-primary text-eve-xl">EVE Character Profile</h2>
            </div>
            
            {character && (
              <div className="p-8 space-y-6">
                <div className="flex gap-8 items-start">
                  <div className="relative">
                    <img
                      src={`https://images.evetech.net/characters/${character.characterId}/portrait`}
                      alt={character.characterName}
                      className="w-64 h-64 rounded eve-border"
                    />
                    <div className="absolute inset-0 eve-border rounded pointer-events-none"></div>
                    {onlineStatus && (
                      <div className={`absolute -top-2 -right-2 w-4 h-4 rounded-full ${
                        onlineStatus.online ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-6">
                    <div>
                      <h3 className="text-white text-eve-large font-medium mb-2">
                        {character.characterName}
                        {onlineStatus && (
                          <span className={`ml-3 text-sm ${
                            onlineStatus.online ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {onlineStatus.online ? 'Online' : 'Offline'}
                          </span>
                        )}
                      </h3>
                      <p className="text-eve.darkgray text-eve-normal">Character ID: {character.characterId}</p>
                    </div>

                    {onlineStatus && (
                      <div className="eve-window p-4 space-y-2">
                        <h4 className="eve-text-primary text-eve-normal">Session Info</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-eve.darkgray text-sm">Last Login</p>
                            <p className="text-white">{formatDate(onlineStatus.last_login)}</p>
                          </div>
                          <div>
                            <p className="text-eve.darkgray text-sm">Last Logout</p>
                            <p className="text-white">{formatDate(onlineStatus.last_logout)}</p>
                          </div>
                          <div>
                            <p className="text-eve.darkgray text-sm">Total Logins</p>
                            <p className="text-white">{onlineStatus.logins.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {location && (
                      <div className="eve-window p-4 space-y-2">
                        <h4 className="eve-text-primary text-eve-normal">Current Location</h4>
                        <p className="text-white text-eve-normal">{location.name}</p>
                      </div>
                    )}
                  </div>
                </div>

                <Accordion type="multiple" className="w-full space-y-4">
                  {publicInfo && (
                    <AccordionItem value="character-info" className="border-0">
                      <AccordionTrigger className="eve-text-primary text-eve-large px-4">
                        Character Information
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="eve-window p-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-eve.darkgray">Birthday</p>
                              <p className="text-white">{formatDate(publicInfo.birthday)}</p>
                            </div>
                            <div>
                              <p className="text-eve.darkgray">Gender</p>
                              <p className="text-white">{publicInfo.gender.charAt(0).toUpperCase() + publicInfo.gender.slice(1)}</p>
                            </div>
                            <div>
                              <p className="text-eve.darkgray">Security Status</p>
                              <p className={`${publicInfo.security_status >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {publicInfo.security_status.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-eve.darkgray">Race ID</p>
                              <p className="text-white">{publicInfo.race_id}</p>
                            </div>
                          </div>
                          {publicInfo.description && (
                            <div className="mt-4">
                              <p className="text-eve.darkgray">Description</p>
                              <p className="text-white text-sm mt-1">{publicInfo.description}</p>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {attributes && (
                    <AccordionItem value="character-attributes" className="border-0">
                      <AccordionTrigger className="eve-text-primary text-eve-large px-4">
                        Character Attributes
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="eve-window p-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-eve.darkgray">Intelligence</p>
                              <p className="text-white text-eve-large">{attributes.intelligence}</p>
                            </div>
                            <div>
                              <p className="text-eve.darkgray">Memory</p>
                              <p className="text-white text-eve-large">{attributes.memory}</p>
                            </div>
                            <div>
                              <p className="text-eve.darkgray">Charisma</p>
                              <p className="text-white text-eve-large">{attributes.charisma}</p>
                            </div>
                            <div>
                              <p className="text-eve.darkgray">Perception</p>
                              <p className="text-white text-eve-large">{attributes.perception}</p>
                            </div>
                            <div>
                              <p className="text-eve.darkgray">Willpower</p>
                              <p className="text-white text-eve-large">{attributes.willpower}</p>
                            </div>
                            <div>
                              <p className="text-eve.darkgray">Bonus Remaps</p>
                              <p className="text-white text-eve-large">{attributes.bonus_remaps}</p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <p className="text-eve.darkgray text-sm">Last Remap: {formatDate(attributes.last_remap_date)}</p>
                            <p className="text-eve.darkgray text-sm">Next Remap Available: {formatDate(attributes.accrued_remap_cooldown_date)}</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  <AccordionItem value="corp-history" className="border-0">
                    <AccordionTrigger className="eve-text-primary text-eve-large px-4">
                      Corporation History
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 gap-4">
                        {corpHistory.map((record) => (
                          <div key={record.record_id} className="eve-window p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <img
                                src={`https://images.evetech.net/corporations/${record.corporation_id}/logo`}
                                alt="Corporation Logo"
                                className="w-12 h-12 rounded eve-border"
                              />
                              <div>
                                <p className="text-white text-eve-normal">
                                  Corporation ID: {record.corporation_id}
                                  {record.is_deleted && <span className="text-eve.red ml-2">(Deleted)</span>}
                                </p>
                                <p className="text-eve.darkgray text-eve-small">
                                  Joined: {formatDate(record.start_date)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {skills && (
                    <AccordionItem value="character-skills" className="border-0">
                      <AccordionTrigger className="eve-text-primary text-eve-large px-4">
                        Character Skills
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="eve-window p-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                              <p className="text-eve.darkgray">Total Skillpoints</p>
                              <p className="text-white text-eve-large">{skills.total_sp.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-eve.darkgray">Unallocated Skillpoints</p>
                              <p className="text-white text-eve-large">{skills.unallocated_sp.toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {skills.skills.map((skill) => (
                              <div key={skill.skill_id} className="eve-window p-3 flex justify-between items-center">
                                <div>
                                  <p className="text-white">Skill ID: {skill.skill_id}</p>
                                  <p className="text-eve.darkgray text-sm">SP: {skill.skillpoints_in_skill.toLocaleString()}</p>
                                </div>
                                <div className="flex items-center space-x-4">
                                  <div>
                                    <p className="text-eve.darkgray text-sm">Trained Level</p>
                                    <p className="text-white text-center">{skill.trained_skill_level}</p>
                                  </div>
                                  <div>
                                    <p className="text-eve.darkgray text-sm">Active Level</p>
                                    <p className="text-white text-center">{skill.active_skill_level}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {skillQueue.length > 0 && (
                    <AccordionItem value="skill-queue" className="border-0">
                      <AccordionTrigger className="eve-text-primary text-eve-large px-4">
                        Skill Queue ({skillQueue.length} skills)
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="eve-window p-4 space-y-4">
                          {skillQueue.map((queueItem) => (
                            <div key={`${queueItem.skill_id}-${queueItem.queue_position}`} className="eve-window p-3">
                              <div className="flex justify-between items-center mb-2">
                                <div>
                                  <p className="text-white">Skill ID: {queueItem.skill_id}</p>
                                  <p className="text-eve.darkgray text-sm">
                                    Level {queueItem.finished_level}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-white">{getTimeRemaining(queueItem.finish_date)}</p>
                                  <p className="text-eve.darkgray text-sm">
                                    {formatDate(queueItem.start_date)}
                                  </p>
                                </div>
                              </div>
                              <div className="relative w-full h-2 bg-eve.darkgray rounded">
                                <div
                                  className="absolute left-0 top-0 h-full bg-eve.blue rounded"
                                  style={{
                                    width: `${calculateProgress(
                                      queueItem.training_start_sp,
                                      queueItem.level_start_sp,
                                      queueItem.level_end_sp
                                    )}%`
                                  }}
                                />
                              </div>
                              <div className="flex justify-between text-eve.darkgray text-xs mt-1">
                                <span>{queueItem.level_start_sp.toLocaleString()} SP</span>
                                <span>{queueItem.level_end_sp.toLocaleString()} SP</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {notifications.length > 0 && (
                    <AccordionItem value="notifications" className="border-0">
                      <AccordionTrigger className="eve-text-primary text-eve-large px-4">
                        Notifications ({notifications.length})
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="eve-window p-4 space-y-4">
                          <div className="grid grid-cols-1 gap-2">
                            {paginatedNotifications.map((notification) => (
                              <div 
                                key={notification.notification_id} 
                                className={`eve-window p-3 ${notification.is_read ? 'opacity-75' : ''}`}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="text-white font-medium">{notification.type.replace(/([A-Z])/g, ' $1').trim()}</p>
                                    <p className="text-eve.darkgray text-sm">
                                      From: {notification.sender_type} ID: {notification.sender_id}
                                    </p>
                                  </div>
                                  <p className="text-eve.darkgray text-sm">
                                    {formatDate(notification.timestamp)}
                                  </p>
                                </div>
                                <p className="text-white text-sm whitespace-pre-wrap">
                                  {notification.text}
                                </p>
                                {!notification.is_read && (
                                  <div className="mt-2">
                                    <span className="bg-eve.blue/20 text-eve.blue px-2 py-1 rounded text-xs">
                                      New
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          {totalPages > 1 && (
                            <Pagination className="mt-4">
                              <PaginationContent>
                                <PaginationItem>
                                  <PaginationPrevious 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                                  >
                                    Previous
                                  </PaginationPrevious>
                                </PaginationItem>
                                
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                  <PaginationItem key={page}>
                                    <PaginationLink
                                      onClick={() => setCurrentPage(page)}
                                      isActive={currentPage === page}
                                    >
                                      {page}
                                    </PaginationLink>
                                  </PaginationItem>
                                ))}
                                
                                <PaginationItem>
                                  <PaginationNext
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                                  >
                                    Next
                                  </PaginationNext>
                                </PaginationItem>
                              </PaginationContent>
                            </Pagination>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {planets.length > 0 && (
                    <AccordionItem value="planets" className="border-0">
                      <AccordionTrigger className="eve-text-primary text-eve-large px-4">
                        Planetary Colonies ({planets.length})
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="eve-window p-4 space-y-4">
                          <div className="grid grid-cols-1 gap-2">
                            {planets.map((planet) => (
                              <div key={planet.planet_id} className="eve-window p-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-white font-medium">
                                      {planet.planet_type.charAt(0).toUpperCase() + planet.planet_type.slice(1)} Planet
                                    </p>
                                    <p className="text-eve.darkgray text-sm">
                                      System ID: {planet.solar_system_id}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-white">
                                      Level {planet.upgrade_level}
                                    </p>
                                    <p className="text-eve.darkgray text-sm">
                                      {planet.num_pins} Pins
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-2 flex justify-between items-center text-sm">
                                  <span className="text-eve.darkgray">
                                    Last Updated: {formatDate(planet.last_update)}
                                  </span>
                                  <span className="bg-eve.blue/20 text-eve.blue px-2 py-1 rounded">
                                    ID: {planet.planet_id}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                </Accordion>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfilePage; 