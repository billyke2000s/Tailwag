import { PetImage } from './PetImage';
import React, { useState } from 'react';
import { 
  Camera, 
  ShieldCheck, 
  Edit3, 
  Check, 
  Sparkles, 
  Volume2, 
  Bell, 
  HelpCircle,
  Award,
  CalendarCheck
} from 'lucide-react';
import { Dog } from '../types/dog';
import { soundManager, useSoundEnabled } from '../utils/audio';

interface ProfileViewProps {
  userDog: Dog;
  onUpdateDog: (updated: Dog) => void;
  matchesCount: number;
  onOpenInstallModal?: () => void;
  petMode?: 'dogs' | 'cats';
  alertsEnabled: boolean;
  onAlertsChange: (enabled:boolean) => void;
  onChangePetMode?: (mode: 'dogs' | 'cats') => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userDog,
  onUpdateDog,
  matchesCount,
  onOpenInstallModal,
  petMode = 'dogs',
  onChangePetMode, alertsEnabled, onAlertsChange
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [name, setName] = useState<string>(userDog.name);
  const [breed, setBreed] = useState<string>(userDog.breed);
  const [age, setAge] = useState<number>(userDog.age);
  const [bio, setBio] = useState<string>(userDog.bio);
  const [favoritePark, setFavoritePark] = useState<string>(userDog.favoritePark);
  const soundActive = useSoundEnabled();


  const [saveError, setSaveError] = useState('');
  const handleSave = () => {
    if (!name.trim() || !breed.trim() || !Number.isFinite(age) || age < 0 || age > 40) { setSaveError('Enter a name, breed and age between 0 and 40.'); return; }
    setSaveError('');
    soundManager.playPop();
    onUpdateDog({
      ...userDog,
      name: name.trim(),
      breed: breed.trim(),
      age,
      bio,
      favoritePark
    });
    setIsEditing(false);
  };

  const toggleSound = () => {
    const next = !soundActive;
    soundManager.setEnabled(next);
    if (next) soundManager.playPop();
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-900 select-none">
      {/* Top Header */}
      <div className="px-5 py-3 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
            {petMode === 'cats' ? "My Cat's Profile" : "My Dog's Profile"}
          </h2>
          <p className="text-[11px] text-slate-500">
            {petMode === 'cats' ? 'Manage feline credentials & preferences' : 'Manage pup credentials & preferences'}
          </p>
        </div>

        <div className="flex items-center gap-2">
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
                🐶
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
                🐱
              </button>
            </div>
          )}

          <button
            onClick={() => {
              if (isEditing) {
                handleSave();
              } else {
                setIsEditing(true);
                soundManager.playPop();
              }
            }}
            className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            <span>{isEditing ? 'Save' : 'Edit'}</span>
          </button>
        </div>
      </div>

      {saveError && <p role="alert" className="p-3 text-rose-700">{saveError}</p>}
      {/* Scrollable Profile Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Profile Card Header */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col items-center text-center relative overflow-hidden">
          <div className="relative mb-3">
            <PetImage
              src={userDog.photos[0]}
              alt={userDog.name}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-emerald-500 shadow-md"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-emerald-600 text-white shadow-md">
              <Camera className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {userDog.name}
            </h3>
            {userDog.owner.verified === true && <ShieldCheck aria-label="Test profile verified" className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />}
          </div>

          <p className="text-xs text-slate-500 mt-0.5">
            {userDog.breed} · {userDog.age} yrs · {userDog.gender}
          </p>

          {/* Quick Metrics Bar */}
          <div className="w-full mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="font-extrabold text-base text-emerald-600 dark:text-emerald-400 font-mono tabular-nums block">
                {matchesCount}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Matches</span>
            </div>
            <div>
              <span className="font-extrabold text-base text-slate-800 dark:text-slate-100 font-mono tabular-nums block">
                3
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Playdates</span>
            </div>
            <div>
              <span className="font-extrabold text-base text-slate-800 dark:text-slate-100 font-mono tabular-nums block">
                4.9★
              </span>
              <span className="text-[10px] text-slate-400 font-medium">{petMode === 'cats' ? 'Cat Rating' : 'Pup Rating'}</span>
            </div>
          </div>
        </div>

        {/* Editable Fields */}
        {isEditing ? (
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                {petMode === 'cats' ? 'Cat Name' : 'Pup Name'}
              </label>
              <input
                type="text"
                aria-label="Pet name" value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Breed
              </label>
              <input
                type="text"
                aria-label="Breed" value={breed}
                onChange={(e) => setBreed(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Age (years)
              </label>
              <input
                type="number"
                min="0"
                max="40"
                step="0.5"
                aria-label="Age in years" value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Bio & Quirks
              </label>
              <textarea
                rows={3}
                aria-label="Bio" value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-hidden resize-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Favorite Dog Park
              </label>
              <input
                type="text"
                aria-label="Favourite park" value={favoritePark}
                onChange={(e) => setFavoritePark(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>
          </div>
        ) : (
          /* View Details */
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Canine Bio
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                {userDog.bio}
              </p>
            </div>

            {/* Canine Badges */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Verified Badges & Accreditations
              </span>
              <div className="flex flex-wrap gap-1.5">
                {userDog.badges.map((badge) => (
                  <span
                    key={badge}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1"
                  >
                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{badge}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Owner Info */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3">
              <PetImage
                src={userDog.owner.avatar}
                alt={userDog.owner.name}
                className="w-11 h-11 rounded-full object-cover shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  Human: {userDog.owner.name}
                </h4>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {userDog.owner.bio}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Android App Settings */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 space-y-3 text-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Android App Preferences
          </span>

          <label className="flex items-center justify-between cursor-pointer py-1">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-slate-500" />
              <span className="text-slate-800 dark:text-slate-200">Playful Canine Sound Effects</span>
            </div>
            <input
              type="checkbox"
              checked={soundActive}
              onChange={toggleSound}
              className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer py-1">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-500" />
              <span className="text-slate-800 dark:text-slate-200">New Playmate Match Alerts</span>
            </div>
            <input
              type="checkbox"
              checked={alertsEnabled}
              onChange={(e) => onAlertsChange(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
            />
          </label>

          {/* Android APK Button */}
          {onOpenInstallModal && (
            <button
              onClick={onOpenInstallModal}
              className="w-full mt-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <span>📲 Convert to APK / Install on Phone</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
