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
import { toast } from 'sonner';


const user_data: any = {
  id: '',
  role: '',

}

export function StudentProfile() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
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

  const { loading, setLoading } = useLoading();

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
        user_data.id = data.id;
        user_data.role = data.role;
        console.log('Fetched user data:', data);

        setFormData((prev) => ({
          ...prev,
          firstName: data.first_name || data.given_name || data.firstName || prev.firstName,
          lastName: data.last_name || data.family_name || data.lastName || prev.lastName,
          email: data.email || prev.email,
          phone: data.phone || prev.phone,
          department: data.department || "",
          location: data.branch || "",
          startDate: data.start_date || "",
          bio: data.bio || "",
          interests: data.interests || prev.interests,
          linkedin: data.linkedin_link || "",
          github: data.github_link || "",
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

   const handleSave = async () => {
    setLoading(true);

      try {
        // assign form values into the shared user_data object
        user_data.email = formData.email;
        user_data.first_name = formData.firstName;
        user_data.last_name = formData.lastName;
        user_data.phone = formData.phone;
        user_data.department = formData.department;
        user_data.branch = formData.location;
        user_data.start_date = formData.startDate;
        user_data.bio = formData.bio;
        user_data.interests = formData.interests;
        user_data.linkedin_link = formData.linkedin;
        user_data.github_link = formData.github;

        console.log('Submitting user_data payload:', user_data);

        const token = localStorage.getItem('token');

      const res = await fetch('http://127.0.0.1:8000/auth/update', {
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
    <div className="pt-8 space-y-8 max-w-4xl">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-gray-900 mb-2">My Profile</h1>
            {loading && (
              <div
                role="status"
                aria-label="Loading profile"
                className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"
              />
            )}
          </div>
          <p className="text-gray-600">Manage your personal information and preferences</p>
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
      <Card className="p-6 border-gray-200">
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
              <Camera className="w-4 h-4 text-gray-600" />
            </Button>
          </div>
          <div className="flex-1">
            <h3 className="text-gray-900 mb-1">Profile Picture</h3>
            <p className="text-sm text-gray-600 mb-3">
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
      <Card className="p-6 border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-gray-900">Personal Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className="rounded-xl"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className="rounded-xl"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
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
            <Label htmlFor="phone">Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="pl-10 rounded-xl"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="pl-10 rounded-xl"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                className="pl-10 rounded-xl"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="bio">Bio</Label>
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

      {/* Programme Information */}
      <Card className="p-6 border-gray-200">
        <h3 className="text-gray-900 mb-6">Programme Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
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
            <Label htmlFor="interests">Areas of Interest</Label>
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
      <Card className="p-6 border-gray-200">
        <h3 className="text-gray-900 mb-6">Social Links</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn</Label>
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
            <Label htmlFor="github">GitHub</Label>
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
      <Card className="p-6 border-gray-200">
        <h3 className="text-gray-900 mb-6">Preferences</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Email Notifications</Label>
              <p className="text-sm text-gray-500">Receive email updates about your programme</p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Weekly Digest</Label>
              <p className="text-sm text-gray-500">Get a weekly summary of your progress</p>
            </div>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Milestone Reminders</Label>
              <p className="text-sm text-gray-500">Reminders for upcoming milestones and tasks</p>
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
