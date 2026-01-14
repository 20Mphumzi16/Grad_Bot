import { useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  Search,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Eye
} from 'lucide-react';
import { Badge } from '../components/ui/badge';

export function AdminConversations() {
  const [searchQuery, setSearchQuery] = useState('');

  const conversations = [
    {
      id: 1,
      user: 'Graduate #1247',
      query: 'What are the key milestones in my first 90 days?',
      response: 'Your first 90 days include orientation (Week 1), technical training...',
      feedback: 'positive',
      timestamp: '2024-12-03 14:32',
      responseTime: '1.2s',
      sources: 3
    },
    {
      id: 2,
      user: 'Graduate #1089',
      query: 'How do I request time off?',
      response: 'To request time off, log into the HR portal and navigate to...',
      feedback: 'positive',
      timestamp: '2024-12-03 14:15',
      responseTime: '0.9s',
      sources: 2
    },
    {
      id: 3,
      user: 'Graduate #1356',
      query: 'What training is available for technical skills?',
      response: 'We offer comprehensive technical training including cloud platforms...',
      feedback: 'negative',
      timestamp: '2024-12-03 13:48',
      responseTime: '1.5s',
      sources: 4
    },
    {
      id: 4,
      user: 'Graduate #1204',
      query: 'Who is my HR contact?',
      response: 'Your assigned HR contact is listed in your onboarding pack...',
      feedback: 'positive',
      timestamp: '2024-12-03 13:22',
      responseTime: '0.8s',
      sources: 1
    },
    {
      id: 5,
      user: 'Graduate #1478',
      query: 'What are the rotation opportunities?',
      response: 'Rotation opportunities are available after your first 6 months...',
      feedback: null,
      timestamp: '2024-12-03 12:55',
      responseTime: '1.1s',
      sources: 3
    },
  ];

  const getFeedbackBadge = (feedback: string | null) => {
    if (feedback === 'positive') {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          <ThumbsUp className="w-3 h-3 mr-1" />
          Positive
        </Badge>
      );
    } else if (feedback === 'negative') {
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
          <ThumbsDown className="w-3 h-3 mr-1" />
          Negative
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="rounded-lg">
          No feedback
        </Badge>
      );
    }
  };

  return (
    <div className="pt-8 space-y-8">
      {/* Page header */}
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 border-gray-200">
          <p className="text-gray-600 text-sm mb-1">Total Conversations</p>
          <p style={{ color: 'var(--foreground)' }}>1,429</p>
        </Card>
        <Card className="p-6 border-gray-200">
          <p className="text-gray-600 text-sm mb-1">Today</p>
          <p style={{ color: 'var(--foreground)' }}>89</p>
        </Card>
        <Card className="p-6 border-gray-200">
          <p className="text-gray-600 text-sm mb-1">Positive Feedback</p>
          <p style={{ color: 'var(--foreground)' }}>94.7%</p>
        </Card>
        <Card className="p-6 border-gray-200">
          <p className="text-gray-600 text-sm mb-1">Avg Response Time</p>
          <p style={{ color: 'var(--foreground)' }}>1.2s</p>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-6 border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
          <Button variant="outline" className="rounded-xl">
            Filter
          </Button>
        </div>
      </Card>

      {/* Conversations list */}
      <div className="space-y-4">
        {conversations.map((conversation) => (
          <Card key={conversation.id} className="p-6 border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white text-sm">
                  {conversation.user.split('#')[1].substring(0, 2)}
                </div>
                <div>
                  <p style={{ color: 'var(--foreground)' }} className="text-sm">{conversation.user}</p>
                  <p className="text-gray-500 text-xs">{conversation.timestamp}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getFeedbackBadge(conversation.feedback)}
                <Button variant="ghost" size="sm" className="rounded-lg">
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-2">USER QUERY</p>
                <p style={{ color: 'var(--foreground)' }} className="text-sm">{conversation.query}</p>
              </div>

              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs text-blue-600 mb-2">BOT RESPONSE</p>
                <p style={{ color: 'var(--foreground)' }} className="text-sm">{conversation.response}</p>
              </div>
            </div>

            <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
              <span>Response time: {conversation.responseTime}</span>
              <span>•</span>
              <span>{conversation.sources} sources cited</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
