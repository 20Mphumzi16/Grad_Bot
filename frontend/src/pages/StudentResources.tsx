import { useState } from 'react';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { 
  Search,
  FileText,
  Download,
  Eye,
  BookOpen
} from 'lucide-react';
import { Badge } from '../components/ui/badge';

export function StudentResources() {
  const [searchQuery, setSearchQuery] = useState('');

  const resources = [
    { 
      id: 1,
      title: 'Graduate Handbook 2025',
      category: 'Onboarding',
      type: 'PDF',
      size: '2.4 MB',
      views: 245,
      description: 'Complete guide to your graduate programme including policies, procedures, and key contacts.'
    },
    { 
      id: 2,
      title: 'Technical Training Guide',
      category: 'Training',
      type: 'PDF',
      size: '1.8 MB',
      views: 189,
      description: 'Overview of technical training modules and learning paths available to graduates.'
    },
    { 
      id: 3,
      title: 'Benefits Overview',
      category: 'HR',
      type: 'PDF',
      size: '3.1 MB',
      views: 167,
      description: 'Comprehensive overview of employee benefits, health insurance, and wellness programmes.'
    },
    { 
      id: 4,
      title: 'Code of Conduct',
      category: 'Policy',
      type: 'PDF',
      size: '1.2 MB',
      views: 156,
      description: 'Company code of conduct, ethics guidelines, and professional standards.'
    },
    { 
      id: 5,
      title: 'First 90 Days Checklist',
      category: 'Onboarding',
      type: 'PDF',
      size: '0.5 MB',
      views: 298,
      description: 'Step-by-step checklist for your first three months in the programme.'
    },
    { 
      id: 6,
      title: 'Leave Policy 2025',
      category: 'HR',
      type: 'PDF',
      size: '0.8 MB',
      views: 134,
      description: 'Annual leave, sick leave, and special leave policies and procedures.'
    },
  ];

  const categories = ['All', 'Onboarding', 'Training', 'HR', 'Policy'];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="pt-8 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-gray-900 mb-2">Resources</h1>
        <p className="text-gray-600">Access programme documents and learning materials</p>
      </div>

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
        {filteredResources.map((resource) => (
          <Card key={resource.id} className="p-6 border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-gray-900">{resource.title}</h3>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="rounded-lg">
                    {resource.category}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {resource.type} • {resource.size}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {resource.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Eye className="w-3 h-3" />
                    <span>{resource.views} views</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-lg">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-lg">
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
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-gray-900 mb-2">No resources found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </Card>
      )}
    </div>
  );
}
