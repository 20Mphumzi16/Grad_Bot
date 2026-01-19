import { createBrowserRouter } from "react-router";
import { HomePage } from "../pages/HomePage";
import { AdminLogin } from "../pages/AdminLogin";
import { AdminDashboard } from "../pages/AdminDashboard";
import { AdminDocuments } from "../pages/AdminDocuments";
import { AdminConversations } from "../pages/AdminConversations";
import { AdminAnalytics } from "../pages/AdminAnalytics";
import { AdminUserManagement } from "../pages/AdminUserManagement";
import { AdminTaskManagement } from "../pages/AdminTaskManagement";
import { AdminSettings } from "../pages/AdminSettings";
import { AdminLayout } from "../components/admin/AdminLayout";
import { StudentLogin } from "../pages/StudentLogin";
import { StudentDashboard } from "../pages/StudentDashboard";
import { StudentChat } from "../pages/StudentChat";
import { StudentProfile } from "../pages/StudentProfile";
import { StudentResources } from "../pages/StudentResources";
import { StudentTimeline } from "../pages/StudentTimeline";
import { StudentDocuments } from "../pages/StudentDocuments";
import { StudentLayout } from "../components/student/StudentLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: HomePage,
  },
  {
    path: "/admin/login",
    Component: AdminLogin,
  },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      {
        index: true,
        Component: AdminDashboard,
      },
      {
        path: "documents",
        Component: AdminDocuments,
      },
      {
        path: "users",
        Component: AdminUserManagement,
      },
      {
        path: "tasks",
        Component: AdminTaskManagement,
      },
      {
        path: "conversations",
        Component: AdminConversations,
      },
      {
        path: "analytics",
        Component: AdminAnalytics,
      },
      {
        path: "settings",
        Component: AdminSettings,
      },
    ],
  },
  {
    path: "/student/login",
    Component: StudentLogin,
  },
  {
    path: "/student",
    Component: StudentLayout,
    children: [
      {
        index: true,
        Component: StudentDashboard,
      },
      {
        path: "chat",
        Component: StudentChat,
      },
      {
        path: "profile",
        Component: StudentProfile,
      },
      {
        path: "resources",
        Component: StudentResources,
      },
      {
        path: "timeline",
        Component: StudentTimeline,
      },
      {
        path: "documents",
        Component: StudentDocuments,
      },
    ],
  },
]);
