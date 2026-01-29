import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useClickOutside } from '../hooks/use-click-outside';
import { CustomModal } from '../components/ui/custom-modal';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { useLoading } from '../components/ui/loading';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Search, MoreVertical, UserCircle2, AlertCircle, Plus, Filter } from 'lucide-react';
import { API_BASE_URL } from '../utils/config';

type GraduateUser = {
  id: string | number;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  phone: string;
  progress?: string | number | null;
};

function UserActionMenu({ 
  user, 
  isOpen, 
  onToggle, 
  onClose,
  onEdit, 
  onDelete 
}: {
  user: GraduateUser;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onEdit: (user: GraduateUser) => void;
  onDelete: (id: string | number) => void;
}) {
  const ref = useClickOutside<HTMLDivElement>(() => onClose(), isOpen);

  return (
    <div className="relative inline-block" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        title="More actions"
        onClick={(e) => {
            e.stopPropagation();
            onToggle();
        }}
      >
        <MoreVertical className="w-4 h-4 text-gray-600" />
      </Button>
      {isOpen && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-28 rounded-md border bg-white shadow-lg z-50">
          <button
            className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
            type="button"
            style={{ color: '#000000' }}
            onClick={(e) => {
                e.stopPropagation();
                onEdit(user);
                onClose();
            }}
          >
            Edit
          </button>
          <button
            className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(user.id);
              onClose();
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function AdminUserManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterRole, setFilterRole] = useState('all');
  const [users, setUsers] = useState<GraduateUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [openMenuUserId, setOpenMenuUserId] = useState<string | number | null>(null);
  const [confirmUserId, setConfirmUserId] = useState<string | number | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<(string | number)[]>([]);
  const [createForm, setCreateForm] = useState<{
    firstName: string;
    lastName: string;
    role: string;
    email: string;
    phone: string;
  } | null>(null);
  const [editingUser, setEditingUser] = useState<GraduateUser | null>(null);
  const [editForm, setEditForm] = useState<{
    firstName: string;
    lastName: string;
    role: string;
    email: string;
    phone: string;
  } | null>(null);
  const { setLoading } = useLoading();

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setLoading(true);
    setUsersError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/graduates/list?t=${new Date().getTime()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        const mapped: GraduateUser[] = (data as any[]).map((it) => ({
          id: it?.id ?? it?.graduate_id ?? it?.pk ?? String(it),
          firstName: it?.first_name ?? it?.firstName ?? it?.name ?? '',
          lastName: it?.last_name ?? it?.lastName ?? '',
          role: it?.role ?? it?.user_role ?? 'Graduate',
          email: it?.email ?? '',
          phone: it?.phone ?? it?.phone_number ?? '',
          progress: it?.progress ?? null,
        }));
        setUsers(mapped);
        setSelectedUserIds([]);
      } else {
        setUsers([]);
        setSelectedUserIds([]);
        setUsersError('Unexpected response format');
      }
    } catch (err: any) {
      setUsersError(err?.message ?? 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!loadingUsers) {
      // Small delay to ensure the table has fully rendered the data
      // before removing the global loader overlay.
      const timeoutId = setTimeout(() => {
        setLoading(false);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [loadingUsers, setLoading]);

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(query) ||
      user.role.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.phone.toLowerCase().includes(query);
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });



  const handleDelete = async (id: string | number) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/graduates/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchUsers();
    } catch (err: any) {
      setUsersError(err?.message ?? 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (users.length === 0) return;
    setLoading(true);
    setUsersError(null);
    try {
      const ids = users.map((user) => user.id);
      for (const id of ids) {
        const res = await fetch(`${API_BASE_URL}/graduates/${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(text || `HTTP ${res.status}`);
        }
      }
      await fetchUsers();
    } catch (err: any) {
      setUsersError(err?.message ?? 'Failed to delete users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedUserIds.length === 0) return;
    setLoading(true);
    setUsersError(null);
    try {
      const ids = selectedUserIds;
      for (const id of ids) {
        const res = await fetch(`${API_BASE_URL}/graduates/${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(text || `HTTP ${res.status}`);
        }
      }
      setSelectedUserIds([]);
      await fetchUsers();
    } catch (err: any) {
      setUsersError(err?.message ?? 'Failed to delete users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm) return;
    setLoading(true);
    setUsersError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: createForm.email,
          first_name: createForm.firstName,
          last_name: createForm.lastName,
          role: createForm.role,
          phone: createForm.phone || '',
        }),
      });
      if (!res.ok) {
        let message = `HTTP ${res.status}`;
        try {
          const data = await res.json();
          if (data?.detail) {
            message = Array.isArray(data.detail)
              ? data.detail[0]?.msg ?? message
              : data.detail;
          }
        } catch {
        }
        throw new Error(message);
      }
      await fetchUsers();
      setCreateForm(null);
    } catch (err: any) {
      setUsersError(err?.message ?? 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (user: GraduateUser) => {
    setEditingUser(user);
    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role || 'Graduate',
      email: user.email || '',
      phone: user.phone || '',
    });
    setOpenMenuUserId(null);
  };

  const handleUpdate = async () => {
    if (!editingUser || !editForm) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: String(editingUser.id),
          email: editForm.email,
          role: editForm.role,
          first_name: editForm.firstName,
          last_name: editForm.lastName,
          phone: editForm.phone || null,
          department: null,
          branch: null,
          start_date: null,
          bio: null,
          linkedin_link: null,
          github_link: null,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      const updatedUser: GraduateUser = {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        role: data.role,
        email: data.email,
        phone: data.phone,
        progress: data.progress ?? null,
      };
      
      setUsers(prev => prev.map(u => String(u.id) === String(updatedUser.id) ? updatedUser : u));
      
      setEditingUser(null);
      setEditForm(null);
    } catch (err: any) {
      setUsersError(err?.message ?? 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const hasSelectedUsers = selectedUserIds.length > 0;

  return (
    <div className="pt-8 space-y-8">
      <Card className="p-6 border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <div className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-primary text-primary-foreground">
              <UserCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">
                {filteredUsers.length}
              </span>
            </div>
            <Button
              className="rounded-xl"
              onClick={() =>
                setCreateForm({
                  firstName: '',
                  lastName: '',
                  role: 'Graduate',
                  email: '',
                  phone: '',
                })
              }
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => setConfirmDeleteAll(true)}
              disabled={filteredUsers.length === 0}
            >
              {hasSelectedUsers ? 'Delete' : 'Delete all'}
            </Button>
          </div>
        </div>
        {showFilters && (
          <div className="flex items-center gap-4 border-t pt-4 mt-4">
            <div className="flex-1">
              <Label className="text-sm mb-2 block">Filter by Role</Label>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="Graduate">Graduate</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              className="rounded-xl mt-6"
              onClick={() => {
                setFilterRole('all');
                setSearchQuery('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </Card>
      
      {usersError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{usersError}</AlertDescription>
        </Alert>
      )}

      <Card className="border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="text-left p-6 text-sm text-muted-foreground" />
                <th className="text-left p-6 text-sm text-muted-foreground">
                  Name
                </th>
                <th className="text-left p-6 text-sm text-muted-foreground">
                  Last Name
                </th>
                <th className="text-left p-6 text-sm text-muted-foreground">
                  Role
                </th>
                <th className="text-left p-6 text-sm text-muted-foreground">
                  Email Address
                </th>
                <th className="text-left p-6 text-sm text-muted-foreground">
                  Phone
                </th>
                <th className="text-left p-6 text-sm text-muted-foreground">
                  Progress
                </th>
                <th className="text-left p-6 text-sm text-muted-foreground">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loadingUsers ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <Skeleton className="h-3 w-24" />
                    </td>
                    <td className="p-6">
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </td>
                    <td className="p-6">
                      <Skeleton className="h-3 w-40" />
                    </td>
                    <td className="p-6">
                      <Skeleton className="h-3 w-32" />
                    </td>
                    <td className="p-6">
                      <Skeleton className="h-3 w-16" />
                    </td>
                    <td className="p-6">
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td className="p-6" colSpan={7}>
                    <div className="text-center text-muted-foreground">
                      {usersError ??
                        (users.length === 0
                          ? 'No users found'
                          : 'No results match your search')}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100 hover:bg-white hover:text-black"
                  >
                    <td className="p-6">
                      <Checkbox
                        checked={selectedUserIds.includes(user.id)}
                        onCheckedChange={(checked) =>
                          setSelectedUserIds((prev) => {
                            const isChecked = checked === true;
                            if (isChecked) {
                              if (prev.includes(user.id)) return prev;
                              return [...prev, user.id];
                            }
                            return prev.filter((id) => id !== user.id);
                          })
                        }
                        aria-label="Select user"
                      />
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <span className="text-sm">
                          {user.firstName || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="text-sm">
                        {user.lastName || '-'}
                      </span>
                    </td>
                    <td className="p-6">
                      <Badge variant="outline" className="rounded-lg">
                        {user.role || 'Graduate'}
                      </Badge>
                    </td>
                    <td className="p-6">
                      <span className="text-sm">
                        {user.email || '-'}
                      </span>
                    </td>
                    <td className="p-6">
                      <span className="text-sm">
                        {user.phone || '-'}
                      </span>
                    </td>
                    <td className="p-6">
                      <span className="text-sm">
                        {user.progress != null ? `${user.progress}%` : '-'}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <UserActionMenu
                          user={user}
                          isOpen={openMenuUserId === user.id}
                          onToggle={() =>
                            setOpenMenuUserId((current) =>
                              current === user.id ? null : user.id
                            )
                          }
                          onClose={() => setOpenMenuUserId(null)}
                          onEdit={openEditModal}
                          onDelete={(id) => setConfirmUserId(id)}
                        />
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
        open={createForm != null}
        onClose={() => setCreateForm(null)}
        title="Add user"
        overlayOpacity={0}
        overlayBlur={0}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setCreateForm(null)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate}>
              Create
            </Button>
          </>
        }
      >
        {createForm && (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="newFirstName">First name</Label>
              <Input
                id="newFirstName"
                value={createForm.firstName}
                onChange={(e) =>
                  setCreateForm((prev) =>
                    prev
                      ? { ...prev, firstName: e.target.value }
                      : prev
                  )
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="newLastName">Last name</Label>
              <Input
                id="newLastName"
                value={createForm.lastName}
                onChange={(e) =>
                  setCreateForm((prev) =>
                    prev
                      ? { ...prev, lastName: e.target.value }
                      : prev
                  )
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="newRole">Role</Label>
              <Select
                value={createForm.role}
                onValueChange={(val) =>
                  setCreateForm((prev) =>
                    prev ? { ...prev, role: val } : prev
                  )
                }
              >
                <SelectTrigger id="newRole">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Graduate">Graduate</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="newEmail">Email</Label>
              <Input
                id="newEmail"
                type="email"
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm((prev) =>
                    prev
                      ? { ...prev, email: e.target.value }
                      : prev
                  )
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="newPhone">Phone</Label>
              <Input
                id="newPhone"
                value={createForm.phone}
                onChange={(e) =>
                  setCreateForm((prev) =>
                    prev
                      ? { ...prev, phone: e.target.value }
                      : prev
                  )
                }
              />
            </div>
          </div>
        )}
      </CustomModal>
      <CustomModal
        open={editingUser != null && editForm != null}
        onClose={() => {
          setEditingUser(null);
          setEditForm(null);
        }}
        title="Edit user"
        overlayOpacity={0}
        overlayBlur={0}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setEditingUser(null);
                setEditForm(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate}>
              Update
            </Button>
          </>
        }
      >
        {editForm && (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                value={editForm.firstName}
                onChange={(e) =>
                  setEditForm((prev) =>
                    prev
                      ? { ...prev, firstName: e.target.value }
                      : prev
                  )
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                value={editForm.lastName}
                onChange={(e) =>
                  setEditForm((prev) =>
                    prev
                      ? { ...prev, lastName: e.target.value }
                      : prev
                  )
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="role">Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(val) =>
                  setEditForm((prev) =>
                    prev ? { ...prev, role: val } : prev
                  )
                }
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Graduate">Graduate</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((prev) =>
                    prev
                      ? { ...prev, email: e.target.value }
                      : prev
                  )
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((prev) =>
                    prev
                      ? { ...prev, phone: e.target.value }
                      : prev
                  )
                }
              />
            </div>
          </div>
        )}
      </CustomModal>
      <CustomModal
        open={confirmUserId != null}
        onClose={() => setConfirmUserId(null)}
        title="Delete this user?"
        overlayOpacity={0}
        overlayBlur={0}
        zIndex={2147483601}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmUserId(null)}>
              No
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                const id = confirmUserId!;
                setConfirmUserId(null);
                await handleDelete(id);
              }}
            >
              Yes
            </Button>
          </>
        }
      >
        <div className="text-sm text-muted-foreground">
          This action will permanently remove the user and related records.
        </div>
      </CustomModal>
      <CustomModal
        open={confirmDeleteAll}
        onClose={() => setConfirmDeleteAll(false)}
        title={hasSelectedUsers ? 'Delete selected users?' : 'Delete all users?'}
        overlayOpacity={0}
        overlayBlur={0}
        zIndex={2147483601}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDeleteAll(false)}>
              No
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                setConfirmDeleteAll(false);
                if (hasSelectedUsers) {
                  await handleDeleteSelected();
                } else {
                  await handleDeleteAll();
                }
              }}
            >
              Yes
            </Button>
          </>
        }
      >
        <div className="text-sm text-muted-foreground">
          {hasSelectedUsers
            ? 'This will permanently remove all selected users.'
            : 'This will permanently remove all users currently listed in the table.'}
        </div>
      </CustomModal>
    </div>
  );
}
