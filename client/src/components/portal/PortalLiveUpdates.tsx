import React from 'react';
import { useWebSocket } from './PortalWebSocketProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CircleDot, Wifi, WifiOff, Timer, MessageCircle, FileText, Pen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export function PortalLiveUpdates() {
  const { connected, lastUpdate } = useWebSocket();

  // Format relative time for update
  const getRelativeTime = () => {
    if (!lastUpdate) return '';
    return formatDistanceToNow(new Date(), { addSuffix: true });
  };

  // Determine the icon to display based on update type
  const getUpdateIcon = () => {
    if (!lastUpdate) return <Timer className="h-4 w-4" />;

    switch (lastUpdate.data.type) {
      case 'job_update':
        return <CircleDot className="h-4 w-4" />;
      case 'new_file':
        return <FileText className="h-4 w-4" />;
      case 'new_message':
        return <MessageCircle className="h-4 w-4" />;
      case 'new_note':
        return <Pen className="h-4 w-4" />;
      default:
        return <Timer className="h-4 w-4" />;
    }
  };

  // Get update description
  const getUpdateDescription = () => {
    if (!lastUpdate) return 'No updates yet';

    switch (lastUpdate.data.type) {
      case 'job_update':
        return 'Project details have been updated';
      case 'new_file':
        return `New file: ${lastUpdate.data.file.label || lastUpdate.data.file.filename}`;
      case 'new_message':
        return 'New message received';
      case 'new_note':
        return 'New project note added';
      default:
        return 'Project was updated';
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>Live Updates</span>
          {connected ? (
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
              <Wifi className="h-3 w-3" />
              <span>Connected</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-200 flex items-center gap-1">
              <WifiOff className="h-3 w-3" />
              <span>Connecting...</span>
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn(
          "flex items-center gap-2 text-sm p-2 rounded-md",
          lastUpdate ? "bg-blue-50" : "bg-slate-50"
        )}>
          <div className="p-1.5 bg-white rounded-full shadow-sm">
            {getUpdateIcon()}
          </div>
          <div className="flex-1">
            <p className="font-medium">{getUpdateDescription()}</p>
            {lastUpdate && (
              <p className="text-xs text-slate-500">{getRelativeTime()}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}