import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckCircle, Clock, Hammer, TruckIcon, AlertTriangle, 
  FileCheck, CircleDot, Calendar, ArrowRight, ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { JobWithDetails } from "@/lib/types";

interface PortalTimelineProps {
  job: JobWithDetails;
}

export function PortalTimeline({ job }: PortalTimelineProps) {
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [expandedTimeline, setExpandedTimeline] = useState(false);
  
  // Generate timeline events based on job stage with more detailed info
  const getTimelineEvents = () => {
    const events = [
      {
        id: 'quote_approved',
        title: 'Quote Approved',
        date: new Date(job.startDate ? new Date(job.startDate).getTime() - 15 * 24 * 60 * 60 * 1000 : new Date()),
        description: 'Project quote approved by client.',
        detailedDescription: 'You approved the project quote, which includes all materials, labor, and estimated timeline.',
        completed: true,
        current: false,
        icon: <CheckCircle className="text-xs text-green-500" />,
        status: 'completed',
        attachments: [{
          name: 'Project Quote',
          type: 'PDF'
        }],
        updates: [{
          date: new Date(job.startDate ? new Date(job.startDate).getTime() - 15 * 24 * 60 * 60 * 1000 : new Date()),
          message: 'Quote approved and project initiated.'
        }]
      },
      {
        id: 'contract_signed',
        title: 'Contract Signed',
        date: new Date(new Date(job.startDate).getTime() - 10 * 24 * 60 * 60 * 1000),
        description: 'Contract signed and initial payment received.',
        detailedDescription: 'The contract was signed and the initial payment was received. This marks the official start of our agreement.',
        completed: true,
        current: false,
        icon: <FileCheck className="text-xs text-green-500" />,
        status: 'completed',
        attachments: [{
          name: 'Project Contract',
          type: 'PDF'
        }],
        updates: [{
          date: new Date(new Date(job.startDate).getTime() - 10 * 24 * 60 * 60 * 1000),
          message: 'Contract signed electronically and payment processed.'
        }]
      },
      {
        id: 'materials_ordered',
        title: 'Materials Ordered',
        date: new Date(new Date(job.startDate).getTime() - 7 * 24 * 60 * 60 * 1000),
        description: 'Materials ordered for the project.',
        detailedDescription: 'All necessary materials have been ordered from our suppliers. This includes lumber, fixtures, and specialty items for your project.',
        completed: job.stage !== 'planning',
        current: job.stage === 'materials_ordered',
        icon: job.stage !== 'planning' 
          ? <CheckCircle className="text-xs text-green-500" /> 
          : <TruckIcon className="text-xs text-slate-500" />,
        status: job.stage === 'planning' ? 'upcoming' : (job.stage === 'materials_ordered' ? 'in-progress' : 'completed'),
        attachments: job.stage !== 'planning' ? [{
          name: 'Materials List',
          type: 'PDF'
        }] : [],
        updates: job.stage !== 'planning' ? [{
          date: new Date(new Date(job.startDate).getTime() - 7 * 24 * 60 * 60 * 1000),
          message: 'All materials ordered with expected delivery in 3-5 business days.'
        }] : []
      },
      {
        id: 'work_in_progress',
        title: 'Work In Progress',
        date: new Date(job.startDate),
        description: 'Construction work has begun.',
        detailedDescription: 'Our team has begun the construction phase of your project. Regular updates and photos will be provided as work progresses.',
        completed: ['in_progress', 'finishing', 'complete'].includes(job.stage),
        current: job.stage === 'in_progress',
        icon: ['in_progress', 'finishing', 'complete'].includes(job.stage)
          ? <CheckCircle className="text-xs text-green-500" />
          : <Hammer className="text-xs text-slate-500" />,
        status: !['in_progress', 'finishing', 'complete'].includes(job.stage) ? 'upcoming' : 
                (job.stage === 'in_progress' ? 'in-progress' : 'completed'),
        attachments: ['in_progress', 'finishing', 'complete'].includes(job.stage) ? [{
          name: 'Progress Report',
          type: 'PDF'
        }] : [],
        updates: ['in_progress', 'finishing', 'complete'].includes(job.stage) ? [
          {
            date: new Date(job.startDate),
            message: 'Construction has officially begun on site.'
          },
          {
            date: new Date(new Date(job.startDate).getTime() + 3 * 24 * 60 * 60 * 1000),
            message: 'Initial framing complete, moving to next phase.'
          }
        ] : []
      },
      {
        id: 'finishing_touches',
        title: 'Finishing Touches',
        date: new Date(new Date(job.endDate).getTime() - 7 * 24 * 60 * 60 * 1000),
        description: 'Final details and finishing work.',
        detailedDescription: 'We are completing the final details of your project, including paint touch-ups, fixture installations, and final clean-up.',
        completed: ['finishing', 'complete'].includes(job.stage),
        current: job.stage === 'finishing',
        icon: ['finishing', 'complete'].includes(job.stage)
          ? <CheckCircle className="text-xs text-green-500" />
          : <Hammer className="text-xs text-slate-500" />,
        status: !['finishing', 'complete'].includes(job.stage) ? 'upcoming' : 
                (job.stage === 'finishing' ? 'in-progress' : 'completed'),
        attachments: ['finishing', 'complete'].includes(job.stage) ? [{
          name: 'Final Inspection Checklist',
          type: 'PDF'
        }] : [],
        updates: ['finishing', 'complete'].includes(job.stage) ? [{
          date: new Date(new Date(job.endDate).getTime() - 7 * 24 * 60 * 60 * 1000),
          message: 'Beginning final touches and detail work.'
        }] : []
      },
      {
        id: 'project_complete',
        title: 'Project Complete',
        date: new Date(job.endDate),
        description: 'Construction completed and final inspection done.',
        detailedDescription: 'Your project has been completed to specifications. A final walkthrough has been conducted and all items have been addressed.',
        completed: job.stage === 'complete',
        current: job.stage === 'complete',
        icon: job.stage === 'complete'
          ? <CheckCircle className="text-xs text-green-500" />
          : <Clock className="text-xs text-slate-500" />,
        status: job.stage !== 'complete' ? 'upcoming' : 'completed',
        attachments: job.stage === 'complete' ? [
          {
            name: 'Final Inspection Report',
            type: 'PDF'
          },
          {
            name: 'Project Warranty',
            type: 'PDF'
          }
        ] : [],
        updates: job.stage === 'complete' ? [{
          date: new Date(job.endDate),
          message: 'Project successfully completed and final inspection passed.'
        }] : []
      }
    ];

    return events;
  };

  const timelineEvents = getTimelineEvents();
  
  // Get the current event
  const currentEvent = timelineEvents.find(event => event.current);
  
  // Get events to display (all if expanded, otherwise only completed + current + next)
  const displayEvents = expandedTimeline ? 
    timelineEvents : 
    timelineEvents.filter(event => 
      event.completed || 
      event.current || 
      timelineEvents.indexOf(event) === 
        timelineEvents.findIndex(e => !e.completed && !e.current) // next event
    );

  // Helper to get status badge
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'in-progress':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">In Progress</Badge>;
      case 'upcoming':
        return <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-200">Upcoming</Badge>;
      default:
        return null;
    }
  };
  
  // Open event details dialog
  const openEventDetails = (event: any) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex justify-between items-center">
            <span>Project Timeline</span>
            {currentEvent && (
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                Current Stage: {currentEvent.title}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="relative border-l border-slate-200 ml-3">
            {displayEvents.map((event, index) => (
              <li 
                key={event.id} 
                className={`mb-6 ml-6 ${event.current ? 'animate-pulse-slow' : ''}`}
              >
                <span className={`absolute flex items-center justify-center w-6 h-6 ${
                  event.completed ? 'bg-green-100' : (event.current ? 'bg-blue-100' : 'bg-slate-100')
                } rounded-full -left-3 ring-8 ring-white`}>
                  {event.icon}
                </span>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={`flex items-center mb-1 text-lg font-semibold ${
                      event.completed ? 'text-slate-800' : (event.current ? 'text-blue-800' : 'text-slate-400')
                    }`}>
                      {event.title}
                      {event.current && (
                        <span className="ml-2 text-xs font-medium bg-blue-100 text-blue-800 rounded-full px-2 py-0.5">
                          Current
                        </span>
                      )}
                    </h3>
                    <time className="block mb-2 text-sm font-normal text-slate-500 flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      {event.date.toLocaleDateString('en-US', { 
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </time>
                    <p className={`text-base font-normal ${
                      event.completed ? 'text-slate-600' : (event.current ? 'text-slate-600' : 'text-slate-400')
                    }`}>
                      {event.description}
                    </p>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-slate-500 hover:text-primary"
                    onClick={() => openEventDetails(event)}
                  >
                    Details
                  </Button>
                </div>
                
                {/* Show updates if there are any */}
                {event.updates && event.updates.length > 0 && event.current && (
                  <div className="mt-3 pl-4 border-l-2 border-blue-200">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Latest Updates</h4>
                    {event.updates.slice(0, 2).map((update, i) => (
                      <div key={i} className="mb-2">
                        <div className="flex items-center text-xs text-slate-500">
                          <CircleDot className="h-2 w-2 mr-1" />
                          {update.date.toLocaleDateString()}
                        </div>
                        <p className="text-sm text-slate-600">{update.message}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Show "next step" indicator */}
                {event.current && index < timelineEvents.length - 1 && (
                  <div className="mt-4 flex items-center text-sm text-blue-600">
                    <span>Next Step: {timelineEvents[index + 1].title}</span>
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </div>
                )}
              </li>
            ))}
          </ol>
          
          {/* Toggle button to show more/less events */}
          {timelineEvents.length > 3 && (
            <Button 
              variant="ghost" 
              className="w-full text-slate-500 mt-2"
              onClick={() => setExpandedTimeline(!expandedTimeline)}
            >
              {expandedTimeline ? (
                <>
                  <ChevronUp className="mr-1 h-4 w-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="mr-1 h-4 w-4" />
                  Show Full Timeline
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
      
      {/* Event Details Dialog */}
      {selectedEvent && (
        <Dialog open={showEventDetails} onOpenChange={setShowEventDetails}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <span>{selectedEvent.title}</span>
                {getStatusBadge(selectedEvent.status)}
              </DialogTitle>
              <DialogDescription>
                {selectedEvent.date.toLocaleDateString('en-US', { 
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-1">Description</h3>
                <p className="text-slate-800">{selectedEvent.detailedDescription}</p>
              </div>
              
              {selectedEvent.attachments && selectedEvent.attachments.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-2">Related Documents</h3>
                  <ul className="space-y-2">
                    {selectedEvent.attachments.map((attachment: any, i: number) => (
                      <li key={i} className="flex items-center">
                        <FileCheck className="h-4 w-4 mr-2 text-primary" />
                        <span className="text-slate-700">{attachment.name}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {attachment.type}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {selectedEvent.updates && selectedEvent.updates.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-2">Timeline Updates</h3>
                  <ul className="space-y-3">
                    {selectedEvent.updates.map((update: any, i: number) => (
                      <li key={i} className="border-l-2 border-slate-200 pl-3 py-1">
                        <div className="text-xs text-slate-500">
                          {update.date.toLocaleDateString()}
                        </div>
                        <div className="text-slate-700 mt-1">{update.message}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="ghost" size="sm" onClick={() => setShowEventDetails(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
