import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TourProvider } from "@/components/onboarding/tour-provider";
import { TourTooltip } from "@/components/onboarding/tour-tooltip";
import { FirstTimeGuide } from "@/components/onboarding/first-time-guide";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Materials from "@/pages/materials";
import Formulations from "@/pages/formulations";
import Vendors from "@/pages/vendors";
import Categories from "@/pages/categories";
import ImportExport from "@/pages/import-export";
import Profile from "@/pages/profile";
import Subscription from "@/pages/subscription";
import Onboarding from "@/pages/onboarding";
import Login from "@/pages/login";
import AppLayout from "@/components/layout/app-layout";
import ProtectedRoute from "@/components/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/onboarding" component={Onboarding} />
      <AppLayout>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/materials" component={Materials} />
        <Route path="/formulations" component={Formulations} />
        <Route path="/vendors" component={Vendors} />
        <Route path="/categories" component={Categories} />
        <Route path="/import-export" component={ImportExport} />
        <Route path="/profile" component={Profile} />
        <Route path="/subscription" component={Subscription} />
        <Route component={NotFound} />
      </AppLayout>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <TourProvider>
          <Toaster />
          <Router />
          <TourTooltip />
          <FirstTimeGuide />
        </TourProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
