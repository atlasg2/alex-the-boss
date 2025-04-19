import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  FileSpreadsheet, 
  FolderOpen, 
  HardHat, 
  MapPin, 
  Clock, 
  Plus,
  Upload,
  MessageSquare,
  ExternalLink
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { JobDetail } from "@/components/jobs/JobDetail";
import { FileUpload } from "@/components/jobs/FileUpload";
import { ContactWithDetail } from "@/lib/types";
import { generatePortalToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function Jobs() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [formValues, setFormValues] = useState({
    contractId: "",
    title: "",
    siteAddress: "",
    stage: "planning",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  });

  // Fetch jobs
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["/api/jobs"],
  });

  // Fetch contracts for job creation
  const { data: contracts } = useQuery({
    queryKey: ["/api/contracts"],
  });

  // Fetch quotes for display
  const { data: quotes } = useQuery({
    queryKey: ["/api/quotes"],
  });

  // Fetch contacts for display
  const { data: contacts } = useQuery({
    queryKey: ["/api/contacts"],
  });

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: async (data: typeof formValues) => {
      return apiRequest("POST", "/api/jobs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setIsCreateOpen(false);
      resetForm();
    },
  });

  // Update job status mutation
  const updateJobStageMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      return apiRequest("PUT", `/api/jobs/${id}`, { stage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
    },
  });

  // Reset form
  const resetForm = () => {
    setFormValues({
      contractId: "",
      title: "",
      siteAddress: "",
      stage: "planning",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    });
  };

  // Handle job creation
  const handleCreateJob = () => {
    createJobMutation.mutate(formValues);
  };

  // Handle job detail view
  const handleViewJobDetail = (job: any) => {
    setSelectedJob(job);
    setIsDetailOpen(true);
  };

  // Handle stage update
  const handleUpdateStage = (jobId: string, newStage: string) => {
    updateJobStageMutation.mutate({ id: jobId, stage: newStage });
  };
  
  // Portal access management
  const { toast } = useToast();
  const handleCreatePortalAccess = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening job details
    
    try {
      const result = await generatePortalToken(jobId);
      if (result.success) {
        // Create URL with the token
        const portalUrl = `${window.location.origin}/portal/${result.token}`;
        
        // Copy to clipboard
        await navigator.clipboard.writeText(portalUrl);
        
        toast({
          title: "Portal Link Created!",
          description: "The client portal link has been copied to your clipboard.",
        });
        
        // Open portal in new tab
        window.open(`/portal/${result.token}`, '_blank');
      } else {
        toast({
          title: "Error Creating Portal Link",
          description: "There was a problem generating the portal link.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Portal access error:", error);
      toast({
        title: "Error Creating Portal Link",
        description: "There was a problem generating the portal link.",
        variant: "destructive"
      });
    }
  };

  // Helper to get stage badge
  const getStageBadge = (stage: string) => {
    switch (stage.toLowerCase()) {
      case "planning":
        return <Badge variant="outline" className="bg-slate-100 text-slate-800">Planning</Badge>;
      case "materials_ordered":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Materials Ordered</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case "finishing":
        return <Badge variant="outline" className="bg-emerald-100 text-emerald-800">Finishing</Badge>;
      case "complete":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Complete</Badge>;
      default:
        return <Badge variant="outline">{stage}</Badge>;
    }
  };

  // Find contracts for job creation
  const availableContracts = contracts?.filter((contract: any) => 
    contract.status === "active" && 
    !jobs?.some((job: any) => job.contractId === contract.id)
  );

  return (
    <>
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Jobs</h1>
            <p className="mt-1 text-sm text-slate-500">Manage and track your construction projects.</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button disabled={!availableContracts?.length}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Job
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Job</DialogTitle>
                  <DialogDescription>
                    Create a job for an active contract.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-4 space-y-4">
                  <div>
                    <Label className="block text-sm font-medium mb-2">
                      Select Contract
                    </Label>
                    <Select 
                      value={formValues.contractId} 
                      onValueChange={(value) => setFormValues({...formValues, contractId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a contract" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableContracts?.map((contract: any) => {
                          const quote = quotes?.find((q: any) => q.id === contract.quoteId);
                          const contact = quote ? contacts?.find((c: any) => c.id === quote.contactId) : null;
                          
                          return (
                            <SelectItem key={contract.id} value={contract.id}>
                              {contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown'} - C-{contract.id.substring(0, 8)}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input
                      id="jobTitle"
                      value={formValues.title}
                      onChange={(e) => setFormValues({...formValues, title: e.target.value})}
                      placeholder="e.g. Kitchen Renovation"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="siteAddress">Site Address</Label>
                    <Input
                      id="siteAddress"
                      value={formValues.siteAddress}
                      onChange={(e) => setFormValues({...formValues, siteAddress: e.target.value})}
                      placeholder="123 Main St, Boston, MA"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formValues.startDate}
                        onChange={(e) => setFormValues({...formValues, startDate: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formValues.endDate}
                        onChange={(e) => setFormValues({...formValues, endDate: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateJob}
                    disabled={!formValues.contractId || !formValues.title || createJobMutation.isPending}
                  >
                    Create Job
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Kanban view for jobs */}
      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle>Jobs by Stage</CardTitle>
          <CardDescription>
            Drag jobs between stages to update their status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-20 text-center text-slate-500">Loading jobs...</div>
          ) : jobs?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
              {["planning", "materials_ordered", "in_progress", "finishing", "complete"].map(stage => {
                const stageJobs = jobs.filter((job: any) => job.stage === stage);
                
                return (
                  <div key={stage} className="border border-slate-200 rounded-md p-4">
                    <h3 className="font-medium mb-3 flex items-center">
                      {stage === "planning" && <HardHat className="h-4 w-4 mr-2" />}
                      {stage === "materials_ordered" && <FileSpreadsheet className="h-4 w-4 mr-2" />}
                      {stage === "in_progress" && <HardHat className="h-4 w-4 mr-2" />}
                      {stage === "finishing" && <HardHat className="h-4 w-4 mr-2" />}
                      {stage === "complete" && <FolderOpen className="h-4 w-4 mr-2" />}
                      {stage.replace('_', ' ').charAt(0).toUpperCase() + stage.replace('_', ' ').slice(1)}
                      <span className="ml-2 text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-600">
                        {stageJobs.length}
                      </span>
                    </h3>
                    
                    <div className="space-y-3">
                      {stageJobs.map((job: any) => {
                        const contract = contracts?.find((c: any) => c.id === job.contractId);
                        const quote = contract ? quotes?.find((q: any) => q.id === contract.quoteId) : null;
                        const contact = quote ? contacts?.find((c: any) => c.id === quote.contactId) : null;
                        
                        return (
                          <div 
                            key={job.id}
                            className="border border-slate-200 rounded-md p-3 bg-white cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => handleViewJobDetail(job)}
                          >
                            <h4 className="font-medium text-slate-800">{job.title}</h4>
                            
                            {contact && (
                              <div className="text-xs text-slate-500 mt-1">
                                {contact.firstName} {contact.lastName}
                                {contact.companyName && ` (${contact.companyName})`}
                              </div>
                            )}
                            
                            <div className="flex items-center text-xs text-slate-500 mt-2">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span className="truncate">{job.siteAddress}</span>
                            </div>
                            
                            <div className="flex items-center text-xs text-slate-500 mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>
                                {new Date(job.startDate).toLocaleDateString()} - {new Date(job.endDate).toLocaleDateString()}
                              </span>
                            </div>
                            
                            {/* Client Portal Link */}
                            <div className="flex justify-end mt-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-xs py-0 h-7 px-2 flex items-center"
                                onClick={(e) => handleCreatePortalAccess(job.id, e)}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Client Portal
                              </Button>
                            </div>
                            
                            {/* Stage controls */}
                            {stage !== "planning" && (
                              <button 
                                className="text-xs text-slate-500 mt-2 hover:text-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const prevStages: Record<string, string> = {
                                    "materials_ordered": "planning",
                                    "in_progress": "materials_ordered",
                                    "finishing": "in_progress",
                                    "complete": "finishing"
                                  };
                                  handleUpdateStage(job.id, prevStages[stage]);
                                }}
                              >
                                ← Move back
                              </button>
                            )}
                            
                            {stage !== "complete" && (
                              <button 
                                className="text-xs text-slate-500 mt-2 ml-3 hover:text-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const nextStages: Record<string, string> = {
                                    "planning": "materials_ordered",
                                    "materials_ordered": "in_progress",
                                    "in_progress": "finishing",
                                    "finishing": "complete"
                                  };
                                  handleUpdateStage(job.id, nextStages[stage]);
                                }}
                              >
                                Move forward →
                              </button>
                            )}
                          </div>
                        );
                      })}
                      
                      {stageJobs.length === 0 && (
                        <div className="text-center py-6 text-slate-400 text-sm">
                          No jobs in this stage
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center text-slate-500">
              No jobs found. Create your first job to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen} modal={false}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-auto">
          {selectedJob && (
            <Tabs defaultValue="overview">
              <DialogHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <DialogTitle className="text-xl">{selectedJob.title}</DialogTitle>
                    <DialogDescription className="mt-1">
                      {selectedJob.siteAddress}
                    </DialogDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStageBadge(selectedJob.stage)}
                    <Button 
                      size="sm" 
                      onClick={(e) => handleCreatePortalAccess(selectedJob.id, e)}
                      className="flex items-center"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Client Portal
                    </Button>
                  </div>
                </div>
                
                <TabsList className="mt-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="files">Files</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>
              </DialogHeader>
              
              <TabsContent value="overview">
                <JobDetail 
                  job={selectedJob} 
                  onStageChange={(stage) => handleUpdateStage(selectedJob.id, stage)}
                />
              </TabsContent>
              
              <TabsContent value="files">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Job Files</h3>
                    <Button size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Files
                    </Button>
                  </div>
                  
                  <FileUpload jobId={selectedJob.id} />
                </div>
              </TabsContent>
              
              <TabsContent value="notes">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Job Notes</h3>
                    <Button size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Add Note
                    </Button>
                  </div>
                  
                  <div className="border border-slate-200 rounded-md p-4">
                    <div className="flex items-start mb-2">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white mr-3">
                        M
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">Mike Pereira</p>
                        <p className="text-xs text-slate-500">{new Date().toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 mt-2">
                      Demolition phase completed today. Old cabinets and countertops removed. Plumbing and electrical work to begin tomorrow.
                    </p>
                  </div>
                  
                  {/* Empty note state */}
                  <div className="text-center py-8 text-slate-500">
                    No additional notes yet.
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
