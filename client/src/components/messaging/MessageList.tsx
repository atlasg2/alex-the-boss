import { Message } from "@/lib/types";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  contactName: string;
}

export function MessageList({ messages, isLoading, contactName }: MessageListProps) {
  if (isLoading) {
    return <div className="text-center py-10 text-slate-500">Loading messages...</div>;
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500">
        No messages yet. Start a conversation with {contactName}.
      </div>
    );
  }

  // Group messages by date
  const groupedMessages: { [date: string]: Message[] } = {};
  messages.forEach((message) => {
    const date = new Date(message.createdAt).toLocaleDateString();
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });

  return (
    <div className="space-y-6">
      {Object.entries(groupedMessages).map(([date, msgs]) => (
        <div key={date}>
          <div className="text-center mb-4">
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
              {date}
            </span>
          </div>
          
          <div className="space-y-4">
            {msgs.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.direction === "outbound" ? "justify-end" : "justify-start"}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.direction === "outbound" 
                      ? "bg-primary text-white" 
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {message.subject && (
                    <div className={`font-medium mb-1 ${
                      message.direction === "outbound" ? "text-white" : "text-slate-800"
                    }`}>
                      {message.subject}
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-wrap">{message.body}</div>
                  <div className={`text-xs mt-1 text-right ${
                    message.direction === "outbound" ? "text-white/70" : "text-slate-500"
                  }`}>
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
