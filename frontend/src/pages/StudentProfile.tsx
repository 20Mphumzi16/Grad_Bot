import React, { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { 
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Camera,
  Save,
  Plus,
  Pencil,
  X
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { useLoading } from '../components/ui/loading';
import { toast } from 'sonner';
import { API_BASE_URL } from '../utils/config';
import { CustomModal } from '../components/ui/custom-modal';


const user_data: any = {
  id: '',
  role: '',

}

interface Department {
  id: number;
  name: string;
}

interface Branch {
  id: number;
  name: string;
}

export function StudentProfile() {
  const [avatar_url, setAvatarUrl] = useState<string | null>(null);
  const [uploading_avatar, setUploadingAvatar] = useState<boolean>(false);
  const [deleting_avatar, setDeletingAvatar] = useState<boolean>(false);
  const [avatarVersion, setAvatarVersion] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    emp_no: 0,
    email: '',
    phone: '',
    location: '',
    department: '',
    startDate: '',
    bio: 'Passionate about technology and innovation. Excited to start my journey in the graduate programme!',
    interests: 'Cloud computing, AI/ML, Software architecture',
    linkedin: 'linkedin.com/in/janesmith',
    github: 'github.com/janesmith',
  });
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const { loading, setLoading } = useLoading();


  const getInitials = (firstName: string, lastName: string) => {
    const firstInitial = firstName?.trim()?.[0] ?? '';
    const lastInitial = lastName?.trim()?.[0] ?? '';
    const initials = `${firstInitial}${lastInitial}`.toUpperCase();
    return initials || 'NA';
  };

  const resolveAvatarUrl = (url: string | null) => {
    if (!url) return undefined;
    const trimmed = url.trim();
    if (!trimmed) return undefined;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    if (trimmed.startsWith('/')) return `${API_BASE_URL}${trimmed}`;
    return `${API_BASE_URL}/${trimmed}`;
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }

    const data: any = await res.json();

    user_data.id = data.id;
    user_data.role = data.role;

    setFormData((prev) => {
      const next = {
        ...prev,
        emp_no: data.emp_no || prev.emp_no,
        firstName: data.first_name || data.given_name || data.firstName || prev.firstName,
        lastName: data.last_name || data.family_name || data.lastName || prev.lastName,
        email: data.email || prev.email,
        phone: data.phone || prev.phone,
        department: data.department || '',
        location: data.branch || '',
        startDate: data.start_date || '',
        bio: data.bio || '',
        interests: data.interests || prev.interests,
        linkedin: data.linkedin_link || '',
        github: data.github_link || '',
      };

      window.dispatchEvent(
        new CustomEvent('avatarUpdated', {
          detail: {
            avatar_url: data.avatar_url || null,
            firstName: next.firstName,
            lastName: next.lastName,
          },
        }),
      );

      return next;
    });

    setAvatarUrl(data.avatar_url || null);
    setAvatarVersion((v) => v + 1); // bust any cached avatar images
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [deptRes, branchRes] = await Promise.all([
          fetch(`${API_BASE_URL}/department/get-all`),
          fetch(`${API_BASE_URL}/branch/get-all`)
        ]);

        if (deptRes.ok) {
          const data = await deptRes.json();
          setDepartments(data);
        }
        
        if (branchRes.ok) {
          const data = await branchRes.json();
          setBranches(data);
        }
      } catch (error) {
        console.error("Failed to fetch metadata", error);
      }
    };
    
    fetchMetadata();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    (async () => {
      setLoading(true);
      try {
        await refreshUser();
      } catch {
        // ignore fetch errors silently
      } finally {
        setLoading(false);
      }
    })();
  }, [setLoading]);

  const handleInputChange = (field: string, value: string) => {
    let finalValue = value;
    if (field === 'phone') {
      finalValue = value.replace(/\s/g, '');
      if (finalValue && !/^0\d{9}$/.test(finalValue)) {
        setPhoneError('Phone number must be 10 digits and start with 0');
      } else {
        setPhoneError(null);
      }
    }
    setFormData({ ...formData, [field]: finalValue });
  };

  const handleAvatarUploadClick = () => {
    if (uploading_avatar || deleting_avatar || loading) return;
    fileInputRef.current?.click();
  };

  const handleAvatarFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You must be logged in to upload a profile photo.');
      return;
    }

    const uploadData = new FormData();
    uploadData.append('file', file);

    setUploadingAvatar(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/upload-avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data: any = await res.json();
      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
        setAvatarVersion((v) => v + 1);
        window.dispatchEvent(
          new CustomEvent('avatarUpdated', {
            detail: {
              avatar_url: data.avatar_url,
              firstName: formData.firstName,
              lastName: formData.lastName,
            },
          }),
        );
      }

      // Re-fetch user to ensure UI reflects backend truth (and keeps header in sync).
      await refreshUser();
      toast.success('Profile photo updated.');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to upload profile photo: ${message}`);
    } finally {
      setUploadingAvatar(false);
      // Reset input so the same file can be selected again if needed
      event.target.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You must be logged in to remove a profile photo.');
      return;
    }

    setDeletingAvatar(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/delete-avatar`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      await refreshUser(); // ensures avatar_url becomes null
      toast.success('Profile photo removed.');
    } catch (error) {
      console.error('Error deleting avatar:', error);
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to remove profile photo: ${message}`);
    } finally {
      setDeletingAvatar(false);
    }
  };

   const handleSave = async () => {
    if (!formData.phone || !/^0\d{9}$/.test(formData.phone)) {
      toast.error('Phone number must be 10 digits and start with 0');
      return;
    }

    setLoading(true);

      try {
        // assign form values into the shared user_data object
        user_data.email = formData.email;
        user_data.first_name = formData.firstName;
        user_data.last_name = formData.lastName;
        user_data.phone = formData.phone;
        user_data.department = formData.department;
        user_data.emp_no = formData.emp_no;
        user_data.branch = formData.location;
        user_data.start_date = formData.startDate;
        user_data.bio = formData.bio;
        user_data.interests = formData.interests;
        user_data.linkedin_link = formData.linkedin;
        user_data.github_link = formData.github;

        console.log('Submitting user_data payload:', user_data);

        const token = localStorage.getItem('token');

      const res = await fetch(`${API_BASE_URL}/auth/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(user_data),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      toast.success('Profile updated');
    }
    catch (error) {
      console.error('Error updating profile:', error);
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to update profile: ${message}`);
    }
    finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-8 space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          {loading && (
            <div
              role="status"
              aria-label="Loading profile"
              className="w-5 h-5 mb-1 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"
            />
          )}
          <p className="text-muted-foreground">Manage your personal information and preferences</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 rounded-xl"
        >
          {loading ? (
            <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Profile picture section */}
      <Card className="p-6 border-white/20 bg-gradient-to-br from-[var(--card-gradient-start)] to-[var(--card-gradient-end)] backdrop-blur-sm shadow-sm transition-colors">
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="w-24 h-24">
              <AvatarImage
                src={
                  resolveAvatarUrl(avatar_url)
                    ? `${resolveAvatarUrl(avatar_url)}${resolveAvatarUrl(avatar_url)?.includes('?') ? '&' : '?'}v=${avatarVersion}`
                    : undefined
                }
                onError={() => toast.error('Could not load profile photo.')}
              />
              <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-teal-500 text-white">
                {getInitials(formData.firstName, formData.lastName)}
              </AvatarFallback>
            </Avatar>
            {uploading_avatar && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <Button 
              size="icon" 
              onClick={handleAvatarUploadClick}
              disabled={uploading_avatar || loading}
              className="absolute bottom-0 right-0 rounded-full w-8 h-8 bg-white border-2 border-gray-200 hover:bg-gray-50"
            >
              {uploading_avatar ? (
                <div className="w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarFileChange}
              className="hidden"
            />
          </div>
          <div className="flex-1">
            <h3 style={{ color: 'var(--foreground)' }} className="mb-1">Profile Picture</h3>
            <p style={{ color: 'var(--muted-foreground)' }} className="text-sm mb-3">
              Upload a photo to personalize your profile
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={handleAvatarUploadClick}
                disabled={uploading_avatar || deleting_avatar || loading}
              >
                {uploading_avatar ? 'Uploading...' : 'Upload Photo'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveAvatar}
                disabled={uploading_avatar || deleting_avatar || loading || !avatar_url}
                className="text-red-600 hover:text-red-700"
              >
                {deleting_avatar ? 'Removing...' : 'Remove'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Personal Information */}
      <Card className="p-6 border-white/20 bg-gradient-to-br from-[var(--card-gradient-start)] to-[var(--card-gradient-end)] backdrop-blur-sm shadow-sm transition-colors">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-foreground">Personal Information</h3>
        </div>

        

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
   
   <div className="space-y-2">
            <Label htmlFor="firstName" style={{ color: 'var(--foreground)' }}>First Name</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className="rounded-xl"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" style={{ color: 'var(--foreground)' }}>Last Name</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className="rounded-xl"
              disabled={loading}
            />
          </div>
                <div className="space-y-2">
            <Label htmlFor="emp_no" style={{ color: 'var(--foreground)' }}>Employee ID</Label>
            <Input
              id="emp_no"
              value={formData.emp_no}
              onChange={(e) => handleInputChange('emp_no', e.target.value)}
              className="rounded-xl"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department" style={{ color: 'var(--foreground)' }}>Department</Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
              <Select 
                value={formData.department} 
                onValueChange={(value) => handleInputChange('department', value)}
                disabled={loading}
              >
                <SelectTrigger className="w-full pl-10 rounded-xl">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>


          <div className="space-y-2">
            <Label htmlFor="email" style={{ color: 'var(--foreground)' }}>Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="pl-10 rounded-xl"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" style={{ color: 'var(--foreground)' }} className={phoneError ? 'text-red-500' : ''}>Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`pl-10 rounded-xl ${phoneError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                disabled={loading}
              />
            </div>
            {phoneError && <p className="text-xs text-red-500">{phoneError}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" style={{ color: 'var(--foreground)' }}>Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
              <Select 
                value={formData.location} 
                onValueChange={(value) => handleInputChange('location', value)}
                disabled={loading}
              >
                <SelectTrigger className="w-full pl-10 rounded-xl">
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.name}>{branch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="bio" style={{ color: 'var(--foreground)' }}>Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              className="rounded-xl"
              rows={4}
              placeholder="Tell us about yourself..."
              disabled={loading}
            />
          </div>
        </div>
      </Card>

      <SkillsSection graduateId={user_data.id} />

      {/* Programme Information */}
      <Card className="p-6 border-white/20 bg-gradient-to-br from-[var(--card-gradient-start)] to-[var(--card-gradient-end)] backdrop-blur-sm shadow-sm transition-colors">
        <h3 className="text-foreground mb-6">Programme Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="startDate" style={{ color: 'var(--foreground)' }}>Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className="rounded-xl"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interests" style={{ color: 'var(--foreground)' }}>Areas of Interest</Label>
            <Input
              id="interests"
              value={formData.interests}
              onChange={(e) => handleInputChange('interests', e.target.value)}
              className="rounded-xl"
              placeholder="e.g., Cloud computing, AI/ML"
              disabled={loading}
            />
          </div>
        </div>
      </Card>

      {/* Social Links */}
      <Card className="p-6 bg-gradient-to-br from-[var(--card-gradient-start)] to-[var(--card-gradient-end)] backdrop-blur-sm border-white/20 shadow-sm transition-colors">
        <h3 className="text-foreground mb-6">Social Links</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="linkedin" style={{ color: 'var(--foreground)' }}>LinkedIn</Label>
            <Input
              id="linkedin"
              value={formData.linkedin}
              onChange={(e) => handleInputChange('linkedin', e.target.value)}
              className="rounded-xl"
              placeholder="linkedin.com/in/yourprofile"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="github" style={{ color: 'var(--foreground)' }}>GitHub</Label>
            <Input
              id="github"
              value={formData.github}
              onChange={(e) => handleInputChange('github', e.target.value)}
              className="rounded-xl"
              placeholder="github.com/yourusername"
              disabled={loading}
            />
          </div>
        </div>
      </Card>

      {/* Preferences */}
      <Card className="p-6 border-white/20 bg-gradient-to-br from-[var(--card-gradient-start)] to-[var(--card-gradient-end)] backdrop-blur-sm shadow-sm transition-colors">
        <h3 className="text-foreground mb-6">Preferences</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive email updates about your programme</p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Weekly Digest</Label>
              <p className="text-sm text-muted-foreground">Get a weekly summary of your progress</p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Milestone Reminders</Label>
              <p className="text-sm text-muted-foreground">Reminders for upcoming milestones and tasks</p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
        </div>
      </Card>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-4">
        <Button variant="outline" className="rounded-xl">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 rounded-xl"
        >
          {loading ? (
            <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

type Skill = { id: string; skill_id: number; name: string; source?: string; where_used?: string };
type AvailableSkill = { id: number; name: string };

function SkillsSection({ graduateId }: { graduateId?: string }) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [availableSkills, setAvailableSkills] = useState<AvailableSkill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [skillName, setSkillName] = useState('');
  const [pendingSkills, setPendingSkills] = useState<string[]>([]);
  const [skillSource, setSkillSource] = useState('');
  const [usedIn, setUsedIn] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  
  // Fetch data on mount or when graduateId changes
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
     
      

        // 1. Fetch available skills for suggestions
        let availSkills: AvailableSkill[] = [];
        try {
          const skillsRes = await fetch(`${API_BASE_URL}/skills/get-all`);
          if (skillsRes.ok) {
            const data = await skillsRes.json();
            // Assuming data is [{id: 1, name: "Java"}, ...]
            availSkills = Array.isArray(data) 
              ? data.map((s: any) => ({ id: s.id, name: s.name || s.skill_name }))
              : [];
            setAvailableSkills(availSkills);
          }
        } catch (e) {
          console.error('Failed to fetch skills suggestions:', e);
        }

        // 2. Fetch graduate's existing skills
        if (graduateId) {
          try {
            const gradSkillsRes = await fetch(`${API_BASE_URL}/graduate_skills/get-all/${graduateId}`);
            if (gradSkillsRes.ok) {
              const data = await gradSkillsRes.json();
              // Backend returns graduate_skills rows: { id, graduate_id, skill_id, ... }
              // We need to map skill_id to name using availSkills
              const mappedSkills: Skill[] = Array.isArray(data) ? data.map((item: any) => {
                const foundSkill = availSkills.find(as => as.id === item.skill_id);
                return {
                  id: item.id || crypto.randomUUID(), // graduate_skill entry id
                  skill_id: item.skill_id,
                  name: foundSkill ? foundSkill.name : 'Unknown Skill',
                  source: item.institution || item.source,
                  where_used: item.where_used
                };
              }) : [];
              setSkills(mappedSkills);
            }
          } catch (e) {
            console.error('Failed to fetch graduate skills:', e);
          }
        }

      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [graduateId]);

  const suggestions = availableSkills.map(s => s.name);
  
  const filtered = query.trim() 
    ? suggestions.filter(s => 
        s.toLowerCase().includes(query.toLowerCase()) && 
        !pendingSkills.includes(s) && 
        !skills.some(existing => existing.name.toLowerCase() === s.toLowerCase())
      ).slice(0, 6)
    : [];

  const visible = showAll ? skills : skills.slice(0, 6);

  const openAdd = () => {
    setEditingId(null);
    setSkillName('');
    setPendingSkills([]);
    setSkillSource('');
    setUsedIn([]);
    setQuery('');
    setOpen(true);
  };

  const openEdit = (id: string) => {
    const s = skills.find(x => x.id === id);
    if (!s) return;
    setEditingId(id);
    setSkillName(s.name);
    setPendingSkills([]); 
    setSkillSource(s.source ?? '');
    setUsedIn(s.where_used ? s.where_used.split(',').map(i => i.trim()) : []); 
    setQuery('');
    setOpen(true);
  };

  const addPendingSkill = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    
    // Validate against available skills
    const isValid = availableSkills.some(s => s.name.toLowerCase() === trimmed.toLowerCase());
    if (!isValid) {
      toast.error('Please select a valid skill from the suggestions');
      return;
    }

    if (pendingSkills.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Skill already selected');
      return;
    }
    
    if (skills.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Skill already exists in your profile');
      return;
    }

    setPendingSkills(prev => [...prev, trimmed]);
    setSkillName('');
    setQuery('');
  };

  const removePendingSkill = (name: string) => {
    setPendingSkills(prev => prev.filter(s => s !== name));
  };

  const saveSkill = async () => {
    if (!graduateId) {
      toast.error('User profile not loaded');
      return;
    }

    

    if (editingId) {
      const originalSkill = skills.find(s => s.id === editingId);
      if (!originalSkill) {
        setOpen(false);
        return;
      }

      // Check if skill name corresponds to a valid skill
      const currentSkillObj = availableSkills.find(s => s.name.toLowerCase() === skillName.trim().toLowerCase());
      if (!currentSkillObj) {
        toast.error('Please select a valid skill');
        return;
      }

      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token || ''}`
      };

      // If the skill itself is changed (name changed -> different ID)
      if (currentSkillObj.id !== originalSkill.skill_id) {
         // Delete old and Add new
         try {
           // 1. Delete old
           const delRes = await fetch(`${API_BASE_URL}/graduate_skills/delete/${graduateId}/${originalSkill.skill_id}`, {
             method: 'DELETE',
             headers
           });
           
           if (!delRes.ok) {
             throw new Error('Failed to delete old skill');
           }

           // 2. Add new
           const payload = {
             graduate_id: graduateId,
             skill_id: currentSkillObj.id,
             source: skillSource.trim() || undefined,
             where_used: usedIn.join(', ') || undefined
           };

           const addRes = await fetch(`${API_BASE_URL}/graduate_skills/add`, {
             method: 'POST',
             headers,
             body: JSON.stringify(payload)
           });

           if (addRes.ok) {
             setSkills(prev => prev.map(s => s.id === editingId ? {
               id: s.id, // Keep same frontend ID or generate new? keeping same is fine for UI stability
               skill_id: currentSkillObj.id,
               name: currentSkillObj.name,
               source: payload.source,
               where_used: payload.where_used
             } : s));
             toast.success('Skill updated');
             setOpen(false);
           } else {
             toast.error('Failed to add new skill');
           }
         } catch (e) {
           console.error('Error updating skill:', e);
           toast.error('Error updating skill');
         }
      } else {
         // Same skill, just update details
         try {
            const payload = {
              graduate_id: graduateId,
              skill_id: currentSkillObj.id,
              source: skillSource.trim() || undefined,
              where_used: usedIn.join(', ') || undefined
            };

            const res = await fetch(`${API_BASE_URL}/graduate_skills/update`, {
              method: 'PUT',
              headers,
              body: JSON.stringify(payload)
            });

            if (res.ok) {
              setSkills(prev => prev.map(s => s.id === editingId ? {
                ...s,
                source: payload.source,
                where_used: payload.where_used
              } : s));
              toast.success('Skill updated');
              setOpen(false);
            } else {
              toast.error('Failed to update skill');
            }
         } catch (e) {
            console.error('Error updating skill:', e);
            toast.error('Error updating skill');
         }
      }
      return;
    } else {
      // Add mode
      let skillsToSaveNames = [...pendingSkills];
      if (skillName.trim()) {
        const name = skillName.trim();
        const isValid = availableSkills.some(s => s.name.toLowerCase() === name.toLowerCase());
        if (isValid && !skillsToSaveNames.includes(name) && !skills.some(s => s.name.toLowerCase() === name.toLowerCase())) {
           skillsToSaveNames.push(name);
        }
      }

      if (skillsToSaveNames.length === 0) {
        toast.error('Please add at least one valid skill');
        return;
      }

     

      let successCount = 0;
      for (const name of skillsToSaveNames) {
        const skillObj = availableSkills.find(s => s.name.toLowerCase() === name.toLowerCase());
        if (!skillObj) continue;

        try {
          const payload = {
            graduate_id: graduateId,
            skill_id: skillObj.id,
            source: skillSource.trim() || undefined,
            where_used: usedIn.join(', ') || undefined
          };

          const res = await fetch(`${API_BASE_URL}/graduate_skills/add`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            successCount++;
            // Update local state
            setSkills(prev => [...prev, {
              id: crypto.randomUUID(), // We don't get the new ID back easily unless we read response
              skill_id: skillObj.id,
              name: skillObj.name,
              source: skillSource.trim() || undefined,
              where_used: usedIn.join(', ') || undefined
            }]);
          } else {
            console.error(`Failed to add skill ${name}`);
          }
        } catch (e) {
          console.error(`Error adding skill ${name}:`, e);
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} skill(s) added`);
        setOpen(false);
      } else {
        toast.error('Failed to add skills');
      }
    }
  };

  const removeSkill = async (id: string) => { // id is the graduate_skill entry id (frontend generated or backend)
    // We need skill_id to delete. 
    // Wait, the delete endpoint takes graduate_id and skill_id.
    const skillToRemove = skills.find(s => s.id === id);
    if (!skillToRemove || !graduateId) return;

    try {
  
      
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`${API_BASE_URL}/graduate_skills/delete/${graduateId}/${skillToRemove.skill_id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      });

      if (res.ok) {
        setSkills(prev => prev.filter(s => s.id !== id));
        toast.success('Skill removed');
      } else {
        toast.error('Failed to remove skill');
      }
    } catch (e) {
      console.error('Error removing skill:', e);
      toast.error('Error removing skill');
    }
  };

  const toggleUsedIn = (label: string) => {
    setUsedIn(prev => prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label]);
  };

  return (
    <Card className="p-6 border-white/20 bg-gradient-to-br from-[var(--card-gradient-start)] to-[var(--card-gradient-end)] backdrop-blur-sm shadow-sm transition-colors">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-foreground">Skills</h3>
        </div>
        <Button onClick={openAdd} className="rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          Add
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
           <div className="col-span-full py-8 text-center text-muted-foreground">
             Loading skills...
           </div>
        ) : visible.length === 0 ? (
          <div className="col-span-full py-8 text-center text-muted-foreground border-2 border-dashed rounded-xl">
            No skills added yet. Click "Add" to list your skills.
          </div>
        ) : (
          visible.map(s => (
            <div key={s.id} className="border rounded-xl p-4 flex items-start justify-between">
              <div>
                <p className="font-medium" style={{ color: 'var(--foreground)' }}>{s.name}</p>
                {s.source ? <p className="text-sm text-muted-foreground">{s.source}</p> : null}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s.id)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => removeSkill(s.id)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
      {skills.length > 6 && (
        <button className="mt-4 text-sm text-blue-600 hover:text-blue-700" type="button" onClick={() => setShowAll(v => !v)}>
          {showAll ? 'Show less' : 'Show all skills'}
        </button>
      )}
      <CustomModal
        open={open}
        onClose={() => setOpen(false)}
        title={editingId ? 'Edit Skill' : 'Add Skill'}
        footer={
          <>
            <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="rounded-xl" onClick={saveSkill}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="skill-name" style={{ color: 'var(--foreground)' }}>Skill name</Label>
              <div className="relative">
                <Input
                  id="skill-name"
                  value={skillName}
                  onChange={(e) => {
                    setSkillName(e.target.value);
                    setQuery(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (!editingId) {
                         addPendingSkill(skillName);
                      }
                    }
                  }}
                  className="rounded-xl"
                  placeholder="e.g., Java"
                />
                {filtered.length > 0 && (
                  <div className="absolute z-10 mt-2 w-full rounded-xl border bg-white dark:bg-zinc-950 shadow-lg max-h-48 overflow-y-auto">
                    {filtered.map(s => (
                      <button
                        key={s}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                        type="button"
                        onClick={() => {
                          if (editingId) {
                            setSkillName(s);
                            setQuery('');
                          } else {
                            addPendingSkill(s);
                          }
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {!editingId && pendingSkills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {pendingSkills.map(skill => (
                    <div key={skill} className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
                      <span>{skill}</span>
                      <button 
                        onClick={() => removePendingSkill(skill)}
                        className="hover:text-blue-900 dark:hover:text-blue-100 focus:outline-none"
                        type="button"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="skill-source" style={{ color: 'var(--foreground)' }}>Institution or source (optional)</Label>
              <Input
                id="skill-source"
                value={skillSource}
                onChange={(e) => setSkillSource(e.target.value)}
                className="rounded-xl"
                placeholder="e.g., Cape Peninsula University of Technology"
              />
            </div>
            <div className="space-y-2">
              <Label style={{ color: 'var(--foreground)' }}>Show us where you used this skill (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {['Experience', 'Education', 'Projects','DCX'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleUsedIn(opt)}
                    className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                      usedIn.includes(opt) 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'text-muted-foreground hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
      </CustomModal>
    </Card>
  );
}
