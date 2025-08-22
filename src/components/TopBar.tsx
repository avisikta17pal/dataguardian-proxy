import { useState } from "react";
import { Search, Moon, Sun, Globe, User, Bell, LogOut, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useSettingsStore, useAuthStore } from "@/stores";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export function TopBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const { settings, updateSettings } = useSettingsStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const toggleTheme = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: newTheme });
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const changeLanguage = (language: "en" | "hi" | "bn") => {
    updateSettings({ language });
  };

  const languageLabels = {
    en: "English",
    hi: "हिंदी",
    bn: "বাংলা"
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search datasets, rules, streams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Language Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">{languageLabels[settings.language]}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Language</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Object.entries(languageLabels).map(([code, label]) => (
              <DropdownMenuItem
                key={code}
                onClick={() => changeLanguage(code as "en" | "hi" | "bn")}
                className={cn(
                  settings.language === code && "bg-accent"
                )}
              >
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="gap-2"
        >
          {settings.theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {settings.theme === 'dark' ? 'Light' : 'Dark'}
          </span>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
            3
          </Badge>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-primary shadow-glow">
                <User className="h-3 w-3 text-primary-foreground" />
              </div>
              <span className="hidden sm:inline text-sm font-medium">{user?.name || 'Demo User'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              {user?.email || 'demo@dataguardian.com'}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <SettingsIcon className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Demo Mode Badge */}
        {settings.demoMode && (
          <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
            Demo Mode
          </Badge>
        )}
      </div>
    </header>
  );
}