import { useDialog } from '../utils/navigation';
import { PetImage } from './PetImage';
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, MessageCircle, ArrowRight } from 'lucide-react';
import { Dog } from '../types/dog';
import { soundManager } from '../utils/audio';

interface MatchCelebrationModalProps {
  userDog: Dog;
  matchedDog: Dog | null;
  onClose: () => void;
  onOpenChat: (dog: Dog) => void;
}

export const MatchCelebrationModal: React.FC<MatchCelebrationModalProps> = ({
  userDog,
  matchedDog,
  onClose,
  onOpenChat
}) => {
  const dialogRef = useDialog(!!matchedDog, onClose);
  useEffect(() => {
    if (matchedDog) {
      soundManager.playMatchCelebration();
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#10b981', '#06b6d4', '#f59e0b', '#ec4899']
        });
      } catch {
        // Confetti fallback
      }
    }
  }, [matchedDog]);

  if (!matchedDog) return null;

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="New match" tabIndex={-1} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700/80 p-6 text-center text-white shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-teal-500/20 blur-3xl pointer-events-none" />

        {/* Header Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>It's a Playmate Match!</span>
        </div>

        <h3 className="text-2xl font-black tracking-tight leading-tight">
          {matchedDog.name} wants to play with {userDog.name}!
        </h3>
        <p className="text-xs text-slate-300 mt-1.5">
          Both pups love {matchedDog.playStyles[0] || 'outdoor zoomies'} and play well together!
        </p>

        {/* Side-by-side Dog Avatars */}
        <div className="flex items-center justify-center gap-2 my-6">
          <div className="relative">
            <PetImage
              src={userDog.photos[0]}
              alt={userDog.name}
              className="w-20 h-20 rounded-full object-cover ring-4 ring-emerald-500 shadow-lg"
              referrerPolicy="no-referrer"
            />
            <span className="absolute -bottom-1 -right-1 text-base">🐶</span>
          </div>

          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-rose-500 font-bold text-sm shadow-md z-10 -mx-2">
            ❤️
          </div>

          <div className="relative">
            <PetImage
              src={matchedDog.photos[0]}
              alt={matchedDog.name}
              className="w-20 h-20 rounded-full object-cover ring-4 ring-teal-400 shadow-lg"
              referrerPolicy="no-referrer"
            />
            <span className="absolute -bottom-1 -right-1 text-base">🐾</span>
          </div>
        </div>

        {/* Compatibility Quick Stat */}
        <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-200 mb-6 flex items-center justify-around">
          <div>
            <span className="text-[10px] text-slate-400 block">Compatibility</span>
            <span className="font-bold text-emerald-400">{matchedDog.matchScore || 94}%</span>
          </div>
          <div className="h-6 w-px bg-slate-700" />
          <div>
            <span className="text-[10px] text-slate-400 block">Meetup Spot</span>
            <span className="font-bold text-slate-200 truncate max-w-[120px] block">{matchedDog.favoritePark}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={() => {
              onOpenChat(matchedDog);
              onClose();
            }}
            className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Say "Woof!" in Chat</span>
          </button>

          <button
            onClick={onClose}
            className="w-full h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Keep Sniffing Pups</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
