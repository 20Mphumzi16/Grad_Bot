'use client';

import { useEffect, useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FileText, Download, Eye, Calendar } from 'lucide-react';
import { Badge } from '../components/ui/badge';

interface Document {
  id: string;
  file_name: string;
  category_id: number;
  file_path: string;
  file_extension: string;
  mime_type: string;
  file_size: number;
  views: number;
  description?: string;
  created_at: string;
}

export function StudentDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/documents/get-documents');
        const data: Document[] = await res.json();
        setDocuments(data);
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const getStatusBadge = (views: number) => {
    return views > 0 ? (
      <Badge className="bg-green-100 text-green-700 rounded-lg">Viewed</Badge>
    ) : (
      <Badge className="bg-orange-100 text-orange-700 rounded-lg">New</Badge>
    );
  };

  const handleView = async (docId: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/documents/${docId}/download`);
      const data = await res.json();
      window.open(data.url, '_blank'); // open in new tab
    } catch (err) {
      console.error('Error fetching document URL:', err);
    }
  };

  const handleDownload = async (docId: string, fileName: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/documents/${docId}/download`);
      const data = await res.json();

      // Create a temporary link element and trigger download
      const link = document.createElement('a');
      link.href = data.url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading document:', err);
    }
  };

  if (loading) return <p>Loading documents...</p>;

  return (
    <div className="pt-8 space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-gray-200">
          <p className="text-gray-600 text-sm mb-1">Total Documents</p>
          <p style={{ color: 'var(--foreground)' }}>{documents.length}</p>
        </Card>
        <Card className="p-6 border-gray-200">
          <p className="text-gray-600 text-sm mb-1">New Documents</p>
          <p style={{ color: 'var(--foreground)' }}>{documents.filter(d => d.views === 0).length}</p>
        </Card>
        <Card className="p-6 border-gray-200">
          <p className="text-gray-600 text-sm mb-1">Viewed</p>
          <p style={{ color: 'var(--foreground)' }}>{documents.filter(d => d.views > 0).length}</p>
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
                    <h3 style={{ color: 'var(--foreground)' }} className="mb-1">{doc.file_name}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>{(doc.file_size / 1024).toFixed(2)} KB</span>
                      <span>•</span>
                      <Badge variant="outline" className="rounded-lg">
                        Category {doc.category_id}
                      </Badge>
                    </div>
                  </div>
                  {getStatusBadge(doc.views)}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => handleView(doc.id)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => handleDownload(doc.id, doc.file_name)}
                >
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
