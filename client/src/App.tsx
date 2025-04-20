import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout/Layout";
import { PortalLayout } from "@/components/portal/PortalLayout";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Contacts from "@/pages/contacts";
import Quotes from "@/pages/quotes";
import Invoices from "@/pages/invoices";
import Contracts from "@/pages/contracts";
import Jobs from "@/pages/jobs";
import Schedule from "@/pages/schedule";
import Messaging from "@/pages/messaging";
import Portal from "@/pages/portal";
import JobPortal from "@/pages/portal/[jobId]";
import PortalLogin from "@/pages/portal/login";
import PortalDashboard from "@/pages/portal/dashboard";

function Router() {
  const [location] = useLocation();
  const isPortalRoute = location.startsWith('/portal');
  const LayoutComponent = isPortalRoute ? PortalLayout : Layout;

  return (
    <LayoutComponent>
      <Switch>
        {/* Admin routes */}
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/contacts" component={Contacts} />
        <Route path="/quotes" component={Quotes} />
        <Route path="/invoices" component={Invoices} />
        <Route path="/contracts" component={Contracts} />
        <Route path="/jobs" component={Jobs} />
        <Route path="/schedule" component={Schedule} />
        <Route path="/messaging" component={Messaging} />
        
        {/* Portal routes - client facing */}
        <Route path="/portal/login" component={PortalLogin} />
        <Route path="/portal/dashboard" component={PortalDashboard} />
        <Route path="/portal" component={Portal} />
        <Route path="/portal/:jobId" component={JobPortal} />
        
        <Route component={NotFound} />
      </Switch>
    </LayoutComponent>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
