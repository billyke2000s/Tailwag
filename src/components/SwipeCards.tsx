import { usePersistentState, isStringList } from '../utils/storage';
import { rewindHistory } from '../utils/discovery';
import { PetImage } from './PetImage';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { X, Heart, Star, RotateCcw, SlidersHorizontal, Info, Sparkles, MapPin, ShieldCheck, HeartHandshake } from 'lucide-react';
import { Dog } from '../types/dog';
import { soundManager } from '../utils/audio';

interface SwipeCardsProps {
  dogs: Dog[];
  onLike: (dog: Dog) => void;
  onPass: (dog: Dog) => void;
  onSuperLike: (dog: Dog) => void;
  onOpenFilter: () => void;
  onOpenDetail: (dog: Dog) => void;
  petMode?: 'dogs' | 'cats';
  onChangePetMode?: (mode: 'dogs' | 'cats') => void;
}

export const SwipeCards: React.FC<SwipeCardsProps> = ({
  dogs,
  onLike,
  onPass,
  onSuperLike,
  onOpenFilter,
  onOpenDetail,
  petMode = 'dogs',
  onChangePetMode
}) => {
  const [history, setHistory] = usePersistentState<string[]>('discovery-' + petMode, [], isStringList);
  const lock = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | null>(null);

  const remaining = dogs.filter(dog => !history.includes(dog.id));
  const currentDog = remaining[0];

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 90;
    if (info.offset.x > threshold) {
      triggerSwipe('right');
    } else if (info.offset.x < -threshold) {
      triggerSwipe('left');
    } else if (info.offset.y < -threshold) {
      triggerSwipe('up');
    }
  };

  const triggerSwipe = (dir: 'left' | 'right' | 'up') => {
    if (!currentDog || lock.current) return;
    lock.current = true;
    const id = currentDog.id;
    setSwipeDirection(dir);

    if (dir === 'right') {
      if (petMode === 'cats') {
        soundManager.playMeow();
      } else {
        soundManager.playBark();
      }
      onLike(currentDog);
    } else if (dir === 'left') {
      soundManager.playSwipe();
      onPass(currentDog);
    } else if (dir === 'up') {
      soundManager.playMatchCelebration();
      onSuperLike(currentDog);
    }

    timer.current = setTimeout(() => {
      setHistory(previous => previous.includes(id) ? previous : [...previous,id]);
      lock.current = false; setSwipeDirection(null); timer.current = null;
    }, 220);
  };

  const handleRewind = () => {
    if (lock.current) return;
    setHistory(previous => rewindHistory(previous, dogs.map(dog => dog.id)));
    soundManager.playPop();
  };
  const handleReset = () => {
    if (lock.current) return;
    setHistory(previous => previous.filter(id => !dogs.some(d => d.id === id)));
    soundManager.playPop();
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none">
      {/* Top Bar Contract (Android App Header) */}
      <header className="h-14 shrink-0 px-3.5 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-20">
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            {petMode === 'cats' ? 'PurrfectMatch' : 'TailWag'}
          </span>
        </div>

        {/* Pet Switcher Toggle */}
        {onChangePetMode && (
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
            <button
              onClick={() => {
                onChangePetMode('dogs');
                soundManager.playPop();
              }}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                petMode === 'dogs'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              🐶 Dogs
            </button>
            <button
              onClick={() => {
                onChangePetMode('cats');
                soundManager.playMeow();
              }}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                petMode === 'cats'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              🐱 Cats
            </button>
          </div>
        )}

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              if (petMode === 'cats') {
                soundManager.playMeow();
              } else {
                soundManager.playBark();
              }
            }}
            className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 hover:bg-emerald-100 flex items-center gap-1 min-h-[34px] transition-colors cursor-pointer"
            title={petMode === 'cats' ? 'Meow audio test' : 'Bark audio test'}
          >
            <span>{petMode === 'cats' ? '🐱' : '🐶'}</span>
            <span>{petMode === 'cats' ? 'Meow!' : 'Woof!'}</span>
          </button>

          <button
            onClick={onOpenFilter}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors cursor-pointer"
            title="Search Filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Card Swipe Canvas */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-3 sm:p-4 min-h-0">
        {currentDog ? (
          <div className="relative w-full max-w-sm h-full max-h-[580px] flex items-center justify-center">
            {/* Background card preview for depth */}
            {remaining[1] && (
              <div className="absolute inset-0 scale-[0.94] translate-y-3 opacity-60 rounded-3xl bg-slate-200 dark:bg-slate-800 pointer-events-none shadow-md overflow-hidden">
                <PetImage
                  src={remaining[1].photos[0]}
                  alt="Next dog"
                  className="w-full h-full object-cover filter blur-[1px]"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            {/* Top Swipable Card */}
            <AnimatePresence>
              <motion.div
                key={currentDog.id}
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={0.8}
                onDragEnd={handleDragEnd}
                animate={
                  swipeDirection === 'right'
                    ? { x: 380, rotate: 20, opacity: 0 }
                    : swipeDirection === 'left'
                    ? { x: -380, rotate: -20, opacity: 0 }
                    : swipeDirection === 'up'
                    ? { y: -450, opacity: 0 }
                    : { x: 0, y: 0, rotate: 0, opacity: 1 }
                }
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="absolute inset-0 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-xl border border-slate-200/80 dark:border-slate-800 cursor-grab active:cursor-grabbing flex flex-col"
              >
                {/* Dog Photo with Contrast Gradient Scrim */}
                <div className="relative flex-1 min-h-[280px] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <PetImage
                    src={currentDog.photos[0]}
                    alt={currentDog.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />

                  {/* Gradient Scrim for Legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

                  {/* Top Floating Match Compatibility & Energy */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-xs font-semibold border border-white/20">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{currentDog.matchScore || 92}% Compatibility</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDetail(currentDog);
                      }}
                      className="p-2 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-800 dark:text-white hover:bg-white min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors cursor-pointer shadow-md"
                      title="View Dog Profile"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Bottom Image Info Overlay */}
                  <div className="absolute bottom-3 left-4 right-4 text-white z-10">
                    <div className="flex items-baseline gap-2">
                      <h2 className="text-2xl font-black tracking-tight">{currentDog.name}</h2>
                      <span className="text-xl font-medium text-slate-200">{currentDog.age} yrs</span>
                      {currentDog.owner.verified === true && <ShieldCheck aria-label="Test profile verified" className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />}
                    </div>

                    {/* Unboxed Metadata with Typographic Separator */}
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-200 mt-0.5">
                      <span>{currentDog.breed}</span>
                      <span aria-hidden="true">·</span>
                      <span>{currentDog.gender}</span>
                      <span aria-hidden="true">·</span>
                      <span>{currentDog.size.split(' ')[0]}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-emerald-300 mt-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{currentDog.favoritePark} ({currentDog.distanceMiles} mi)</span>
                    </div>
                  </div>
                </div>

                {/* Card Lower Deck: Bio & Quirks Snippet */}
                <div 
                  onClick={() => currentDog && !swipeDirection && onOpenDetail(currentDog)}
                  className="p-3.5 bg-white dark:bg-slate-900 shrink-0 border-t border-slate-100 dark:border-slate-800 cursor-pointer"
                >
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {currentDog.bio}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                    <span className="truncate">Loves: {currentDog.playStyles.slice(0, 2).join(' · ')}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">Tap for Bio</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          /* Empty Deck State */
          <div className="text-center p-6 max-w-xs mx-auto flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl mb-4">
              {petMode === 'cats' ? '🐱' : '🐕'}
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {petMode === 'cats' ? 'All Cats Explored!' : 'All Pups Explored!'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              {petMode === 'cats'
                ? 'You’ve checked out all the feline friends in your current search radius.'
                : 'You’ve checked out all the dog playmates in your current search radius.'}
            </p>

            <button
              onClick={handleReset}
              className="mt-5 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Shuffle & Discover Again</span>
            </button>
          </div>
        )}
      </div>

      {/* Tactile Action Control Bar (Natural Thumb Zone) */}
      {(currentDog || history.some(id => dogs.some(d => d.id === id))) && (
        <div className="shrink-0 px-4 py-2.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-4 z-20">
          {/* Rewind */}
          <button
            onClick={handleRewind}
            disabled={!!swipeDirection || !history.some(id => dogs.some(d => d.id === id))}
            className="w-11 h-11 rounded-full flex items-center justify-center text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 disabled:opacity-40 disabled:pointer-events-none transition-transform active:scale-95 cursor-pointer shadow-sm"
            title="Rewind previous card"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Pass (Dislike) */}
          <button
            disabled={!currentDog || !!swipeDirection} onClick={() => triggerSwipe('left')}
            className="w-14 h-14 rounded-full flex items-center justify-center text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 transition-transform active:scale-90 hover:scale-105 cursor-pointer shadow-md"
            title="Pass to next dog"
          >
            <X className="w-7 h-7 stroke-[2.5]" />
          </button>

          {/* Super Bark / Star */}
          <button
            disabled={!currentDog || !!swipeDirection} onClick={() => triggerSwipe('up')}
            className="w-11 h-11 rounded-full flex items-center justify-center text-sky-500 hover:text-sky-600 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 transition-transform active:scale-95 hover:scale-105 cursor-pointer shadow-sm"
            title="Super Bark! Send direct alert"
          >
            <Star className="w-5 h-5 fill-current" />
          </button>

          {/* Match / Like */}
          <button
            disabled={!currentDog || !!swipeDirection} onClick={() => triggerSwipe('right')}
            className="w-14 h-14 rounded-full flex items-center justify-center text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 transition-transform active:scale-90 hover:scale-105 cursor-pointer shadow-md"
            title="Match! Want to play"
          >
            <Heart className="w-7 h-7 fill-current stroke-[1.5]" />
          </button>

          {/* Quick Playdate */}
          <button
            disabled={!currentDog || !!swipeDirection} onClick={() => currentDog && onOpenDetail(currentDog)}
            className="w-11 h-11 rounded-full flex items-center justify-center text-teal-600 hover:text-teal-700 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 transition-transform active:scale-95 cursor-pointer shadow-sm"
            title="View Details & Owner"
          >
            <HeartHandshake className="w-5 h-5 stroke-[2]" />
          </button>
        </div>
      )}
    </div>
  );
};
