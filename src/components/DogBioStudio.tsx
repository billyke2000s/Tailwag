import { PetImage } from './PetImage';
import React, { useState } from 'react';
import { Sparkles, MessageCircle, Heart, RefreshCw, Check, Copy } from 'lucide-react';
import { Dog } from '../types/dog';
import { generateDogBio, translateBarkToHuman, translateMeowToHuman, calculateDogCompatibility } from '../utils/gemini';
import { soundManager } from '../utils/audio';

interface DogBioStudioProps {
  userDog: Dog;
  matchedDogs: Dog[];
  onUpdateBio: (newBio: string) => void;
  petMode?: 'dogs' | 'cats';
}

export const DogBioStudio: React.FC<DogBioStudioProps> = ({
  userDog,
  matchedDogs,
  onUpdateBio,
  petMode = 'dogs'
}) => {
  const [activeTab, setActiveTab] = useState<'bio' | 'synergy' | 'translator'>('bio');

  const dogTraits = [
    'Ball Obsessed',
    'Velcro Dog',
    'Sploot Champion',
    'Mud Magnet',
    'Squirrel Stalker',
    'Professional Napper',
    'Treat Connoisseur',
    'Tail Wag Machine'
  ];

  const catTraits = [
    'Biscuit Baker',
    'Cardboard Box Sommelier',
    'Sunbeam Hunter',
    'Feather Wand Acrobat',
    'Midnight Zoomies',
    'Bird Watcher',
    'Loud Purr Machine',
    'Catnip Connoisseur'
  ];

  const traitOptions = petMode === 'cats' ? catTraits : dogTraits;

  // Bio Generator State
  const [selectedTraits, setSelectedTraits] = useState<string[]>(
    petMode === 'cats' 
      ? ['Biscuit Baker', 'Cardboard Box Sommelier', 'Sunbeam Hunter']
      : ['Ball Obsessed', 'Velcro Dog', 'Sploot Champion']
  );
  const [favoriteToy, setFavoriteToy] = useState<string>(
    petMode === 'cats' ? 'Feather Wand & Catnip Mouse' : 'Yellow Tennis Ball'
  );
  const [vibe, setVibe] = useState<string>(
    petMode === 'cats' ? 'Regal & Haughty' : 'Playful & Energetic'
  );
  const [generatedBio, setGeneratedBio] = useState<string>(userDog.bio);
  const [isGeneratingBio, setIsGeneratingBio] = useState<boolean>(false);
  const [copiedBio, setCopiedBio] = useState<boolean>(false);
  const [appliedBio, setAppliedBio] = useState<boolean>(false);

  // Synergy Analyzer State
  const [selectedPartnerDog, setSelectedPartnerDog] = useState<Dog>(matchedDogs[0] || userDog);

  // Translator State
  const [mood, setMood] = useState<'excited' | 'hungry' | 'playful'>('playful');
  const [translatedText, setTranslatedText] = useState<string>(
    petMode === 'cats'
      ? `"Observe my regal loaf. Now prepare yourself, because in 0.5 seconds I will launch into the air and attack your ankles!"`
      : `"Look at this stick! It is the greatest stick in human history! You may look at it, but DO NOT TOUCH IT! Okay throw it!"`
  );
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  const handleToggleTrait = (trait: string) => {
    setSelectedTraits((prev) =>
      prev.includes(trait) ? prev.filter((t) => t !== trait) : [...prev, trait]
    );
  };

  const handleGenerateBio = async () => {
    soundManager.playPop();
    setIsGeneratingBio(true);
    setAppliedBio(false);
    const bio = await generateDogBio(
      userDog.name,
      userDog.breed,
      selectedTraits,
      favoriteToy,
      vibe,
      petMode === 'cats' ? 'cat' : 'dog'
    );
    setGeneratedBio(bio);
    setIsGeneratingBio(false);
  };

  const handleApplyToProfile = () => {
    if (petMode === 'cats') {
      soundManager.playMeow();
    } else {
      soundManager.playBark();
    }
    onUpdateBio(generatedBio);
    setAppliedBio(true);
    setTimeout(() => setAppliedBio(false), 2500);
  };

  const handleTranslateSpeech = async (selectedMood: 'excited' | 'hungry' | 'playful') => {
    if (petMode === 'cats') {
      soundManager.playMeow();
    } else {
      soundManager.playBark();
    }
    setMood(selectedMood);
    setIsTranslating(true);

    if (petMode === 'cats') {
      const trans = await translateMeowToHuman(userDog.name, userDog.breed, selectedMood);
      setTranslatedText(trans);
    } else {
      const trans = await translateBarkToHuman(userDog.name, userDog.breed, selectedMood);
      setTranslatedText(trans);
    }
    setIsTranslating(false);
  };

  const synergy = calculateDogCompatibility(userDog, selectedPartnerDog);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-900 select-none">
      {/* Top Header */}
      <div className="px-5 py-3 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              {petMode === 'cats' ? 'Pet Wingman Studio' : 'Pet Wingman Studio'}
            </h2>
            <p className="text-[11px] text-slate-500">
              {petMode === 'cats'
                ? 'Craft viral cat bios & decode your feline’s thoughts'
                : 'Craft viral dog bios & analyze play compatibility'}
            </p>
          </div>
        </div>

        {/* 3 Interactive Tab Buttons */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('bio')}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer truncate ${
              activeTab === 'bio'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            Bio Maker
          </button>
          <button
            onClick={() => setActiveTab('synergy')}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer truncate ${
              activeTab === 'synergy'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            Compatibility
          </button>
          <button
            onClick={() => setActiveTab('translator')}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer truncate ${
              activeTab === 'translator'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            {petMode === 'cats' ? 'Meow Translator' : 'Bark Translator'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: Bio Maker */}
        {activeTab === 'bio' && (
          <div className="space-y-4">
            {/* Traits Selection */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                Select {userDog.name}'s Distinct Quirks
              </span>
              <div className="flex flex-wrap gap-1.5">
                {traitOptions.map((trait) => {
                  const isSelected = selectedTraits.includes(trait);
                  return (
                    <button
                      key={trait}
                      onClick={() => handleToggleTrait(trait)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {trait}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Favorite Toy & Vibe */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Prized Toy / Object
                </label>
                <input
                  type="text"
                  value={favoriteToy}
                  onChange={(e) => setFavoriteToy(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Profile Persona
                </label>
                <select
                  value={vibe}
                  onChange={(e) => setVibe(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                >
                  {petMode === 'cats' ? (
                    <>
                      <option value="Regal & Haughty">Regal & Haughty</option>
                      <option value="Playful & Chaotic">Playful & Chaotic</option>
                      <option value="Quiet Bookish Loaf">Quiet Bookish Loaf</option>
                      <option value="Affectionate Lap Cat">Affectionate Lap Cat</option>
                    </>
                  ) : (
                    <>
                      <option value="Playful & Energetic">Playful & Energetic</option>
                      <option value="Distinguished Gentleman">Distinguished Gentleman</option>
                      <option value="Full Zoomies Chaos">Full Zoomies Chaos</option>
                      <option value="Sweet Cuddle Bug">Sweet Cuddle Bug</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Action Trigger */}
            <button
              onClick={handleGenerateBio}
              disabled={isGeneratingBio}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isGeneratingBio ? 'animate-spin' : ''}`} />
              <span>{isGeneratingBio ? 'Generating Pet Bio...' : 'Generate Demo Bio'}</span>
            </button>

            {/* Resulting Bio Preview */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-white">Generated Bio Preview</span>
                <span className="text-[11px] text-slate-400 font-mono">{generatedBio.length} chars</span>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed italic bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                "{generatedBio}"
              </p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleApplyToProfile}
                  className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  {appliedBio ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  <span>{appliedBio ? 'Applied to Profile!' : 'Set as Current Bio'}</span>
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(generatedBio);
                    setCopiedBio(true);
                    setTimeout(() => setCopiedBio(false), 2000);
                  }}
                  className="px-3 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedBio ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Synergy Analyzer */}
        {activeTab === 'synergy' && (
          <div className="space-y-4">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Compare {userDog.name} with Matched {petMode === 'cats' ? 'Felines' : 'Pups'}
            </span>

            {/* Select Target Dog Strip */}
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {matchedDogs.map((dog) => {
                const isSelected = selectedPartnerDog.id === dog.id;
                return (
                  <button
                    key={dog.id}
                    onClick={() => {
                      setSelectedPartnerDog(dog);
                      soundManager.playPop();
                    }}
                    className={`p-2 rounded-2xl flex items-center gap-2 border transition-all cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/30'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <PetImage
                      src={dog.photos[0]}
                      alt={dog.name}
                      className="w-10 h-10 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-left text-xs">
                      <span className="font-bold text-slate-900 dark:text-white block">{dog.name}</span>
                      <span className="text-[10px] text-slate-400">{dog.breed.split(' ')[0]}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Compatibility Score Card */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {userDog.name} & {selectedPartnerDog.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">Playstyle Compatibility Matrix</p>
                </div>
                <div className="px-3 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-extrabold text-lg font-mono">
                  {synergy.score}%
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${synergy.score}%` }}
                />
              </div>

              {/* Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Energy Synergy
                  </span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {synergy.energySynergy}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Play Style Harmony
                  </span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {synergy.playstyleSynergy}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">
                    Recommended First Meetup Spot
                  </span>
                  <p className="font-semibold text-emerald-900 dark:text-emerald-200 mt-0.5">
                    {synergy.recommendedPark}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Speech Translator */}
        {activeTab === 'translator' && (
          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                What is {userDog.name} REALLY saying?
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { 
                    id: 'playful' as const, 
                    label: petMode === 'cats' ? '🧶 Yarn Ball' : '🎾 Tennis Ball', 
                    emoji: petMode === 'cats' ? '🐱' : '🐾' 
                  },
                  { 
                    id: 'excited' as const, 
                    label: petMode === 'cats' ? '⚡ Midnight Zoom' : '⚡ Park Zoomies', 
                    emoji: '💨' 
                  },
                  { 
                    id: 'hungry' as const, 
                    label: petMode === 'cats' ? '🐟 Tuna Feast' : '🥩 Treat Emergency', 
                    emoji: petMode === 'cats' ? '🥫' : '🍖' 
                  }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleTranslateSpeech(m.id)}
                    className={`p-2.5 rounded-xl text-center border transition-all cursor-pointer text-xs ${
                      mood === m.id
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="block text-base mb-1">{m.emoji}</span>
                    <span className="truncate block font-medium">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Translation Output */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>{petMode === 'cats' ? '🐱' : '🐕'}</span> {userDog.name}'s Monologue
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Local demo generator
                </span>
              </div>

              <blockquote className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                {isTranslating ? (petMode === 'cats' ? 'Listening to meows...' : 'Listening to woofs...') : translatedText}
              </blockquote>

              <button
                onClick={() => handleTranslateSpeech(mood)}
                disabled={isTranslating}
                className="w-full h-10 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTranslating ? 'animate-spin' : ''}`} />
                <span>Another Interpretation</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
