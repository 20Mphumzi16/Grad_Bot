import { useState, useEffect, SetStateAction } from 'react';
import { useLocation } from 'react-router';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
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
  Trash2,
  Loader2,
  Zap,
  Package,
  ArrowUpDown
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { useLoading } from '../components/ui/loading';

export function AdminDocuments() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isDialogOpen, setIsDialogOpen] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('upload') === 'true';
  });
  const [fileName, setFileName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string | number; name: string }>>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [documentsError, setDocumentsError] = useState<string | null>(null);

  const [documents, setDocuments] = useState<Array<{ id: string | number; name: string; status?: string; uploadedAt?: string; size?: string; chunks?: number; category?: string }>>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const { setLoading } = useLoading();
 

  const fetchDocuments = async () => {
    setLoadingDocuments(true);
    setLoading(true);
    setDocumentsError(null);
    try {
      const res = await fetch('http://127.0.0.1:8000/documents/get-documents');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        const mapped = (data as any[]).map((it) => ({
          id: it?.id ?? it?.document_id ?? it?.pk ?? String(it),
          name: it?.name ?? it?.title ?? it?.file_name ?? it?.filename ?? it?.file ?? 'Untitled',
          status: it?.status ?? 'processed',
          uploadedAt: it?.uploaded_at ?? it?.uploadedAt ?? it?.created_at ?? it?.createdAt ?? '',
          size: it?.size ?? it?.file_size ?? '',
          chunks: typeof it?.chunks === 'number' ? it.chunks : Number(it?.chunks) || 0,
          category: it?.category_name ?? it?.category ?? (typeof it?.category_id !== 'undefined' ? String(it?.category_id) : ''),
        }));
        setDocuments(mapped);
      } else {
        setDocuments([]);
        setDocumentsError('Unexpected response format');
      }
    } catch (err: any) {
      setDocumentsError(err?.message ?? 'Failed to fetch documents');
      setDocuments([]);
    } finally {
      setLoadingDocuments(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

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

  const formatSizeMb = (size: any) => {
    if (size == null || size === '') return '-';
    // If already a string with unit
    if (typeof size === 'string') {
      const s = size.trim();
      const numMatch = s.match(/[-+]?\d*\.?\d+/);
      const unitMatch = s.match(/([a-zA-Z]+)/);
      const num = numMatch ? parseFloat(numMatch[0]) : NaN;
      const unit = unitMatch ? unitMatch[0].toLowerCase() : '';
      if (!isNaN(num) && unit) {
        if (unit.startsWith('g')) return `${(num * 1024).toFixed(1)} Mb`;
        if (unit.startsWith('m')) return `${num.toFixed(1)} Mb`;
        if (unit.startsWith('k')) return `${(num / 1024).toFixed(1)} Mb`;
        if (unit === 'b' || unit === 'bytes') return `${(num / (1024 * 1024)).toFixed(1)} Mb`;
      }
      // If string contains no unit but is numeric
      if (!isNaN(num)) return `${(num / (1024 * 1024)).toFixed(1)} Mb`;
      return s;
    }

    // If numeric, assume bytes
    if (typeof size === 'number') {
      return `${(size / (1024 * 1024)).toFixed(1)} Mb`;
    }

    return String(size);
  };

  const getCategoryName = (cat: any) => {
    if (cat == null || cat === '') return '-';
    // if categories list is available, try to resolve id to name
    const found = categories.find((c) => String(c.id) === String(cat));
    if (found) return found.name;
    // otherwise, return the provided value (could already be a name)
    return String(cat);
  };

  const filteredDocuments = documents.filter((doc) => {
    const query = searchQuery.toLowerCase();
    const nameMatch = doc.name?.toLowerCase().includes(query) ?? false;
    const categoryMatch = getCategoryName(doc.category).toLowerCase().includes(query);
    const statusMatch = doc.status?.toLowerCase().includes(query) ?? false;
    const searchPasses = nameMatch || categoryMatch || statusMatch;

    // Apply status filter
    const statusPasses = !filterStatus || doc.status === filterStatus;

    // Apply category filter
    const categoryPasses = !filterCategory || String(doc.category) === String(filterCategory);

    return searchPasses && statusPasses && categoryPasses;
  }).sort((a, b) => {
    let compareVal = 0;
    if (sortBy === 'name') {
      compareVal = (a.name || '').localeCompare(b.name || '');
    } else {
      // Sort by date
      const dateA = new Date(a.uploadedAt || 0).getTime();
      const dateB = new Date(b.uploadedAt || 0).getTime();
      compareVal = dateA - dateB;
    }
    return sortOrder === 'asc' ? compareVal : -compareVal;
  });

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const form = new FormData();
      form.append('file', selectedFile);
      form.append('file_name', fileName);
      form.append('description', description);
      form.append('category_id', category); 

      console.log('Uploading document:', {
        name: fileName,
        description,
        category,
        file: selectedFile.name,
      });

      const res = await fetch('http://127.0.0.1:8000/documents/create', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data = await res.json().catch(() => null);
      setUploadSuccess('Upload successful');

      // Optionally handle returned data (e.g., new document id)
      console.log('Upload response:', data);

      // Reset form but keep modal open for user confirmation
      setFileName('');
      setCategory('');
      setSelectedFile(null);

      // Refresh documents list so the newly uploaded document appears
      try {
        await fetchDocuments();
      } catch (e) {
        // Ignore - fetchDocuments handles its own errors
      }
    } catch (err: any) {
      setUploadError(err?.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (id: string | number, filename?: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/documents/${id}/download`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json().catch(() => null);
      const url = data?.url ?? data;
      if (!url) throw new Error('No download URL returned');
      
      const fileRes = await fetch(url);
      if (!fileRes.ok) throw new Error(`HTTP ${fileRes.status}`);
      const blob = await fileRes.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      if (filename) {
        link.download = filename;
      }
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      setDocumentsError(err?.message ?? 'Failed to download document');
    }
  };

  const handleDelete = async (id: string | number) => {
    const ok = window.confirm('Are you sure you want to delete this document?');
    if (!ok) return;
    setDeletingId(id);
    setDocumentsError(null);
    try {
      const res = await fetch(`http://127.0.0.1:8000/documents/delete/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      // refresh documents list
      await fetchDocuments();
    } catch (err: any) {
      setDocumentsError(err?.message ?? 'Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      setCategoriesError(null);
      try {
        const res = await fetch('http://127.0.0.1:8000/categories/list');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();


setCategories(data);
        // Normalize response to array of category objects with id and name
        if (Array.isArray(data)) {
          if (data.every((i) => typeof i === 'string')) {
            // If strings, convert to objects with id and name
            setCategories(data.map((cat: string, idx: number) => ({ id: idx, name: cat })));
          } else {
            // Map objects with `id`/`name` or `id`/`title` fields
            const mapped = (data as any[]).map((it) => ({
              id: it?.id ?? it?.category_id ?? String(it),
              name: it?.name ?? it?.title ?? String(it),
            }));
            setCategories(mapped);
          }
        } else {
          setCategories([]);
          setCategoriesError('Unexpected response format');
        }
      } catch (err: any) {
        setCategoriesError(err?.message ?? 'Failed to fetch categories');
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="pt-8 space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-end">
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
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Total Documents</p>
          <p style={{ color: 'var(--foreground)' }} className="text-2xl font-semibold">{documents.length}</p>
        </Card>
        <Card className="p-6 border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Processed</p>
          <p style={{ color: 'var(--foreground)' }} className="text-2xl font-semibold">
            {documents.filter((d) => d.status === 'processed').length}
          </p>
        </Card>
        <Card className="p-6 border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Processing</p>
          <p style={{ color: 'var(--foreground)' }} className="text-2xl font-semibold">
            {documents.filter((d) => d.status === 'processing').length}
          </p>
        </Card>
        <Card className="p-6 border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Total Chunks</p>
          <p style={{ color: 'var(--foreground)' }} className="text-2xl font-semibold">
            {documents.reduce((sum, d) => sum + (d.chunks || 0), 0).toLocaleString()}
          </p>
        </Card>
      </div>

      {/* Search and filters */}
      <Card className="p-6 border-gray-200">
        <div className="space-y-4">
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
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setShowFilters(!showFilters)}
            >
              Filter
            </Button>
            <Select value={sortBy} onValueChange={(val: string) => setSortBy(val as 'name' | 'date')}>
              <SelectTrigger className="w-[180px] rounded-xl">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort by Date</SelectItem>
                <SelectItem value="name">Sort Alphabetically</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
            >
              <ArrowUpDown className="w-4 h-4" />
            </Button>
          </div>

          {showFilters && (
            <div className="flex items-center gap-4 border-t pt-4">
              <div className="flex-1">
                <Label className="text-sm mb-2 block">Filter by Status</Label>
                <Select value={filterStatus} onValueChange={(val: SetStateAction<string>) => setFilterStatus(val === 'all' ? '' : val)}>
                 
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="processed">Processed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <Label className="text-sm mb-2 block">Filter by Category</Label>
                <Select value={filterCategory} onValueChange={(val: SetStateAction<string>) => setFilterCategory(val === 'all' ? '' : val)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                className="rounded-xl mt-6"
                onClick={() => {
                  setFilterStatus('');
                  setFilterCategory('');
                  setSearchQuery('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Documents table */}
      <Card className="border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="text-left p-6 text-sm text-muted-foreground">Document Name</th>
                <th className="text-left p-6 text-sm text-muted-foreground">Category</th>
                <th className="text-left p-6 text-sm text-muted-foreground">Status</th>
                <th className="text-left p-6 text-sm text-muted-foreground">Chunks</th>
                <th className="text-left p-6 text-sm text-muted-foreground">Size (Mb)</th>
                <th className="text-left p-6 text-sm text-muted-foreground">Upload Date</th>
                <th className="text-left p-6 text-sm text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingDocuments ? (
                <tr>
                  <td className="p-6" colSpan={7}>
                    <div className="text-center text-muted-foreground">Loading documents...</div>
                  </td>
                </tr>
              ) : filteredDocuments.length === 0 ? (
                <tr>
                  <td className="p-6" colSpan={7}>
                    <div className="text-center text-muted-foreground">{documentsError ?? (documents.length === 0 ? 'No documents found' : 'No results match your search')}</div>
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-gray-600" />
                        </div>
                        <span style={{ color: 'var(--foreground)' }} className="text-sm">{doc.name}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <Badge variant="outline" className="rounded-lg">
                        {getCategoryName(doc.category)}
                      </Badge>
                    </td>
                    <td className="p-6">
                      {getStatusBadge(doc.status || '')}
                    </td>
                    <td className="p-6">
                      <span style={{ color: 'var(--foreground)' }} className="text-sm">{doc.chunks}</span>
                    </td>
                    <td className="p-6">
                      <span className="text-gray-600 text-sm">{formatSizeMb(doc.size)}</span>
                    </td>
                    <td className="p-6">
                      <span className="text-gray-600 text-sm">{doc.uploadedAt}</span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDownload(doc.id, doc.name)}
                        >
                          <Download className="w-4 h-4 text-gray-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDelete(doc.id)}
                          disabled={deletingId === doc.id}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4 text-gray-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
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
    uploadSuccess ? (
      <Button
        onClick={() => {
          setIsDialogOpen(false);
          setUploadSuccess(null);
          setUploadError(null);
          setDescription('');
        }}
        className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 rounded-lg"
      >
        <CheckCircle2 className="w-4 h-4 mr-2" />
        OK
      </Button>
    ) : (
      <>
        <Button
          variant="outline"
          onClick={() => {
            setIsDialogOpen(false);
            setFileName('');
            setCategory('');
            setSelectedFile(null);
            setUploadError(null);
            setDescription('');
          }}
          className="rounded-lg"
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          disabled={!fileName || !category || !selectedFile || uploading}
          className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 rounded-lg"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </>
    )
  }
>
  <p className="text-sm text-gray-600">
    Upload a new document to the knowledge base
  </p>

  {uploadSuccess && (
    <div className="rounded-lg bg-green-50 p-4 border border-green-200">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-green-600" />
        <div>
          <p className="text-sm font-medium text-green-900">Success!</p>
          <p className="text-sm text-green-700">{uploadSuccess}</p>
        </div>
      </div>
    </div>
  )}

  {uploadError && (
    <div className="rounded-lg bg-red-50 p-4 border border-red-200">
      <div className="flex items-center gap-3">
        <XCircle className="w-5 h-5 text-red-600" />
        <div>
          <p className="text-sm font-medium text-red-900">Error</p>
          <p className="text-sm text-red-700">{uploadError}</p>
        </div>
      </div>
    </div>
  )}

  {/* File Name */}
  <div className="space-y-2">
    <Label htmlFor="filename">File Name</Label>
    <Input
      id="filename"
      value={fileName}
      onChange={(e) => setFileName(e.target.value)}
      className="rounded-lg border border-gray-300 dark:border-gray-500 bg-input-background dark:bg-input/30"
    />
  </div>

  {/* Description */}
  <div className="space-y-2">
    <Label htmlFor="description">Description</Label>
    <Textarea
      id="description"
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      className="min-h-[80px] rounded-lg border border-gray-300 dark:border-gray-500 bg-input-background dark:bg-input/30"
    />
  </div>

  {/* Category */}
  <div className="space-y-2">
    <Label>Category</Label>
    <Select value={category} onValueChange={setCategory}>
      <SelectTrigger className="rounded-lg border border-gray-300 dark:border-gray-500 bg-input-background dark:bg-input/30">
        <SelectValue placeholder="Select a category" />
      </SelectTrigger>
      <SelectContent>
        {loadingCategories ? (
          <SelectItem value="loading" disabled>
            Loading...
          </SelectItem>
        ) : categories.length > 0 ? (
          categories.map((cat) => (
            <SelectItem key={cat.id} value={String(cat.id)}>
              {cat.name}
            </SelectItem>
          ))
        ) : (
          <SelectItem value="" disabled>
            {categoriesError ? `Error: ${categoriesError}` : 'No categories available'}
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  </div>

  {/* File Upload */}
  <div className="space-y-2">
    <Label>Select File</Label>
    <div className="border-2 border-dashed rounded-lg p-6 text-center border-gray-300 dark:border-gray-500">
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
