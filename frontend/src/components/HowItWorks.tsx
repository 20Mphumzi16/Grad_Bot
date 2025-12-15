import { Upload, Cpu, MessageSquare } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    title: 'Upload Programme Documents',
    description: 'Admin uploads handbooks, policies, and training materials to the knowledge base.',
  },
  {
    icon: Cpu,
    title: 'RAG Pipeline Processes',
    description: 'Documents are chunked, embedded, and indexed for semantic search and retrieval.',
  },
  {
    icon: MessageSquare,
    title: 'Grounded Answers',
    description: 'Chatbot retrieves relevant sources and generates accurate, cited responses.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 px-6 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            A simple three-step process powered by Retrieval-Augmented Generation.
          </p>
        </div>

        <div className="relative">
          {/* Connection line */}
          <div className="absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-teal-200 to-blue-200 hidden lg:block" 
               style={{ top: '3rem' }} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="text-center">
                  <div className="relative inline-block mb-6">
                    <div className="w-24 h-24 rounded-2xl bg-white border-2 border-gray-100 shadow-lg shadow-gray-200/50 flex items-center justify-center mx-auto">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 text-white flex items-center justify-center shadow-lg">
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
