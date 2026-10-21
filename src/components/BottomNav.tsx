import React from 'react';
import { Flame, MessageCircle, MapPin, Sparkles, User } from 'lucide-react';

export type TabType = 'discover' | 'chats' | 'parks' | 'wingman' | 'profile';

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  unreadCount?: number;
  petMode?: 'dogs' | 'cats';
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  unreadCount = 0,
  petMode = 'dogs'
}) => {
  const tabs = [
    {
      id: 'discover' as TabType,
      label: 'Discover',
      icon: Flame,
    },
    {
      id: 'chats' as TabType,
      label: 'Matches',
      icon: MessageCircle,
      badge: unreadCount > 0 ? unreadCount : undefined
    },
    {
      id: 'parks' as TabType,
      label: petMode === 'cats' ? 'Catios' : 'Dog Parks',
      icon: MapPin,
    },
    {
      id: 'wingman' as TabType,
      label: petMode === 'cats' ? 'Cat Studio' : 'Wingman',
      icon: Sparkles,
    },
    {
      id: 'profile' as TabType,
      label: petMode === 'cats' ? 'My Cat' : 'My Pup',
      icon: User,
    }
  ];

  return (
    <nav 
      aria-label="Android Bottom Navigation" 
      className="shrink-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-2 py-1"
    >
      <div className="grid grid-cols-5 items-center h-14 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 transition-all rounded-xl ${
                isActive 
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold' 
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <div className={`p-1 rounded-full transition-transform ${isActive ? 'scale-110 bg-emerald-50 dark:bg-emerald-950/60' : ''}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                </div>
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] tracking-tight mt-0.5 truncate whitespace-nowrap shrink-0 ${isActive ? 'font-semibold' : 'font-normal'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
