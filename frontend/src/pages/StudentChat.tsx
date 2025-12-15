import { useState, useEffect, useRef } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
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



interface Message {
  id: number;
  type: MessageType;
  content: string;
  sources?: Source[];
  timestamp: string;
}


export function StudentChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'bot',
      content: "Hello Jane! I'm your Graduate Programme Knowledge Assistant. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputValue, setInputValue] = useState('');

  const chatRef = useRef<HTMLDivElement>(null);

  // AUTO-SCROLL WHEN MESSAGES CHANGE
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

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
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);

    const questionToSend = inputValue;
    setInputValue('');

    // Add loading indicator
    const loadingMessage: Message = {
      id: Date.now() + 1,
      type: 'loading',
      content: "",
      timestamp: ""
    };

    setMessages(prev => [...prev, loadingMessage]);

    try {
      const response = await fetch("http://localhost:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
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
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [
        ...prev.filter(m => m.type !== 'loading'),
        errorMessage
      ]);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
  };

  return (
    <div className="pt-8 h-[calc(100vh-8rem)]">
      <div className="flex flex-col h-full max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-gray-900 mb-2">Chat Assistant</h1>
          <p className="text-gray-600">Ask me anything about the graduate programme</p>
        </div>

        {/* Chat container */}
        <Card className="flex-1 border-gray-200 flex flex-col overflow-hidden">

          {/* Messages area */}
          <div
            ref={chatRef}
            className="flex-1 overflow-y-auto p-6 space-y-6"
          >
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>

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
                  <div className={`rounded-2xl p-4 ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-tr-sm'
                      : message.type === 'loading'
                      ? 'bg-gray-200 text-gray-900 rounded-tl-sm'
                      : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                  }`}>

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

                  {/* Sources */}
             {message.sources && (
  <div className="mt-2 space-y-2">
    {message.sources.map((source, index) => (
      <div
        key={index}
        className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-2"
      >
        <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />

        <div className="space-y-1">
          {/* Evidence snippet */}
          <p className="text-gray-700 line-clamp-3">
            {source.text}
          </p>

          {/* Provenance */}
          <div className="flex gap-3 text-[11px] text-gray-400">
            <span>📄 {source.source}</span>
            {source.page && <span>Page {source.page}</span>}
          </div>
        </div>
      </div>
    ))}
  </div>
)}


                  {/* BOT FOOTER */}
                  {message.type === 'bot' && (
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-500">{message.timestamp}</span>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <ThumbsUp className="w-3 h-3 text-gray-400 hover:text-green-600" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <ThumbsDown className="w-3 h-3 text-gray-400 hover:text-red-600" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* USER FOOTER */}
                  {message.type === 'user' && (
                    <div className="flex justify-end mt-2">
                      <span className="text-xs text-gray-500">{message.timestamp}</span>
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

        </Card>
      </div>
    </div>
  );
}
