import image0 from '../assets/images/cat_british_shorthair_chubby_1792607695094.jpg';
import image1 from '../assets/images/cat_siamese_elegant_blue_1792607696042.jpg';
import image2 from '../assets/images/cat_orange_tabby_playful_1792607697364.jpg';
import image3 from '../assets/images/cat_bengal_adventure_harness_1792607696489.jpg';
import { Dog, DogPark } from '../types/dog';

export const USER_CAT: Dog = {
  id: 'user_cat_1',
  name: 'Mochi',
  age: 2,
  breed: 'Scottish Fold Mix',
  gender: 'Girl',
  size: 'Small (10-25 lbs)',
  energyLevel: 'Chill Couch Potato',
  playStyles: ['Kneading & Biscuit Making', 'Sunbeam Lounger', 'Feather Wand Chaser'],
  photos: [
    image0
  ],
  bio: "Full-time professional biscuit baker and certified cardboard box sommelier. Seeking a respectful feline companion for synchronized afternoon sunbathing and mutual bird watching by the window.",
  quirks: [
    'Will fit into any box, regardless of geometric laws',
    'Chirps like a baby sparrow when watching pigeons outside',
    'Demands wet food precisely at 5:01 PM every single evening'
  ],
  favoritePark: 'Whiskers & Beans Cat Lounge',
  distanceMiles: 0,
  vaccinated: true,
  neutered: true,
  goodWith: ['Gentle Cats', 'Calm Pups', 'Quiet Humans'],
  badges: ['Master Biscuit Baker', 'Box Inspector', 'Vet Verified'],
  owner: {
    name: 'Emily & David',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    bio: 'Botanist & graphic designer. Our home is a jungle of cat-safe ferns and sunny perches.',
    verified: true,
    memberSince: 'April 2024',
    responseTime: 'Replies in minutes'
  },
  petType: 'cat'
};

export const INITIAL_CATS: Dog[] = [
  {
    id: 'cat_cleo',
    purposes: ['Dog Park Playdates', 'Morning Walk Buddy'],
    name: 'Cleo',
    age: 2.5,
    breed: 'Siamese',
    gender: 'Girl',
    size: 'Small (10-25 lbs)',
    energyLevel: 'Moderate Stroller',
    playStyles: ['Vocal Conversations', 'Feather Wand Chaser', 'High Perch Watching'],
    photos: [
      image1
    ],
    bio: "Eloquent conversationalist with sapphire blue eyes. I have strong opinions on treaty flavors and will explain them to you in detail. Looking for a sophisticated friend who appreciates high-altitude bookshelf perches.",
    quirks: [
      'Speaks fluent conversational meow and expects prompt replies',
      'Prefers drinking running water from the bathroom sink',
      'Can jump from the floor directly to the top of the refrigerator'
    ],
    favoritePark: 'Velvet Paws Cat Lounge & Library',
    distanceMiles: 0.9,
    vaccinated: true,
    neutered: true,
    goodWith: ['Friendly Cats', 'Quiet Humans'],
    badges: ['Vocal Diva', 'Acrobat', 'Fully Vaccinated'],
    owner: {
      name: 'Julian Vance',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      bio: 'Classical pianist. Cleo sits on the grand piano while I practice Chopin.',
      verified: true,
      memberSince: 'March 2024',
      responseTime: 'Replies in ~10 mins'
    },
    matchScore: 92,
    petType: 'cat'
  },
  {
    id: 'cat_marmalade',
    purposes: ['Dog Park Playdates', 'Morning Walk Buddy'],
    name: 'Marmalade',
    age: 1.5,
    breed: 'Orange Tabby',
    gender: 'Boy',
    size: 'Medium (25-50 lbs)',
    energyLevel: 'Hyper Zoomies Champion',
    playStyles: ['Toy Mouse Juggling', 'Laser Pointer Sprinter', 'Curtain Climbing'],
    photos: [
      image2
    ],
    bio: "Blessed with one shared braincell and unlimited enthusiasm! I specialize in high-velocity hall sprints, batting imaginary dust motes, and dramatic flop-and-roll greetings.",
    quirks: [
      'Believes any paper bag is an interdimensional portal',
      'Runs sideways when completely overwhelmed with happiness',
      'Purrs so loudly it vibrates the coffee table'
    ],
    favoritePark: 'Silver Moon Interactive Feline Haven',
    distanceMiles: 1.4,
    vaccinated: true,
    neutered: true,
    goodWith: ['Playful Cats', 'Energetic Kittens', 'Dog Buddies'],
    badges: ['Zoomies Champion', 'Big Purr Energy', 'Playdate Ready'],
    owner: {
      name: 'Chloe Rivera',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      bio: 'Illustrator and cat enthusiast. Always looking for play buddies for Marmalade!',
      verified: true,
      memberSince: 'June 2024',
      responseTime: 'Replies instantly'
    },
    matchScore: 95,
    petType: 'cat'
  },
  {
    id: 'cat_leo',
    purposes: ['Dog Park Playdates', 'Morning Walk Buddy'],
    name: 'Leo',
    age: 3,
    breed: 'Bengal Adventure Cat',
    gender: 'Boy',
    size: 'Medium (25-50 lbs)',
    energyLevel: 'High Energy Sprinter',
    playStyles: ['Harness Leash Walking', 'Agility Wall Climbing', 'Catio Patrol'],
    photos: [
      image3
    ],
    bio: "Miniature leopard with a passion for the great outdoors! Leash-trained, harness-ready, and loves exploring safe garden catios and botanical nature walks. Looking for an adventurous feline or tolerant dog buddy.",
    quirks: [
      'Loves water! Will deliberately play in the bathroom sink',
      'Walks proudly on a leash like a tiny panther',
      'Solves puzzle treat feeders in under 30 seconds'
    ],
    favoritePark: 'The Purrfect Catio & Botanical Sanctuary',
    distanceMiles: 2.1,
    vaccinated: true,
    neutered: true,
    goodWith: ['Adventurous Cats', 'Leash Pups', 'Confident Pets'],
    badges: ['Adventure Cat', 'Harness Certified', 'Trail Ready'],
    owner: {
      name: 'Samir & Tara',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      bio: 'Outdoor gear designers. Leo accompanies us on weekend glamping trips.',
      verified: true,
      memberSince: 'January 2024',
      responseTime: 'Replies in ~20 mins'
    },
    matchScore: 89,
    petType: 'cat'
  },
  {
    id: 'cat_barnaby',
    purposes: ['Dog Park Playdates', 'Morning Walk Buddy'],
    name: 'Barnaby',
    age: 4,
    breed: 'British Shorthair',
    gender: 'Boy',
    size: 'Large (50-80 lbs)',
    energyLevel: 'Chill Couch Potato',
    playStyles: ['Synchronized Sleeping', 'Gentle Paw Taps', 'Catnip Connoisseur'],
    photos: [
      image0
    ],
    bio: "A round, plush, contemplative soul. I do not run; I relocate with dignity. Looking for a fellow calm feline who understands that the peak of companionship is sleeping in the same room without making eye contact.",
    quirks: [
      'Can remain in identical loaf formation for 6 continuous hours',
      'Judges you silently when you open the wrong brand of pate',
      'Has cheeks so chubby they warrant their own zip code'
    ],
    favoritePark: 'Whiskers & Beans Cat Lounge',
    distanceMiles: 1.1,
    vaccinated: true,
    neutered: true,
    goodWith: ['Calm Cats', 'Senior Pets', 'Book Readers'],
    badges: ['Royal Loaf', 'Zen Master', 'Vet Verified'],
    owner: {
      name: 'Professor Arthur Wright',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      bio: 'Literature lecturer. Barnaby proofreads my manuscripts by sitting on my keyboard.',
      verified: true,
      memberSince: 'October 2023',
      responseTime: 'Replies in an hour'
    },
    matchScore: 97,
    petType: 'cat'
  }
];

