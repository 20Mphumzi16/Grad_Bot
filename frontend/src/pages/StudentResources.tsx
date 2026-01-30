'use client';

import { useEffect, useState } from 'react';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Search, BookOpen, Eye, Download, Loader2 } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { useLoading } from '../components/ui/loading';
import { API_BASE_URL } from '../utils/config';

interface Resource {
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

const CATEGORY_MAP: Record<number, string> = {
  1: 'HR',
  2: 'Onboarding',
  3: 'Training',
  4: 'Policy',
};

export function StudentResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const { setLoading: setGlobalLoading } = useLoading();
  const [viewingDocId, setViewingDocId] = useState<string | null>(null);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setGlobalLoading(true);
        const res = await fetch(`${API_BASE_URL}/documents/get-documents`);
        const data: Resource[] = await res.json();
        setResources(data);
      } catch (error) {
        console.error('Error fetching resources:', error);
      } finally {
        setLoading(false);
        setGlobalLoading(false);
      }
    };

    fetchResources();
  }, []);

  const filteredResources = resources.filter(resource => {
    const titleMatch = resource.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    const categoryName = CATEGORY_MAP[resource.category_id] || 'Other';
    const categoryMatch = selectedCategory === 'All' || categoryName === selectedCategory;
    return titleMatch && categoryMatch;
  });

  const handleView = async (id: string) => {
    try {
      setViewingDocId(id);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/documents/${id}/view`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      window.open(data.url, '_blank');
    } catch (err) {
      console.error('Error fetching document URL:', err);
    } finally {
      setViewingDocId(null);
    }
  };

  const handleDownload = async (id: string, fileName: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/documents/${id}/download`);
      const data = await res.json();
      const url = (data as any)?.url ?? data;
      if (!url) throw new Error('No download URL returned');

      const fileRes = await fetch(url);
      if (!fileRes.ok) throw new Error(`HTTP ${fileRes.status}`);
      const blob = await fileRes.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Error downloading document:', err);
    }
  };

  const categories = ['All', 'Onboarding', 'Training', 'HR', 'Policy'];

  if (loading) return <p>Loading resources...</p>;

  return (
    <div className="pt-8 space-y-8">
      {/* Search and filters */}
      <Card className="p-6 border-gray-200">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-lg ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600'
                    : ''
                }`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Resources grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredResources.map((res) => (
          <Card key={res.id} className="p-6 border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <h3 style={{ color: 'var(--foreground)' }}>{res.file_name}</h3>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="rounded-lg">
                    {CATEGORY_MAP[res.category_id] || 'Other'}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {res.file_extension.toUpperCase()} • {(res.file_size / 1024).toFixed(2)} KB
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">{res.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Eye className="w-3 h-3" />
                    <span>{res.views} views</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-lg" 
                      onClick={() => handleView(res.id)}
                      disabled={viewingDocId === res.id}
                    >
                      {viewingDocId === res.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4 mr-2" />
                      )}
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-lg" onClick={() => handleDownload(res.id, res.file_name)}>
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredResources.length === 0 && (
        <Card className="p-12 border-gray-200 text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 style={{ color: 'var(--foreground)' }} className="mb-2">No resources found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </Card>
      )}
    </div>
  );
}
