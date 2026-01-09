import { useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { CustomModal } from "../components/ui/custom-modal";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

import { 
  Upload, 
  FileText, 
  Search,
  MoreVertical,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  Trash2
} from 'lucide-react';
import { Badge } from '../components/ui/badge';

export function AdminDocuments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [category, setCategory] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const documents = [
    { 
      id: 1,
      name: 'Graduate Handbook 2025.pdf', 
      status: 'processed', 
      uploadedAt: '2024-12-01',
      size: '2.4 MB',
      chunks: 145,
      category: 'Onboarding'
    },
    { 
      id: 2,
      name: 'Training Schedule Q1.pdf', 
      status: 'processing', 
      uploadedAt: '2024-12-03',
      size: '1.8 MB',
      chunks: 67,
      category: 'Training'
    },
    { 
      id: 3,
      name: 'Benefits Guide.pdf', 
      status: 'processed', 
      uploadedAt: '2024-11-28',
      size: '3.1 MB',
      chunks: 89,
      category: 'HR'
    },
    { 
      id: 4,
      name: 'Code of Conduct.pdf', 
      status: 'processed', 
      uploadedAt: '2024-11-25',
      size: '1.2 MB',
      chunks: 34,
      category: 'Policy'
    },
    { 
      id: 5,
      name: 'Technical Skills Framework.pdf', 
      status: 'processed', 
      uploadedAt: '2024-11-20',
      size: '2.9 MB',
      chunks: 112,
      category: 'Training'
    },
    { 
      id: 6,
      name: 'Leave Policy 2025.pdf', 
      status: 'failed', 
      uploadedAt: '2024-12-02',
      size: '0.8 MB',
      chunks: 0,
      category: 'HR'
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Processed
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
            <Clock className="w-3 h-3 mr-1" />
            Processing
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleUpload = () => {
    // Handle upload logic here
    console.log('Uploading:', { fileName, category, selectedFile });
    // Reset form
    setFileName('');
    setCategory('');
    setSelectedFile(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="pt-8 space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-2">Document Management</h1>
          <p className="text-gray-600">Upload and manage knowledge base documents</p>
        </div>
        <Button 
          onClick={() => setIsDialogOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 rounded-xl"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 border-gray-200">
          <p className="text-gray-600 text-sm mb-1">Total Documents</p>
          <p className="text-gray-900">247</p>
        </Card>
        <Card className="p-6 border-gray-200">
          <p className="text-gray-600 text-sm mb-1">Processed</p>
          <p className="text-gray-900">242</p>
        </Card>
        <Card className="p-6 border-gray-200">
          <p className="text-gray-600 text-sm mb-1">Processing</p>
          <p className="text-gray-900">3</p>
        </Card>
        <Card className="p-6 border-gray-200">
          <p className="text-gray-600 text-sm mb-1">Total Chunks</p>
          <p className="text-gray-900">12,847</p>
        </Card>
      </div>

      {/* Search and filters */}
      <Card className="p-6 border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search documents..."
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

      {/* Documents table */}
      <Card className="border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="text-left p-6 text-sm text-gray-600">Document Name</th>
                <th className="text-left p-6 text-sm text-gray-600">Category</th>
                <th className="text-left p-6 text-sm text-gray-600">Status</th>
                <th className="text-left p-6 text-sm text-gray-600">Chunks</th>
                <th className="text-left p-6 text-sm text-gray-600">Size</th>
                <th className="text-left p-6 text-sm text-gray-600">Upload Date</th>
                <th className="text-left p-6 text-sm text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-gray-600" />
                      </div>
                      <span className="text-gray-900 text-sm">{doc.name}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <Badge variant="outline" className="rounded-lg">
                      {doc.category}
                    </Badge>
                  </td>
                  <td className="p-6">
                    {getStatusBadge(doc.status)}
                  </td>
                  <td className="p-6">
                    <span className="text-gray-900 text-sm">{doc.chunks}</span>
                  </td>
                  <td className="p-6">
                    <span className="text-gray-600 text-sm">{doc.size}</span>
                  </td>
                  <td className="p-6">
                    <span className="text-gray-600 text-sm">{doc.uploadedAt}</span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="w-4 h-4 text-gray-600" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
<CustomModal
  open={isDialogOpen}
  onClose={() => {
    setIsDialogOpen(false);
    setFileName('');
    setCategory('');
    setSelectedFile(null);
  }}
  title="Upload Document"
  footer={
    <>
      <Button
        variant="outline"
        onClick={() => {
          setIsDialogOpen(false);
          setFileName('');
          setCategory('');
          setSelectedFile(null);
        }}
        className="rounded-lg"
      >
        Cancel
      </Button>
      <Button
        onClick={handleUpload}
        disabled={!fileName || !category || !selectedFile}
        className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 rounded-lg"
      >
        <Upload className="w-4 h-4 mr-2" />
        Upload
      </Button>
    </>
  }
>
  <p className="text-sm text-gray-600">
    Upload a new document to the knowledge base
  </p>

  {/* File Name */}
  <div className="space-y-2">
    <Label htmlFor="filename">File Name</Label>
    <Input
      id="filename"
      value={fileName}
      onChange={(e) => setFileName(e.target.value)}
    />
  </div>

  {/* Category */}
  <div className="space-y-2">
    <Label>Category</Label>
    <Select value={category} onValueChange={setCategory}>
      <SelectTrigger>
        <SelectValue placeholder="Select a category" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Onboarding">Onboarding</SelectItem>
        <SelectItem value="Training">Training</SelectItem>
        <SelectItem value="HR">HR</SelectItem>
        <SelectItem value="Policy">Policy</SelectItem>
      </SelectContent>
    </Select>
  </div>

  {/* File Upload */}
  <div className="space-y-2">
    <Label>Select File</Label>
    <div className="border-2 border-dashed rounded-lg p-6 text-center">
      <input
        id="file"
        type="file"
        className="hidden"
        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
      />
      <label htmlFor="file" className="cursor-pointer">
        <FileText className="mx-auto mb-2 h-8 w-8 text-gray-400" />
        <p className="text-sm">
          {selectedFile ? selectedFile.name : "Click to select a file"}
        </p>
      </label>
    </div>
  </div>
</CustomModal>


    </div>
  );
}
