import { AuthService } from './auth.service';
import debug from 'debug';

const logESI = debug('pcc:web:esi');
const logError = debug('pcc:web:esi:error');

interface SolarSystem {
  system_id: number;
  name: string;
}

interface CorporationHistory {
  corporation_id: number;
  record_id: number;
  start_date: string;
  is_deleted?: boolean;
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

export interface CharacterNotification {
  notification_id: number;
  sender_id: number;
  sender_type: string;
  text: string;
  timestamp: string;
  type: string;
  is_read?: boolean;
}

export interface CharacterPlanet {
  last_update: string;
  num_pins: number;
  owner_id: number;
  planet_id: number;
  planet_type: string;
  solar_system_id: number;
  upgrade_level: number;
}

interface TypeInfo {
  type_id: number;
  name: string;
  description: string;
  published: boolean;
  group_id: number;
}

export interface PlanetDetails {
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

export class ESIService {
  private static instance: ESIService;
  private baseUrl: string;
  private imageBaseUrl: string;

  private constructor() {
    this.baseUrl = 'https://esi.evetech.net/latest';
    this.imageBaseUrl = 'https://images.evetech.net';
  }

  public static getInstance(): ESIService {
    if (!ESIService.instance) {
      ESIService.instance = new ESIService();
    }
    return ESIService.instance;
  }

