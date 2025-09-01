import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/dashboard";
import SharedNote from "@/pages/shared-note";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public shared note route - no authentication required */}
      <Route path="/shared/:noteId/:token" component={SharedNote} />
      
      {/* Main routes */}
      <Route path="/">
        {isLoading || !isAuthenticated ? (
          <Landing />
        ) : (
          <Dashboard />
        )}
      </Route>
      
      <Route>
        {isLoading || !isAuthenticated ? (
          <Landing />
        ) : (
          <Dashboard />
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
