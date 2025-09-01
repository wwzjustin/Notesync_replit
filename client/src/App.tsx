import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Welcome from "@/pages/welcome";
import Dashboard from "@/pages/dashboard";
import SharedNote from "@/pages/shared-note";
import { useState, useEffect } from "react";

function Router() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for existing auth state from localStorage
    const authState = localStorage.getItem('notesync-auth');
    if (authState) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleAuth = (provider: string) => {
    // Mock authentication - in real app would integrate with actual providers
    localStorage.setItem('notesync-auth', provider);
    setIsAuthenticated(true);
  };

  const handleGuest = () => {
    localStorage.setItem('notesync-auth', 'guest');
    setIsAuthenticated(true);
  };

  return (
    <Switch>
      {/* Public shared note route - no authentication required */}
      <Route path="/shared/:noteId/:token" component={SharedNote} />
      
      {/* Protected routes */}
      <Route path="/">
        {isAuthenticated ? (
          <Dashboard />
        ) : (
          <Welcome onAuth={handleAuth} onGuest={handleGuest} />
        )}
      </Route>
      
      <Route>
        {isAuthenticated ? (
          <Dashboard />
        ) : (
          <Welcome onAuth={handleAuth} onGuest={handleGuest} />
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
