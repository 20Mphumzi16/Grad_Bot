import { Card } from '../components/ui/card';
import { 
  TrendingUp, 
  MessageSquare, 
  Clock,
  ThumbsUp
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export function AdminAnalytics() {
  const conversationData = [
    { date: 'Mon', conversations: 145 },
    { date: 'Tue', conversations: 189 },
    { date: 'Wed', conversations: 167 },
    { date: 'Thu', conversations: 203 },
    { date: 'Fri', conversations: 178 },
    { date: 'Sat', conversations: 98 },
    { date: 'Sun', conversations: 87 },
  ];

  const responseTimeData = [
    { date: 'Mon', time: 1.3 },
    { date: 'Tue', time: 1.1 },
    { date: 'Wed', time: 1.2 },
    { date: 'Thu', time: 1.0 },
    { date: 'Fri', time: 1.2 },
    { date: 'Sat', time: 1.4 },
    { date: 'Sun', time: 1.3 },
  ];

  const topQueries = [
    { query: 'First 90 days milestones', count: 234 },
    { query: 'Time off request process', count: 189 },
    { query: 'Technical training available', count: 167 },
    { query: 'HR contact information', count: 145 },
    { query: 'Benefits overview', count: 128 },
  ];

  const documentUsage = [
    { document: 'Graduate Handbook', usage: 456 },
    { document: 'Training Guide', usage: 389 },
    { document: 'Benefits Guide', usage: 312 },
    { document: 'Code of Conduct', usage: 267 },
    { document: 'Leave Policy', usage: 234 },
  ];

  return (
    <div className="pt-8 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-gray-900 mb-2">Analytics</h1>
        <p className="text-gray-600">Track performance metrics and usage patterns</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <p className="text-gray-600 text-sm">Total Conversations</p>
          </div>
          <p className="text-gray-900 mb-1">1,429</p>
          <p className="text-sm text-green-600">+12.5% vs last week</p>
        </Card>

        <Card className="p-6 border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <p className="text-gray-600 text-sm">Avg Response Time</p>
          </div>
          <p className="text-gray-900 mb-1">1.2s</p>
          <p className="text-sm text-green-600">-0.3s improvement</p>
        </Card>

        <Card className="p-6 border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <ThumbsUp className="w-5 h-5 text-white" />
            </div>
            <p className="text-gray-600 text-sm">Satisfaction Rate</p>
          </div>
          <p className="text-gray-900 mb-1">94.7%</p>
          <p className="text-sm text-green-600">+2.1% vs last month</p>
        </Card>

        <Card className="p-6 border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <p className="text-gray-600 text-sm">Active Users</p>
          </div>
          <p className="text-gray-900 mb-1">342</p>
          <p className="text-sm text-green-600">+18 new this week</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border-gray-200">
          <h3 className="text-gray-900 mb-6">Conversation Volume</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={conversationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="conversations" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 border-gray-200">
          <h3 className="text-gray-900 mb-6">Response Time Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="time" 
                stroke="#14b8a6" 
                strokeWidth={2}
                dot={{ fill: '#14b8a6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border-gray-200">
          <h3 className="text-gray-900 mb-6">Top Queries</h3>
          <div className="space-y-4">
            {topQueries.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <span className="text-gray-900 text-sm">{item.query}</span>
                </div>
                <span className="text-gray-600 text-sm">{item.count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 border-gray-200">
          <h3 className="text-gray-900 mb-6">Document Usage</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={documentUsage} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" stroke="#9ca3af" />
              <YAxis dataKey="document" type="category" width={120} stroke="#9ca3af" />
              <Tooltip />
              <Bar dataKey="usage" fill="#3b82f6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
