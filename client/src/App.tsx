import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster as SonnerToaster } from "sonner";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import { ProtectedRoute } from "./lib/protected-route";
import DashboardPage from "@/pages/dashboard-page";
import MembersPage from "@/pages/members-page";
import AnnouncementsPage from "@/pages/announcements-page";
import ActivitiesPage from "@/pages/activities-page";
import PaymentsPage from "@/pages/payments-page";
import FinancePage from "@/pages/finance-page";
import FinanceWalletPage from "@/pages/finance/wallet";
import FinanceIncomePage from "@/pages/finance/income";
import FinanceExpensePage from "@/pages/finance/expense";
import FinanceDuesPage from "@/pages/finance/dues";
import FinanceInitialPage from "@/pages/finance/initial";
import DonationPage from "@/pages/donation-page";


function AppRoutes() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/members" component={MembersPage} />
      <ProtectedRoute path="/announcements" component={AnnouncementsPage} />
      <ProtectedRoute path="/activities" component={ActivitiesPage} />
      <ProtectedRoute path="/payments" component={PaymentsPage} />
      <ProtectedRoute path="/finance" component={FinancePage} />
      <ProtectedRoute path="/finance/wallet" component={FinanceWalletPage} />
      <ProtectedRoute path="/finance/income" component={FinanceIncomePage} />
      <ProtectedRoute path="/finance/expense" component={FinanceExpensePage} />
      <ProtectedRoute path="/finance/dues" component={FinanceDuesPage} />
      <ProtectedRoute path="/finance/initial" component={FinanceInitialPage} />
      <ProtectedRoute path="/donation" component={DonationPage} />
      <ProtectedRoute path="/donation/happy" component={DonationPage} />
      <ProtectedRoute path="/donation/sad" component={DonationPage} />
      <ProtectedRoute path="/donation/fundraising" component={DonationPage} />
      <ProtectedRoute path="/donation/detail/:id" component={DonationPage} />
      <ProtectedRoute path="/donation/create" component={DonationPage} />
      <ProtectedRoute path="/donation/edit/:id" component={DonationPage} />

      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Router hook={useHashLocation}>
              <Toaster />
              <SonnerToaster position="top-right" richColors closeButton />
              <AppRoutes />
            </Router>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
