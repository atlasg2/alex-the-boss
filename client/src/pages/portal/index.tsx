import { useState } from "react";
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
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { Globe, ExternalLink, Copy, CheckCircle } from "lucide-react";
import { generatePortalToken } from "@/lib/auth";
import { JobWithDetails } from "@/lib/types";

export default function Portal() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Fetch jobs
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["/api/jobs"],
  });

  // Fetch contracts
  const { data: contracts } = useQuery({
    queryKey: ["/api/contracts"],
  });

  // Handle portal link generation
  const handleGeneratePortalLink = async () => {
    if (!selectedJobId) return;
    
    try {
      const result = await generatePortalToken(selectedJobId);
      if (result.success) {
        // Construct portal URL
        const portalUrl = `${window.location.origin}/portal/${result.token}`;
        setGeneratedUrl(portalUrl);
      }
    } catch (error) {
      console.error("Error generating portal token:", error);
    }
  };

  // Handle copy to clipboard
  const handleCopyToClipboard = () => {
    if (!generatedUrl) return;
    
    navigator.clipboard.writeText(generatedUrl)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
      });
  };

  // Filter active jobs
  const activeJobs = jobs?.filter((job: JobWithDetails) => 
    job.stage !== "complete" && contracts?.some((contract: any) => contract.id === job.contractId)
  );

  return (
    <>
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Customer Portal</h1>
            <p className="mt-1 text-sm text-slate-500">Manage client access to project information.</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button onClick={() => setIsGenerateOpen(true)}>
              <Globe className="mr-2 h-4 w-4" />
              Generate Portal Link
            </Button>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Portal Access Management</CardTitle>
          <CardDescription>
            Create and manage client access to your projects.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-50 border border-yellow-100 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">About Customer Portal</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>The Customer Portal provides clients with a secure way to view project details, including quotes, contracts, invoices, and job progress. Generate a unique link for each job and share it with your client.</p>
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="py-20 text-center text-slate-500">Loading jobs...</div>
          ) : activeJobs?.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 font-medium text-slate-600">Job</th>
                  <th className="text-left py-3 font-medium text-slate-600">Client</th>
                  <th className="text-left py-3 font-medium text-slate-600">Progress</th>
                  <th className="text-right py-3 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {activeJobs.map((job: JobWithDetails) => (
                  <tr key={job.id} className="hover:bg-slate-50">
                    <td className="py-3">
                      <div className="font-medium">{job.title}</div>
                      <div className="text-sm text-slate-500">{job.siteAddress}</div>
                    </td>
                    <td className="py-3">
                      <div className="text-sm">John Smith</div>
                      <div className="text-xs text-slate-500">john.smith@example.com</div>
                    </td>
                    <td className="py-3">
                      <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: job.stage === "planning" ? "20%" : 
                                          job.stage === "materials_ordered" ? "40%" : 
                                          job.stage === "in_progress" ? "60%" : 
                                          job.stage === "finishing" ? "80%" : "100%" }}
                        ></div>
                      </div>
                      <div className="text-xs text-slate-500">
                        {job.stage === "planning" ? "Planning (20%)" : 
                         job.stage === "materials_ordered" ? "Materials Ordered (40%)" : 
                         job.stage === "in_progress" ? "In Progress (60%)" : 
                         job.stage === "finishing" ? "Finishing (80%)" : "Complete (100%)"}
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" onClick={() => {
                          setSelectedJobId(job.id);
                          setIsGenerateOpen(true);
                        }}>
                          <Globe className="h-4 w-4 mr-2" />
                          Generate Link
                        </Button>
                        <Button size="sm" asChild>
                          <Link href={`/portal/${job.id}`}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Preview
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-20 text-center text-slate-500">
              No active jobs found. Create a job to enable customer portal access.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Portal Link Dialog */}
      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Portal Link</DialogTitle>
            <DialogDescription>
              Create a secure link for client access to job details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {!generatedUrl ? (
              <>
                <div>
                  <Label className="block text-sm font-medium mb-2">
                    Select Job
                  </Label>
                  <select
                    className="w-full border border-slate-300 rounded-md h-10 px-3"
                    value={selectedJobId || ""}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                  >
                    <option value="">Select a job</option>
                    {activeJobs?.map((job: JobWithDetails) => (
                      <option key={job.id} value={job.id}>
                        {job.title}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="text-sm text-slate-500">
                  <p>The generated link will expire in 30 days and provides read-only access to:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Job details and progress</li>
                    <li>Project timeline</li>
                    <li>Approved documents</li>
                    <li>Invoice payment status</li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="portalUrl">Portal Link</Label>
                  <div className="flex mt-1">
                    <Input
                      id="portalUrl"
                      value={generatedUrl}
                      readOnly
                      className="rounded-r-none"
                    />
                    <Button
                      onClick={handleCopyToClipboard}
                      className="rounded-l-none"
                      variant="outline"
                    >
                      {copySuccess ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-md">
                  <p className="text-sm text-slate-600">
                    Share this link with your client via email or text message.
                    <br />
                    The link is valid for 30 days from now.
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <Button variant="outline" asChild>
                    <Link href={generatedUrl} target="_blank">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Preview Portal
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            {!generatedUrl ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setIsGenerateOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleGeneratePortalLink}
                  disabled={!selectedJobId}
                >
                  Generate Link
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => {
                  setGeneratedUrl(null);
                  setSelectedJobId(null);
                  setIsGenerateOpen(false);
                }}
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
