import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobWithDetails } from "@/lib/types";

interface JobCardProps {
  job: JobWithDetails;
}

const getStageColor = (stage: string) => {
  switch (stage.toLowerCase()) {
    case "planning":
      return "bg-gray-100 text-gray-800";
    case "materials_ordered":
      return "bg-yellow-100 text-yellow-800";
    case "in_progress":
      return "bg-blue-100 text-blue-800";
    case "finishing":
      return "bg-emerald-100 text-emerald-800";
    case "complete":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStageLabel = (stage: string) => {
  switch (stage.toLowerCase()) {
    case "materials_ordered":
      return "Materials Ordered";
    case "in_progress":
      return "In Progress";
    default:
      return stage.charAt(0).toUpperCase() + stage.slice(1).replace("_", " ");
  }
};

export function JobCard({ job }: JobCardProps) {
  const { id, title, siteAddress, stage, startDate, endDate } = job;
  
  const formattedStartDate = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const formattedEndDate = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const dateRange = `${formattedStartDate} - ${formattedEndDate}`;

  return (
    <div className="p-6 border-b border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-base font-medium text-slate-800">{title}</h4>
          <div className="mt-1 text-sm text-slate-500">{siteAddress}</div>
          <div className="mt-2 flex items-center text-sm">
            <Badge variant="outline" className={getStageColor(stage)}>
              {getStageLabel(stage)}
            </Badge>
            <span className="ml-3 text-slate-500 flex items-center">
              <Calendar className="mr-1 h-4 w-4" />
              <span>{dateRange}</span>
            </span>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 flex">
          <Link href={`/jobs/${id}`}>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
