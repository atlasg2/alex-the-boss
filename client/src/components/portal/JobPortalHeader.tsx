import { ContactWithDetail } from "@/lib/types";

interface JobPortalHeaderProps {
  contact: ContactWithDetail;
}

export function JobPortalHeader({ contact }: JobPortalHeaderProps) {
  return (
    <div className="px-6 py-4 bg-primary text-white">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-white rounded-md w-8 h-8 flex items-center justify-center text-primary font-bold">P</div>
          <span className="ml-2 text-xl font-semibold">Pereira Construction</span>
        </div>
        <div className="text-sm">
          <div className="font-medium">Welcome, {contact.firstName} {contact.lastName}</div>
          {contact.email && <div className="text-white/80 text-xs">{contact.email}</div>}
        </div>
      </div>
    </div>
  );
}
