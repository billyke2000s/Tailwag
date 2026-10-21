import type { Dog } from '../types/dog';
import type { FilterSettings } from '../components/FilterModal';
export const DEFAULT_FILTERS: FilterSettings = {maxDistance:20,energyLevel:'All',size:'All',purpose:['Dog Park Playdates'],mustBeVaccinated:true,mustBeNeutered:false};
export function matchesFilters(pet: Dog, filters: FilterSettings) {
  return pet.distanceMiles <= filters.maxDistance &&
    (filters.energyLevel === 'All' || pet.energyLevel === filters.energyLevel) &&
    (filters.size === 'All' || pet.size === filters.size) &&
    (!filters.mustBeVaccinated || pet.vaccinated === true) &&
    (!filters.mustBeNeutered || pet.neutered === true) &&
    (!filters.purpose.length || filters.purpose.some(p => pet.purposes?.includes(p)));
}
export function rewindHistory(history: string[], visibleIds: string[]) {
  const lastVisible = history.findLastIndex(id => visibleIds.includes(id));
  return lastVisible < 0 ? history : history.filter((_, i) => i !== lastVisible);
}
