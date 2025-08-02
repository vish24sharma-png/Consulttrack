import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { RoleSwitcher } from "./role-switcher";
import { 
  Stethoscope, 
  BarChart3, 
  Users, 
  UserRound, 
  Calendar, 
  FileText, 
  TrendingUp, 
  Settings,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="w-64 bg-white shadow-lg border-r border-clinical-200 flex flex-col">
      {/* Logo & Branding */}
      <div className="p-6 border-b border-clinical-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Stethoscope className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-clinical-800">ConsulTrack</h1>
            <p className="text-sm text-clinical-500">Clinical Management</p>
          </div>
        </div>
      </div>

      {/* Role Switcher */}
      <div className="p-4 border-b border-clinical-200 bg-clinical-50">
        <RoleSwitcher />
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <Link href="/">
              {(params) => (
                <a className={`flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                  params.href === "/" 
                    ? "bg-primary/10 text-primary" 
                    : "text-clinical-600 hover:bg-clinical-100"
                }`}>
                  <BarChart3 className="w-5 h-5" />
                  <span>Dashboard</span>
                </a>
              )}
            </Link>
          </li>
          <li>
            <a href="#" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-clinical-600 hover:bg-clinical-100 transition-colors">
              <Users className="w-5 h-5" />
              <span>Patients</span>
            </a>
          </li>
          {user.currentRole === "clinician" && (
            <li>
              <a href="#" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-clinical-600 hover:bg-clinical-100 transition-colors">
                <UserRound className="w-5 h-5" />
                <span>Consultants</span>
              </a>
            </li>
          )}
          <li>
            <a href="#" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-clinical-600 hover:bg-clinical-100 transition-colors">
              <Calendar className="w-5 h-5" />
              <span>Appointments</span>
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-clinical-600 hover:bg-clinical-100 transition-colors">
              <FileText className="w-5 h-5" />
              <span>Treatment Plans</span>
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-clinical-600 hover:bg-clinical-100 transition-colors">
              <TrendingUp className="w-5 h-5" />
              <span>Reports</span>
            </a>
          </li>
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-clinical-200">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 bg-health-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">{getInitials(user.name)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-clinical-800 truncate">{user.name}</p>
            <p className="text-xs text-clinical-500 capitalize">{user.currentRole}</p>
          </div>
          <button className="text-clinical-400 hover:text-clinical-600">
            <Settings className="w-4 h-4" />
          </button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start text-clinical-600 hover:text-clinical-800"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
