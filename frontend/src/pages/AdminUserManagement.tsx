import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CustomModal } from '../components/ui/custom-modal';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { useLoading } from '../components/ui/loading';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Label } from '../components/ui/label';
import { Search, MoreVertical, UserCircle2, AlertCircle, Plus } from 'lucide-react';

type GraduateUser = {
  id: string | number;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  phone: string;
  progress?: string | number | null;
};

export function AdminUserManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<GraduateUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [openMenuUserId, setOpenMenuUserId] = useState<string | number | null>(null);
  const [confirmUserId, setConfirmUserId] = useState<string | number | null>(null);
  const [createForm, setCreateForm] = useState<{
    firstName: string;
    lastName: string;
    role: string;
    email: string;
    phone: string;
    password: string;
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
      const res = await fetch(`http://127.0.0.1:8000/graduates/list?t=${new Date().getTime()}`);
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
      } else {
        setUsers([]);
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
      const timeoutId = setTimeout(() => {
        setLoading(false);
      }, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [loadingUsers, setLoading]);

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    return (
      fullName.includes(query) ||
      user.role.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.phone.toLowerCase().includes(query)
    );
  });

  const handleDelete = async (id: string | number) => {
    setLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/graduates/${id}`, {
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

  const handleCreate = async () => {
    if (!createForm) return;
    setLoading(true);
    setUsersError(null);
    try {
      const res = await fetch('http://127.0.0.1:8000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: createForm.email,
          password: createForm.password,
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
      const res = await fetch('http://127.0.0.1:8000/auth/update', {
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
      await fetchUsers();
      setEditingUser(null);
      setEditForm(null);
    } catch (err: any) {
      setUsersError(err?.message ?? 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

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
                  password: '',
                })
              }
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </div>
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
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <UserCircle2 className="w-5 h-5 text-gray-600" />
                        </div>
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
                        {user.progress ?? '-'}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <div className="relative inline-block">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="More actions"
                            onClick={() =>
                              setOpenMenuUserId((current) =>
                                current === user.id ? null : user.id
                              )
                            }
                          >
                            <MoreVertical className="w-4 h-4 text-gray-600" />
                          </Button>
                          {openMenuUserId === user.id && (
                            <div
                              className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-28 rounded-md border bg-white shadow-lg z-50"
                            >
                              <button
                                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                                type="button"
                                style={{ color: '#000000' }}
                                onClick={() => openEditModal(user)}
                              >
                                Edit
                              </button>
                              <button
                                className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                type="button"
                                onClick={() => {
                                  setOpenMenuUserId(null);
                                  setConfirmUserId(user.id);
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
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
        zIndex={2147483601}
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
              <Input
                id="newRole"
                value={createForm.role}
                onChange={(e) =>
                  setCreateForm((prev) =>
                    prev
                      ? { ...prev, role: e.target.value }
                      : prev
                  )
                }
              />
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
            <div className="space-y-1">
              <Label htmlFor="newPassword">Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={createForm.password}
                onChange={(e) =>
                  setCreateForm((prev) =>
                    prev
                      ? { ...prev, password: e.target.value }
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
        zIndex={2147483601}
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
              <Input
                id="role"
                value={editForm.role}
                onChange={(e) =>
                  setEditForm((prev) =>
                    prev
                      ? { ...prev, role: e.target.value }
                      : prev
                  )
                }
              />
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
    </div>
  );
}
