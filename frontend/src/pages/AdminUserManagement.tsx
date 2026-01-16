import { useEffect, useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Search, MoreVertical, UserCircle2 } from 'lucide-react';

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

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setUsersError(null);
    try {
      const res = await fetch('http://127.0.0.1:8000/graduates/list');
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
        </div>
      </Card>

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
                <tr>
                  <td className="p-6" colSpan={7}>
                    <div className="text-center text-muted-foreground">
                      Loading users...
                    </div>
                  </td>
                </tr>
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
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <UserCircle2 className="w-5 h-5 text-gray-600" />
                        </div>
                        <span
                          style={{ color: 'var(--foreground)' }}
                          className="text-sm"
                        >
                          {user.firstName || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span
                        style={{ color: 'var(--foreground)' }}
                        className="text-sm"
                      >
                        {user.lastName || '-'}
                      </span>
                    </td>
                    <td className="p-6">
                      <Badge variant="outline" className="rounded-lg">
                        {user.role || 'Graduate'}
                      </Badge>
                    </td>
                    <td className="p-6">
                      <span className="text-gray-600 text-sm">
                        {user.email || '-'}
                      </span>
                    </td>
                    <td className="p-6">
                      <span className="text-gray-600 text-sm">
                        {user.phone || '-'}
                      </span>
                    </td>
                    <td className="p-6">
                      <span className="text-gray-600 text-sm">
                        {user.progress ?? '-'}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="More actions"
                        >
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
    </div>
  );
}
