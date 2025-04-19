import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Plus } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { JobCard } from "@/components/dashboard/JobCard";
import { ActivityItem } from "@/components/dashboard/ActivityItem";
import { StatCard as StatCardType, JobWithDetails, ActivityItem as ActivityItemType } from "@/lib/types";

export default function Dashboard() {
  // Fetch jobs in progress
  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["/api/jobs"],
  });

  // Mock stats data since we don't have aggregation APIs yet
  const stats: StatCardType[] = [
    {
      title: "Today's Jobs",
      value: "3",
      icon: '<i class="fas fa-calendar-check"></i>',
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
      linkText: "View all jobs",
      linkUrl: "/jobs",
    },
    {
      title: "Pending Payments",
      value: "$12,450",
      icon: '<i class="fas fa-dollar-sign"></i>',
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      linkText: "View invoices",
      linkUrl: "/invoices",
    },
    {
      title: "Quotes to Send",
      value: "5",
      icon: '<i class="fas fa-file-invoice-dollar"></i>',
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      linkText: "View quotes",
      linkUrl: "/quotes",
    },
    {
      title: "Unread Messages",
      value: "8",
      icon: '<i class="fas fa-envelope"></i>',
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      linkText: "View messages",
      linkUrl: "/messaging",
    },
  ];

  // Mock activity data
  const activities: ActivityItemType[] = [
    {
      id: "1",
      message: "Quote #1052 accepted by John Smith",
      time: "3 hours ago",
    },
    {
      id: "2",
      message: "Invoice #2201 paid by Emma Johnson",
      time: "5 hours ago",
    },
    {
      id: "3",
      message: "New message from Mike Davis",
      time: "Yesterday at 2:45 PM",
    },
    {
      id: "4",
      message: "New lead created for Sarah Wilson",
      time: "Yesterday at 11:32 AM",
    },
    {
      id: "5",
      message: "Contract signed for 123 Main St project",
      time: "2 days ago",
    },
  ];

  return (
    <>
      {/* Page header */}
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Welcome back, Mike. Here's what's happening today.</p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Job
            </Button>
          </div>
        </div>
      </header>

      {/* Dashboard stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((card, index) => (
          <StatCard key={index} card={card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Jobs in progress */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">Jobs in Progress</CardTitle>
            </CardHeader>
            <div className="divide-y divide-slate-200">
              {jobsLoading ? (
                <div className="p-6">Loading jobs...</div>
              ) : jobs?.length > 0 ? (
                jobs.map((job: JobWithDetails) => (
                  <JobCard key={job.id} job={job} />
                ))
              ) : (
                <div className="p-6">No jobs in progress.</div>
              )}
            </div>
            <div className="bg-slate-50 px-6 py-3">
              <div className="text-sm">
                <a href="/jobs" className="font-medium text-primary hover:text-primary/80 flex items-center">
                  View all jobs <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <ol className="space-y-6">
                {activities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </ol>
            </CardContent>
            <div className="bg-slate-50 px-6 py-3">
              <div className="text-sm">
                <a href="#" className="font-medium text-primary hover:text-primary/80 flex items-center">
                  View all activity <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

// Import ArrowRight icon for use in the component
function ArrowRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 12h14"></path>
      <path d="m12 5 7 7-7 7"></path>
    </svg>
  );
}
