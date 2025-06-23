import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TourProvider } from "@/components/onboarding/tour-provider";
import { TourTooltip } from "@/components/onboarding/tour-tooltip";
import { FirstTimeGuide } from "@/components/onboarding/first-time-guide";
import Dashboard from "@/pages/dashboard";
import Materials from "@/pages/materials";
import MaterialDetail from "@/pages/material-detail";
import Formulations from "@/pages/formulations";
import FormulationDetail from "@/pages/formulation-detail";
import Vendors from "@/pages/vendors";
import Categories from "@/pages/categories";
import ImportExport from "@/pages/import-export";
import Profile from "@/pages/profile";
import Subscription from "@/pages/subscription";
import Support from "@/pages/support";
import HelpPage from "@/pages/help";
import Reports from "@/pages/reports";
import Payments from "@/pages/payments";
import AdminSubscriptions from "@/pages/admin-subscriptions";
import Onboarding from "@/pages/onboarding";
import Login from "@/pages/login";
import AppLayout from "@/components/layout/app-layout";
import ProtectedRoute from "@/components/protected-route";

function ProtectedAppRoute({ path, component: Component }: { path: string; component: any }) {
  return (
    <Route path={path}>
      <ProtectedRoute>
        <AppLayout>
          <Component />
        </AppLayout>
      </ProtectedRoute>
    </Route>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/onboarding" component={Onboarding} />
      <ProtectedAppRoute path="/dashboard" component={Dashboard} />
      <ProtectedAppRoute path="/materials/:id" component={MaterialDetail} />
      <ProtectedAppRoute path="/materials" component={Materials} />
      <ProtectedAppRoute path="/formulations/:id" component={FormulationDetail} />
      <ProtectedAppRoute path="/formulations" component={Formulations} />
      <ProtectedAppRoute path="/vendors" component={Vendors} />
      <ProtectedAppRoute path="/categories" component={Categories} />
      <ProtectedAppRoute path="/import-export" component={ImportExport} />
      <ProtectedAppRoute path="/reports" component={Reports} />
      <ProtectedAppRoute path="/payments" component={Payments} />
      <ProtectedAppRoute path="/admin/subscriptions" component={AdminSubscriptions} />
      <ProtectedAppRoute path="/profile" component={Profile} />
      <ProtectedAppRoute path="/subscription" component={Subscription} />
      <ProtectedAppRoute path="/support" component={Support} />
      <ProtectedAppRoute path="/help" component={HelpPage} />
      <ProtectedAppRoute path="/" component={Dashboard} />
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
