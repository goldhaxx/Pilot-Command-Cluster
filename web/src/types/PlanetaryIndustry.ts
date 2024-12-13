export interface Link {
  source_id: string;
  dest_id: string;
}

export interface Route {
  source_id: string;
  dest_id: string;
  content: number;
}

export interface Installation {
  id: string;
  type: string;
  type_id: number;
  type_name: string;
  status: string;
}

export interface Pin {
  pin_id: number;
  type_id: number;
  type_name?: string;
  latitude: number;
  longitude: number;
} 