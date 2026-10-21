import image0 from '../assets/images/dog_golden_retriever_sunny_1792601209384.jpg';
import image1 from '../assets/images/dog_corgi_happy_park_1792601211244.jpg';
import image2 from '../assets/images/dog_french_bulldog_urban_1792601210368.jpg';
import image3 from '../assets/images/dog_husky_playful_snow_1792601210960.jpg';
import { DogPark } from '../types/dog';

export const INITIAL_DOG_PARKS: DogPark[] = [
  {
    id: 'park_sunny_meadows',
    name: 'Sunny Meadows Dog Run',
    distanceMiles: 1.2,
    address: '420 Meadow Creek Way, West District',
    rating: 4.9,
    reviewCount: 142,
    isOpen: true,
    hours: '6:00 AM – 9:00 PM',
    amenities: ['Double Gated Entry', 'Fresh Water Fountain', 'Agility Ramps', 'Separate Small Dog Area', 'Night Floodlights', 'Shaded Benches'],
    fenced: 'Double Gated Entry',
    activeDogsCount: 6,
    checkedInDogs: [
      { name: 'Max', breed: 'Golden Retriever', photo: image0 },
      { name: 'Biscuit', breed: 'Corgi', photo: image1 },
      { name: 'Bella', breed: 'Labradoodle', photo: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=200&q=80' }
    ],
    description: 'A 3-acre grassy haven with pristine turf, agility obstacles, and an active community of gentle, vaccinated dogs. Highly monitored and clean!',
    photoUrl: image0
  },
  {
    id: 'park_elmwood_square',
    name: 'Elmwood Square Canine Haven',
    distanceMiles: 0.8,
    address: '150 Elmwood Blvd, Central Square',
    rating: 4.7,
    reviewCount: 98,
    isOpen: true,
    hours: '7:00 AM – 8:30 PM',
    amenities: ['Double Gated Entry', 'Paved Perimeter Path', 'Drinking Water', 'Waste Stations', 'Cafe Patio Adjacent'],
    fenced: 'Fully Enclosed',
    activeDogsCount: 4,
    checkedInDogs: [
      { name: 'Winston', breed: 'French Bulldog', photo: image2 },
      { name: 'Oliver', breed: 'Pug', photo: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=200&q=80' }
    ],
    description: 'Great urban park ideal for small and medium dogs who enjoy casual socialization and leisurely sniffing before patio treats.',
    photoUrl: image2
  },
  {
    id: 'park_pine_ridge',
    name: 'Pine Ridge Off-Leash Woods Trail',
    distanceMiles: 2.4,
    address: '880 Pine Ridge Pass, North Hills',
    rating: 4.8,
    reviewCount: 210,
    isOpen: true,
    hours: 'Sunrise to Sunset',
    amenities: ['Shaded Forest Trails', 'Natural Creek Splash Area', 'Waste Bag Stations', 'Picnic Tables', 'Ranger Station'],
    fenced: 'Partial Enclosure',
    activeDogsCount: 8,
    checkedInDogs: [
      { name: 'Maya', breed: 'Siberian Husky', photo: image3 },
      { name: 'Cooper', breed: 'Border Collie', photo: 'https://images.unsplash.com/photo-1503256207526-0d5d80fa2f47?auto=format&fit=crop&w=200&q=80' }
    ],
    description: 'Sprawling natural trail loop with shallow creek crossings. Perfect for high-energy athletes, swimmers, and zoomies champions.',
    photoUrl: image3
  },
  {
    id: 'park_green_valley',
    name: 'Green Valley Canine Meadow',
    distanceMiles: 3.1,
    address: '304 Valley Vista Rd, East Parklands',
    rating: 4.9,
    reviewCount: 165,
    isOpen: true,
    hours: '6:30 AM – 9:30 PM',
    amenities: ['Double Gated Entry', 'K9 Grass Turf', 'Splash Pad & Sprinklers', 'Covered Gazebos', 'Agility Tunnel'],
    fenced: 'Double Gated Entry',
    activeDogsCount: 5,
    checkedInDogs: [
      { name: 'Biscuit', breed: 'Welsh Corgi', photo: image1 },
      { name: 'Rosie', breed: 'Golden Doodle', photo: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=200&q=80' }
    ],
    description: 'Clean synthetic turf prevents mud. Features fun summer dog splash pad, agility tunnels, and organized weekend breed meetups.',
    photoUrl: image1
  }
];
