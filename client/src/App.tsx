import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Welcome from "@/pages/welcome";
import Dashboard from "@/pages/dashboard";
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

  if (!isAuthenticated) {
    return <Welcome onAuth={handleAuth} onGuest={handleGuest} />;
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route component={Dashboard} />
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
