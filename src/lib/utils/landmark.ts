export interface Landmark {
    name: string;
    lat: number;
    lon: number;
    type?: 'landmark' | 'airport' | 'train_station' | 'street';
    description?: string;
  }
  
  export const LANDMARK_OPTIONS: Landmark[] = [
    {
      name: "Piazza del Plebiscito",
      lat: 40.8358,
      lon: 14.2488,
      type: "landmark",
      description: "Main central square, cultural hub"
    },
    {
      name: "Castel dell'Ovo",
      lat: 40.8300,
      lon: 14.2470,
      type: "landmark",
      description: "Iconic seaside castle"
    },
    {
      name: "Naples Cathedral (Duomo)",
      lat: 40.8522,
      lon: 14.2625,
      type: "landmark",
      description: "Historic cathedral in historic center"
    },
    {
      name: "Via Toledo",
      lat: 40.8433,
      lon: 14.2479,
      type: "street",
      description: "Popular shopping street"
    },
    {
      name: "Naples Airport (Capodichino)",
      lat: 40.8840,
      lon: 14.2906,
      type: "airport",
      description: "International airport"
    },
    {
      name: "Napoli Centrale Station",
      lat: 40.8522,
      lon: 14.2710,
      type: "train_station",
      description: "Main railway station and transport hub"
    },
  ];  