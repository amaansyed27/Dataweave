
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background animate-fade-in">
      <div className="text-center max-w-md mx-auto p-8 glass-panel">
        <Database className="h-16 w-16 mx-auto mb-4 text-primary/40" />
        
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-6">
          This page doesn't exist in your database schema
        </p>
        
        <Button asChild className="mt-4">
          <a href="/">Return to DataWeave</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
