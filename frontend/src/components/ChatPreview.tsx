import { FileText } from 'lucide-react';

export function ChatPreview() {
  return (
    <section className="py-16 px-6 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 space-y-6">
          {/* User message */}
          <div className="flex justify-end">
            <div className="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-6 py-4 rounded-2xl rounded-tr-sm max-w-md">
              <p>What learning resources are available in my first month?</p>
            </div>
          </div>

          {/* Bot message */}
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-6 py-4 rounded-2xl rounded-tl-sm max-w-md">
              <p className="mb-3">
                During your first month, you'll have access to our onboarding portal with video tutorials, 
                the Graduate Handbook, and weekly mentorship sessions with your assigned buddy.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <FileText className="w-4 h-4" />
                <span>Source: Graduate Handbook 2024, Section 2.3</span>
              </div>
            </div>
          </div>

          {/* Typing indicator */}
          <div className="flex justify-start">
            <div className="bg-gray-100 px-6 py-4 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
