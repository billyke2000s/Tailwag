export type DogSize = 'Toy (<10 lbs)' | 'Small (10-25 lbs)' | 'Medium (25-50 lbs)' | 'Large (50-80 lbs)' | 'Giant (80+ lbs)';

export type EnergyLevel = 'Chill Couch Potato' | 'Moderate Stroller' | 'High Energy Sprinter' | 'Hyper Zoomies Champion';

export interface DogOwner {
  name: string;
  avatar: string;
  bio: string;
  verified?: boolean;
  memberSince: string;
  responseTime: string;
}

export interface Dog {
  id: string;
  name: string;
  age: number;
  breed: string;
  gender: 'Boy' | 'Girl';
  size: DogSize;
  energyLevel: EnergyLevel;
  playStyles: string[];
  photos: string[];
  bio: string;
  quirks: string[];
  favoritePark: string;
  distanceMiles: number;
  vaccinated?: boolean;
  neutered?: boolean;
  goodWith: string[];
  badges: string[];
  owner: DogOwner;
  matchScore?: number;
  purposes?: string[];
  petType?: 'dog' | 'cat';
}

export interface DogPark {
  id: string;
  name: string;
  distanceMiles: number;
  address: string;
  rating: number;
  reviewCount: number;
  isOpen: boolean;
  hours: string;
  amenities: string[];
  fenced: 'Fully Enclosed' | 'Double Gated Entry' | 'Partial Enclosure';
  activeDogsCount: number;
  checkedInDogs: { id?: string; name: string; breed: string; photo: string }[];
  description: string;
  photoUrl: string;
}

export interface PlaydatePlan {
  id: string;
  partnerDogId: string;
  parkName: string;
  date: string;
  time: string;
  activity: string;
  status: 'pending' | 'confirmed' | 'completed';
}

export interface ChatMessage {
  id: string;
  senderId: string; // 'user' or dogId
  text: string;
  timestamp: string;
  isPlaydateProposal?: boolean;
  playdateDetails?: {
    park: string;
    date: string;
    time: string;
    activity: string;
    status: 'pending' | 'confirmed';
  };
}

export interface DogMatch {
  dog: Dog;
  matchedAt: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}
