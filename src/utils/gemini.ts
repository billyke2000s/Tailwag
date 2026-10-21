import { Dog } from '../types/dog';

// Offline prototype generators. No API credentials or network requests are used.
/**
 * Generate funny, tailored icebreaker suggestions for dog playdates
 */
export async function generateIcebreakerSuggestions(myDog: Dog, targetDog: Dog): Promise<string[]> {
  const fallbackSuggestions = [
    `Hey ${targetDog.owner.name}! ${myDog.name} saw ${targetDog.name} and did an immediate tail wag. Are you two free for a playdate at ${targetDog.favoritePark}?`,
    `Does ${targetDog.name} enjoy high-speed fetch or gentle sniffing? ${myDog.name} is looking for a weekend park partner!`,
    `Hi from ${myDog.name}'s human! Love ${targetDog.name}'s profile—especially the quirk about "${targetDog.quirks[0] || 'zoomies'}". Would love to introduce them!`,
    `Is ${targetDog.name} free for a quick pup-cup & morning walk this Saturday?`
  ];

  return fallbackSuggestions;
}

/**
 * Translate a dog's "Bark / Woof" into hilarious human speech
 */
export async function translateBarkToHuman(dogName: string, breed: string, barkMood: string): Promise<string> {
  const fallbackTranslations: Record<string, string[]> = {
    excited: [
      `"I have sniffed the wind and determined that we MUST GO TO THE PARK THIS INSTANT! NO TIME TO EXPLAIN, GET THE LEASH!"`,
      `"HELLO FRIEND! I HAVE FOUR LEGS, YOU HAVE TWO LEGS, TOGETHER WE FORM THE ULTIMATE SQUAD!"`
    ],
    hungry: [
      `"Notice how my bowl is currently empty? Scientifically speaking, this is an existential emergency."`,
      `"I smelled cheese from three blocks away. Let's negotiate a treaty where I get the rind."`
    ],
    playful: [
      `"Look at this stick! It is the greatest stick in human history! You may look at it, but DO NOT TOUCH IT! Okay throw it!"`,
      `"Initiating zoomies protocol in 3... 2... 1... WOOOOF!"`
    ]
  };

  const pool = fallbackTranslations[barkMood] || fallbackTranslations.playful;
  const chosen = pool[Math.floor(Math.random() * pool.length)];

  return chosen;
}

/**
 * Translate a cat's "Meow / Purr" into humorous human speech
 */
export async function translateMeowToHuman(catName: string, breed: string, meowMood: string): Promise<string> {
  const fallbackTranslations: Record<string, string[]> = {
    excited: [
      `"I have spotted an invisible particle on the ceiling and I MUST SING THE SONG OF OUR PEOPLE AT MAXIMUM VOLUME!"`,
      `"ATTENTION PEASANT: The treat drawer is closed. Rectify this geopolitical catastrophe immediately."`
    ],
    hungry: [
      `"There is an empty circle in the exact center of my bowl. I am perishing of starvation while looking directly at kibble."`,
      `"Open the wet food can with haste, or your favorite potted plant pays the ultimate price."`
    ],
    playful: [
      `"Observe my regal loaf. Now prepare yourself, because in 0.5 seconds I will launch into the air and attack your ankles!"`,
      `"I have captured the felt mouse! Bask in my ancestral predator glory before I demand chin scratches."`
    ]
  };

  const pool = fallbackTranslations[meowMood] || fallbackTranslations.playful;
  const chosen = pool[Math.floor(Math.random() * pool.length)];

  return chosen;
}

/**
 * Generate funny bio for pet bio studio (supports both dogs and cats)
 */
export async function generateDogBio(
  name: string,
  breed: string,
  traits: string[],
  favoriteToy: string,
  vibe: string,
  petType: 'dog' | 'cat' = 'dog'
): Promise<string> {
  const catFallbacks = [
    `Distinguished ${breed} with a doctorate in testing cardboard box integrity. When not napping in sunbeams, I enjoy 3 AM hall sprints and staring into the void. Seeking a fellow feline who respects personal space and mutual bird watching.`,
    `A certified royal loaf known for ${traits.join(' and ')}. Must appreciate quiet company, feather wands, and high-altitude bookshelf perches.`,
    `Independent yet affectionate biscuit baker! Looking for a catio companion who won't judge my dramatic reaction to closed doors.`
  ];

  const dogFallbacks = [
    `Professional ${breed} with a master's degree in staring at the treat jar. When I'm not obsessing over my ${favoriteToy}, you can find me testing sunny nap spots across the living room. Seeking a four-legged partner in crime who won't judge my 3 AM zoomies!`,
    `A certified good pup seeking a weekend trail buddy! Known for ${traits.join(' and ')}. Must love outdoor mud puddles and be willing to share sticks of above-average quality.`,
    `Looking for someone to run circles around the park with. I bring high energy, unconditional tail wags, and will defend our picnic blanket from squirrels at all costs!`
  ];

  const fallbacks = petType === 'cat' ? catFallbacks : dogFallbacks;

  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

/**
 * Play style compatibility match analysis
 */
export function calculateDogCompatibility(dogA: Dog, dogB: Dog): {
  score: number;
  energySynergy: string;
  playstyleSynergy: string;
  verdict: string;
  recommendedPark: string;
} {
  let score = 75;

  // Energy matching
  const energies = ['Chill Couch Potato', 'Moderate Stroller', 'High Energy Sprinter', 'Hyper Zoomies Champion'];
  const diffEnergy = Math.abs(energies.indexOf(dogA.energyLevel) - energies.indexOf(dogB.energyLevel));
  if (diffEnergy === 0) score += 15;
  else if (diffEnergy === 1) score += 8;
  else score -= 10;

  // Shared play style
  const sharedPlay = dogA.playStyles.filter(s => dogB.playStyles.includes(s));
  score += Math.min(sharedPlay.length * 5, 15);

  // Good with checks
  if (dogA.goodWith.includes('Big Dogs') || dogB.goodWith.includes('Big Dogs')) score += 5;
  if (dogA.goodWith.includes('Puppies') || dogB.goodWith.includes('Puppies')) score += 3;

  score = Math.max(65, Math.min(99, score));

  let energySynergy = 'Harmonious pace';
  if (diffEnergy === 0) energySynergy = 'Perfect energy twin — identical zoomie stamina';
  else if (diffEnergy === 1) energySynergy = 'Complementary active levels';
  else energySynergy = 'Gentle balance — one sprinter, one pacer';

  let playstyleSynergy = sharedPlay.length > 0 
    ? `Mutual love for ${sharedPlay.join(' & ')}` 
    : 'Different styles that balance fetch and sniffing';

  let verdict = 'High potential for an epic dog park friendship!';
  if (score >= 90) verdict = 'Soulmate status! Schedule a weekend playdate immediately.';
  else if (score >= 80) verdict = 'Great match! Ideal for joint walks and outdoor fetch.';

  return {
    score,
    energySynergy,
    playstyleSynergy,
    verdict,
    recommendedPark: dogB.favoritePark || dogA.favoritePark
  };
}
