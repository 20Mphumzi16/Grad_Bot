import { useEffect, useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { 
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Camera,
  Save
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { useLoading } from '../components/ui/loading';

export function StudentProfile() {
  const [formData, setFormData] = useState({
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '+1 (555) 123-4567',
    location: 'New York, NY',
    department: 'Engineering',
    startDate: '2024-11-15',
    bio: 'Passionate about technology and innovation. Excited to start my journey in the graduate programme!',
    interests: 'Cloud computing, AI/ML, Software architecture',
    linkedin: 'linkedin.com/in/janesmith',
    github: 'github.com/janesmith',
  });

  const { setLoading } = useLoading();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch('http://127.0.0.1:8000/auth/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) return;
        const data: any = await res.json();

        setFormData((prev) => ({
          ...prev,
          firstName: data.first_name || data.given_name || data.firstName || prev.firstName,
          lastName: data.last_name || data.family_name || data.lastName || prev.lastName,
          email: data.email || prev.email,
          phone: data.phone || prev.phone,
        }));
      } catch {
        // ignore fetch errors silently
      } finally {
        setLoading(false);
      }
    })();
  }, [setLoading]);

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = () => {
    // Mock save functionality
    alert('Profile updated successfully!');
  };

  return (
    <div className="pt-8 space-y-8 max-w-4xl">
      {/* Page header */}
      <div className="flex items-center justify-end">
        <Button 
          onClick={handleSave}
          className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 rounded-xl"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Profile picture section */}
      <Card className="p-6 border-border">
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="w-24 h-24">
              <AvatarImage src="" />
              <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-teal-500 text-white">
                JS
              </AvatarFallback>
            </Avatar>
            <Button 
              size="icon" 
              className="absolute bottom-0 right-0 rounded-full w-8 h-8 bg-white border-2 border-gray-200 hover:bg-gray-50"
            >
              <Camera className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
          <div className="flex-1">
            <h3 style={{ color: 'var(--foreground)' }} className="mb-1">Profile Picture</h3>
            <p style={{ color: 'var(--muted-foreground)' }} className="text-sm mb-3">
              Upload a photo to personalize your profile
            </p>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="rounded-lg">
                Upload Photo
              </Button>
              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                Remove
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Personal Information */}
      <Card className="p-6 border-border">
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" style={{ color: 'var(--foreground)' }}>Last Name</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className="rounded-xl"
            />
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
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" style={{ color: 'var(--foreground)' }}>Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" style={{ color: 'var(--foreground)' }}>Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department" style={{ color: 'var(--foreground)' }}>Department</Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                className="pl-10 rounded-xl"
              />
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
            />
          </div>
        </div>
      </Card>

      {/* Programme Information */}
      <Card className="p-6 border-border">
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
            />
          </div>
        </div>
      </Card>

      {/* Social Links */}
      <Card className="p-6 border-border">
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
            />
          </div>
        </div>
      </Card>

      {/* Preferences */}
      <Card className="p-6 border-border">
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
          className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 rounded-xl"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
