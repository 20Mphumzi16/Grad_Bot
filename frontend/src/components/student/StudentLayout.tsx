import { Outlet } from 'react-router';
import { StudentSidebar } from './StudentSidebar';
import { StudentHeader } from './StudentHeader';

export function StudentLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <StudentHeader />
      <div className="flex">
        <StudentSidebar />
        <main className="flex-1 ml-64 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