  private async makeAuthenticatedRequest<T>(url: string): Promise<T> {
    try {
      const token = await AuthService.getEveAccessToken();
      if (!token) {
        throw new Error('No EVE access token available');
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          // Don't clear the token immediately
          // Try to refresh the token first
          const newToken = await AuthService.getEveAccessToken();
          if (newToken) {
            // Retry the request with the new token
            const retryResponse = await fetch(url, {
              headers: {
                'Authorization': `Bearer ${newToken}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              }
            });
            
            if (retryResponse.ok) {
              return await retryResponse.json();
            }
          }
          // Only clear token if refresh failed
          AuthService.clearToken();
          throw new Error('Authentication expired - please log in again');
        }
        throw new Error(`Request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logError(`Error making authenticated request to ${url}:`, error);
      throw error;
    }
  }

  public async getCharacterLocation(characterId: number): Promise<SolarSystem> {
    logESI('Fetching character location');
    try {
      // First, get the solar system ID
      const locationData = await this.makeAuthenticatedRequest<{ solar_system_id: number }>(
        `${this.baseUrl}/characters/${characterId}/location/`
      );

      // Then, get the solar system name
      const systemResponse = await fetch(
        `${this.baseUrl}/universe/systems/${locationData.solar_system_id}/`
      );

      if (!systemResponse.ok) {
        throw new Error(`Failed to fetch system info: ${systemResponse.status}`);
      }

      const systemInfo = await systemResponse.json();
      return {
        system_id: locationData.solar_system_id,
        name: systemInfo.name
      };
    } catch (error) {
      logError('Error fetching character location:', error);
      throw error;
    }
  }

  public async getCharacterCorpHistory(characterId: number): Promise<CorporationHistory[]> {
    logESI('Fetching character corporation history');
    try {
      const response = await fetch(
        `${this.baseUrl}/characters/${characterId}/corporationhistory/`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch corporation history: ${response.status}`);
      }

      const history = await response.json();
      return history.sort((a: CorporationHistory, b: CorporationHistory) => 
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      );
    } catch (error) {
      logError('Error fetching corporation history:', error);
      throw error;
    }
  }

  public async getCharacterAttributes(characterId: number): Promise<CharacterAttributes> {
    logESI('Fetching character attributes');
    return this.makeAuthenticatedRequest<CharacterAttributes>(
      `${this.baseUrl}/characters/${characterId}/attributes/`
    );
  }

  public async getCharacterPublicInfo(characterId: number): Promise<CharacterPublicInfo> {
    logESI('Fetching character public information');
    return this.makeAuthenticatedRequest<CharacterPublicInfo>(
      `${this.baseUrl}/characters/${characterId}/`
    );
  }

  public async getCharacterSkills(characterId: number): Promise<CharacterSkills> {
    logESI('Fetching character skills');
    return this.makeAuthenticatedRequest<CharacterSkills>(
      `${this.baseUrl}/characters/${characterId}/skills/`
    );
  }

  public async getCharacterSkillQueue(characterId: number): Promise<CharacterSkillQueueItem[]> {
    logESI('Fetching character skill queue');
    return this.makeAuthenticatedRequest<CharacterSkillQueueItem[]>(
      `${this.baseUrl}/characters/${characterId}/skillqueue/`
    );
  }

  public async getCharacterOnlineStatus(characterId: number): Promise<CharacterOnlineStatus> {
    logESI('Fetching character online status');
    return this.makeAuthenticatedRequest<CharacterOnlineStatus>(
      `${this.baseUrl}/characters/${characterId}/online/`
    );
  }

  public async getCharacterNotifications(characterId: number): Promise<CharacterNotification[]> {
    logESI('Fetching character notifications');
    const notifications = await this.makeAuthenticatedRequest<CharacterNotification[]>(
      `${this.baseUrl}/characters/${characterId}/notifications/`
    );
    return notifications.sort((a: CharacterNotification, b: CharacterNotification) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public async getCharacterPlanets(characterId: number): Promise<CharacterPlanet[]> {
    logESI('Fetching character planets');
    return this.makeAuthenticatedRequest<CharacterPlanet[]>(
      `${this.baseUrl}/characters/${characterId}/planets/`
    );
  }

  public async getTypeInfo(typeId: number): Promise<TypeInfo> {
    logESI(`Fetching type information for ID: ${typeId}`);
    const response = await fetch(
      `${this.baseUrl}/universe/types/${typeId}/?datasource=tranquility&language=en`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch type info: ${response.status}`);
    }

    return await response.json();
  }

  public async getPlanetDetails(characterId: number, planetId: number): Promise<PlanetDetails> {
    logESI('Fetching planet details');
    const details = await this.makeAuthenticatedRequest<PlanetDetails>(
      `${this.baseUrl}/characters/${characterId}/planets/${planetId}/`
    );

    // Create a Set of all type IDs that need to be resolved
    const typeIds = new Set<number>();
    
    // Collect all type IDs from pins
    details.pins.forEach(pin => {
      typeIds.add(pin.type_id);
      pin.contents?.forEach(content => typeIds.add(content.type_id));
      if (pin.extractor_details?.product_type_id) {
        typeIds.add(pin.extractor_details.product_type_id);
      }
      if (pin.schematic_id) {
        typeIds.add(pin.schematic_id);
      }
    });
    
    // Collect type IDs from routes
    details.routes.forEach(route => {
      typeIds.add(route.content_type_id);
    });

    // Fetch type information for all collected IDs
    const typeInfoMap = new Map<number, TypeInfo>();
    await Promise.all(
      Array.from(typeIds).map(async (typeId) => {
        try {
          const typeInfo = await this.getTypeInfo(typeId);
          typeInfoMap.set(typeId, typeInfo);
        } catch (error) {
          logError(`Failed to fetch type info for ID ${typeId}:`, error);
        }
      })
    );

    // Create a map of pin IDs to their locations for route visualization
    const pinLocations = new Map(
      details.pins.map(pin => [
        pin.pin_id,
        { latitude: pin.latitude, longitude: pin.longitude }
      ])
    );

    // Resolve type names throughout the details object
    details.pins = details.pins.map(pin => ({
      ...pin,
      type_name: typeInfoMap.get(pin.type_id)?.name,
      contents: pin.contents?.map(content => ({
        ...content,
        type_name: typeInfoMap.get(content.type_id)?.name
      })),
      extractor_details: pin.extractor_details ? {
        ...pin.extractor_details,
        product_type_name: typeInfoMap.get(pin.extractor_details.product_type_id)?.name
      } : undefined,
      schematic_name: pin.schematic_id ? typeInfoMap.get(pin.schematic_id)?.name : undefined
    }));

    // Enhance routes with type names and endpoint locations
    details.routes = details.routes.map(route => ({
      ...route,
      content_type_name: typeInfoMap.get(route.content_type_id)?.name,
      source_location: pinLocations.get(route.source_pin_id),
      destination_location: pinLocations.get(route.destination_pin_id)
    }));

    // Enhance links with endpoint locations
    details.links = details.links.map(link => ({
      ...link,
      source_location: pinLocations.get(link.source_pin_id),
      destination_location: pinLocations.get(link.destination_pin_id)
    }));

    return details;
  }

  public async getImageVariations(category: string, id: number): Promise<string[]> {
    try {
      const response = await fetch(`${this.imageBaseUrl}/${category}/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch image variations: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching image variations:', error);
      return [];
    }
  }

  // Helper method to get the best variation based on priority
  private getBestVariation(variations: string[]): string {
    // Priority order for type variations
    const priorityOrder = ['render', 'icon', 'bp', 'bpc'];
    
    for (const priority of priorityOrder) {
      if (variations.includes(priority)) {
        return priority;
      }
    }
    
    // Return the first available variation if none of the priorities match
    return variations[0] || 'icon';
  }

  public async getOptimalImageUrl(category: string, id: number): Promise<string> {
    try {
      const variations = await this.getImageVariations(category, id);
      const bestVariation = this.getBestVariation(variations);
      return `${this.imageBaseUrl}/${category}/${id}/${bestVariation}`;
    } catch (error) {
      // Fallback to icon if something goes wrong
      return `${this.imageBaseUrl}/${category}/${id}/icon`;
    }
  }
} 