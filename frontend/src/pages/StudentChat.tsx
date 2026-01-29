import { useState, useEffect, useRef } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { API_BASE_URL } from '../utils/config';
import {
  Send,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Sparkles
} from 'lucide-react';

// Add loading type
type MessageType = 'user' | 'bot' | 'loading';

interface Source {
  chunk_id: string;
  text: string;
  source: string;
  page?: string;
}

interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  time_stamp: string;
  content: string;
  sources?: string[] | null;
}

interface Message {
  id: number;
  type: MessageType;
  content: string;
  sources?: Source[];
  timestamp: string;
}

const formatTime = (dateInput?: string | Date) => {
  try {
    const date = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(date.getTime())) return String(dateInput);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch (error) {
    return String(dateInput || "");
  }
};

export function StudentChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'bot',
      content: "Hello! I'm your Graduate Programme Knowledge Assistant. How can I help you today?",
      timestamp: formatTime()
    }
  ]);

  const [firstName, setFirstName] = useState<string | null>(null);

  const [inputValue, setInputValue] = useState('');

  const chatRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Sources panel state
  const [isSourcesPanelOpen, setIsSourcesPanelOpen] = useState(false);
  const [activeSourcesMessageId, setActiveSourcesMessageId] = useState<number | null>(null);
  const [activeSources, setActiveSources] = useState<Source[] | null>(null);

  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  // AUTO-SCROLL WHEN MESSAGES CHANGE (but don't break manual scrolling)
  useEffect(() => {
    if (!isAtBottom) return;
    const el = chatRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isAtBottom]);

  const truncateText = (text: string, limit = 50) => {
    if (text.length <= limit) return text;
    return text.slice(0, limit).trim() + '…';
  };

  const scrollToBottom = () => {
    const el = chatRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: 'smooth',
    });
    setIsAtBottom(true);
  };
  const handleChatScroll = () => {
    const el = chatRef.current;
    if (!el) return;

    const threshold = 40; // px from bottom to still count as "at bottom"
    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;

    setIsAtBottom(atBottom);
  };

  // Fetch current user and personalize greeting
  useEffect(() => {
    let mounted = true;


    const token = localStorage.getItem('token');
    if (!token) return;

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) return;
        const data = await res.json();
        const name = data.first_name || data.firstName || data.name || data.full_name || data.fullName || '';
        const first = name ? String(name).split(' ')[0] : null;
        if (mounted && first) {
          setFirstName(first);
          setMessages(prev => prev.map(m => m.id === 1 ? {
            ...m,
            content: `Hello ${first}! I'm your Graduate Programme Knowledge Assistant. How can I help you today?`
          } : m));
        }
      } catch (err) {
        // ignore errors, keep default greeting
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Fetch chat history (old structure) and append after initial greeting
  useEffect(() => {
    let mounted = true;
   const token = localStorage.getItem('token');
   if (!token) {
    setIsHistoryLoading(false);
    return;
   }
  const id=JSON.parse(atob(token.split('.')[1])).user_id;
 
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/chat/get-history/${id}`);
        if (!res.ok) throw new Error("Failed to fetch history");

        const data: ChatHistoryMessage[] = await res.json();
        if (!mounted || !Array.isArray(data)) return;

        const enriched = await Promise.all(
          data.map(async (msg, index) => {
            const baseMsg: Message = {
              id: Date.now() + index,
              type: msg.role === 'user' ? 'user' : 'bot',
              content: msg.content,
              timestamp: formatTime(msg.time_stamp)
            };
            if (msg.role === 'assistant' && Array.isArray(msg.sources) && msg.sources.length > 0) {
              try {
                const srcRes = await fetch(`${API_BASE_URL}/chat/get-chat-sources`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ chunks: msg.sources })
                });
                if (srcRes.ok) {
                  const srcData: Source[] = await srcRes.json();
                  baseMsg.sources = srcData;
                }
              } catch {}
            }
            return baseMsg;
          })
        );

        setMessages(prev => {
          if (prev.length > 1) return prev;
          return [...prev, ...enriched];
        });
      } catch (error) {
        // Fail silently; history is optional
      } finally {
        if (mounted) setIsHistoryLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const suggestedQuestions = [
    "What are my first 90 days milestones?",
    "How do I request time off?",
    "What training is available?",
    "Who is my HR contact?"
  ];

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: formatTime()
    };

    setMessages(prev => [...prev, userMessage]);

    const questionToSend = inputValue;
    setInputValue('');

    // Add loading indicator
    const loadingMessage: Message = {
      id: Date.now() + 1,
      type: 'loading',
      content: "",
      timestamp: formatTime()
    };

    setMessages(prev => [...prev, loadingMessage]);
    const token = localStorage.getItem('token');
    if (!token) return;
    const id = JSON.parse(atob(token.split('.')[1])).user_id; 

    try {
      const response = await fetch(`${API_BASE_URL}/chat/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id:id,
          question: questionToSend
        })
      });

      const data = await response.json();
      console.log("RAG response:", data);



      const botMessage: Message = {
        id: Date.now() + 2,
        type: 'bot',
        content: data.answer,
        sources: data.sources, // ✅ CORRECT
        timestamp: formatTime()
      };


      // Replace the loading bubble
      setMessages(prev => [
        ...prev.filter(m => m.type !== 'loading'),
        botMessage
      ]);

    } catch (error) {
      const errorMessage: Message = {
        id: Date.now() + 2,
        type: 'bot',
        content: "Sorry, I couldn't reach the server.",
        timestamp: formatTime()
      };

      setMessages(prev => [
        ...prev.filter(m => m.type !== 'loading'),
        errorMessage
      ]);
    }
  };

  const handleSourcesClick = (message: Message) => {
    if (!message.sources || message.sources.length === 0) return;
    setActiveSources(message.sources);
    setActiveSourcesMessageId(message.id);
    setIsSourcesPanelOpen(true);
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
  };

  return (
    <div className="pt-8 h-[calc(100vh-8rem)]">
      <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="flex flex-1 gap-4 overflow-hidden">         
         
         
          {/* Chat container */}
          <Card className="relative flex-1 border-gray-200 flex flex-col overflow-hidden">
            {/* Messages area */}
            <div
              ref={chatRef}
              className="flex-1 overflow-y-auto p-6 space-y-6"
              onScroll={handleChatScroll}
            >
              {isHistoryLoading && (
                <div className="flex justify-center p-4">
                  <div className="typing">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}
                  >
                    {/* BOT HEADER */}
                    {message.type === 'bot' && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs text-gray-500">Knowledge Assistant</span>
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`rounded-2xl p-4 ${
                        message.type === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-tr-sm'
                          : message.type === 'loading'
                          ? 'bg-gray-200 text-gray-900 rounded-tl-sm'
                          : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                      }`}
                    >
                      {/* LOADING ANIMATION */}
                      {message.type === 'loading' ? (
                        <div className="typing">
                          <span className="dot"></span>
                          <span className="dot"></span>
                          <span className="dot"></span>
                        </div>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                    </div>

                    {/* Sources trigger (ChatGPT-style) */}
                    {message.type === 'bot' &&
                      message.sources &&
                      message.sources.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleSourcesClick(message)}
                          className="mt-2 text-xs text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          Sources · {message.sources.length}
                        </button>
                      )}

                    {/* BOT FOOTER */}
                    {message.type === 'bot' && (
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-500">
                          {message.timestamp}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                          >
                            <ThumbsUp className="w-3 h-3 text-gray-400 hover:text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                          >
                            <ThumbsDown className="w-3 h-3 text-gray-400 hover:text-red-600" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* USER FOOTER */}
                    {message.type === 'user' && (
                      <div className="flex justify-end mt-2">
                        <span className="text-xs text-gray-500">
                          {message.timestamp}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Suggested questions */}
            {messages.length === 1 && (
              <div className="px-6 pb-4">
                <p className="text-sm text-gray-500 mb-3">Suggested questions:</p>
                <div className="grid grid-cols-2 gap-2">
                  {suggestedQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-left justify-start h-auto py-2 px-3 text-xs"
                      onClick={() => handleSuggestedQuestion(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input area */}
            <div className="border-t border-gray-200 p-6">
              <div className="flex items-end gap-3">
                <Input
                  placeholder="Type your question here..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="rounded-xl"
                />
                <Button
                  onClick={handleSendMessage}
                  className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 rounded-xl flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Scroll-to-bottom arrow */}
            {!isAtBottom && (
              <button
                type="button"
                onClick={scrollToBottom}
                className="absolute right-4 bottom-24 z-10 rounded-full bg-white shadow-md border border-gray-200 p-2 hover:bg-gray-50"
              >
                <span className="block text-gray-600 text-xs">↓</span>
              </button>
            )}
          </Card>

          {/* Sources side panel */}
          {isSourcesPanelOpen && activeSources && (
            <Card className="w-80 flex-shrink-0 border-gray-200 flex flex-col overflow-hidden h-[calc(100vh-8rem)] sticky top-8">
            <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Sources</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setIsSourcesPanelOpen(false);
                    setActiveSources(null);
                    setActiveSourcesMessageId(null);
                  }}
                >
                  {'×'}
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeSources.map((source, index) => (
                  <div
                    key={source.chunk_id || index}
                    className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2"
                  >
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <FileText className="w-3 h-3" />
                      <span className="font-medium truncate">
                        {source.source}
                      </span>
                    </div>
                    <p className="text-xs text-gray-800 break-words whitespace-pre-wrap max-w-full">
  {truncateText(source.text)}
</p>
                    {source.page && (
                      <p className="text-[11px] text-gray-500">
                        Page {source.page}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              {activeSourcesMessageId && (
                <div className="border-t border-gray-200 px-4 py-2 text-[11px] text-gray-400">
                  Showing sources for response #{activeSourcesMessageId}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
