import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const portalLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type PortalLoginFormValues = z.infer<typeof portalLoginSchema>;

export default function PortalLogin() {
  const [, setLocation] = useLocation();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isAutoLogin, setIsAutoLogin] = useState(false);

  // Check URL for autofill parameter
  const urlParams = new URLSearchParams(window.location.search);
  const shouldAutofill = urlParams.get('autofill') === 'true';
  
  // Get stored credentials from localStorage if autofill is requested
  const storedUsername = shouldAutofill ? localStorage.getItem('portal_test_username') : null;
  const storedPassword = shouldAutofill ? localStorage.getItem('portal_test_password') : null;

  const form = useForm<PortalLoginFormValues>({
    resolver: zodResolver(portalLoginSchema),
    defaultValues: {
      email: storedUsername || "",
      password: storedPassword || "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: PortalLoginFormValues) => {
      const response = await apiRequest("POST", "/api/portal/login", data);
      return await response.json();
    },
    onSuccess: () => {
      setLocation("/portal/dashboard");
    },
    onError: (error: Error) => {
      setLoginError(error.message || "Login failed. Please check your credentials.");
    },
  });

  function onSubmit(data: PortalLoginFormValues) {
    setLoginError(null);
    loginMutation.mutate(data);
  }
  
  // Auto login if credentials are available
  useEffect(() => {
    if (shouldAutofill && storedUsername && storedPassword && !isAutoLogin) {
      setIsAutoLogin(true);
      const autoLoginData = {
        email: storedUsername,
        password: storedPassword
      };
      // Auto submit after a short delay
      const timer = setTimeout(() => {
        loginMutation.mutate(autoLoginData);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [shouldAutofill, storedUsername, storedPassword, isAutoLogin, loginMutation]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Client Portal</h1>
          <p className="mt-2 text-slate-600">Access your projects and quotes</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your email and password to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isAutoLogin && shouldAutofill && !loginError && (
              <Alert className="mb-4 bg-blue-50 border-blue-200 text-blue-800">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Auto-Login</AlertTitle>
                <AlertDescription>
                  Testing portal access with saved credentials...
                </AlertDescription>
              </Alert>
            )}
            
            {loginError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="your.email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center text-center">
            <p className="text-sm text-slate-500">
              Need help? Contact your contractor for assistance.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}