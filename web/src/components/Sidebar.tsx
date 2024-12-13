import { cn } from "../lib/utils"
import { Button } from "./ui/button"
import { ScrollArea } from "./ui/scroll-area"
import {
  Home,
  Settings,
  User,
  MessageSquare,
  BarChart,
  Globe2,
} from "lucide-react"
import { NavLink } from "react-router-dom"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  return (
    <div className={cn("pb-12", className)}>
      <ScrollArea className="h-full">
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold">Dashboard</h2>
            <div className="space-y-1">
              <NavLink to="/">
                <Button variant="ghost" className="w-full justify-start">
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Button>
              </NavLink>
              <NavLink to="/profile">
                <Button variant="ghost" className="w-full justify-start">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Button>
              </NavLink>
              <NavLink to="/planetary-industry">
                <Button variant="ghost" className="w-full justify-start">
                  <Globe2 className="mr-2 h-4 w-4" />
                  Planetary Industry
                </Button>
              </NavLink>
              <NavLink to="/settings">
                <Button variant="ghost" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </NavLink>
            </div>
          </div>
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold">Analytics</h2>
            <div className="space-y-1">
              <Button variant="ghost" className="w-full justify-start">
                <BarChart className="mr-2 h-4 w-4" />
                Statistics
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <MessageSquare className="mr-2 h-4 w-4" />
                Messages
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}