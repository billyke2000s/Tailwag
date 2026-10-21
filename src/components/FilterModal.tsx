import { useDialog } from '../utils/navigation';
import React, { useState, useEffect } from 'react';
import { X, Check, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { DogSize, EnergyLevel } from '../types/dog';

export interface FilterSettings {
  maxDistance: number;
  energyLevel: string; // 'all' or EnergyLevel
  size: string; // 'all' or DogSize
  purpose: string[];
  mustBeVaccinated: boolean;
  mustBeNeutered: boolean;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterSettings;
  onApplyFilters: (newFilters: FilterSettings) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  onApplyFilters
}) => {
  const [localFilters, setLocalFilters] = useState<FilterSettings>(filters);

  useEffect(() => { if (isOpen) setLocalFilters(filters); }, [isOpen]);
  const dialogRef = useDialog(isOpen, onClose);
  if (!isOpen) return null;

  const energyOptions: (EnergyLevel | 'All')[] = [
    'All',
    'Chill Couch Potato',
    'Moderate Stroller',
    'High Energy Sprinter',
    'Hyper Zoomies Champion'
  ];

  const sizeOptions: (DogSize | 'All')[] = [
    'All',
    'Toy (<10 lbs)',
    'Small (10-25 lbs)',
    'Medium (25-50 lbs)',
    'Large (50-80 lbs)',
    'Giant (80+ lbs)'
  ];

  const purposeOptions = [
    'Dog Park Playdates',
    'Morning Walk Buddy',
    'Puppy Socialization',
    'High-Speed Zoomies Partner'
  ];

  const togglePurpose = (purpose: string) => {
    setLocalFilters((prev) => {
      const exists = prev.purpose.includes(purpose);
      return {
        ...prev,
        purpose: exists
          ? prev.purpose.filter((p) => p !== purpose)
          : [...prev.purpose, purpose]
      };
    });
  };

  const handleReset = () => {
    setLocalFilters({
      maxDistance: 15,
      energyLevel: 'All',
      size: 'All',
      purpose: ['Dog Park Playdates'],
      mustBeVaccinated: true,
      mustBeNeutered: false
    });
  };

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Match preferences" tabIndex={-1} className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="flex-1" onClick={onClose} />

      <div className="bg-white dark:bg-slate-900 rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom duration-300">
        {/* Android Sheet Handle */}
        <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 shrink-0" />

        {/* Top Header */}
        <div className="px-5 py-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Match Preferences</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Filters */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 text-xs">
          {/* Distance Slider */}
          <div>
            <div className="flex items-center justify-between font-medium mb-1.5">
              <span className="text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wider text-[11px]">
                Maximum Distance
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                {localFilters.maxDistance} miles
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              step={1}
              value={localFilters.maxDistance}
              onChange={(e) => setLocalFilters({ ...localFilters, maxDistance: Number(e.target.value) })}
              className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
            />
          </div>

          {/* Energy Level Segmented Buttons */}
          <div>
            <span className="text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wider text-[11px] block mb-2">
              Energy Match
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {energyOptions.map((opt) => {
                const isSelected = localFilters.energyLevel === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => setLocalFilters({ ...localFilters, energyLevel: opt })}
                    className={`py-2 px-2.5 rounded-xl text-left border transition-colors cursor-pointer truncate ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-semibold shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dog Size */}
          <div>
            <span className="text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wider text-[11px] block mb-2">
              Pup Size
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {sizeOptions.map((size) => {
                const isSelected = localFilters.size === size;
                return (
                  <button
                    key={size}
                    onClick={() => setLocalFilters({ ...localFilters, size: size })}
                    className={`py-2 px-2.5 rounded-xl text-left border transition-colors cursor-pointer truncate ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-semibold shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Playdate Goals (Multiple Choice) */}
          <div>
            <span className="text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wider text-[11px] block mb-2">
              Looking For
            </span>
            <div className="space-y-1.5">
              {purposeOptions.map((goal) => {
                const isChecked = localFilters.purpose.includes(goal);
                return (
                  <button
                    key={goal}
                    onClick={() => togglePurpose(goal)}
                    className={`w-full py-2 px-3 rounded-xl flex items-center justify-between border transition-colors cursor-pointer ${
                      isChecked
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{goal}</span>
                    {isChecked && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Health & Safety Toggles */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-700 dark:text-slate-200">Only Show Vaccinated Dogs</span>
              <input
                type="checkbox"
                checked={localFilters.mustBeVaccinated}
                onChange={(e) => setLocalFilters({ ...localFilters, mustBeVaccinated: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-700 dark:text-slate-200">Only Show Neutered / Spayed</span>
              <input
                type="checkbox"
                checked={localFilters.mustBeNeutered}
                onChange={(e) => setLocalFilters({ ...localFilters, mustBeNeutered: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={() => {
              onApplyFilters(localFilters);
              onClose();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};
