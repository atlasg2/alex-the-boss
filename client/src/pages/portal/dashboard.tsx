import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, FileCheck, LogOut } from "lucide-react";
import { ContactWithDetail, JobWithDetails, QuoteWithDetails, ContractWithDetails } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";

export default function PortalDashboard() {
  const [, setLocation] = useLocation();

  // Fetch portal data about the current user
  const { data: portalUser, isLoading: isUserLoading, isError: isUserError } = useQuery<ContactWithDetail>({
    queryKey: ["/api/portal/me"],
  });

  // Fetch jobs for the user
  const { data: jobs, isLoading: isJobsLoading } = useQuery<JobWithDetails[]>({
    queryKey: ["/api/portal/jobs"],
    enabled: !!portalUser,
  });

  // Fetch quotes for the user (assuming we'd have this endpoint)
  const { data: quotes, isLoading: isQuotesLoading } = useQuery<QuoteWithDetails[]>({
    queryKey: [`/api/contacts/${portalUser?.id}/quotes`],
    enabled: !!portalUser?.id,
  });

  // Handle logout
  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/portal/logout");
      setLocation("/portal/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isUserError) {
      setLocation("/portal/login");
    }
  }, [isUserError, setLocation]);

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500">Loading portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-800">Client Portal</h1>
              {portalUser && (
                <p className="mt-1 text-sm text-slate-500">
                  Welcome back, {portalUser.firstName} {portalUser.lastName}
                </p>
              )}
            </div>
            <div className="mt-4 md:mt-0">
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Projects/Jobs Section */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-primary" />
                Your Projects
              </CardTitle>
              <CardDescription>
                Current and past projects we're working on for you
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isJobsLoading ? (
                <div className="py-10 text-center text-slate-500">Loading projects...</div>
              ) : jobs && jobs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Timeline</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.title}</TableCell>
                        <TableCell>{job.siteAddress}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            job.stage === "planning" 
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : job.stage === "materials_ordered" 
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : job.stage === "in_progress" 
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : job.stage === "finishing" 
                              ? "bg-orange-50 text-orange-700 border-orange-200"
                              : "bg-green-50 text-green-700 border-green-200"
                          }>
                            {job.stage === "planning" 
                              ? "Planning"
                              : job.stage === "materials_ordered" 
                              ? "Materials Ordered"
                              : job.stage === "in_progress" 
                              ? "In Progress"
                              : job.stage === "finishing" 
                              ? "Finishing"
                              : "Complete"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(job.startDate).toLocaleDateString()} - {" "}
                          {job.endDate ? new Date(job.endDate).toLocaleDateString() : "TBD"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-10 text-center text-slate-500">
                  No active projects found.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quotes Section */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5 text-primary" />
                Your Quotes
              </CardTitle>
              <CardDescription>
                Quotes we've prepared for you
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isQuotesLoading ? (
                <div className="py-10 text-center text-slate-500">Loading quotes...</div>
              ) : quotes && quotes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quote Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valid Until</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotes.map((quote) => (
                      <TableRow key={quote.id}>
                        <TableCell>
                          {new Date(quote.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          ${parseFloat(quote.total.toString()).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            quote.status === "draft" 
                              ? "bg-slate-50 text-slate-700 border-slate-200"
                              : quote.status === "sent" 
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-green-50 text-green-700 border-green-200"
                          }>
                            {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : "N/A"}
                        </TableCell>
                        <TableCell>
                          {quote.status === "sent" && (
                            <Button size="sm" variant="outline" className="flex items-center">
                              <FileCheck className="mr-1 h-4 w-4" />
                              Accept Quote
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-10 text-center text-slate-500">
                  No quotes found.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}