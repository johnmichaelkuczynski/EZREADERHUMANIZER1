import { Switch, Route, Link } from "wouter";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import Settings from "@/pages/settings";
import GPTBypassPage from "@/pages/gpt-bypass";
import { Settings as SettingsIcon, Zap } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200">
        <div className="container flex justify-between items-center py-4">
          <Link href="/" className="text-2xl font-bold">
            EZ Reader
          </Link>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/gpt-bypass" className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                    <Zap className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>GPT Bypass</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/settings" className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                    <SettingsIcon className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>API Settings</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/gpt-bypass" component={GPTBypassPage} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

export default App;
