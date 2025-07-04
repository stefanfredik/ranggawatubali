import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <div className="rounded-2xl p-8" style={{backdropFilter: "blur(10px)", backgroundColor: "rgba(255, 255, 255, 0.1)", border: "1px solid rgba(255, 255, 255, 0.2)", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"}}> 
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
