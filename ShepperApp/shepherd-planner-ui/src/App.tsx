import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import MemberDashboard from "./pages/MemberDashboard.tsx";
import MemberMessagesPage from "./pages/MemberMessagesPage.tsx";
import MemberProfilePage from "./pages/MemberProfilePage.tsx";
import CalendarPage from "./pages/CalendarPage.tsx";
import MembersPage from "./pages/MembersPage.tsx";
import EventsPage from "./pages/EventsPage.tsx";
import MessagesPage from "./pages/MessagesPage.tsx";
import SettingsPage from "./pages/SettingsPage.tsx";
import EventDetailPage from "./pages/EventDetailPage.tsx";
import MeetingRequestsPage from "./pages/MeetingRequestsPage.tsx";
import MemberCalendarPage from "./pages/MemberCalendarPage.tsx";
import MemberEventsPage from "./pages/MemberEventsPage.tsx";
import MemberAnnouncementsPage from "./pages/MemberAnnouncementsPage.tsx";
import MemberMeetingRequestsPage from "./pages/MemberMeetingRequestsPage.tsx";
import AdminVisitPlannerPage from "./pages/AdminVisitPlannerPage.tsx";
import MemberVisitPage from "./pages/MemberVisitPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* ADMIN-only routes */}
            <Route element={<ProtectedRoute role="ADMIN" />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/calendar" element={<CalendarPage />} />
              <Route path="/admin/members" element={<MembersPage />} />
              <Route path="/admin/events" element={<EventsPage />} />
              <Route path="/admin/events/:id" element={<EventDetailPage />} />
              <Route path="/admin/meeting-requests" element={<MeetingRequestsPage />} />
              <Route path="/admin/messages" element={<MessagesPage />} />
              <Route path="/admin/settings" element={<SettingsPage />} />
              <Route path="/admin/visit-planner" element={<AdminVisitPlannerPage />} />
            </Route>

            {/* MEMBER-only routes */}
            <Route element={<ProtectedRoute role="MEMBER" />}>
              <Route path="/member" element={<MemberDashboard />} />
              <Route path="/member/calendar" element={<MemberCalendarPage />} />
              <Route path="/member/events" element={<MemberEventsPage />} />
              <Route path="/member/announcements" element={<MemberAnnouncementsPage />} />
              <Route path="/member/meeting-requests" element={<MemberMeetingRequestsPage />} />
              <Route path="/member/messages" element={<MemberMessagesPage />} />
              <Route path="/member/profile" element={<MemberProfilePage />} />
              <Route path="/member/visits" element={<MemberVisitPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
