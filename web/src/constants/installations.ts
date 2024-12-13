export enum InstallationType {
  COMMAND_CENTER = 'command_center',
  EXTRACTOR = 'extractor',
  STORAGE = 'storage',
  PROCESSOR = 'processor',
  SPACEPORT = 'spaceport',
  FACTORY = 'factory'
}

// EVE Online API type IDs for planetary installations
export const EVE_TYPE_ID_TO_INSTALLATION: Record<number, InstallationType> = {
  // Storm planet installations
  2550: InstallationType.COMMAND_CENTER,  // Storm Command Center
  3067: InstallationType.EXTRACTOR,       // Storm Extractor Control Unit
  2561: InstallationType.STORAGE,         // Storm Storage Facility
  2483: InstallationType.PROCESSOR,       // Storm Basic Industry Facility
  2557: InstallationType.SPACEPORT,       // Storm Launchpad
  2484: InstallationType.FACTORY,         // Storm Advanced Industry Facility
  
  // Temperate planet installations
  2254: InstallationType.COMMAND_CENTER,  // Temperate Command Center
  3068: InstallationType.EXTRACTOR,       // Temperate Extractor Control Unit
  2562: InstallationType.STORAGE,         // Temperate Storage Facility
  2481: InstallationType.PROCESSOR,       // Temperate Basic Industry Facility
  2558: InstallationType.SPACEPORT,       // Temperate Launchpad
  2480: InstallationType.FACTORY,         // Temperate Advanced Industry Facility

  // Regular planet installations (keeping these for compatibility)
  2256: InstallationType.STORAGE,         // Storage Facility
  2469: InstallationType.PROCESSOR,       // Basic Industrial Facility
  2257: InstallationType.SPACEPORT,       // Spaceport
  2470: InstallationType.FACTORY,         // Advanced Industrial Facility
  2848: InstallationType.EXTRACTOR        // Extractor Control Unit
};

export interface InstallationInfo {
  type: InstallationType;
  name: string;
  description: string;
  icon: string;
  typeId: number;
}

export const INSTALLATION_INFO: Record<InstallationType, InstallationInfo> = {
  [InstallationType.COMMAND_CENTER]: {
    type: InstallationType.COMMAND_CENTER,
    name: 'Command Center',
    description: 'Central control facility for planetary installations',
    icon: '/icons/installations/command_center.png',
    typeId: 2254
  },
  [InstallationType.EXTRACTOR]: {
    type: InstallationType.EXTRACTOR,
    name: 'Extractor Control Unit',
    description: 'Extracts raw materials from the planet surface',
    icon: '/icons/installations/extractor.png',
    typeId: 2848
  },
  [InstallationType.STORAGE]: {
    type: InstallationType.STORAGE,
    name: 'Storage Facility',
    description: 'Stores planetary resources and products',
    icon: '/icons/installations/storage.png',
    typeId: 2256
  },
  [InstallationType.PROCESSOR]: {
    type: InstallationType.PROCESSOR,
    name: 'Basic Industrial Facility',
    description: 'Processes raw materials into products',
    icon: '/icons/installations/processor.png',
    typeId: 2469
  },
  [InstallationType.SPACEPORT]: {
    type: InstallationType.SPACEPORT,
    name: 'Spaceport',
    description: 'Launches products into space',
    icon: '/icons/installations/spaceport.png',
    typeId: 2257
  },
  [InstallationType.FACTORY]: {
    type: InstallationType.FACTORY,
    name: 'Advanced Industrial Facility',
    description: 'Creates advanced products from basic materials',
    icon: '/icons/installations/factory.png',
    typeId: 2470
  }
}; 