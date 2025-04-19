import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, Hammer, TruckIcon } from "lucide-react";
import { JobWithDetails } from "@/lib/types";

interface PortalTimelineProps {
  job: JobWithDetails;
}

export function PortalTimeline({ job }: PortalTimelineProps) {
  // Generate timeline events based on job stage
  const getTimelineEvents = () => {
    const events = [
      {
        id: 'quote_approved',
        title: 'Quote Approved',
        date: new Date(job.createdAt || new Date()),
        description: 'Project quote approved by client.',
        completed: true,
        icon: <CheckCircle className="text-xs text-green-500" />
      },
      {
        id: 'contract_signed',
        title: 'Contract Signed',
        date: new Date(new Date(job.startDate).getTime() - 10 * 24 * 60 * 60 * 1000),
        description: 'Contract signed and initial payment received.',
        completed: true,
        icon: <CheckCircle className="text-xs text-green-500" />
      },
      {
        id: 'materials_ordered',
        title: 'Materials Ordered',
        date: new Date(new Date(job.startDate).getTime() - 7 * 24 * 60 * 60 * 1000),
        description: 'Materials ordered for the project.',
        completed: job.stage !== 'planning',
        icon: job.stage !== 'planning' 
          ? <CheckCircle className="text-xs text-green-500" /> 
          : <TruckIcon className="text-xs text-slate-500" />
      },
      {
        id: 'work_in_progress',
        title: 'Work In Progress',
        date: new Date(job.startDate),
        description: 'Construction work has begun.',
        completed: ['in_progress', 'finishing', 'complete'].includes(job.stage),
        icon: ['in_progress', 'finishing', 'complete'].includes(job.stage)
          ? <CheckCircle className="text-xs text-green-500" />
          : <Hammer className="text-xs text-slate-500" />
      },
      {
        id: 'finishing_touches',
        title: 'Finishing Touches',
        date: new Date(new Date(job.endDate).getTime() - 7 * 24 * 60 * 60 * 1000),
        description: 'Final details and finishing work.',
        completed: ['finishing', 'complete'].includes(job.stage),
        icon: ['finishing', 'complete'].includes(job.stage)
          ? <CheckCircle className="text-xs text-green-500" />
          : <Hammer className="text-xs text-slate-500" />
      },
      {
        id: 'project_complete',
        title: 'Project Complete',
        date: new Date(job.endDate),
        description: 'Construction completed and final inspection done.',
        completed: job.stage === 'complete',
        icon: job.stage === 'complete'
          ? <CheckCircle className="text-xs text-green-500" />
          : <Clock className="text-xs text-slate-500" />
      }
    ];

    return events;
  };

  const timelineEvents = getTimelineEvents();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Project Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="relative border-l border-slate-200 ml-3">
          {timelineEvents.map((event) => (
            <li key={event.id} className="mb-6 ml-6">
              <span className={`absolute flex items-center justify-center w-6 h-6 ${
                event.completed ? 'bg-green-100' : 'bg-slate-100'
              } rounded-full -left-3 ring-8 ring-white`}>
                {event.icon}
              </span>
              <h3 className={`flex items-center mb-1 text-lg font-semibold ${
                event.completed ? 'text-slate-800' : 'text-slate-400'
              }`}>
                {event.title}
              </h3>
              <time className="block mb-2 text-sm font-normal text-slate-500">
                {event.date.toLocaleDateString('en-US', { 
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
              <p className={`text-base font-normal ${
                event.completed ? 'text-slate-600' : 'text-slate-400'
              }`}>
                {event.description}
              </p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
