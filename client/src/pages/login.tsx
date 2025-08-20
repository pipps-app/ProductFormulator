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

  // Check for magic link token in URL 
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('reset');
    
    if (token) {
      // Set reset form state immediately
      setShowPasswordReset(true);
      setShowPasswordResetForm(true);
      setResetToken(token);
      setIsLogin(false);
      
      // Force logout if user is logged in
      if (user) {
        fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        }).then(() => {
          queryClient.clear();
          queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        });
      }
      
      // Clean up URL after a delay
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 2000);
      
      toast({
        title: "Magic link worked!",
        description: "Password reset form loaded.",
        duration: 5000,
      });
    }
  }, []);

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
      token: resetToken,
      newPassword: "",
    },
  });

  // Helper to fully clear all auth-related forms (prevents stale field persistence when returning)
  const clearAllAuthForms = () => {
    try {
      loginForm.reset({ email: "", password: "" });
      registerForm.reset({ email: "", password: "", company: "" });
      passwordResetRequestForm.reset({ email: "" });
      passwordResetForm.reset({ token: "", newPassword: "" });
    } catch (_) {
      // no-op safety
    }
  };

  // Helper to clear just sensitive password fields while retaining email (useful on errors)
  const clearPasswordFields = () => {
    try {
  // Clear both email and password now (no retention per user request)
  loginForm.reset({ email: "", password: "" });
  registerForm.reset({ email: "", password: "", company: "" });
    } catch (_) {
      // ignore
    }
  };

  // Ensure forms are cleared if the component ever unmounts (navigation away, etc.)
  useEffect(() => {
    return () => {
      clearAllAuthForms();
    };
  }, []);

  // Update form token when resetToken changes
  useEffect(() => {
    if (resetToken && passwordResetForm) {
      passwordResetForm.setValue('token', resetToken);
    }
  }, [resetToken]);

  // Move mutations to top level to fix hooks rule violation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      // Client-side safeguard (should normally be handled by react-hook-form already)
      if (!data.email || !data.password) {
        throw Object.assign(new Error("Email and password are required"), { status: 400 });
      }
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      const raw = await response.text();
      let parsed: any = null;
      if (raw) {
        try { parsed = JSON.parse(raw); } catch (e) {
          throw Object.assign(new Error("Server returned invalid JSON"), { status: response.status });
        }
      }
      if (!response.ok) {
        const message = parsed?.error || parsed?.message || parsed?.detail || (response.status === 400 ? "Email and password are required" : response.status === 401 ? "Invalid credentials" : `Login failed (${response.status})`);
        throw Object.assign(new Error(message), { status: response.status });
      }
      if (!parsed) {
        throw Object.assign(new Error("Empty response from server"), { status: response.status });
      }
      return parsed;
    },
    onSuccess: async (data) => {
      // Store JWT token in localStorage
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }

  // Clear the login form immediately so fields don't show if user returns
  clearAllAuthForms();
      
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
  description: error.message || (error.status === 401 ? "Invalid credentials" : error.status === 400 ? "Email and password are required" : "Unexpected error during login"),
        variant: "destructive",
      });
  // Clear only password field for security; keep email for convenience
  clearPasswordFields();
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      // Client-side validation
      if (!data.email || !data.password) {
        throw Object.assign(new Error("Email and password are required"), { status: 400 });
      }
      
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      const raw = await response.text();
      let parsed: any = null;
      if (raw) {
        try { parsed = JSON.parse(raw); } catch (e) {
          throw Object.assign(new Error("Server returned invalid JSON"), { status: response.status });
        }
      }
      
      if (!response.ok) {
        const message = parsed?.error || parsed?.message || `Registration failed (${response.status})`;
        throw Object.assign(new Error(message), { status: response.status });
      }
      
      if (!parsed) {
        throw Object.assign(new Error("Empty response from server"), { status: response.status });
      }
      
      return parsed;
    },
    onSuccess: (data) => {
      // With email verification, users won't get a token immediately
      // Show email verification message
      toast({
        title: "Registration successful!",
        description: data.message || "Please check your email to verify your account before logging in.",
        duration: 8000, // Show longer since it's important
      });
      
      // Switch to login view and clear forms
      setIsLogin(true);
      clearAllAuthForms();
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || (error.status === 400 ? "Invalid registration data" : "Unexpected error during registration"),
        variant: "destructive",
      });
      // Clear only password field
      clearPasswordFields();
    },
  });

  const passwordResetRequestMutation = useMutation({
    mutationFn: async (data: PasswordResetRequestFormData) => {
      if (!data.email) {
        throw Object.assign(new Error("Email is required"), { status: 400 });
      }
      
      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      const raw = await response.text();
      let parsed: any = null;
      if (raw) {
        try { parsed = JSON.parse(raw); } catch (e) {
          throw Object.assign(new Error("Server returned invalid JSON"), { status: response.status });
        }
      }
      
      if (!response.ok) {
        const message = parsed?.error || parsed?.message || `Password reset request failed (${response.status})`;
        throw Object.assign(new Error(message), { status: response.status });
      }
      
      if (!parsed) {
        throw Object.assign(new Error("Empty response from server"), { status: response.status });
      }
      
      return parsed;
    },
    // Prevent multiple requests by disabling retry and setting gcTime
    retry: false,
    gcTime: 30000, // Cache for 30 seconds
    onSuccess: (data) => {
      toast({
        title: "Reset request sent",
        description: data.message,
      });
      // Check if we're in demo mode (token returned) or production mode (email sent)
      if (data.resetToken) {
        // Demo mode - auto-fill the token
        setResetToken(data.resetToken);
        passwordResetForm.setValue("token", data.resetToken);
        setShowPasswordResetForm(true);
      } else {
        // Production mode - email was sent, automatically show token entry form
        setShowPasswordResetForm(true);
        toast({
          title: "Check your email",
          description: "We've sent a password reset token to your email address. Copy the token from the email and paste it below.",
          duration: 10000,
        });
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
      if (!data.token || !data.newPassword) {
        throw Object.assign(new Error("Token and new password are required"), { status: 400 });
      }
      
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      const raw = await response.text();
      let parsed: any = null;
      if (raw) {
        try { parsed = JSON.parse(raw); } catch (e) {
          throw Object.assign(new Error("Server returned invalid JSON"), { status: response.status });
        }
      }
      
      if (!response.ok) {
        const message = parsed?.error || parsed?.message || `Password reset failed (${response.status})`;
        throw Object.assign(new Error(message), { status: response.status });
      }
      
      if (!parsed) {
        throw Object.assign(new Error("Empty response from server"), { status: response.status });
      }
      
      return parsed;
    },
    onSuccess: () => {
      toast({
        title: "Password reset successful",
        description: "Your password has been updated. You can now log in with your new password.",
      });
      // Reset all form states and force re-render
      setShowPasswordReset(false);
      setShowPasswordResetForm(false);
      setResetToken("");
      setIsLogin(true);
      
      // Reset forms completely
      passwordResetForm.reset();
      loginForm.reset();
      
      // Force page refresh to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Password reset failed",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  // Handle redirect to dashboard if user is authenticated (but not during password reset)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasResetToken = urlParams.get('reset');
    
    if (!isLoading && user && !showPasswordReset && !hasResetToken) {
      setLocation("/dashboard");
    }
  }, [isLoading, user, setLocation, showPasswordReset]);

  // If user is already authenticated and not resetting password, redirect to dashboard
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (user && !showPasswordReset) {
    return null; // Will redirect via useEffect
  }

  const onLoginSubmit = (data: LoginFormData) => {
    // Additional front-end validation to avoid empty submissions producing confusing server messages
    if (!data.email) {
      loginForm.setError("email", { type: "required", message: "Email is required" });
      return;
    }
    if (!data.password) {
      loginForm.setError("password", { type: "required", message: "Password is required" });
      return;
    }
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  // Reset forms when switching between modes
  const handleSwitchToLogin = () => {
  clearAllAuthForms();
  setIsLogin(true);
  setShowPasswordReset(false);
  setShowPasswordResetForm(false);
  setResetToken("");
  };

  const handleSwitchToRegister = () => {
  clearAllAuthForms();
  setIsLogin(false);
  setShowPasswordReset(false);
  setShowPasswordResetForm(false);
  setResetToken("");
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
                  ? "Check your email for the reset token, then enter it below with your new password" 
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
                              <div className="space-y-2">
                                <Input 
                                  type="text" 
                                  placeholder="Paste the token from your email" 
                                  className="w-full"
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={async () => {
                                    try {
                                      const text = await navigator.clipboard.readText();
                                      // Look for a token-like string (32+ hex characters)
                                      const tokenMatch = text.match(/[a-f0-9]{32,}/i);
                                      if (tokenMatch) {
                                        passwordResetForm.setValue("token", tokenMatch[0]);
                                        toast({
                                          title: "Token pasted",
                                          description: "Reset token has been automatically filled in.",
                                        });
                                      } else {
                                        passwordResetForm.setValue("token", text.trim());
                                        toast({
                                          title: "Text pasted",
                                          description: "Please verify the token is correct.",
                                        });
                                      }
                                    } catch (error) {
                                      toast({
                                        title: "Paste failed",
                                        description: "Please manually copy and paste the token.",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                >
                                  Paste Token from Clipboard
                                </Button>
                              </div>
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
                              key="login-password-field"
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
                        // When entering password reset flow, wipe other form data
                        onMouseDown={() => clearAllAuthForms()}
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