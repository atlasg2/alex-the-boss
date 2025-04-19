import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JobWithDetails } from "@/lib/types";

interface PortalJobOverviewProps {
  job: JobWithDetails;
}

export function PortalJobOverview({ job }: PortalJobOverviewProps) {
  // Calculate progress percentage based on stage
  const getProgressPercentage = () => {
    switch (job.stage) {
      case "planning": return 10;
      case "materials_ordered": return 30;
      case "in_progress": return 50;
      case "finishing": return 80;
      case "complete": return 100;
      default: return 0;
    }
  };

  // Format stage label for display
  const formatStageLabel = (stage: string) => {
    return stage.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-slate-800">{job.title}</h3>
          <p className="text-slate-600 mt-1">{job.siteAddress}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="border border-slate-200 rounded-md p-4">
            <div className="text-sm font-medium text-slate-500">Start Date</div>
            <div className="mt-1 text-lg font-semibold text-slate-800">
              {new Date(job.startDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
          <div className="border border-slate-200 rounded-md p-4">
            <div className="text-sm font-medium text-slate-500">Estimated Completion</div>
            <div className="mt-1 text-lg font-semibold text-slate-800">
              {new Date(job.endDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
          <div className="border border-slate-200 rounded-md p-4">
            <div className="text-sm font-medium text-slate-500">Project Status</div>
            <div className="mt-1">
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                {formatStageLabel(job.stage)}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="relative pt-1">
          <div className="text-sm font-medium text-slate-700 mb-2">
            Project Progress ({getProgressPercentage()}%)
          </div>
          <div className="overflow-hidden h-2 text-xs flex rounded bg-slate-200">
            <div 
              style={{ width: `${getProgressPercentage()}%` }} 
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
