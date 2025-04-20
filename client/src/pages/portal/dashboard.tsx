import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { portalLogout, getCurrentPortalUser } from '@/lib/auth';
import { Loader2, LogOut, Home, Calendar, Truck, FileCheck, MessageSquare } from 'lucide-react';
import { Job } from '@shared/schema';

export default function PortalDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Check if the user is logged in
  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['/api/portal/me'],
    queryFn: async () => {
      const { success, data } = await getCurrentPortalUser();
      if (!success || !data) {
        setLocation('/portal/login');
        return null;
      }
      return data;
    },
  });
  
  // Fetch all jobs for the current user
  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/portal/jobs'],
    queryFn: async () => {
      const response = await fetch('/api/portal/jobs');
      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error('Failed to fetch jobs');
      }
      return await response.json() as Job[];
    },
    enabled: !!currentUser, // Only fetch jobs if the user is logged in
  });
  
  const isLoading = userLoading || jobsLoading;
  
  const handleLogout = async () => {
    try {
      const result = await portalLogout();
      if (result.success) {
        toast({
          title: 'Logged out',
          description: 'You have been successfully logged out',
        });
        setLocation('/portal/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Logout error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };
  
  // If user is not loaded yet, show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-slate-400" />
      </div>
    );
  }
  
  // If no user is found, redirect (this should be handled in the query above, but just in case)
  if (!currentUser) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Client Portal</h1>
            <p className="text-sm text-slate-500">
              Welcome, {currentUser.firstName} {currentUser.lastName}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Navigation</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav>
                  <Button variant="ghost" className="w-full justify-start rounded-none py-6 px-4 border-l-2 border-l-primary">
                    <Home className="h-5 w-5 mr-2" />
                    Dashboard
                  </Button>
                  <Button variant="ghost" className="w-full justify-start rounded-none py-6 px-4 border-l-2 border-l-transparent">
                    <Calendar className="h-5 w-5 mr-2" />
                    Schedule
                  </Button>
                  <Button variant="ghost" className="w-full justify-start rounded-none py-6 px-4 border-l-2 border-l-transparent">
                    <FileCheck className="h-5 w-5 mr-2" />
                    Documents
                  </Button>
                  <Button variant="ghost" className="w-full justify-start rounded-none py-6 px-4 border-l-2 border-l-transparent">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Messages
                  </Button>
                </nav>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content Area */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Projects</CardTitle>
                <CardDescription>
                  View and manage all your ongoing projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                {jobs && jobs.length > 0 ? (
                  <div className="space-y-6">
                    {jobs.map((job) => (
                      <ProjectCard key={job.id} job={job} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <Truck className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-lg font-medium">No active projects</h3>
                    <p className="mt-2">
                      You don't have any active projects at the moment.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function ProjectCard({ job }: { job: Job }) {
  // Map job stage to a more readable format and determine status color
  const stageMapping: Record<string, { label: string, color: string }> = {
    planning: { label: 'Planning Phase', color: 'text-blue-600 bg-blue-50' },
    materials_ordered: { label: 'Materials Ordered', color: 'text-orange-600 bg-orange-50' },
    in_progress: { label: 'In Progress', color: 'text-emerald-600 bg-emerald-50' },
    finishing: { label: 'Finishing Touches', color: 'text-purple-600 bg-purple-50' },
    complete: { label: 'Complete', color: 'text-green-600 bg-green-50' },
  };
  
  const stageInfo = stageMapping[job.stage] || { label: job.stage, color: 'text-slate-600 bg-slate-100' };
  
  // Format dates for display
  const formatDate = (date: Date | null) => {
    if (!date) return 'Not scheduled';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  return (
    <Card className="overflow-hidden border-slate-200">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{job.title}</h3>
            <p className="text-sm text-slate-500">
              {job.siteAddress}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${stageInfo.color}`}>
            {stageInfo.label}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Start Date</p>
            <p className="text-sm font-medium">{formatDate(job.startDate)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Est. Completion</p>
            <p className="text-sm font-medium">{formatDate(job.endDate)}</p>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="flex justify-end">
          <Button variant="outline" size="sm" className="mr-2">
            Files
          </Button>
          <Button size="sm">
            View Details
          </Button>
        </div>
      </div>
    </Card>
  );
}