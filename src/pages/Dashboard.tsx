import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Database, Workflow, Key, Shield, TrendingUp } from "lucide-react";
import { useDatasetStore, useStreamStore, useTokenStore, useRuleStore } from "@/stores";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { datasets } = useDatasetStore();
  const { streams } = useStreamStore();
  const { tokens } = useTokenStore();
  const { rules } = useRuleStore();

  const [stats, setStats] = useState({
    activeStreams: 0,
    expiringSoon: 0,
    totalTokens: 0,
    revokedTokens: 0,
  });

  useEffect(() => {
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const activeStreams = streams.filter(s => s.status === 'active').length;
    const expiringSoon = streams.filter(s => 
      s.status === 'active' && new Date(s.expiresAt) <= twentyFourHoursFromNow
    ).length;
    const totalTokens = tokens.length;
    const revokedTokens = tokens.filter(t => t.revoked).length;

    setStats({ activeStreams, expiringSoon, totalTokens, revokedTokens });
  }, [streams, tokens]);

  const StatCard = ({ title, value, description, icon: Icon, trend, color = "default" }: {
    title: string;
    value: string | number;
    description: string;
    icon: any;
    trend?: { value: number; label: string };
    color?: "default" | "warning" | "success" | "destructive";
  }) => (
    <Card className="transition-all duration-200 hover:shadow-elegant border-border/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${
          color === 'warning' ? 'text-warning' :
          color === 'success' ? 'text-success' :
          color === 'destructive' ? 'text-destructive' :
          'text-muted-foreground'
        }`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className="flex items-center pt-1">
            <TrendingUp className="h-3 w-3 text-success mr-1" />
            <span className="text-xs text-success font-medium">
              +{trend.value}% {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor your data streams and privacy controls
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/datasets">
            <Button className="bg-gradient-primary hover:shadow-glow transition-all duration-200">
              Upload Dataset
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Datasets"
          value={datasets.length}
          description="Uploaded data sources"
          icon={Database}
          trend={{ value: 12, label: "from last month" }}
          color="success"
        />
        <StatCard
          title="Active Streams"
          value={stats.activeStreams}
          description="Currently sharing data"
          icon={Workflow}
          color="default"
        />
        <StatCard
          title="Expiring Soon"
          value={stats.expiringSoon}
          description="Streams expire in 24h"
          icon={Activity}
          color="warning"
        />
        <StatCard
          title="Access Tokens"
          value={stats.totalTokens}
          description={`${stats.revokedTokens} revoked`}
          icon={Key}
          color="default"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/50 hover:shadow-elegant transition-all duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Quick Upload
            </CardTitle>
            <CardDescription>
              Upload a new dataset to start creating streams
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/datasets">
              <Button variant="outline" className="w-full">
                Go to Datasets
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:shadow-elegant transition-all duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-secondary" />
              Create Rule
            </CardTitle>
            <CardDescription>
              Define privacy rules for your data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/rules">
              <Button variant="outline" className="w-full">
                Go to Rules
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:shadow-elegant transition-all duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5 text-accent" />
              New Stream
            </CardTitle>
            <CardDescription>
              Generate a new data stream with time limits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/streams/new">
              <Button variant="outline" className="w-full">
                Create Stream
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions in your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: "Dataset uploaded", detail: "fitness.csv", time: "2 minutes ago", type: "success" },
              { action: "Stream created", detail: "Health Insights", time: "1 hour ago", type: "info" },
              { action: "Token revoked", detail: "Mobile App Access", time: "3 hours ago", type: "warning" },
              { action: "Rule updated", detail: "PII Protection", time: "1 day ago", type: "info" },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div className="flex items-center gap-3">
                  <Badge variant={
                    item.type === 'success' ? 'default' :
                    item.type === 'warning' ? 'destructive' : 'secondary'
                  }>
                    {item.action}
                  </Badge>
                  <span className="text-sm">{item.detail}</span>
                </div>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}