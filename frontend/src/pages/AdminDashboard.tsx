import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Upload, 
  FileText, 
  MessageSquare, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Clock,
  MoreVertical
} from 'lucide-react';
import { Progress } from '../components/ui/progress';

export function AdminDashboard() {
  const navigate = useNavigate();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recentDocuments, setRecentDocuments] = useState<Array<{ name: string; status: string; uploadedAt: string; chunks: number }>>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);

  const stats = [
    {
      label: 'Total Documents',
      value: '247',
      change: '+12 this week',
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
    },
    {
      label: 'Conversations',
      value: '1,429',
      change: '+89 today',
      icon: MessageSquare,
      color: 'from-teal-500 to-teal-600',
    },
    {
      label: 'Avg Response Time',
      value: '1.2s',
      change: '-0.3s improved',
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
    },
    {
      label: 'Success Rate',
      value: '94.7%',
      change: '+2.1% this month',
      icon: CheckCircle2,
      color: 'from-green-500 to-green-600',
    },
  ];

  useEffect(() => {
    const fetchRecentDocuments = async () => {
      setLoadingDocuments(true);
      try {
        const res = await fetch('http://127.0.0.1:8000/documents/get-newest-documents');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (Array.isArray(data)) {
          const mapped = (data as any[]).map((it) => ({
            name: it?.name ?? it?.file_name ?? it?.title ?? 'Untitled',
            status: it?.status ?? 'processed',
            uploadedAt: it?.uploaded_at ?? it?.uploadedAt ?? it?.created_at ?? it?.createdAt ?? '',
            chunks: typeof it?.chunks === 'number' ? it.chunks : Number(it?.chunks) || 0,
          }));
          setRecentDocuments(mapped);
        }
      } catch (err: any) {
        console.error('Failed to fetch recent documents:', err);
        setRecentDocuments([]);
      } finally {
        setLoadingDocuments(false);
      }
    };

    fetchRecentDocuments();
  }, []);

  const recentQueries = [
    { question: 'What are the key milestones in my first 90 days?', answer: 'Provided', time: '5 min ago' },
    { question: 'How do I request time off?', answer: 'Provided', time: '12 min ago' },
    { question: 'What training is available for technical skills?', answer: 'Provided', time: '28 min ago' },
    { question: 'Who is my HR contact?', answer: 'Provided', time: '1 hour ago' },
  ];

  return (
    <div className="pt-8 space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-end">
        <Button 
          className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 rounded-xl"
          onClick={() => navigate('/admin/documents?upload=true')}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-6 border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </Button>
              </div>
              <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
              <p style={{ color: 'var(--foreground)' }} className="mb-2">{stat.value}</p>
              <p className="text-sm text-green-600">{stat.change}</p>
            </Card>
          );
        })}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent documents */}
        <Card className="p-6 border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 style={{ color: 'var(--foreground)' }}>Recent Documents</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-blue-600 hover:text-blue-700"
              onClick={() => navigate('/admin/documents')}
            >
              View all
            </Button>
          </div>
          <div className="space-y-4">
            {loadingDocuments ? (
              <div className="text-center py-8 text-gray-600">Loading recent documents...</div>
            ) : recentDocuments.length === 0 ? (
              <div className="text-center py-8 text-gray-600">No recent documents found</div>
            ) : (
              recentDocuments.map((doc, index) => (
                <div key={index} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: 'var(--foreground)' }} className="text-sm truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {doc.status === 'processed' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle2 className="w-3 h-3" />
                          Processed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-orange-600">
                          <Clock className="w-3 h-3" />
                          Processing
                      </span>
                    )}
                    <span className="text-xs text-gray-500">• {doc.chunks} chunks</span>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{doc.uploadedAt}</span>
              </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent queries */}
        <Card className="p-6 border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 style={{ color: 'var(--foreground)' }}>Recent Queries</h3>
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
              View all
            </Button>
          </div>
          <div className="space-y-4">
            {recentQueries.map((query, index) => (
              <div key={index} className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                <p style={{ color: 'var(--foreground)' }} className="text-sm mb-2">{query.question}</p>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 className="w-3 h-3" />
                    Answer {query.answer}
                  </span>
                  <span className="text-xs text-gray-500">{query.time}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* System status */}
      <Card className="p-6 border-gray-200">
        <h3 style={{ color: 'var(--foreground)' }} className="mb-6">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Vector Database</span>
              <span className="text-sm text-green-600">Healthy</span>
            </div>
            <Progress value={98} className="h-2" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">API Response Rate</span>
              <span className="text-sm text-green-600">99.2%</span>
            </div>
            <Progress value={99} className="h-2" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Storage Usage</span>
              <span className="text-sm text-gray-600">67%</span>
            </div>
            <Progress value={67} className="h-2" />
          </div>
        </div>
      </Card>

      {/* Alert section */}
      <Card className="p-6 border-orange-200 bg-orange-50">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <h4 style={{ color: 'var(--foreground)' }} className="mb-1">Documents Pending Review</h4>
            <p className="text-sm text-gray-600 mb-3">
              3 documents have been uploaded and are awaiting administrator review before being added to the knowledge base.
            </p>
            <Button variant="outline" size="sm" className="rounded-lg border-orange-300 text-orange-700 hover:bg-orange-100">
              Review Documents
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
