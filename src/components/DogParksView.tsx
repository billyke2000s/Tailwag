import { usePersistentState } from '../utils/storage';
import { PetImage } from './PetImage';
import React, { useState } from 'react';
import { 
  MapPin, 
  Star, 
  Users, 
  Clock, 
  Navigation, 
  ShieldCheck, 
  Plus, 
  Check, 
  Sparkles,
  Search
} from 'lucide-react';
import { DogPark, Dog } from '../types/dog';
import { soundManager } from '../utils/audio';

interface DogParksViewProps {
  parks: DogPark[];
  userDog: Dog;
  onPlanMeetupAtPark: (park: DogPark) => void;
  petMode?: 'dogs' | 'cats';
}

export const DogParksView: React.FC<DogParksViewProps> = ({
  parks: initialParks,
  userDog,
  onPlanMeetupAtPark,
  petMode = 'dogs'
}) => {

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPark, setSelectedPark] = useState<DogPark | null>(initialParks[0]);
  const [checkedInParkId, setCheckedInParkId] = usePersistentState<string | null>('check-in-' + userDog.id, null, (v): v is string | null => v === null || (typeof v === 'string' && initialParks.some(p => p.id === v)));
  const parks = initialParks.map(park => park.id !== checkedInParkId ? park : ({...park,activeDogsCount:park.activeDogsCount+1,checkedInDogs:[...park.checkedInDogs,{id:userDog.id,name:userDog.name,breed:userDog.breed,photo:userDog.photos[0]}]}));

  const filteredParks = parks.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.amenities.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCheckIn = (parkId: string) => {
    soundManager.playPop();
    setCheckedInParkId(previous => previous === parkId ? null : parkId);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-900 select-none">
      {/* Header with Search */}
      <div className="px-5 py-3 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              {petMode === 'cats' ? 'Feline Lounges & Catios' : 'Local Dog Parks'}
            </h2>
            <p className="text-[11px] text-slate-500">
              {petMode === 'cats' ? 'Find safe catios, lounges & play buddies' : 'Find active off-leash zones & playmates'}
            </p>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200/60 dark:border-emerald-800/60">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Radar</span>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={petMode === 'cats' ? "Search lounge, catio, climbing wall..." : "Search park name, turf, amenities..."}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Main Parks Scroll List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredParks.map((park) => {
          const isCheckedIn = checkedInParkId === park.id;

          return (
            <div
              key={park.id}
              className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden transition-all hover:border-emerald-500/60"
            >
              {/* Photo & Active Badges */}
              <div className="relative h-36 bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <PetImage
                  src={park.photoUrl}
                  alt={park.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[11px] font-semibold border border-white/20">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{park.rating}</span>
                  <span className="text-slate-300">({park.reviewCount})</span>
                </div>

                <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-emerald-600/90 text-white text-[11px] font-bold backdrop-blur-sm flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{park.activeDogsCount} dogs playing now</span>
                </div>

                <div className="absolute bottom-2.5 left-3 right-3 text-white">
                  <h3 className="text-base font-black tracking-tight drop-shadow-xs">{park.name}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-200 mt-0.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      {park.distanceMiles} miles away
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {park.hours}
                    </span>
                  </div>
                </div>
              </div>

              {/* Park Body */}
              <div className="p-3.5 space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {park.description}
                </p>

                {/* Checked in dogs avatar strip */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Currently Romping Here
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2 overflow-hidden">
                      {park.checkedInDogs.map((dog, i) => (
                        <PetImage
                          key={i}
                          src={dog.photo}
                          alt={dog.name}
                          className="inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-800 object-cover"
                          title={`${dog.name} (${dog.breed})`}
                          referrerPolicy="no-referrer"
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium truncate">
                      {park.checkedInDogs.map((d) => d.name).join(', ')}
                    </span>
                  </div>
                </div>

                {/* Amenities Badges */}
                <div className="flex flex-wrap gap-1.5">
                  {park.amenities.slice(0, 4).map((amenity) => (
                    <span
                      key={amenity}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300"
                    >
                      {amenity}
                    </span>
                  ))}
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 self-center">
                    {park.fenced}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-2">
                  <button
                    onClick={() => handleCheckIn(park.id)}
                    className={`flex-1 h-10 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isCheckedIn
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    }`}
                  >
                    {isCheckedIn ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>{userDog.name} Checked In!</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Check In {userDog.name}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onPlanMeetupAtPark(park)}
                    className="px-3.5 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Plan meetup at this park"
                  >
                    <Navigation className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Meetup</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
