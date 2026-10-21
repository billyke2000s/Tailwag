import { usePersistentState, isObject } from '../utils/storage';
import { isMessages } from '../utils/validation';
import { useDialog } from '../utils/navigation';
import { PetImage } from './PetImage';
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Send, 
  Sparkles, 
  Calendar, 
  MapPin, 
  Check, 
  CheckCheck, 
  Smile,
  Clock,
  Dog as DogIcon
} from 'lucide-react';
import { Dog, DogMatch, ChatMessage, DogPark } from '../types/dog';
import { soundManager } from '../utils/audio';
import { generateIcebreakerSuggestions } from '../utils/gemini';

interface ChatViewProps {
  userDog: Dog;
  matches: DogMatch[];
  parks: DogPark[];
  activeMatchDog: Dog | null;
  onSelectMatch: (dog: Dog | null) => void;
  onOpenParks: () => void;
  isVisible: boolean;
  scheduleRequest: {id:number;petId:string;park?:string} | null;
  onScheduleConsumed: () => void;
  onMessage: (petId:string, text:string, incoming:boolean) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  userDog,
  matches,
  parks,
  activeMatchDog,
  onSelectMatch, isVisible, scheduleRequest, onScheduleConsumed, onMessage
}) => {
  const [messagesByDog, setMessagesByDog] = usePersistentState<Record<string, ChatMessage[]>>('messages', {
    dog_max: [
      {
        id: 'msg_1',
        senderId: 'dog_max',
        text: `Woof! Elena here (Max's mom). Max saw Charlie's photo and started wagging his tail like crazy! Are you two frequent visitors to Sunny Meadows?`,
        timestamp: '10:14 AM'
      },
      {
        id: 'msg_2',
        senderId: 'user',
        text: `Hey Elena! Yes, Charlie lives for Sunny Meadows! Especially on Saturday mornings. How does Max do with high-speed fetch?`,
        timestamp: '10:16 AM'
      },
      {
        id: 'msg_3',
        senderId: 'dog_max',
        text: `Max is literally obsessed with tennis balls. If Charlie wants a fetch companion, they'll wear each other out in 30 minutes!`,
        timestamp: '10:18 AM'
      }
    ],
    dog_winston: [
      {
        id: 'msg_w1',
        senderId: 'dog_winston',
        text: `Bonjour! Winston's dad Marcus here. Winston is looking for a polite walking buddy who appreciates short walks and long patio hangs.`,
        timestamp: 'Yesterday'
      }
    ],
    dog_maya: [
      {
        id: 'msg_m1',
        senderId: 'dog_maya',
        text: `Awoooo! Maya is always looking for other dogs who can match her husky stamina at Pine Ridge!`,
        timestamp: '2d ago'
      }
    ],
    dog_biscuit: [
      {
        id: 'msg_b1',
        senderId: 'dog_biscuit',
        text: `Hi! Biscuit would love to do some agility obstacle runs together!`,
        timestamp: '3d ago'
      }
    ],
    cat_cleo: [
      {
        id: 'msg_c1',
        senderId: 'cat_cleo',
        text: "Meow! Julian here (Cleo's human). Cleo saw Mochi's biscuit-making skills and gave an appreciative purr. Would you two like to meet up at Velvet Paws Lounge?",
        timestamp: '9:40 AM'
      }
    ],
    cat_marmalade: [
      {
        id: 'msg_cm1',
        senderId: 'cat_marmalade',
        text: "Marmalade is doing mid-air somersaults with excitement! Ready for some feather wand and sunbeam action at Silver Moon!",
        timestamp: 'Yesterday'
      }
    ]
  }, isMessages);

  const [drafts, setDrafts] = usePersistentState<Record<string,string>>('chat-drafts', {}, (v): v is Record<string,string> => isObject(v) && Object.values(v).every(x => typeof x === 'string'));
  const inputMessage = activeMatchDog ? drafts[activeMatchDog.id] || '' : '';
  const setInputMessage = (text:string) => { if (activeMatchDog) setDrafts(previous => ({...previous,[activeMatchDog.id]:text})); };
  const [typingByPet, setTypingByPet] = useState<Record<string,number>>({});
  const isTyping = !!(activeMatchDog && typingByPet[activeMatchDog.id]);
  const pending = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onMessageRef = useRef(onMessage); onMessageRef.current = onMessage;
  const activeIdRef = useRef(activeMatchDog?.id); activeIdRef.current = activeMatchDog?.id;
  useEffect(() => () => pending.current.forEach(clearTimeout), []);
  const scheduleReply = (petId:string, run:() => void, delay:number) => {
    setTypingByPet(previous => ({...previous,[petId]:(previous[petId] || 0)+1}));
    const timer = setTimeout(() => {
      pending.current = pending.current.filter(t => t !== timer);
      setTypingByPet(previous => ({...previous,[petId]:Math.max(0,(previous[petId] || 0)-1)}));
      run();
    },delay);
    pending.current.push(timer);
  };
  const [showPlaydateModal, setShowPlaydateModal] = useState<boolean>(false);
  const [icebreakers, setIcebreakers] = useState<string[]>([]);
  const [isLoadingIcebreakers, setIsLoadingIcebreakers] = useState<boolean>(false);

  // Playdate proposal form state
  const [selectedPark, setSelectedPark] = useState<string>(parks[0]?.name || 'Sunny Meadows Dog Run');
  const [selectedDate, setSelectedDate] = useState<string>('This Saturday');
  const [selectedTime, setSelectedTime] = useState<string>('10:00 AM');
  const [selectedActivity, setSelectedActivity] = useState<string>('Off-Leash Fetch & Zoomies');
  const schedulerRef = useDialog(showPlaydateModal && isVisible, () => setShowPlaydateModal(false));
  useEffect(() => {
    setIcebreakers([]);
    setShowPlaydateModal(false);
    if (!parks.some(p => p.name === selectedPark)) setSelectedPark(parks[0]?.name || '');
  }, [activeMatchDog?.id, userDog.id]);
  useEffect(() => {
    if (!scheduleRequest || activeMatchDog?.id !== scheduleRequest.petId) return;
    setSelectedPark(scheduleRequest.park || parks[0]?.name || '');
    setShowPlaydateModal(true); onScheduleConsumed();
  }, [scheduleRequest, activeMatchDog?.id]);

  const activeDogMessages = activeMatchDog ? messagesByDog[activeMatchDog.id] || [] : [];

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || !activeMatchDog) return;

    soundManager.playPop();

    const newMsg: ChatMessage = {
      id: crypto.randomUUID(),
      senderId: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessagesByDog((prev) => ({
      ...prev,
      [activeMatchDog.id]: [...(prev[activeMatchDog.id] || []), newMsg]
    }));

    onMessageRef.current(activeMatchDog.id, newMsg.text, false);
    setInputMessage('');

    // Simulate smart auto-reply from pet parent
    scheduleReply(activeMatchDog.id, () => {
      const isCat = activeMatchDog.petType === 'cat';
      if (isCat) {
        soundManager.playMeow();
      } else {
        soundManager.playBark();
      }

      const dogResponses = [
        `Sounds paw-some! ${activeMatchDog.name} will be thrilled. I'll make sure to bring their favorite squeaky ball!`,
        `That works wonderfully for us! Looking forward to seeing both of them run laps around the park!`,
        `${activeMatchDog.owner.name} here: Perfect! We usually park near the east double-gate. See you then! 🐾`,
        `Count us in! Let's get these happy pups some exercise!`
      ];

      const catResponses = [
        `Purr-fect! ${activeMatchDog.name} gave an approving chirp. I'll make sure to bring their favorite feather wand!`,
        `That sounds delightful! Looking forward to watching them loaf together in the sunbeam!`,
        `${activeMatchDog.owner.name} here: Splendid! We usually hang out by the skywalk bridge. See you both then! 🐾`,
        `Count us in! Let's get these refined felines some quality socialization & catnip treats!`
      ];

      const responses = isCat ? catResponses : dogResponses;
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      const replyMsg: ChatMessage = {
        id: crypto.randomUUID(),
        senderId: activeMatchDog.id,
        text: randomResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessagesByDog((prev) => ({
        ...prev,
        [activeMatchDog.id]: [...(prev[activeMatchDog.id] || []), replyMsg]
      }));
      onMessageRef.current(activeMatchDog.id, replyMsg.text, true);
    }, 1400);
  };

  const handleProposePlaydate = () => {
    if (!activeMatchDog) return;

    const playdateMsg: ChatMessage = {
      id: crypto.randomUUID(),
      senderId: 'user',
      text: `Let's schedule a playdate!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isPlaydateProposal: true,
      playdateDetails: {
        park: selectedPark,
        date: selectedDate,
        time: selectedTime,
        activity: selectedActivity,
        status: 'confirmed'
      }
    };

    setMessagesByDog((prev) => ({
      ...prev,
      [activeMatchDog.id]: [...(prev[activeMatchDog.id] || []), playdateMsg]
    }));

    onMessageRef.current(activeMatchDog.id, playdateMsg.text, false);
    setShowPlaydateModal(false);
    soundManager.playMatchCelebration();

    // Matched owner response
    scheduleReply(activeMatchDog.id, () => {
      const confirmReply: ChatMessage = {
        id: crypto.randomUUID(),
        senderId: activeMatchDog.id,
        text: `Playdate confirmed! 🎉 We'll see you and ${userDog.name} at ${selectedPark} on ${selectedDate} at ${selectedTime}!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessagesByDog((prev) => ({
        ...prev,
        [activeMatchDog.id]: [...(prev[activeMatchDog.id] || []), confirmReply]
      }));
      onMessageRef.current(activeMatchDog.id, confirmReply.text, true);
    }, 1200);
  };

  const loadIcebreakers = async () => {
    if (!activeMatchDog) return;
    setIsLoadingIcebreakers(true);
    const petId = activeMatchDog.id;
    const suggestions = await generateIcebreakerSuggestions(userDog, activeMatchDog);
    if (activeIdRef.current === petId) setIcebreakers(suggestions);
    setIsLoadingIcebreakers(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-900">
      {/* If No Dog Selected: Matches & Chats List */}
      {!activeMatchDog ? (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Top Bar Header */}
          <div className="px-5 py-3 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">Playmate Matches</h2>
              <p className="text-[11px] text-slate-500">Connect and organize park playdates</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200/60 dark:border-emerald-800/60">
              {matches.length} Matches
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Horizontal Stories / New Matches Row */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/60">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2.5">
                New Playmates
              </span>
              <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-none">
                {matches.map((match) => (
                  <button
                    key={match.dog.id}
                    aria-label={match.dog.name}
                    onClick={() => {
                      onSelectMatch(match.dog);
                      soundManager.playPop();
                    }}
                    className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
                  >
                    <div className="relative">
                      <PetImage
                        src={match.dog.photos[0]}
                        alt={match.dog.name}
                        className="w-14 h-14 rounded-full object-cover ring-2 ring-emerald-500 p-0.5 group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[64px]">
                      {match.dog.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation List */}
            <div className="p-3">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2 block mb-1">
                Recent Conversations
              </span>
              <div className="space-y-1">
                {matches.map((match) => {
                  const dogMsgs = messagesByDog[match.dog.id] || [];
                  const lastMsg = dogMsgs[dogMsgs.length - 1];

                  return (
                    <button
                      key={match.dog.id}
                      onClick={() => {
                        onSelectMatch(match.dog);
                        soundManager.playPop();
                      }}
                      className="w-full p-3 rounded-2xl flex items-center gap-3 hover:bg-white dark:hover:bg-slate-800/80 transition-colors cursor-pointer text-left border border-transparent hover:border-slate-200/80 dark:hover:border-slate-700"
                    >
                      <div className="relative shrink-0">
                        <PetImage
                          src={match.dog.photos[0]}
                          alt={match.dog.name}
                          className="w-12 h-12 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute -bottom-1 -right-1 text-xs">🐾</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {match.dog.name} & {match.dog.owner.name.split(' ')[0]}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {lastMsg ? lastMsg.timestamp : match.matchedAt}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {lastMsg ? lastMsg.text : `${match.dog.breed} · Match at ${match.dog.favoritePark}`}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Active Chat View */
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Active Chat Header */}
          <div className="px-4 py-2.5 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0 flex items-center justify-between z-10">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={() => onSelectMatch(null)}
                className="p-1 -ml-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="relative shrink-0">
                <PetImage
                  src={activeMatchDog.photos[0]}
                  alt={activeMatchDog.name}
                  className="w-9 h-9 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-1 ring-white" />
              </div>

              <div className="min-w-0">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {activeMatchDog.name}
                </h3>
                <span className="text-[10px] text-slate-400 block truncate">
                  Owner: {activeMatchDog.owner.name} · {activeMatchDog.owner.responseTime}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowPlaydateModal(true);
                soundManager.playPop();
              }}
              className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Plan Playdate</span>
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {/* Match Notice Info Box */}
            <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-center text-xs text-emerald-900 dark:text-emerald-200">
              <p className="font-semibold">🐕 You both matched for canine playdates!</p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                Shared favorite park: {activeMatchDog.favoritePark}
              </p>
            </div>

            {/* Message Bubbles */}
            {activeDogMessages.map((msg) => {
              const isMe = msg.senderId === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  {msg.isPlaydateProposal && msg.playdateDetails ? (
                    /* Playdate Proposal Card */
                    <div className="w-full max-w-[270px] rounded-2xl bg-white dark:bg-slate-800 border-2 border-emerald-500 shadow-md p-3.5 space-y-2.5">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                        <Calendar className="w-4 h-4" />
                        <span>Playdate Confirmed!</span>
                      </div>

                      <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold truncate">{msg.playdateDetails.park}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{msg.playdateDetails.date} at {msg.playdateDetails.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DogIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-[11px] text-slate-500">{msg.playdateDetails.activity}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-emerald-600 font-bold">
                        <span className="flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Saved Playdate
                        </span>
                        <span className="font-mono text-slate-400">{msg.timestamp}</span>
                      </div>
                    </div>
                  ) : (
                    /* Standard Chat Bubble */
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs ${
                        isMe
                          ? 'bg-emerald-600 text-white rounded-br-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700/70 rounded-bl-xs'
                      }`}
                    >
                      <p>{msg.text}</p>
                      <span
                        className={`text-[9px] block text-right mt-1 font-mono ${
                          isMe ? 'text-emerald-100' : 'text-slate-400'
                        }`}
                      >
                        {msg.timestamp}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 p-2">
                <span className="font-medium text-[11px]">{activeMatchDog.name}'s human is typing</span>
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                </span>
              </div>
            )}
          </div>

          {/* AI Wingman Quick Suggestions Bar */}
          {icebreakers.length > 0 && (
            <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 border-t border-emerald-100 dark:border-emerald-900/40 shrink-0">
              <div className="flex items-center justify-between mb-1.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  AI Wingman Icebreakers
                </span>
                <button
                  onClick={() => setIcebreakers([])}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {icebreakers.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInputMessage(suggestion);
                      soundManager.playPop();
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 whitespace-nowrap hover:border-emerald-500 transition-colors cursor-pointer shrink-0"
                  >
                    "{suggestion.slice(0, 32)}..."
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Chat Input Bar */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={loadIcebreakers}
                disabled={isLoadingIcebreakers}
                className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors cursor-pointer"
                title="AI Wingman suggestions"
              >
                <Sparkles className="w-5 h-5" />
              </button>

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={`Message ${activeMatchDog.name} & owner...`}
                className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim()}
                className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Playdate Modal */}
      {showPlaydateModal && activeMatchDog && (
        <div ref={schedulerRef} role="dialog" aria-modal="true" aria-label="Plan a playdate" tabIndex={-1} className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="flex-1" onClick={() => setShowPlaydateModal(false)} />

          <div className="bg-white dark:bg-slate-900 rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl border-t border-slate-200 dark:border-slate-800 p-5 space-y-4 animate-in slide-in-from-bottom duration-300 text-xs">
            <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto -mt-2 mb-1" />

            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Plan a Playdate with {activeMatchDog.name}
              </h3>
              <button
                onClick={() => setShowPlaydateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Cancel
              </button>
            </div>

            {/* Select Park */}
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[11px] block mb-1.5">
                Choose Dog Park
              </span>
              <select
                value={selectedPark}
                onChange={(e) => setSelectedPark(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-hidden"
              >
                {parks.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} ({p.distanceMiles} mi)
                  </option>
                ))}
              </select>
            </div>

            {/* Select Day */}
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[11px] block mb-1.5">
                Day
              </span>
              <div className="grid grid-cols-3 gap-2">
                {['This Saturday', 'This Sunday', 'Tomorrow Afternoon'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    className={`p-2 rounded-xl text-center border transition-colors cursor-pointer text-xs ${
                      selectedDate === d
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Select Time */}
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[11px] block mb-1.5">
                Time
              </span>
              <div className="grid grid-cols-3 gap-2">
                {['9:30 AM', '10:30 AM', '4:30 PM'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTime(t)}
                    className={`p-2 rounded-xl text-center border transition-colors cursor-pointer text-xs ${
                      selectedTime === t
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Select Activity */}
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[11px] block mb-1.5">
                Play Activity
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Off-Leash Fetch & Zoomies',
                  'Gentle Pack Walking',
                  'Agility Course Practice',
                  'Water Splash Pad Play'
                ].map((act) => (
                  <button
                    key={act}
                    type="button"
                    onClick={() => setSelectedActivity(act)}
                    className={`p-2 rounded-xl text-left border transition-colors cursor-pointer text-xs ${
                      selectedActivity === act
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {act}
                  </button>
                ))}
              </div>
            </div>

            {/* Action CTA */}
            <button
              onClick={handleProposePlaydate}
              className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Send Playdate Invitation</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
