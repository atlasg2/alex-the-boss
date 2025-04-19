import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, FileText } from 'lucide-react';

type WebSocketContextType = {
  connected: boolean;
  lastUpdate: { type: string; data: any } | null;
};

const WebSocketContext = createContext<WebSocketContextType>({
  connected: false,
  lastUpdate: null
});

export const useWebSocket = () => useContext(WebSocketContext);

interface PortalWebSocketProviderProps {
  jobId: string;
  children: React.ReactNode;
}

export function PortalWebSocketProvider({ jobId, children }: PortalWebSocketProviderProps) {
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<{ type: string; data: any } | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const connectWebSocket = () => {
      // Close any existing connection
      if (socketRef.current) {
        socketRef.current.close();
      }

      // Create the WebSocket connection with the correct protocol
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('WebSocket connected');
        // Register for updates for this job
        socket.send(JSON.stringify({
          type: 'init',
          jobId
        }));
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('WebSocket message received:', message);

          if (message.type === 'connected') {
            setConnected(true);
            toast({
              title: 'Connected to live updates',
              description: 'You will receive real-time notifications about your project.',
              duration: 3000
            });
          } else if (message.type === 'update') {
            handleUpdate(message.data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        // Try to reconnect after a delay
        setTimeout(connectWebSocket, 5000);
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: 'Connection Error',
          description: 'Unable to connect to real-time updates. Retrying...',
          variant: 'destructive'
        });
      };
    };

    // Only connect if we have a jobId
    if (jobId) {
      connectWebSocket();
    }

    // Cleanup function to close the WebSocket when the component unmounts
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [jobId, toast]);

  const handleUpdate = (data: any) => {
    setLastUpdate({ type: data.type, data: data });

    // Show appropriate toast notification based on update type
    switch (data.type) {
      case 'job_update':
        toast({
          title: 'Project Updated',
          description: 'The project details have been updated.',
          duration: 5000
        });
        break;
      case 'new_file':
        toast({
          title: 'New File Added',
          description: `${data.file.label || data.file.filename} has been added to your project.`,
          duration: 5000
        });
        break;
      case 'new_message':
        toast({
          title: 'New Message',
          description: 'You have received a new message.',
          duration: 5000
        });
        break;
      case 'new_note':
        toast({
          title: 'Project Note Added',
          description: 'A new note has been added to your project.',
          duration: 5000
        });
        break;
      default:
        console.log('Unknown update type:', data.type);
    }
  };

  return (
    <WebSocketContext.Provider value={{ connected, lastUpdate }}>
      {children}
    </WebSocketContext.Provider>
  );
}