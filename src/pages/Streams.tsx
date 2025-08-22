import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Workflow, Clock, Activity, Play, Pause, Download, Trash2, Eye, Plus } from "lucide-react";
import { useStreamStore, useDatasetStore, useRuleStore } from "@/stores";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function Streams() {
  const { streams, revokeStream, removeStream } = useStreamStore();
  const { datasets } = useDatasetStore();
  const { rules } = useRuleStore();
  const [selectedStream, setSelectedStream] = useState<any>(null);

  // Helper function to get time remaining
  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return { expired: true, text: "Expired" };
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return { expired: false, text: `${days}d ${hours % 24}h`, urgent: days <= 1 };
    } else if (hours > 0) {
      return { expired: false, text: `${hours}h`, urgent: hours <= 24 };
    } else {
      const minutes = Math.floor(diff / (1000 * 60));
      return { expired: false, text: `${minutes}m`, urgent: true };
    }
  };

  const handleRevoke = (streamId: string) => {
    revokeStream(streamId);
    toast.success('Stream revoked successfully');
  };

  const handleDelete = (streamId: string) => {
    removeStream(streamId);
    toast.success('Stream deleted');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/10 text-success border-success/20">Active</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'revoked':
        return <Badge variant="outline">Revoked</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const enrichedStreams = streams.map(stream => {
    const dataset = datasets.find(d => d.id === stream.datasetName);
    const rule = rules.find(r => r.id === stream.ruleId);
    const timeRemaining = getTimeRemaining(stream.expiresAt);
    
    return {
      ...stream,
      dataset,
      rule,
      timeRemaining
    };
  });

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Data Streams
          </h1>
          <p className="text-muted-foreground">
            Manage your active data streams and access tokens
          </p>
        </div>
        <Link to="/streams/new">
          <Button className="bg-gradient-primary hover:shadow-glow transition-all duration-200">
            <Plus className="h-4 w-4 mr-2" />
            Create Stream
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Streams</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{streams.length}</div>
            <p className="text-xs text-muted-foreground">All time created</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Activity className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {streams.filter(s => s.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">Currently sharing</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {enrichedStreams.filter(s => s.timeRemaining.urgent && s.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">Within 24 hours</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revoked</CardTitle>
            <Pause className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {streams.filter(s => s.status === 'revoked').length}
            </div>
            <p className="text-xs text-muted-foreground">Access removed</p>
          </CardContent>
        </Card>
      </div>

      {/* Streams List */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Your Streams
          </CardTitle>
        </CardHeader>
        <CardContent>
          {streams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No streams created yet</p>
              <p className="text-sm mb-4">Create your first data stream to share filtered data</p>
              <Link to="/streams/new">
                <Button>Create Stream</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {enrichedStreams.map((stream) => (
                <div
                  key={stream.id}
                  className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-cyber shadow-glow">
                      <Workflow className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{stream.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Dataset: {stream.dataset?.name || 'Unknown'}</span>
                        <span>Rule: {stream.rule?.name || 'Unknown'}</span>
                        <span>Created: {new Date(stream.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      {getStatusBadge(stream.status)}
                      {stream.status === 'active' && (
                        <div className={cn(
                          "text-xs mt-1",
                          stream.timeRemaining.urgent ? "text-warning" : "text-muted-foreground"
                        )}>
                          Expires in {stream.timeRemaining.text}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedStream(stream)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Stream Details: {stream.name}</DialogTitle>
                            <DialogDescription>
                              Configuration and access information
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Status:</span>
                                <div className="mt-1">{getStatusBadge(stream.status)}</div>
                              </div>
                              <div>
                                <span className="font-medium">Expires:</span>
                                <p className="font-mono">{new Date(stream.expiresAt).toLocaleString()}</p>
                              </div>
                              <div>
                                <span className="font-medium">Dataset:</span>
                                <p>{stream.dataset?.name || 'Unknown'}</p>
                              </div>
                              <div>
                                <span className="font-medium">Rule:</span>
                                <p>{stream.rule?.name || 'Unknown'}</p>
                              </div>
                            </div>
                            
                            {stream.rule && (
                              <div>
                                <span className="font-medium">Rule Configuration:</span>
                                <div className="mt-2 p-3 bg-accent/30 rounded-lg">
                                  <p className="text-sm"><strong>Fields:</strong> {stream.rule.fields.join(', ')}</p>
                                  <p className="text-sm"><strong>TTL:</strong> {stream.rule.ttlMinutes} minutes</p>
                                  {stream.rule.description && (
                                    <p className="text-sm"><strong>Description:</strong> {stream.rule.description}</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toast.success('CSV export started')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>

                      {stream.status === 'active' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevoke(stream.id)}
                          className="text-warning hover:text-warning"
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(stream.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}