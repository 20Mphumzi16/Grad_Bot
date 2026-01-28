import { createBrowserRouter, redirect } from "react-router";
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
import ActivateAccount from "../pages/ActivateAccount";

function getRoleFromToken(token: string | null): string | null {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    const payload = JSON.parse(json);

    return (
      payload.role ||
      payload.user_role ||
      (Array.isArray(payload.roles) ? payload.roles[0] : null) ||
      null
    );
  } catch {
    return null;
  }
}

const requireRole =
  (allowedRole: string, loginPath: string) => () => {
    if (typeof window === "undefined") {
      return null;
    }

    const token = localStorage.getItem("token");
    const role = getRoleFromToken(token);

    if (!token) {
      return redirect(loginPath);
    }

    if (role !== allowedRole) {
      sessionStorage.setItem(
        "auth_error",
        "Unauthorized: you don't have permission to access that page."
      );
      localStorage.clear();
      return redirect("/");
    }

    return null;
  };

const adminLoader = requireRole("Admin", "/admin/login");
const studentLoader = requireRole("Graduate", "/student/login");

export const router = createBrowserRouter([
  {
    path: "/",
    Component: HomePage,
  },
  {
    path: "/activate-account",
    Component: ActivateAccount,
  },
  {
    path: "/admin/login",
    Component: AdminLogin,
  },
  {
    path: "/admin",
    Component: AdminLayout,
    loader: adminLoader,
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
    loader: studentLoader,
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
