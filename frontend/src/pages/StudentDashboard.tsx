import React from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  MessageSquare, 
  BookOpen, 
  Calendar,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react';
import { Progress } from '../components/ui/progress';
import { Link } from 'react-router';
import { useEffect, useState, } from 'react';
import { useLoading } from '../components/ui/loading';
import { API_BASE_URL } from '../utils/config';

export function StudentDashboard() {

  const [firstName, setFirstName] = useState<string | null>(null);
  const [upcomingMilestones, setUpcomingMilestones] = useState<any[]>([]);
  const [progressData, setProgressData] = useState({ 
    total: 0, 
    completed: 0, 
    percentage: 0,
    totalMilestones: 0,
    completedMilestones: 0
  });
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [viewsThisWeek, setViewsThisWeek] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const { setLoading } = useLoading();

  const fetchDashboardData = async (retryCount = 0) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setStatsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch user');
      }
      
      const data: any = await res.json();

      // Common field names returned by /auth/me
      const f = data.first_name || data.given_name || data.firstName || data.first || (data.name ? data.name.split(' ')[0] : null);

      if (f) setFirstName(f);

      // Fetch milestones for progress
      if (data.id) {
        // Fetch milestones
        const milestonesRes = await fetch(
          `${API_BASE_URL}/timeline/${data.id}/milestones-tasks`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (!milestonesRes.ok) {
          throw new Error('Failed to fetch milestones');
        }

        const milestonesData = await milestonesRes.json();
        const overallProgress = milestonesData.reduce((acc: any, milestone: any) => {
          if (!milestone.tasks) return acc;
          const completed = milestone.tasks.filter((t: any) => t.completed).length;
          return {
            total: acc.total + milestone.tasks.length,
            completed: acc.completed + completed
          };
        }, { total: 0, completed: 0 });

        const percentage = overallProgress.total > 0 
          ? Math.round((overallProgress.completed / overallProgress.total) * 100) 
          : 0;

        const totalMilestones = milestonesData.length;
        const completedMilestones = milestonesData.filter((m: any) => m.status === 'Completed').length;
          
        setProgressData({
          total: overallProgress.total,
          completed: overallProgress.completed,
          percentage: percentage,
          totalMilestones,
          completedMilestones
        });

        // Fetch total questions asked
        try {
          const chatRes = await fetch(
            `${API_BASE_URL}/chat/count/${data.id}`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );
          if (chatRes.ok) {
            const chatData = await chatRes.json();
            setTotalQuestions(chatData.count || 0);
          }
        } catch {
          // ignore fetch errors
        }

        // Fetch total views
        try {
          const viewsRes = await fetch(
            `${API_BASE_URL}/documents/user/${data.id}/view-count`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );
          if (viewsRes.ok) {
            const viewsData = await viewsRes.json();
            setTotalViews(viewsData.count || 0);
            setViewsThisWeek(viewsData.this_week || 0);
          }
        } catch (error) {
          console.error('Error fetching view count:', error);
        }

        // Fetch top 3 active/upcoming milestones
        try {
          const upcomingRes = await fetch(
            `${API_BASE_URL}/timeline/get-3-active-milestones/${data.id}`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (upcomingRes.ok) {
            const milestones = await upcomingRes.json();
            if (Array.isArray(milestones)) {
              const mapped = milestones.map((m: any) => {
                const rawStatus = m.status || 'Upcoming';
                const isInProgress = /progress/i.test(String(rawStatus));

                return {
                  title: m.title || m.name || m.milestone_title || 'Untitled milestone',
                  dueDate: m.due_date || m.dueDate || m.deadline || 'No date',
                  status: rawStatus,
                  isInProgress,
                  progress:
                    m.progress ??
                    m.completion_percent ??
                    m.completionPercentage ??
                    0,
                };
              });
              setUpcomingMilestones(mapped);
            }
          }
        } catch {
          // ignore fetch errors for upcoming milestones
        }
      }
      setStatsLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      if (retryCount < 3) {
        setTimeout(() => fetchDashboardData(retryCount + 1), 1000); // Retry after 1s
      } else {
        setStatsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const openDocument = async (docId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/documents/${docId}/view`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        console.error('Failed to fetch document URL', res.statusText);
        return;
      }

      const data: any = await res.json();
      if (data?.url) {
        window.open(data.url, '_blank');
        // refresh list since views count likely changed on the server
        fetchPopularDocuments();
      } else {
        console.error('No URL returned for document', data);
      }
    } catch (err) {
      console.error('Error opening document:', err);
    } finally {
      setLoading(false);
    }
  };

  const [recentResources, setRecentResources] = useState<any[]>([
    { title: 'Graduate Handbook 2025', type: 'PDF', views: 245 },
    { title: 'Technical Training Guide', type: 'PDF', views: 189 },
    { title: 'Benefits Overview', type: 'PDF', views: 167 },
  ]);

  const fetchPopularDocuments = async () => {
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_BASE_URL}/documents/get-popular-documents`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) return;
      const data: any = await res.json();
      console.log('Fetch popular documents response:', data);
      // expect data to be an array of documents
      if (Array.isArray(data)) setRecentResources(data);
    } catch (err) {
      // ignore fetch errors for now
      console.error('Error fetching popular documents', err);
    }
  };

  useEffect(() => {
    fetchPopularDocuments();
  }, []);

  const quickActions = [
    { icon: MessageSquare, label: 'Ask a Question', path: '/student/chat', color: 'from-blue-500 to-blue-600' },
    { icon: BookOpen, label: 'Browse Resources', path: '/student/resources', color: 'from-teal-500 to-teal-600' },
    { icon: Calendar, label: 'View Timeline', path: '/student/timeline', color: 'from-purple-500 to-purple-600' },
  ];

  return (
    <div className="pt-8 space-y-8">
      {/* Welcome section */}
      <div className="bg-gradient-to-r from-blue-500 to-teal-500 rounded-3xl p-8 text-white">
        <h1 className="mb-2">Welcome back, {firstName}!</h1>
        <p className="text-blue-100 mb-6">
          You're on day 15 of your graduate programme. Keep up the great progress!
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.path} to={action.path}>
                <Button 
                  variant="outline" 
                  className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl backdrop-blur-sm"
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {action.label}
                </Button>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center`}>
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Questions Asked</p>
          <p className="text-gray-900 dark:text-gray-100 mb-2">
            {statsLoading ? (
              <Loader2 className="w-4 h-4 text-gray-400 gb-spinner" />
            ) : (
              totalQuestions
            )}
          </p>
          <p className="text-sm text-green-600">
            {statsLoading ? (
              <Loader2 className="w-3 h-3 text-green-400 gb-spinner" />
            ) : (
              '+5 this week'
            )}
          </p>
        </Card>

        <Card className="p-6 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center`}>
              <BookOpen className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Resources Viewed</p>
          <p className="text-gray-900 dark:text-gray-100 mb-2">
            {statsLoading ? (
              <Loader2 className="w-4 h-4 text-gray-400 gb-spinner" />
            ) : (
              totalViews
            )}
          </p>
          <p className="text-sm text-green-600">
            {statsLoading ? (
              <Loader2 className="w-3 h-3 text-green-400 gb-spinner" />
            ) : (
              `+${viewsThisWeek} this week`
            )}
          </p>
        </Card>

        <Card className="p-6 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center`}>
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Programme Progress</p>
          <p className="text-gray-900 dark:text-gray-100 mb-2">
            {statsLoading ? (
              <Loader2 className="w-4 h-4 text-gray-400 gb-spinner" />
            ) : (
              `${progressData.percentage}%`
            )}
          </p>
          <p className="text-sm text-green-600">
            {statsLoading ? (
              <Loader2 className="w-3 h-3 text-green-400 gb-spinner" />
            ) : (
              `${progressData.completedMilestones}/${progressData.totalMilestones} Milestones`
            )}
          </p>
        </Card>

        <Card className="p-6 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center`}>
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Tasks Completed</p>
          <p className="text-gray-900 dark:text-gray-100 mb-2">
            {statsLoading ? (
              <Loader2 className="w-4 h-4 text-gray-400 gb-spinner" />
            ) : (
              `${progressData.completed}/${progressData.total}`
            )}
          </p>
          <p className="text-sm text-green-600">
            {statsLoading ? (
              <Loader2 className="w-3 h-3 text-green-400 gb-spinner" />
            ) : (
              `${progressData.percentage}% complete`
            )}
          </p>
        </Card>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming milestones */}
        <Card className="p-6 border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 style={{ color: 'var(--foreground)' }}>Upcoming Milestones</h3>
            <Link to="/student/timeline">
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                View all
              </Button>
            </Link>
          </div>
          <div className="space-y-4">
            {upcomingMilestones.length === 0 ? (
              <p className="text-sm text-gray-500">No upcoming milestones found.</p>
            ) : (
              upcomingMilestones.map((milestone, index) => (
                <div key={index} className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-gray-100 text-sm mb-1">{milestone.title}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {milestone.dueDate}
                      </p>
                    </div>
                    {milestone.isInProgress ? (
                      <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                        In Progress
                      </span>
                    ) : (
                      <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-lg">
                        Upcoming
                      </span>
                    )}
                  </div>
                  {milestone.progress > 0 && (
                    <div className="space-y-1">
                      <Progress value={milestone.progress} className="h-2" />
                      <p className="text-xs text-gray-500">{milestone.progress}% complete</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent resources */}
        <Card className="p-6 border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 style={{ color: 'var(--foreground)' }}>Popular Resources</h3>
            <Link to="/student/resources">
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                View all
              </Button>
            </Link>
          </div>
          <div className="space-y-4">
            {recentResources.map((resource, index) => (
              <div key={index} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 dark:text-gray-100 text-sm truncate">{resource.file_name}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">{resource.file_extension} • {resource.views} views</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openDocument(resource.id);
                  }}
                  aria-label={`Open ${resource.file_name}`}
                  className="rounded p-1 hover:bg-gray-100"
                >
                  <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick tip */}
      <Card className="p-6 border-blue-200 bg-blue-50">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 style={{ color: 'var(--foreground)' }} className="mb-1">Quick Tip</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              You can ask me anything about the graduate programme! Try questions like "What training is available?" or "How do I request time off?"
            </p>
            <Link to="/student/chat">
              <Button size="sm" className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 rounded-lg">
                Start Chatting
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
