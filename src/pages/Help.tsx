import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle, Book, Video, MessageCircle } from "lucide-react";

export default function Help() {
  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Help & Support
        </h1>
        <p className="text-muted-foreground">
          Learn how to use DataGuardian Proxy effectively
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Quick Start Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm">
              <li>1. Upload a dataset (CSV file)</li>
              <li>2. Create privacy rules</li>
              <li>3. Generate data streams</li>
              <li>4. Share with time-limited tokens</li>
            </ol>
            <Button variant="outline" className="mt-4 w-full">
              View Full Guide
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Video Tutorials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Watch step-by-step tutorials on how to use DataGuardian Proxy
            </p>
            <Button variant="outline" className="w-full">
              Watch Tutorials
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}