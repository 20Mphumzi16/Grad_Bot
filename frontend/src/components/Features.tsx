import { Database, FileCheck, MessageCircle, Shield } from 'lucide-react';
import { Card } from './ui/card';

const features = [
  {
    icon: Database,
    title: 'Knowledge Repository',
    description: 'Curated programme documents, policies, and resources all in one place.',
  },
  {
    icon: FileCheck,
    title: 'Accurate Answers',
    description: 'RAG-based responses with citations from official sources you can trust.',
  },
  {
    icon: MessageCircle,
    title: 'Multi-turn Conversations',
    description: 'Natural dialogue that understands context and follows up intelligently.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Compliant data handling with enterprise-grade security standards.',
  },
];

export function Features() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-gray-900 mb-4">
            Built for Graduate Success
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Everything you need to access institutional knowledge and get answers instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={feature.title}
                className="p-8 border-gray-100 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
