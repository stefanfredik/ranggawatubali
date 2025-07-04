import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mountain, Moon, Sun } from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { useTheme } from "@/components/theme-provider";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof insertUserSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("login");

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@example.com",
      password: "12345",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      email: "",
      username: "",
      fullName: "",
      password: "",
      phone: "",
      role: "member",
    },
  });

  // Redirect if already logged in
  if (user) {
    navigate("/");
    return null;
  }

  const onLogin = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterForm) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 items-center min-h-screen">
          {/* Left side - Hero Section */}
          <div className="hidden lg:block space-y-8">
            <div className="rounded-3xl p-12 text-center" style={{backdropFilter: "blur(10px)", backgroundColor: "rgba(255, 255, 255, 0.1)", border: "1px solid rgba(255, 255, 255, 0.2)", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"}}> 
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                <Mountain className="text-3xl text-white" size={32} />
              </div>
              <h1 className="text-4xl font-bold gradient-text mb-4">
                Rangga Watu Bali
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Organizational Management System
              </p>
              <div className="space-y-4 text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"></div>
                  <span className="text-muted-foreground">Member Management</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"></div>
                  <span className="text-muted-foreground">Activity Planning</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"></div>
                  <span className="text-muted-foreground">Payment Tracking</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"></div>
                  <span className="text-muted-foreground">Birthday Reminders</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Auth Forms */}
          <div className="flex flex-col justify-center">
            <div className="w-full max-w-md mx-auto space-y-6">
              {/* Mobile Logo */}
              <div className="lg:hidden text-center rounded-2xl p-6" style={{backdropFilter: "blur(10px)", backgroundColor: "rgba(255, 255, 255, 0.1)", border: "1px solid rgba(255, 255, 255, 0.2)", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"}}> 
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Mountain className="text-2xl text-white" size={24} />
                </div>
                <h1 className="text-2xl font-bold gradient-text mb-2">
                  Rangga Watu Bali
                </h1>
                <p className="text-sm text-muted-foreground">
                  Organizational Management System
                </p>
              </div>

              {/* Auth Card */}
              <Card variant="glass" className="shadow-2xl">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold">
                    Welcome
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2" variant="glass">
                      <TabsTrigger value="login">Sign In</TabsTrigger>
                      <TabsTrigger value="register">Sign Up</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login" className="space-y-4 mt-6">
                      <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            variant="glass"
                            placeholder="Enter your email"
                            {...loginForm.register("email")}
                          />
                          {loginForm.formState.errors.email && (
                            <p className="text-destructive text-sm">
                              {loginForm.formState.errors.email.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            variant="glass"
                            placeholder="Enter your password"
                            {...loginForm.register("password")}
                          />
                          {loginForm.formState.errors.password && (
                            <p className="text-destructive text-sm">
                              {loginForm.formState.errors.password.message}
                            </p>
                          )}
                        </div>

                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? (
                            <>
                              <Loading size="sm" variant="dots" text="" className="mr-2" />
                              Signing In...
                            </>
                          ) : (
                            "Sign In"
                          )}
                        </Button>
                      </form>
                    </TabsContent>

                    <TabsContent value="register" className="space-y-4 mt-6">
                      <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                              id="fullName"
                              variant="glass"
                              placeholder="Your full name"
                              {...registerForm.register("fullName")}
                            />
                            {registerForm.formState.errors.fullName && (
                              <p className="text-destructive text-sm">
                                {registerForm.formState.errors.fullName.message}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                              id="username"
                              variant="glass"
                              placeholder="Choose username"
                              {...registerForm.register("username")}
                            />
                            {registerForm.formState.errors.username && (
                              <p className="text-destructive text-sm">
                                {registerForm.formState.errors.username.message}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="reg-email">Email</Label>
                          <Input
                            id="reg-email"
                            type="email"
                            variant="glass"
                            placeholder="Enter your email"
                            {...registerForm.register("email")}
                          />
                          {registerForm.formState.errors.email && (
                            <p className="text-destructive text-sm">
                              {registerForm.formState.errors.email.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone (Optional)</Label>
                          <Input
                            id="phone"
                            variant="glass"
                            placeholder="Your phone number"
                            {...registerForm.register("phone")}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="reg-password">Password</Label>
                          <Input
                            id="reg-password"
                            type="password"
                            variant="glass"
                            placeholder="Create a password"
                            {...registerForm.register("password")}
                          />
                          {registerForm.formState.errors.password && (
                            <p className="text-destructive text-sm">
                              {registerForm.formState.errors.password.message}
                            </p>
                          )}
                        </div>

                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? (
                            <>
                              <Loading size="sm" variant="dots" text="" className="mr-2" />
                              Creating Account...
                            </>
                          ) : (
                            "Create Account"
                          )}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Theme Toggle */}
              <div className="flex justify-center">
                <Button
                  variant="glass"
                  size="sm"
                  onClick={toggleTheme}
                  className="rounded-full p-3 hover:scale-110 transition-all duration-200"
                >
                  {theme === "dark" ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
