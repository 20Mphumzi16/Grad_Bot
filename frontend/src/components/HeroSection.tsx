import { Button } from './ui/button';
import { MessageSquare, Sparkles } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        {/* Decorative element */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 mb-8">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm">AI-Powered Knowledge Assistant</span>
        </div>

        <h1 className="text-gray-900 mb-6">
          Your Graduate Programme<br />Knowledge Assistant
        </h1>
        
        <p className="text-gray-600 max-w-2xl mx-auto mb-12">
          A Retrieval-Augmented AI chatbot that preserves institutional knowledge and supports graduates with accurate, programme-specific answers.
        </p>

        {/* Chat Input */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Ask me anything about the graduate programme..."
              className="w-full px-6 py-5 rounded-2xl border border-gray-200 shadow-lg shadow-gray-100/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <Button 
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 rounded-xl"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Start Chat
            </Button>
          </div>
        </div>

        <p className="text-sm text-gray-400">
          Try asking: "What are the key milestones in my first 90 days?"
        </p>
      </div>
    </section>
  );
}
