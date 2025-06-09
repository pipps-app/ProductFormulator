import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Materials from "@/pages/materials";
import Formulations from "@/pages/formulations";
import Vendors from "@/pages/vendors";
import ImportExport from "@/pages/import-export";
import AppLayout from "@/components/layout/app-layout";

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/materials" component={Materials} />
        <Route path="/formulations" component={Formulations} />
        <Route path="/vendors" component={Vendors} />
        <Route path="/import-export" component={ImportExport} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
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
