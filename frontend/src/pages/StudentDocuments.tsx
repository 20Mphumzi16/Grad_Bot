import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  FileText,
  Download,
  Eye,
  Calendar
} from 'lucide-react';
import { Badge } from '../components/ui/badge';

export function StudentDocuments() {
  const documents = [
    {
      id: 1,
      title: 'Offer Letter',
      category: 'Personal',
      date: '2024-10-15',
      size: '0.3 MB',
      status: 'signed'
    },
    {
      id: 2,
      title: 'Employment Contract',
      category: 'Personal',
      date: '2024-10-15',
      size: '0.8 MB',
      status: 'signed'
    },
    {
      id: 3,
      title: 'Tax Forms - W4',
      category: 'HR',
      date: '2024-11-01',
      size: '0.2 MB',
      status: 'pending'
    },
    {
      id: 4,
      title: 'Benefits Enrollment',
      category: 'HR',
      date: '2024-11-15',
      size: '0.5 MB',
      status: 'completed'
    },
    {
      id: 5,
      title: 'Learning Plan Q1',
      category: 'Training',
      date: '2024-12-01',
      size: '0.4 MB',
      status: 'draft'
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'signed':
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 rounded-lg">
            {status === 'signed' ? 'Signed' : 'Completed'}
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 rounded-lg">
            Pending
          </Badge>
        );
      case 'draft':
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 rounded-lg">
            Draft
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="pt-8 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-gray-900 mb-2">My Documents</h1>
        <p className="text-gray-600">Access your personal documents and forms</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-gray-200">
          <p className="text-gray-600 text-sm mb-1">Total Documents</p>
          <p className="text-gray-900">5</p>
        </Card>
        <Card className="p-6 border-gray-200">
          <p className="text-gray-600 text-sm mb-1">Pending Action</p>
          <p className="text-gray-900">1</p>
        </Card>
        <Card className="p-6 border-gray-200">
          <p className="text-gray-600 text-sm mb-1">Completed</p>
          <p className="text-gray-900">3</p>
        </Card>
      </div>

      {/* Documents list */}
      <div className="space-y-4">
        {documents.map((doc) => (
          <Card key={doc.id} className="p-6 border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-gray-900 mb-1">{doc.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(doc.date).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>{doc.size}</span>
                      <span>•</span>
                      <Badge variant="outline" className="rounded-lg">
                        {doc.category}
                      </Badge>
                    </div>
                  </div>
                  {getStatusBadge(doc.status)}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" className="rounded-lg">
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
