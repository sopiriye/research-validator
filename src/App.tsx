import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import CheckTitle from "./pages/CheckTitle.tsx";
import AdminLogin from "./pages/AdminLogin.tsx";
import AdminLayout from "./components/AdminLayout.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import ProjectInformation from "./pages/ProjectInformation.tsx";
import ProjectReports from "./pages/ProjectReports.tsx";
import AdminManagementPage from "./pages/AdminManagement.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/check" element={<CheckTitle />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="projects" element={<ProjectInformation />} />
            <Route path="reports" element={<ProjectReports />} />
            <Route path="management" element={<AdminManagementPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Analytics />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
