import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Volume2, VolumeX, Smartphone, Monitor, ChevronLeft, Circle, Square } from 'lucide-react';
import { soundManager, useSoundEnabled } from '../utils/audio';

interface AndroidFrameProps {
  children: React.ReactNode;
  onHomeClick?: () => void;
  onBackClick?: () => void;
  onOpenInstallModal?: () => void;
  notificationMessage?: string | null;
  onDismissNotification?: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  onHomeClick,
  onBackClick,
  onOpenInstallModal,
  notificationMessage,
  onDismissNotification
}) => {
  const [currentTime, setCurrentTime] = useState<string>('09:41');
  const soundEnabled = useSoundEnabled();
  const [isFrameMode, setIsFrameMode] = useState<boolean>(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const nextState = !soundEnabled;
    soundManager.setEnabled(nextState);
    if (nextState) {
      soundManager.playPop();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-0 sm:p-4 md:p-6 text-slate-900 dark:text-slate-100 antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Utility Controls (for testing on desktop/laptop) */}
      <header className="hidden sm:flex items-center justify-between w-full max-w-4xl px-4 py-2 mb-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white text-sm tracking-tight flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            TailWag Android Studio
          </span>
          <span className="text-slate-500">·</span>
          <span>Google Pixel 9 Pro Emulator</span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenInstallModal && (
            <button
              onClick={onOpenInstallModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors cursor-pointer shadow-xs"
              title="Convert / Download Android APK"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Get Android APK</span>
            </button>
          )}

          <button
            onClick={() => setIsFrameMode(!isFrameMode)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            title="Toggle Device Frame"
          >
            {isFrameMode ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
            <span>{isFrameMode ? 'Full Viewport' : 'Android Frame'}</span>
          </button>

          <button
            onClick={toggleSound}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              soundEnabled ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60' : 'bg-slate-800 text-slate-400'
            }`}
            title="Toggle Canine Bark & Chime Sounds"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>Audio {soundEnabled ? 'On' : 'Muted'}</span>
          </button>
        </div>
      </header>

      {/* Main Container / Device Frame */}
      <div
        className={`w-full transition-all duration-300 ${
          isFrameMode
            ? 'max-w-[420px] h-[92vh] max-h-[890px] rounded-[44px] shadow-2xl shadow-black/80 border-[8px] border-slate-800 ring-1 ring-slate-700/60 overflow-hidden flex flex-col relative bg-slate-50 dark:bg-slate-900'
            : 'max-w-4xl min-h-[90vh] rounded-3xl shadow-xl border border-slate-800 overflow-hidden flex flex-col relative bg-slate-50 dark:bg-slate-900'
        }`}
      >
        {/* Android Punch Hole Camera (only in frame mode) */}
        {isFrameMode && (
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-black ring-2 ring-slate-800 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-900"></div>
            </div>
          </div>
        )}

        {/* Android Native Status Bar */}
        <div className="h-9 shrink-0 px-6 pt-1 flex items-center justify-between text-xs font-semibold z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-100 dark:border-slate-800/40 select-none">
          <div className="flex items-center gap-2">
            <span className="tracking-tight text-slate-800 dark:text-slate-100 font-mono text-[13px]">{currentTime}</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium tracking-wide">TailWag</span>
          </div>

          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Wifi className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold tracking-tighter">5G</span>
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-mono tabular-nums">98%</span>
              <Battery className="w-4 h-4 fill-slate-700 dark:fill-slate-300" />
            </div>
          </div>
        </div>

        {/* In-App Interactive Dropdown Notification Banner */}
        {notificationMessage && (
          <aside
            aria-label="New Alert"
            onClick={onDismissNotification}
            className="absolute top-10 left-3 right-3 z-50 p-3 rounded-2xl bg-emerald-600 text-white shadow-xl flex items-center justify-between gap-3 cursor-pointer animate-in fade-in slide-in-from-top-4 duration-200"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-lg">🐾</span>
              <p className="text-xs font-medium truncate">{notificationMessage}</p>
            </div>
            <button className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 whitespace-nowrap shrink-0">
              View
            </button>
          </aside>
        )}

        {/* Viewport Content */}
        <main className="flex-1 flex flex-col min-h-0 relative overflow-hidden bg-slate-50 dark:bg-slate-950">
          {children}
        </main>

        {/* Android Bottom Navigation System Bar (Material 3 Back / Home / Recents) */}
        <footer 
          aria-label="Android System Navigation"
          className="h-8 shrink-0 bg-white dark:bg-slate-900 flex items-center justify-around px-8 z-40 border-t border-slate-100 dark:border-slate-800 select-none"
        >
          <button
            onClick={onBackClick}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Android Back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onHomeClick}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Android Home"
          >
            <Circle className="w-3.5 h-3.5 fill-current" />
          </button>
          <button
            onClick={() => soundManager.playPop()}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Android App Overview"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
        </footer>
      </div>
    </div>
  );
};
