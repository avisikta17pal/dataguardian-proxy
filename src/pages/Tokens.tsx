import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Key, Copy, Trash2, Clock } from "lucide-react";
import { useTokenStore } from "@/stores";
import toast from "react-hot-toast";

export default function Tokens() {
  const { tokens, revokeToken, removeToken } = useTokenStore();

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success('Token copied to clipboard');
  };

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Access Tokens
          </h1>
          <p className="text-muted-foreground">
            Manage API tokens for accessing your data streams
          </p>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Your Tokens ({tokens.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tokens.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tokens generated yet</p>
              <p className="text-sm">Create a stream to generate access tokens</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tokens.map((token) => (
                <div key={token.id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
                      <Key className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{token.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Created: {new Date(token.createdAt).toLocaleDateString()}</span>
                        <span>Expires: {new Date(token.expiresAt).toLocaleDateString()}</span>
                        {token.oneTime && <Badge variant="outline">One-time</Badge>}
                        {token.revoked && <Badge variant="destructive">Revoked</Badge>}
                      </div>
                      <code className="text-xs bg-muted px-2 py-1 rounded mt-1 block font-mono">
                        {token.token.substring(0, 20)}...
                      </code>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => copyToken(token.token)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => revokeToken(token.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
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