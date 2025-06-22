import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/hooks/use-user";
import logoPath from "@assets/pipps-app-logo_1749571716445.jpg";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const registerSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  company: z.string().optional(),
});

const passwordResetRequestSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const passwordResetSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

type RegisterFormData = z.infer<typeof registerSchema>;
type PasswordResetRequestFormData = z.infer<typeof passwordResetRequestSchema>;
type PasswordResetFormData = z.infer<typeof passwordResetSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showPasswordResetForm, setShowPasswordResetForm] = useState(false);
  const [resetToken, setResetToken] = useState<string>("");
  const { toast } = useToast();
  const { data: user, isLoading } = useUser();
  const queryClient = useQueryClient();

  // Always initialize forms at the top level
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      company: "",
    },
  });

  const passwordResetRequestForm = useForm<PasswordResetRequestFormData>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: {
      email: "",
    },
    mode: "onChange",
  });

  const passwordResetForm = useForm<PasswordResetFormData>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      token: "",
      newPassword: "",
    },
  });

  // Move mutations to top level to fix hooks rule violation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Login failed");
      }
      return response.json();
    },
    onSuccess: async (data) => {
      // Clear all queries and refetch user to ensure fresh auth state
      queryClient.clear();
      await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      
      // Small delay to ensure state updates, then navigate
      setTimeout(() => {
        setLocation("/dashboard");
      }, 250);
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Registration failed");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account created!",
        description: "Your account has been created successfully. You can now log in.",
      });
      registerForm.reset({
        username: "",
        email: "",
        password: "",
        company: "",
      });
      setIsLogin(true);
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const passwordResetRequestMutation = useMutation({
    mutationFn: async (data: PasswordResetRequestFormData) => {
      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Password reset request failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Reset link sent",
        description: data.message,
      });
      // For demo purposes, auto-fill the token (remove in production)
      if (data.resetToken) {
        setResetToken(data.resetToken);
        passwordResetForm.setValue("token", data.resetToken);
        setShowPasswordResetForm(true);
      }
      passwordResetRequestForm.reset({ email: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Request failed",
        description: error.message || "Failed to send reset link",
        variant: "destructive",
      });
    },
  });

  const passwordResetMutation = useMutation({
    mutationFn: async (data: PasswordResetFormData) => {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Password reset failed");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password reset successful",
        description: "Your password has been updated. You can now log in with your new password.",
      });
      setShowPasswordReset(false);
      setShowPasswordResetForm(false);
      setResetToken("");
      passwordResetForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Password reset failed",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  // Handle redirect to dashboard if user is authenticated
  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/dashboard");
    }
  }, [isLoading, user, setLocation]);

  // If user is already authenticated, redirect to dashboard
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect via useEffect
  }

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  // Reset forms when switching between modes
  const handleSwitchToLogin = () => {
    setIsLogin(true);
    registerForm.reset();
  };

  const handleSwitchToRegister = () => {
    setIsLogin(false);
    loginForm.reset();
  };

  const onPasswordResetRequestSubmit = (data: PasswordResetRequestFormData) => {
    passwordResetRequestMutation.mutate(data);
  };

  const onPasswordResetSubmit = (data: PasswordResetFormData) => {
    passwordResetMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <img 
            src={logoPath} 
            alt="PIPPS Logo" 
            className="h-16 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">PIPPS Maker Calc</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Professional formulation and cost management</p>
        </div>

        <Card className="w-full shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl sm:text-2xl">
              {showPasswordReset 
                ? (showPasswordResetForm ? "Enter New Password" : "Reset Password")
                : (isLogin ? "Sign In" : "Create Account")
              }
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {showPasswordReset 
                ? (showPasswordResetForm 
                  ? "Enter the token and your new password" 
                  : "Enter your email to receive a reset token"
                )
                : (isLogin 
                  ? "Enter your credentials to access your account" 
                  : "Create a new account to get started"
                )
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            {showPasswordReset ? (
              <div className="w-full">
                {showPasswordResetForm ? (
                  <Form {...passwordResetForm}>
                    <form onSubmit={passwordResetForm.handleSubmit(onPasswordResetSubmit)} className="space-y-4">
                      <FormField
                        control={passwordResetForm.control}
                        name="token"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reset Token</FormLabel>
                            <FormControl>
                              <Input 
                                type="text" 
                                placeholder="Enter the reset token" 
                                className="w-full"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={passwordResetForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Enter your new password" 
                                className="w-full"
                                autoComplete="new-password"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full mt-4" 
                        disabled={passwordResetMutation.isPending}
                        size="default"
                      >
                        {passwordResetMutation.isPending ? "Resetting..." : "Reset Password"}
                      </Button>
                    </form>
                  </Form>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="reset-email" className="text-sm font-medium">Email</label>
                      <Input 
                        id="reset-email"
                        type="email" 
                        placeholder="Enter your email" 
                        className="w-full"
                        autoComplete="email"
                        value={passwordResetRequestForm.watch("email") || ""}
                        onChange={(e) => passwordResetRequestForm.setValue("email", e.target.value)}
                        disabled={passwordResetRequestMutation.isPending}
                      />
                      {passwordResetRequestForm.formState.errors.email && (
                        <p className="text-sm text-red-600">
                          {passwordResetRequestForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <Button 
                      onClick={() => {
                        const email = passwordResetRequestForm.getValues("email");
                        if (email) {
                          onPasswordResetRequestSubmit({ email });
                        } else {
                          passwordResetRequestForm.setError("email", {
                            type: "required",
                            message: "Email is required"
                          });
                        }
                      }}
                      className="w-full mt-4" 
                      disabled={passwordResetRequestMutation.isPending}
                      size="default"
                    >
                      {passwordResetRequestMutation.isPending ? "Sending..." : "Send Reset Link"}
                    </Button>
                  </div>
                )}
              </div>
            ) : isLogin ? (
              <div className="w-full">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="Enter your email" 
                              className="w-full"
                              autoComplete="email"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Enter your password" 
                              className="w-full"
                              autoComplete="current-password"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full mt-4" 
                      disabled={loginMutation.isPending}
                      size="default"
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign In"}
                    </Button>
                    
                    <div className="text-center mt-4">
                      <button
                        type="button"
                        onClick={() => setShowPasswordReset(true)}
                        className="text-sm text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
                      >
                        Forgot your password?
                      </button>
                    </div>
                  </form>
                </Form>
              </div>
            ) : (
              <div className="w-full space-y-4">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <div className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-sm font-medium">Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Choose a username" 
                                className="w-full h-11 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                autoComplete="username"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-xs text-red-600" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-sm font-medium">Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="Enter your email" 
                                className="w-full h-11 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                autoComplete="email"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-xs text-red-600" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-sm font-medium">Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Create a password" 
                                className="w-full h-11 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                autoComplete="new-password"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-xs text-red-600" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-sm font-medium">Company (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Your company name" 
                                className="w-full h-11 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                autoComplete="organization"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-xs text-red-600" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-11 mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-200" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Creating account...</span>
                        </div>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-200 text-center">
              {showPasswordReset ? (
                <div className="space-y-2">
                  {showPasswordResetForm && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordResetForm(false);
                        passwordResetForm.reset();
                      }}
                      className="block w-full text-sm text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1 transition-colors duration-200"
                    >
                      Back to email entry
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordReset(false);
                      setShowPasswordResetForm(false);
                      setResetToken("");
                      passwordResetRequestForm.reset({ email: "" });
                      passwordResetForm.reset({ token: "", newPassword: "" });
                    }}
                    className="block w-full text-sm text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1 transition-colors duration-200"
                  >
                    Back to sign in
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => isLogin ? handleSwitchToRegister() : handleSwitchToLogin()}
                  className="text-sm text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1 transition-colors duration-200"
                >
                  {isLogin 
                    ? "Don't have an account? Sign up" 
                    : "Already have an account? Sign in"
                  }
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}