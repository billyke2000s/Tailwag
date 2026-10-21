import { usePersistentState, isBoolean, isStringList } from './utils/storage';
import { isPet, isMatches, isFilters } from './utils/validation';
import { DEFAULT_FILTERS, matchesFilters } from './utils/discovery';
import { useBackHandler, handleBack, useDialog } from './utils/navigation';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AndroidFrame } from './components/AndroidFrame';
import { BottomNav, TabType } from './components/BottomNav';
import { SwipeCards } from './components/SwipeCards';
import { DogDetailModal } from './components/DogDetailModal';
import { MatchCelebrationModal } from './components/MatchCelebrationModal';
import { FilterModal, FilterSettings } from './components/FilterModal';
import { ChatView } from './components/ChatView';
import { DogParksView } from './components/DogParksView';
import { DogBioStudio } from './components/DogBioStudio';
import { ProfileView } from './components/ProfileView';
import { AndroidInstallModal } from './components/AndroidInstallModal';

import { USER_DOG, INITIAL_DOGS } from './data/mockDogs';
import { USER_CAT, INITIAL_CATS, CAT_PARKS } from './data/mockCats';
import { INITIAL_DOG_PARKS } from './data/dogParks';
import { Dog, DogMatch, DogPark } from './types/dog';

export default function App() {
  const [petMode, setPetMode] = usePersistentState<'dogs' | 'cats'>('species', 'dogs', (v): v is 'dogs' | 'cats' => v === 'dogs' || v === 'cats');
  const [currentTab, setCurrentTab] = useState<TabType>('discover');
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [userDog, setUserDog] = usePersistentState('dog-profile', USER_DOG, isPet);
  const [userCat, setUserCat] = usePersistentState('cat-profile', USER_CAT, isPet);
  const [availableDogs] = useState<Dog[]>(INITIAL_DOGS);
  const [availableCats] = useState<Dog[]>(INITIAL_CATS);

  const [matches, setMatches] = usePersistentState<DogMatch[]>('dog-matches', [
    {
      dog: INITIAL_DOGS[0], // Max
      matchedAt: '10:14 AM',
      unreadCount: 1,
      lastMessage: "Woof! Elena here (Max's mom)..."
    },
    {
      dog: INITIAL_DOGS[1], // Winston
      matchedAt: 'Yesterday',
      unreadCount: 0,
      lastMessage: "Bonjour! Winston's dad Marcus here..."
    }
  ], isMatches);

  const [catMatches, setCatMatches] = usePersistentState<DogMatch[]>('cat-matches', [
    {
      dog: INITIAL_CATS[0], // Cleo
      matchedAt: '9:40 AM',
      unreadCount: 1,
      lastMessage: "Meow! Julian here (Cleo's human)..."
    },
    {
      dog: INITIAL_CATS[1], // Marmalade
      matchedAt: 'Yesterday',
      unreadCount: 0,
      lastMessage: "Marmalade is doing mid-air somersaults with excitement!"
    }
  ], isMatches);

  const [dogParks] = useState<DogPark[]>(INITIAL_DOG_PARKS);
  const [catParks] = useState<DogPark[]>(CAT_PARKS);

  const [selectedDetailDog, setSelectedDetailDog] = useState<Dog | null>(null);
  const [justMatchedDog, setJustMatchedDog] = useState<Dog | null>(null);
  const [activeChatDog, setActiveChatDog] = useState<Dog | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [inAppNotification, setInAppNotification] = useState<string | null>(null);

  const [filters, setFilters] = usePersistentState('filters', DEFAULT_FILTERS, isFilters);
  const [, setDiscoveryHistory] = usePersistentState<string[]>('discovery-' + petMode, [], isStringList);
  const [alertsEnabled, setAlertsEnabled] = usePersistentState('alerts', true, isBoolean);
  const [scheduleRequest, setScheduleRequest] = useState<{ id: number; petId: string; park?: string } | null>(null);
  const [meetupPark, setMeetupPark] = useState<DogPark | null>(null);
  const notificationTarget = useRef<TabType | null>(null);
  const notify = (message: string, target: TabType | null = null, matchAlert = false) => {
    if (matchAlert && !alertsEnabled) return;
    notificationTarget.current = target;
    setInAppNotification(message);
  };
  useEffect(() => {
    if (!inAppNotification) return;
    const timeout = setTimeout(() => setInAppNotification(null), 3500);
    return () => clearTimeout(timeout);
  }, [inAppNotification]);
  const meetupRef = useDialog(!!meetupPark, () => setMeetupPark(null));

  // Active species derived states
  const activeUserPet = petMode === 'cats' ? userCat : userDog;
  const activeAvailablePets = petMode === 'cats' ? availableCats : availableDogs;
  const activeMatches = petMode === 'cats' ? catMatches : matches;
  const activeParks = petMode === 'cats' ? catParks : dogParks;

  // Filter available pets based on settings
  const filteredPets = activeAvailablePets.filter(pet => matchesFilters(pet, filters));

  // Handle Right Swipe / Like
  const handleLikePet = (pet: Dog) => {
    if (petMode === 'cats') {
      if (!catMatches.some((m) => m.dog.id === pet.id)) {
        const newMatch: DogMatch = {
          dog: pet,
          matchedAt: 'Just now',
          unreadCount: 1,
          lastMessage: `You both matched for catio & lounge hangouts!`
        };
        setCatMatches((prev) => [newMatch, ...prev]);
      }
      setJustMatchedDog(pet);
      notify(`${pet.name} purred back! You have a new feline playmate!`, 'chats', true);
    } else {
      if (!matches.some((m) => m.dog.id === pet.id)) {
        const newMatch: DogMatch = {
          dog: pet,
          matchedAt: 'Just now',
          unreadCount: 1,
          lastMessage: `You both matched for park playdates!`
        };
        setMatches((prev) => [newMatch, ...prev]);
      }
      setJustMatchedDog(pet);
      notify(`${pet.name} wagged back! You have a new playmate match!`, 'chats', true);
    }
  };

  const handleSuperLikePet = (pet: Dog) => {
    handleLikePet(pet);
    if (petMode === 'cats') {
      notify(`Super Purr sent to ${pet.name} & ${pet.owner.name}!`, 'chats', true);
    } else {
      notify(`Super Bark sent to ${pet.name} & ${pet.owner.name}!`, 'chats', true);
    }
  };

  const handlePassPet = (_pet: Dog) => {
    // clean pass
  };

  // Navigate to Chat with pet
  const handleStartChatWithPet = (pet: Dog) => {
    if (petMode === 'cats') {
      if (!catMatches.some((m) => m.dog.id === pet.id)) {
        setCatMatches((prev) => [
          {
            dog: pet,
            matchedAt: 'Just now',
            unreadCount: 0
          },
          ...prev
        ]);
      }
    } else {
      if (!matches.some((m) => m.dog.id === pet.id)) {
        setMatches((prev) => [
          {
            dog: pet,
            matchedAt: 'Just now',
            unreadCount: 0
          },
          ...prev
        ]);
      }
    }
    setActiveChatDog(pet);
    setCurrentTab('chats');
  };

  // Plan playdate shortcut
  const handlePlanPlaydateWithPet = (pet: Dog) => {
    handleStartChatWithPet(pet);
    setScheduleRequest({id: Date.now(), petId: pet.id});
  };

  // Plan meetup from Dog Parks view
  const handlePlanMeetupAtPark = (park: DogPark) => setMeetupPark(park);

  // Android Navigation bar handlers
  const handleAndroidHome = () => {
    setIsFilterOpen(false);
    setIsInstallModalOpen(false);
    setMeetupPark(null);
    setScheduleRequest(null);
    setCurrentTab('discover');
    setActiveChatDog(null);
    setSelectedDetailDog(null);
    setJustMatchedDog(null);
  };

  useBackHandler(() => {
    if (selectedDetailDog) setSelectedDetailDog(null);
    else if (justMatchedDog) setJustMatchedDog(null);
    else if (activeChatDog) setActiveChatDog(null);
    else if (currentTab !== 'discover') setCurrentTab('discover');
    else return false;
    return true;
  }, 10);
  useEffect(() => {
    if (currentTab !== 'chats' || !activeChatDog) return;
    const update = petMode === 'cats' ? setCatMatches : setMatches;
    update(previous => previous.map(m => m.dog.id === activeChatDog.id && m.unreadCount ? {...m, unreadCount:0} : m));
  }, [currentTab, activeChatDog?.id, petMode]);
  const visibleConversation = useRef<string | null>(null);
  visibleConversation.current = currentTab === 'chats' ? activeChatDog?.id || null : null;
  const messageArrived = (petId: string, text: string, incoming: boolean) => {
    const update = petId.startsWith('cat_') ? setCatMatches : setMatches;
    update(previous => previous.map(m => m.dog.id === petId ? {...m, lastMessage:text, unreadCount: incoming && visibleConversation.current !== petId ? m.unreadCount+1 : 0} : m));
  };
  const changeSpecies = (mode: 'dogs' | 'cats') => {
    setPetMode(mode); setActiveChatDog(null); setScheduleRequest(null); setMeetupPark(null);
  };

  return (
    <AndroidFrame
      onHomeClick={handleAndroidHome}
      onBackClick={handleBack}
      onOpenInstallModal={() => setIsInstallModalOpen(true)}
      notificationMessage={inAppNotification}
      onDismissNotification={() => {
        setInAppNotification(null);
        if (notificationTarget.current) setCurrentTab(notificationTarget.current);
      }}
    >
      {/* Active Tab Screen */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {currentTab === 'discover' && (
          <SwipeCards
            key={petMode}
            dogs={filteredPets}
            onLike={handleLikePet}
            onPass={handlePassPet}
            onSuperLike={handleSuperLikePet}
            onOpenFilter={() => setIsFilterOpen(true)}
            onOpenDetail={(pet) => setSelectedDetailDog(pet)}
            petMode={petMode}
            onChangePetMode={changeSpecies}
          />
        )}

        <div className={currentTab === 'chats' ? 'flex flex-1 min-h-0 flex-col' : 'hidden'}>
          <ChatView
            userDog={activeUserPet}
            matches={activeMatches}
            parks={activeParks}
            activeMatchDog={activeChatDog}
            isVisible={currentTab === 'chats'}
            scheduleRequest={scheduleRequest}
            onScheduleConsumed={() => setScheduleRequest(null)}
            onMessage={messageArrived}
            onSelectMatch={(pet) => setActiveChatDog(pet)}
            onOpenParks={() => setCurrentTab('parks')}
          />
        </div>

        {currentTab === 'parks' && (
          <DogParksView
            key={petMode}
            parks={activeParks}
            userDog={activeUserPet}
            onPlanMeetupAtPark={handlePlanMeetupAtPark}
            petMode={petMode}
          />
        )}

        {currentTab === 'wingman' && (
          <DogBioStudio
            key={activeUserPet.id}
            userDog={activeUserPet}
            matchedDogs={activeAvailablePets}
            petMode={petMode}
            onUpdateBio={(newBio) => {
              if (petMode === 'cats') {
                setUserCat((prev) => ({ ...prev, bio: newBio }));
                notify(`New bio applied to ${activeUserPet.name}'s profile!`, 'profile');
              } else {
                setUserDog((prev) => ({ ...prev, bio: newBio }));
                notify(`New bio applied to ${activeUserPet.name}'s profile!`, 'profile');
              }
            }}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileView
            key={activeUserPet.id}
            userDog={activeUserPet}
            petMode={petMode}
            onChangePetMode={changeSpecies}
            onUpdateDog={(updated) => {
              if (petMode === 'cats') {
                setUserCat(updated);
                notify(`${updated.name}'s profile saved successfully!`);
              } else {
                setUserDog(updated);
                notify(`${updated.name}'s profile saved successfully!`);
              }
            }}
            alertsEnabled={alertsEnabled}
            onAlertsChange={setAlertsEnabled}
            matchesCount={activeMatches.length}
            onOpenInstallModal={() => setIsInstallModalOpen(true)}
          />
        )}
      </div>

      {/* Android Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        petMode={petMode}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab !== 'chats') {
            setActiveChatDog(null);
          }
        }}
        unreadCount={activeMatches.reduce((acc, m) => acc + (m.unreadCount || 0), 0)}
      />

      {meetupPark && <div ref={meetupRef} role="dialog" aria-modal="true" aria-label="Choose a playmate" tabIndex={-1} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-3">
          <h2 className="font-bold">Meetup at {meetupPark.name}</h2>
          <p>Choose a playmate</p>
          {activeMatches.map(m => <button key={m.dog.id} className="block w-full p-3 text-left rounded-xl bg-emerald-50" onClick={() => {
            const park = meetupPark.name; setMeetupPark(null); handleStartChatWithPet(m.dog); setScheduleRequest({id:Date.now(),petId:m.dog.id,park});
          }}>{m.dog.name} & {m.dog.owner.name}</button>)}
          {!activeMatches.length && <p>Match with a pet first.</p>}
          <button onClick={() => setMeetupPark(null)} className="p-3">Cancel</button>
        </div>
      </div>}
      {/* Pet Detail Bottom Sheet */}
      <DogDetailModal
        dog={selectedDetailDog}
        onClose={() => setSelectedDetailDog(null)}
        onLike={(pet) => {
          handleLikePet(pet);
          setDiscoveryHistory(previous => previous.includes(pet.id) ? previous : [...previous,pet.id]);
          setSelectedDetailDog(null);
        }}
        onPlanPlaydate={handlePlanPlaydateWithPet}
        onStartChat={handleStartChatWithPet}
      />

      {/* Match Celebration Modal */}
      <MatchCelebrationModal
        userDog={activeUserPet}
        matchedDog={justMatchedDog}
        onClose={() => setJustMatchedDog(null)}
        onOpenChat={(pet) => {
          setJustMatchedDog(null);
          handleStartChatWithPet(pet);
        }}
      />

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters);
          notify('Match preferences updated!');
        }}
      />

      {/* Android APK & Installation Hub */}
      <AndroidInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </AndroidFrame>
  );
}
