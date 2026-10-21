import { useDialog } from '../utils/navigation';
import { PetImage } from './PetImage';
import React from 'react';
import { X, Sparkles, MapPin, ShieldCheck, Heart, Calendar, Check, MessageSquare } from 'lucide-react';
import { Dog } from '../types/dog';

interface DogDetailModalProps {
  dog: Dog | null;
  onClose: () => void;
  onLike: (dog: Dog) => void;
  onPlanPlaydate: (dog: Dog) => void;
  onStartChat: (dog: Dog) => void;
}

export const DogDetailModal: React.FC<DogDetailModalProps> = ({
  dog,
  onClose,
  onLike,
  onPlanPlaydate,
  onStartChat
}) => {
  const dialogRef = useDialog(!!dog, onClose);
  if (!dog) return null;

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Pet profile" tabIndex={-1} className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Tap backdrop to dismiss */}
      <div className="flex-1" onClick={onClose} />

      {/* Slide-Up Bottom Sheet */}
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom duration-300">
        {/* Android Sheet Drag Handle */}
        <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 shrink-0" />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-24 space-y-5">
          {/* Header Photo & Name */}
          <div className="relative rounded-2xl overflow-hidden aspect-4/3 bg-slate-100 dark:bg-slate-800 shadow-inner">
            <PetImage
              src={dog.photos[0]}
              alt={dog.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-md min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600/90 text-white text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{dog.matchScore || 94}% Playmate Compatibility</span>
            </div>
          </div>

          {/* Core Info */}
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{dog.name}</h2>
                <span className="text-xl font-medium text-slate-500">{dog.age} years</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>{dog.petType === 'cat' ? 'Verified Feline' : 'Verified Pup'}</span>
              </div>
            </div>

            {/* Unboxed Metadata Line */}
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>{dog.breed}</span>
              <span aria-hidden="true">·</span>
              <span>{dog.gender}</span>
              <span aria-hidden="true">·</span>
              <span>{dog.size}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 mt-2">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Favorite spot: <strong>{dog.favoritePark}</strong> ({dog.distanceMiles} miles away)</span>
            </div>
          </div>

          {/* About & Bio */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1.5">
              {dog.petType === 'cat' ? 'Feline Bio' : 'Pup Bio'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {dog.bio}
            </p>
          </div>

          {/* Energy & Play Style */}
          <div className="space-y-3">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Energy Level
              </span>
              <div className="mt-1.5 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">{dog.energyLevel}</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">⚡ Zoomies Ready</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Play Styles
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {dog.playStyles.map((style) => (
                  <span
                    key={style}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700"
                  >
                    {style}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Quirks & Fun Facts */}
          {dog.quirks && dog.quirks.length > 0 && (
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {dog.petType === 'cat' ? 'Feline Quirks & Habits' : 'Canine Quirks & Habits'}
              </span>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                {dog.quirks.map((quirk, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>{quirk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Good With & Health */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Social Harmony
              </span>
              <div className="space-y-1 text-xs text-slate-700 dark:text-slate-200">
                {dog.goodWith.map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Good with {item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Health Status
              </span>
              <div className="space-y-1 text-xs text-slate-700 dark:text-slate-200">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{dog.vaccinated === true ? 'Vaccines Up to Date' : dog.vaccinated === false ? 'Not Vaccinated' : 'Vaccination Unknown'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{dog.neutered === true ? 'Spayed / Neutered' : dog.neutered === false ? 'Not Spayed / Neutered' : 'Neuter Status Unknown'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dog Owner Section */}
          <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-start gap-3">
            <PetImage
              src={dog.owner.avatar}
              alt={dog.owner.name}
              className="w-11 h-11 rounded-full object-cover shrink-0 ring-2 ring-emerald-500/30"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {dog.owner.name} ({dog.petType === 'cat' ? 'Cat Parent' : 'Dog Parent'})
                </h4>
                <span className="text-[10px] text-slate-400">{dog.owner.responseTime}</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                {dog.owner.bio}
              </p>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Actions */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2.5">
          <button
            onClick={() => {
              onPlanPlaydate(dog);
              onClose();
            }}
            className="flex-1 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Plan Playdate</span>
          </button>

          <button
            onClick={() => {
              onStartChat(dog);
              onClose();
            }}
            className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Message</span>
          </button>

          <button
            onClick={() => {
              onLike(dog);
              onClose();
            }}
            className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Like this dog"
          >
            <Heart className="w-5 h-5 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
};