export const CAT_PARKS: DogPark[] = [
  {
    id: 'spot_whiskers_beans',
    name: 'Whiskers & Beans Cat Lounge',
    distanceMiles: 0.9,
    address: '210 Gardenia Walk, Midtown Arts District',
    rating: 4.9,
    reviewCount: 228,
    isOpen: true,
    hours: '10:00 AM – 8:00 PM',
    amenities: ['Multi-Level Cat Bridges', 'Organic Catnip Garden', 'Filtered Water Fountains', 'Quiet Reading Pods', 'Scratching Towers', 'Barista Coffee Bar'],
    fenced: 'Fully Enclosed',
    activeDogsCount: 7,
    checkedInDogs: [
      { name: 'Mochi', breed: 'Scottish Fold', photo: image0 },
      { name: 'Cleo', breed: 'Siamese', photo: image1 },
      { name: 'Barnaby', breed: 'British Shorthair', photo: image0 }
    ],
    description: 'Premier indoor feline community lounge with double airlock security doors, skywalk bridges, heated napping pods, and cozy seating for pet parents.',
    photoUrl: image0
  },
  {
    id: 'spot_purrfect_catio',
    name: 'The Purrfect Catio & Botanical Sanctuary',
    distanceMiles: 2.1,
    address: '550 Pinecrest Terrace, North Hills',
    rating: 4.8,
    reviewCount: 145,
    isOpen: true,
    hours: '9:00 AM – 7:30 PM',
    amenities: ['Fully Enclosed Steel Mesh Catio', 'Safe Climbing Trees', 'Koi Pond Viewing Windows', 'Harness Walking Paths', 'Shaded Hammocks'],
    fenced: 'Fully Enclosed',
    activeDogsCount: 5,
    checkedInDogs: [
      { name: 'Leo', breed: 'Bengal', photo: image3 },
      { name: 'Marmalade', breed: 'Orange Tabby', photo: image2 }
    ],
    description: 'Sun-drenched outdoor botanical screened catio allowing cats to enjoy fresh air, bird watching, and safe exploration without neighborhood risks.',
    photoUrl: image3
  },
  {
    id: 'spot_velvet_paws',
    name: 'Velvet Paws Lounge & Tea Room',
    distanceMiles: 1.3,
    address: '88 Cambridge Square, West End',
    rating: 4.9,
    reviewCount: 180,
    isOpen: true,
    hours: '11:00 AM – 9:00 PM',
    amenities: ['Acoustic Soundproofing', 'Velvet Heated Sofas', 'Private Playdate Suites', 'Veterinary Checkpoint', 'Herbal Feline Teas'],
    fenced: 'Double Gated Entry',
    activeDogsCount: 4,
    checkedInDogs: [
      { name: 'Cleo', breed: 'Siamese', photo: image1 }
    ],
    description: 'Tranquil boutique lounge tailored for shy, polite cats who prefer gentle one-on-one socialization, soothing jazz, and gourmet treats.',
    photoUrl: image1
  }
];
