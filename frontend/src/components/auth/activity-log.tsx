import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Clock, MapPin, Monitor, LogIn, LogOut, Key, Shield, Loader2, RefreshCw } from "lucide-react";
import { account } from "@/lib/appwrite";
import { toast } from "react-hot-toast";

interface ActivityLogProps {
  userId?: string;
}

interface LogEntry {
  id: string;
  event: string;
  time: string;
  location?: string;
  device?: string;
  ip?: string;
}

export default function ActivityLog({ userId }: ActivityLogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    loadActivityLog();
  }, []);

  const loadActivityLog = async () => {
    setIsLoading(true);
    try {
      // Get sessions to simulate activity log
      const sessions = await account.listSessions();
      
      // Transform sessions into log entries
      const logEntries: LogEntry[] = sessions.sessions.map((session: any) => ({
        id: session.$id,
        event: session.current ? 'Current Session Started' : 'Session Started',
        time: new Date(session.$createdAt).toLocaleString(),
        location: session.countryName || 'Unknown Location',
        device: `${session.clientName} on ${session.osName}`,
        ip: session.ip
      }));

      // Add some mock historical events for demonstration
      const mockEvents: LogEntry[] = [
        {
          id: 'mock-1',
          event: 'Password Changed',
          time: new Date(Date.now() - 86400000 * 3).toLocaleString(),
          device: 'Chrome on macOS'
        },
        {
          id: 'mock-2', 
          event: 'MFA Enabled',
          time: new Date(Date.now() - 86400000 * 7).toLocaleString(),
          device: 'Chrome on macOS'
        },
        {
          id: 'mock-3',
          event: 'Account Created',
          time: new Date(Date.now() - 86400000 * 30).toLocaleString(),
          device: 'Chrome on macOS'
        }
      ];

      setLogs([...logEntries, ...mockEvents]);
    } catch (err) {
      console.error("Failed to load activity log:", err);
      toast.error("Failed to load activity log");
    } finally {
      setIsLoading(false);
    }
  };

  const getEventIcon = (event: string) => {
    if (event.includes('Session')) return <LogIn className="h-4 w-4" />;
    if (event.includes('Password')) return <Key className="h-4 w-4" />;
    if (event.includes('MFA')) return <Shield className="h-4 w-4" />;
    if (event.includes('Logout')) return <LogOut className="h-4 w-4" />;
    return <History className="h-4 w-4" />;
  };

  const getEventColor = (event: string) => {
    if (event.includes('Current')) return 'bg-green-500';
    if (event.includes('Password') || event.includes('MFA')) return 'bg-blue-500';
    if (event.includes('Logout') || event.includes('Failed')) return 'bg-orange-500';
    return 'bg-muted-foreground';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Activity Log</CardTitle>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadActivityLog}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
        <CardDescription>
          Recent security events and login activity for your account
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Loading activity...</span>
          </div>
        ) : logs.length > 0 ? (
          <div className="space-y-4">
            {logs.slice(0, 10).map((log, index) => (
              <div
                key={log.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  index === 0 ? 'bg-accent/30' : 'bg-muted/30'
                }`}
              >
                <div className={`p-2 rounded-full ${getEventColor(log.event)} text-white`}>
                  {getEventIcon(log.event)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-sm">{log.event}</h4>
                    {log.event.includes('Current') && (
                      <Badge variant="outline" className="text-xs">Active Now</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {log.time}
                    </span>
                    {log.device && (
                      <span className="flex items-center gap-1">
                        <Monitor className="h-3 w-3" />
                        {log.device}
                      </span>
                    )}
                    {log.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {log.location}
                      </span>
                    )}
                  </div>
                  {log.ip && (
                    <p className="text-xs text-muted-foreground mt-1">
                      IP: {log.ip}
                    </p>
                  )}
                </div>
              </div>
            ))}
            
            {logs.length > 10 && (
              <Button variant="outline" className="w-full">
                View All Activity ({logs.length} events)
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Activity Yet</h3>
            <p className="text-sm text-muted-foreground">
              Your security events and login activity will appear here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
