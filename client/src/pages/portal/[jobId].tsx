import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { verifyPortalToken } from "@/lib/auth";
import { PortalData } from "@/lib/types";
import { JobPortalHeader } from "@/components/portal/JobPortalHeader";
import { PortalJobOverview } from "@/components/portal/PortalJobOverview";
import { PortalTimeline } from "@/components/portal/PortalTimeline";
import { PortalDocuments } from "@/components/portal/PortalDocuments";
import { PortalPhotos } from "@/components/portal/PortalPhotos";
import { ContactManager } from "@/components/portal/ContactManager";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

export default function JobPortal() {
  const [, params] = useRoute<{ jobId: string }>("/portal/:jobId");
  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPortalData = async () => {
      try {
        if (!params?.jobId) {
          setError("Invalid portal URL");
          setLoading(false);
          return;
        }

        const token = params.jobId;
        const result = await verifyPortalToken(token);
        
        if (result.success) {
          setPortalData(result.data);
        } else {
          setError("This portal link is invalid or has expired.");
        }
      } catch (err) {
        setError("There was an error loading the portal data.");
        console.error("Portal data error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPortalData();
  }, [params?.jobId]);

  // If loading, show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <h1 className="text-xl font-medium text-slate-800">Loading portal data...</h1>
          <p className="text-slate-500 mt-1">Please wait while we prepare your project dashboard.</p>
        </div>
      </div>
    );
  }

  // If error, show error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Portal Access Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-6 text-center">
            <a href="/" className="text-primary hover:underline">Return to homepage</a>
          </div>
        </div>
      </div>
    );
  }

  // If no portal data, show not found
  if (!portalData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Portal Not Found</h1>
          <p className="text-slate-600 mb-6">The portal you're looking for doesn't exist or has expired.</p>
          <a href="/" className="text-primary hover:underline">Return to homepage</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <JobPortalHeader contact={portalData.contact} />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-semibold text-slate-800 mb-6">Your Project Dashboard</h1>
        
        <div className="space-y-8">
          {/* Project Overview Section */}
          <PortalJobOverview job={portalData.job} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Project Timeline */}
            <PortalTimeline job={portalData.job} />
            
            {/* Project Documents */}
            <PortalDocuments 
              invoices={portalData.invoices} 
              files={portalData.files}
              contract={portalData.contract}
              quote={portalData.quote}
            />
          </div>
          
          {/* Project Photos */}
          <PortalPhotos files={portalData.files} />
          
          {/* Contact Section */}
          <ContactManager />
        </div>
      </div>
    </div>
  );
}
