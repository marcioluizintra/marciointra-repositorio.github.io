import { Switch, Route, Router } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import { useHashLocation } from "wouter/use-hash-location";
import { useEffect } from "react";

console.log('[App] Iniciando aplicação');

function App() {
  console.log('[App] Renderizando componente principal');
  
  useEffect(() => {
    console.log('[App] Componente montado');
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router hook={useHashLocation}>
          <Switch>
            <Route path="/" component={Home} />
            <Route component={NotFound} />
          </Switch>
        </Router>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;