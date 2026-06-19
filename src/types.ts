// Define common types used across the application

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  parts: { text: string }[];
  functionCalls?: { name: string; args: any }[];
  isSearching?: boolean;
}

export interface MapViewport {
  lat: number;
  lng: number;
  zoom: number;
}

export interface PlaceMarker {
  id: string;
  lat: number;
  lng: number;
  title?: string;
}
