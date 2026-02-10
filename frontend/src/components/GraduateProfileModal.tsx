import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { CustomModal } from './ui/custom-modal';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  MapPin, 
  Mail, 
  Phone, 
  Linkedin, 
  Github, 
  Calendar, 
  Building2,
  Briefcase,
  X
} from 'lucide-react';
import { API_BASE_URL } from '../utils/config';

export interface GraduateProfile {
  id: string | number;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  phone: string;
  avatar_url?: string | null;
  bio?: string;
  interests?: string;
  linkedin_link?: string;
  github_link?: string;
  department?: string;
  branch?: string; // location
  start_date?: string;
  emp_no?: string | number;
  skills?: string[];
}

interface GraduateProfileModalProps {
  user: GraduateProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export function GraduateProfileModal({ user, isOpen, onClose }: GraduateProfileModalProps) {
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);

  if (!user) return null;

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  const firstInitial = user.firstName ? user.firstName[0] : '';
  const lastInitial = user.lastName ? user.lastName[0] : '';

  const resolveAvatarUrl = (url: string | null | undefined) => {
    if (!url) return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    if (trimmed.startsWith('/')) return `${API_BASE_URL}${trimmed}`;
    return `${API_BASE_URL}/${trimmed}`;
  };

  const avatarUrl = resolveAvatarUrl(user.avatar_url);

  return (
    <>
      <CustomModal
        open={isOpen}
        onClose={onClose}
        title="" 
        className="w-full max-w-xl !p-0 overflow-hidden flex flex-col max-h-[85vh] mx-4"
        contentClassName="flex-1 min-h-0 relative flex flex-col"
        overlayOpacity={0.5}
        overlayBlur={4}
        showCloseButton={true}
      >
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Banner */}
          <div className="h-32 bg-gradient-to-r from-blue-600 to-teal-500 w-full shrink-0"></div>
          
          {/* Profile Header Content */}
          <div className="px-6 pb-6">
            <div className="relative flex justify-between items-end -mt-12 mb-4">
              <div className="relative group cursor-pointer" onClick={() => setIsImagePreviewOpen(true)}>
                <Avatar className="w-24 h-24 border-4 border-[var(--card)] shadow-md transition-transform transform group-hover:scale-105 bg-white">
                  <AvatarImage src={avatarUrl || undefined} className="object-cover" />
                  <AvatarFallback className="text-2xl bg-blue-100 text-blue-700">
                    {firstInitial}{lastInitial}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex gap-2 mb-2">
                 {/* Action buttons could go here */}
              </div>
            </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-foreground">{fullName}</h2>
            <p className="text-lg text-muted-foreground font-medium">{user.role}</p>
          </div>

          {/* Bio Section */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">About</h3>
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
              {user.bio || "No bio available."}
            </p>
          </div>

          {/* Programme Information */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Programme Information</h3>
            <div className="space-y-2">
              {user.department && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-medium text-foreground">Department</span>
                    <span>{user.department}</span>
                  </div>
                </div>
              )}
              {user.branch && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-medium text-foreground">Branch</span>
                    <span>{user.branch}</span>
                  </div>
                </div>
              )}
              {user.start_date && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500 shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-medium text-foreground">Start Date</span>
                    <span>{new Date(user.start_date).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Skills */}
          {user.skills && user.skills.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {user.skills.map((skill, i) => (
                  <Badge key={i} variant="outline" className="px-3 py-1 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Contact & Links */}
          <div className="mt-6 flex flex-col gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Contact Info</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <a href={`mailto:${user.email}`} className="hover:text-primary truncate transition-colors">
                    {user.email}
                  </a>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <a href={`tel:${user.phone}`} className="hover:text-primary transition-colors">
                      {user.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Social & Links</h3>
              <div className="space-y-2">
                {user.linkedin_link ? (
                  <a 
                    href={user.linkedin_link.startsWith('http') ? user.linkedin_link : `https://${user.linkedin_link}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors group p-2 rounded-lg hover:bg-secondary/50 -ml-2"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-500/20">
                      <Linkedin className="w-4 h-4" />
                    </div>
                    <span className="font-medium">LinkedIn Profile</span>
                  </a>
                ) : (
                    <div className="text-sm text-muted-foreground italic py-2">No LinkedIn profile</div>
                )}
                
                {user.github_link ? (
                  <a 
                    href={user.github_link.startsWith('http') ? user.github_link : `https://${user.github_link}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors group p-2 rounded-lg hover:bg-secondary/50 -ml-2"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-500/10 flex items-center justify-center text-gray-600 dark:text-gray-400 shrink-0 group-hover:bg-gray-500/20">
                      <Github className="w-4 h-4" />
                    </div>
                    <span className="font-medium">GitHub Profile</span>
                  </a>
                ) : (
                    <div className="text-sm text-muted-foreground italic py-2">No GitHub profile</div>
                )}
              </div>
            </div>
          </div>

          {/* Interests */}
          {user.interests && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Areas of Interest</h3>
              <div className="flex flex-wrap gap-2">
                {user.interests.split(',').map((interest, i) => (
                  <Badge key={i} variant="secondary" className="px-3 py-1 bg-secondary text-secondary-foreground hover:bg-secondary/80">
                    {interest.trim()}

                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      </CustomModal>

      {/* Image Preview Overlay */}
      {isImagePreviewOpen && createPortal(
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setIsImagePreviewOpen(false)}
        >
          <div className="relative max-w-4xl max-h-screen w-full flex items-center justify-center">
            <button
              onClick={() => setIsImagePreviewOpen(false)}
              className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={fullName}
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()} 
              />
            ) : (
               <div 
                 className="w-64 h-64 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-6xl font-bold border-4 border-white select-none"
                 onClick={(e) => e.stopPropagation()}
               >
                 {firstInitial}{lastInitial}
               </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
