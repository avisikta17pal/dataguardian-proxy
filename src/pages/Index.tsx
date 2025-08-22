import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Database, Clock, Key, Activity, ChevronRight, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-cyber opacity-10 animate-cyber-scan"></div>
        <div className="container mx-auto px-6 py-20 text-center relative">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
              Cyber Vigilance & Digital Sovereignty
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent animate-fade-in">
              DataGuardian Proxy
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-4 animate-slide-up">
              AI Privacy Shield for Personal Data
            </p>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Generate synthetic, purpose-built, time-limited data streams. Apps only get what they need—nothing more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-primary hover:shadow-glow transition-all duration-200" onClick={() => navigate('/login')}>
                <Play className="h-5 w-5 mr-2" />
                Start Demo
              </Button>
              <Button size="lg" variant="outline">
                How it Works
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-6 py-20">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/50 hover:shadow-elegant transition-all duration-200">
            <CardHeader>
              <Database className="h-10 w-10 text-primary mb-4" />
              <CardTitle>Upload & Analyze</CardTitle>
              <CardDescription>
                Securely upload datasets and automatically detect PII fields
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 hover:shadow-elegant transition-all duration-200">
            <CardHeader>
              <Shield className="h-10 w-10 text-secondary mb-4" />
              <CardTitle>Privacy Rules</CardTitle>
              <CardDescription>
                Define custom rules for data filtering and obfuscation
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 hover:shadow-elegant transition-all duration-200">
            <CardHeader>
              <Clock className="h-10 w-10 text-warning mb-4" />
              <CardTitle>Time-Limited Access</CardTitle>
              <CardDescription>
                Set automatic expiration for all data streams
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 hover:shadow-elegant transition-all duration-200">
            <CardHeader>
              <Key className="h-10 w-10 text-accent mb-4" />
              <CardTitle>Secure Tokens</CardTitle>
              <CardDescription>
                Generate revocable API tokens for controlled access
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-muted-foreground">
            Built by Team Venus: Avisikta Pal, Sattick Biswas, Ritashree Das
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
