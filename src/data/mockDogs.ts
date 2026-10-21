import image0 from '../assets/images/dog_golden_retriever_sunny_1792601209384.jpg';
import image1 from '../assets/images/dog_french_bulldog_urban_1792601210368.jpg';
import image2 from '../assets/images/dog_husky_playful_snow_1792601210960.jpg';
import image3 from '../assets/images/dog_corgi_happy_park_1792601211244.jpg';
import { Dog } from '../types/dog';

export const USER_DOG: Dog = {
  id: 'user_dog_1',
  name: 'Charlie',
  age: 2,
  breed: 'Aussie Doodle',
  gender: 'Boy',
  size: 'Medium (25-50 lbs)',
  energyLevel: 'High Energy Sprinter',
  playStyles: ['Fetch Obsessed', 'Tag / Chaser', 'Gentle Sniffer'],
  photos: [
    image0
  ],
  bio: "Part-time speed demon, full-time cuddle bug. I know how to sit, shake, and stare into your soul until you share your peanut butter. Looking for a weekend dog park buddy with matching zoomie stamina!",
  quirks: [
    'Carries 2 tennis balls in mouth at once',
    'Does a happy tap dance before morning walkies',
    'Afraid of the automatic robot vacuum cleaner'
  ],
  favoritePark: 'Sunny Meadows Dog Run',
  distanceMiles: 0,
  vaccinated: true,
  neutered: true,
  goodWith: ['Puppies', 'Big Dogs', 'Cats', 'Kids'],
  badges: ['AKC Good Citizen', 'Park Regular', 'Gentle Play Certified'],
  owner: {
    name: 'Alex & Sam',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    bio: 'Software engineer & trail runner. Always carrying extra poop bags and liver treats.',
    verified: true,
    memberSince: 'March 2024',
    responseTime: 'Replies in minutes'
  }
};

export const INITIAL_DOGS: Dog[] = [
  {
    id: 'dog_max',
    purposes: ['Dog Park Playdates', 'Morning Walk Buddy'],
    name: 'Max',
    age: 2.5,
    breed: 'Golden Retriever',
    gender: 'Boy',
    size: 'Large (50-80 lbs)',
    energyLevel: 'High Energy Sprinter',
    playStyles: ['Fetch Obsessed', 'Wrestling Buff', 'Water Splasher'],
    photos: [
      image0
    ],
    bio: "Passionate about yellow tennis balls, muddy puddles, and making 40 new human friends every walk. Will happily surrender my favorite stick if you promise to throw it at least 25 times.",
    quirks: [
      'Believes every human on earth was born to pet him',
      'Does full-body wiggles when greeting at the gate',
      'Cannot resist water, even tiny lawn sprinkler sprays'
    ],
    favoritePark: 'Sunny Meadows Dog Run',
    distanceMiles: 1.2,
    vaccinated: true,
    neutered: true,
    goodWith: ['Puppies', 'Big Dogs', 'Kids'],
    badges: ['Fetch MVP', 'Water Baby', 'Vet Verified'],
    owner: {
      name: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      bio: 'Dog mom of two. Weekends are reserved for morning coffee and off-leash park playdates.',
      verified: true,
      memberSince: 'January 2024',
      responseTime: 'Replies in ~15 mins'
    },
    matchScore: 94
  },
  {
    id: 'dog_winston',
    purposes: ['Dog Park Playdates', 'Morning Walk Buddy'],
    name: 'Winston',
    age: 3,
    breed: 'French Bulldog',
    gender: 'Boy',
    size: 'Small (10-25 lbs)',
    energyLevel: 'Moderate Stroller',
    playStyles: ['Gentle Sniffer', 'Tug of War Pro', 'Cafe Lounger'],
    photos: [
      image1
    ],
    bio: "Distinguished gentleman who appreciates a brisk 20-minute trot followed by a 4-hour nap in a sunny patch of carpet. Stylish bandana connoisseur and professional treat inspector.",
    quirks: [
      'Snores louder than a Harley Davidson',
      'Will refuse to walk if the pavement has minor dampness',
      'Masters the art of dramatic side-eye'
    ],
    favoritePark: 'Elmwood Square Dog Haven',
    distanceMiles: 0.8,
    vaccinated: true,
    neutered: true,
    goodWith: ['Small Dogs', 'Cats', 'Kids', 'Senior Dogs'],
    badges: ['Style Icon', 'Patio Polite', 'Fully Vaccinated'],
    owner: {
      name: 'Marcus Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      bio: 'Architect & design nerd. Winston goes everywhere with me.',
      verified: true,
      memberSince: 'May 2024',
      responseTime: 'Replies in an hour'
    },
    matchScore: 82
  },
  {
    id: 'dog_maya',
    purposes: ['Dog Park Playdates', 'High-Speed Zoomies Partner'],
    name: 'Maya',
    age: 1.5,
    breed: 'Siberian Husky',
    gender: 'Girl',
    size: 'Large (50-80 lbs)',
    energyLevel: 'Hyper Zoomies Champion',
    playStyles: ['Tag / Chaser', 'Wrestling Buff', 'Snow Zoomies', 'Pack Leader'],
    photos: [
      image2
    ],
    bio: "Vocally opinionated soprano singer. Unlimited cardio engine and agility course enthusiast. If your dog loves high-speed laps around the fence line until tongues hang out, we are soulmates.",
    quirks: [
      'Holds 5-minute vocal conversations about why dinner is late',
      'Can outrun a cheetah for about 45 seconds',
      'Always sleeps upside down with all four paws in the air'
    ],
    favoritePark: 'Pine Ridge Off-Leash Trail',
    distanceMiles: 2.4,
    vaccinated: true,
    neutered: true,
    goodWith: ['Big Dogs', 'Active Pups'],
    badges: ['Sprint Champion', 'Trail Ready', 'AKC Registered'],
    owner: {
      name: 'Liam & Chloe',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      bio: 'Trail runners & mountain hikers. Looking for big-energy playmates!',
      verified: true,
      memberSince: 'February 2024',
      responseTime: 'Replies instantly'
    },
    matchScore: 91
  },
  {
    id: 'dog_biscuit',
    purposes: ['Dog Park Playdates', 'Puppy Socialization'],
    name: 'Biscuit',
    age: 2,
    breed: 'Pembroke Welsh Corgi',
    gender: 'Boy',
    size: 'Small (10-25 lbs)',
    energyLevel: 'High Energy Sprinter',
    playStyles: ['Tag / Chaser', 'Ball Herding', 'Gentle Sniffer'],
    photos: [
      image3
    ],
    bio: "Low to the ground, high on life! Certified royal loaf with a heart of gold. I herd tennis balls, humans, and any dog willing to participate in a gentle game of tag.",
    quirks: [
      'Famous sploot posture after every park sprint',
      'Wiggle butt activates at 100mph whenever treats appear',
      'Thinks he has the height of a Great Dane'
    ],
    favoritePark: 'Green Valley Canine Meadow',
    distanceMiles: 3.1,
    vaccinated: true,
    neutered: true,
    goodWith: ['Puppies', 'Big Dogs', 'Small Dogs', 'Kids'],
    badges: ['Agility Rookie', 'Friendly Loaf', 'Vet Checked'],
    owner: {
      name: 'Jessica Taylor',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      bio: 'Veterinary technician. Big advocate for safe, monitored socialization.',
      verified: true,
      memberSince: 'November 2023',
      responseTime: 'Replies in ~30 mins'
    },
    matchScore: 96
  }
];
