import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Tasks from "@/pages/tasks";
import Opportunities from "@/pages/opportunities";
import Proposals from "@/pages/proposals";
import Companies from "@/pages/companies";
import Contacts from "@/pages/contacts";
import Email from "@/pages/email";
import Designs from "@/pages/designs";
import Reports from "@/pages/reports";
import AdminHub from "@/pages/admin-hub";
import GCDashboard from "@/pages/gc-dashboard";
import NotFound from "@/pages/not-found";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

function Router() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Header />
        <div className="p-6 overflow-y-auto h-full">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/gc-dashboard" component={GCDashboard} />
            <Route path="/tasks" component={Tasks} />
            <Route path="/opportunities" component={Opportunities} />
            <Route path="/proposals" component={Proposals} />
            <Route path="/companies" component={Companies} />
            <Route path="/contacts" component={Contacts} />
            <Route path="/email" component={Email} />
            <Route path="/designs" component={Designs} />
            <Route path="/reports" component={Reports} />
            <Route path="/admin" component={AdminHub} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
