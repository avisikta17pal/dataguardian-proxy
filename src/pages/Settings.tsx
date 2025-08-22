import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon } from "lucide-react";
import { useSettingsStore } from "@/stores";

export default function Settings() {
  const { settings, updateSettings } = useSettingsStore();

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Configure your account preferences and privacy settings
        </p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Language</Label>
              <p className="text-sm text-muted-foreground">Choose your preferred language</p>
            </div>
            <Select value={settings.language} onValueChange={(value: "en" | "hi" | "bn") => updateSettings({ language: value })}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">हिंदी</SelectItem>
                <SelectItem value="bn">বাংলা</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Theme</Label>
              <p className="text-sm text-muted-foreground">Choose light or dark theme</p>
            </div>
            <Select value={settings.theme} onValueChange={(value: "light" | "dark" | "system") => updateSettings({ theme: value })}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Demo Mode</Label>
              <p className="text-sm text-muted-foreground">Use local storage instead of API</p>
            </div>
            <Switch
              checked={settings.demoMode}
              onCheckedChange={(checked) => updateSettings({ demoMode: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}