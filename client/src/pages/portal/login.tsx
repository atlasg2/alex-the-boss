import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { portalLogin, getCurrentPortalUser } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(4, {
    message: 'Password must be at least 4 characters.',
  }),
});

export default function PortalLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const { success, data } = await getCurrentPortalUser();
        if (success && data) {
          // If already logged in, redirect to portal dashboard
          setLocation('/portal/dashboard');
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [setLocation]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const result = await portalLogin(values.email, values.password);
      
      if (result.success) {
        toast({
          title: 'Login successful',
          description: 'Welcome to your client portal',
        });
        setLocation('/portal/dashboard');
      } else {
        toast({
          title: 'Login failed',
          description: 'Please check your email and password',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Login Form */}
        <div className="w-full max-w-md mx-auto">
          <Card className="shadow-lg border-slate-200">
            <CardHeader className="space-y-1">
              <CardTitle className="text-3xl font-bold">Client Portal</CardTitle>
              <CardDescription>
                Enter your email and password to access your project dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="your.email@example.com" 
                            {...field} 
                            disabled={isLoading}
                          />
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
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            {...field} 
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      'Log in'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="border-t p-4">
              <p className="text-sm text-slate-600 text-center w-full">
                Having trouble logging in? Contact your project manager for assistance.
              </p>
            </CardFooter>
          </Card>
        </div>

        {/* Hero Section */}
        <div className="hidden md:flex flex-col space-y-6">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
              Welcome to Your Project Portal
            </h1>
            <p className="mt-4 text-xl text-slate-600">
              Access project details, view progress, communicate with your contractor, 
              and more - all in one place.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FeatureCard 
              title="Track Progress" 
              description="View real-time updates on your project's timeline and milestones."
              icon="📊"
            />
            <FeatureCard 
              title="Project Files" 
              description="Access important documents, designs, and photos."
              icon="📁"
            />
            <FeatureCard 
              title="Approvals" 
              description="Review and approve designs, changes, and documents."
              icon="✓"
            />
            <FeatureCard 
              title="Messaging" 
              description="Communicate directly with your project team."
              icon="💬"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-slate-100">
      <div className="flex items-start gap-4">
        <div className="text-2xl">{icon}</div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
      </div>
    </div>
  );
}