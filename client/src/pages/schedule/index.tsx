import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { JobWithDetails } from "@/lib/types";
import { JobDetail } from "@/components/jobs/JobDetail";

export default function Schedule() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobWithDetails | null>(null);

  // Fetch jobs
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["/api/jobs"],
  });

  // Handle month navigation
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // Get month name and year
  const monthYear = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Get first day of month and total days
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Get day of week of first day (0 = Sunday, 6 = Saturday)
    const firstDayWeekday = firstDayOfMonth.getDay();
    
    // Create array for all cells in calendar (max 42 for 6 weeks)
    const days = [];
    
    // Add empty cells for days before first day of month
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(null);
    }
    
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  // Get jobs for a specific day
  const getJobsForDay = (date: Date) => {
    if (!jobs) return [];
    
    return jobs.filter((job: JobWithDetails) => {
      const jobStartDate = new Date(job.startDate);
      const jobEndDate = new Date(job.endDate);
      
      // Check if the date is between job start and end dates (inclusive)
      return date >= new Date(jobStartDate.setHours(0, 0, 0, 0)) && 
             date <= new Date(jobEndDate.setHours(23, 59, 59, 999));
    });
  };

  // Handle job click
  const handleJobClick = (job: JobWithDetails) => {
    setSelectedJob(job);
    setIsDetailOpen(true);
  };

  // Get stage color
  const getStageColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case "planning":
        return "bg-slate-100 text-slate-800";
      case "materials_ordered":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "finishing":
        return "bg-emerald-100 text-emerald-800";
      case "complete":
        return "bg-green-100 text-green-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const days = generateCalendarDays();
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <>
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Schedule</h1>
            <p className="mt-1 text-sm text-slate-500">View your job schedule calendar.</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center">
            <Button variant="outline" size="sm" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="mx-4 font-medium">{monthYear}</div>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button className="ml-4" size="sm">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Today
            </Button>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Job Calendar</CardTitle>
          <CardDescription>
            View and manage your scheduled jobs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-20 text-center text-slate-500">Loading schedule...</div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {/* Weekday headers */}
              {weekdays.map(day => (
                <div 
                  key={day}
                  className="p-2 text-center text-sm font-medium text-slate-500"
                >
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {days.map((date, index) => {
                // If day is null, it's an empty cell
                if (!date) {
                  return <div key={`empty-${index}`} className="min-h-[120px] bg-slate-50 border border-slate-100"></div>;
                }
                
                const isToday = new Date().toDateString() === date.toDateString();
                const dayJobs = getJobsForDay(date);
                
                return (
                  <div 
                    key={date.toISOString()}
                    className={`min-h-[120px] p-1 border border-slate-200 ${isToday ? 'bg-blue-50 border-blue-200' : ''}`}
                  >
                    <div className={`text-right p-1 text-sm ${isToday ? 'font-bold text-blue-600' : 'text-slate-600'}`}>
                      {date.getDate()}
                    </div>
                    
                    <div className="space-y-1">
                      {dayJobs.map((job: JobWithDetails) => (
                        <div
                          key={job.id}
                          onClick={() => handleJobClick(job)}
                          className={`p-1 text-xs rounded truncate cursor-pointer ${getStageColor(job.stage)}`}
                        >
                          {job.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
          </DialogHeader>
          {selectedJob && <JobDetail job={selectedJob} onStageChange={() => {}} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
