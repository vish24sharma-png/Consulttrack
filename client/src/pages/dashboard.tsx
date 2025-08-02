import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/sidebar";
import { StatsCards } from "@/components/stats-cards";
import { ConsultantManagement } from "@/components/consultant-management";
import { PatientTable } from "@/components/patient-table";
import { TreatmentModal } from "@/components/treatment-modal";
import { ImageUpload } from "@/components/image-upload";
import { 
  Plus, 
  Bell, 
  UserPlus, 
  Camera, 
  FileText, 
  DollarSign 
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/dashboard/activities"],
  });

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "patient_created":
      case "patient_updated":
        return <UserPlus className="w-4 h-4 text-primary" />;
      case "image_uploaded":
        return <Camera className="w-4 h-4 text-health-600" />;
      case "payment_recorded":
        return <DollarSign className="w-4 h-4 text-yellow-600" />;
      case "treatment_plan_created":
      case "treatment_plan_updated":
        return <FileText className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-clinical-400" />;
    }
  };

  const getTimeSince = (date: string) => {
    const now = new Date().getTime();
    const activityTime = new Date(date).getTime();
    const diffInHours = Math.floor((now - activityTime) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Less than an hour ago";
    if (diffInHours === 1) return "1 hour ago";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "1 day ago";
    return `${diffInDays} days ago`;
  };

  return (
    <div className="flex h-screen bg-clinical-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-clinical-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-clinical-800">
                {user?.currentRole === "clinician" ? "Clinician Dashboard" : "Consultant Dashboard"}
              </h2>
              <p className="text-clinical-500 mt-1">
                {user?.currentRole === "clinician" 
                  ? "Manage consultants, patients, and clinic operations"
                  : "Track your multi-clinic practice and patient progress"
                }
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button className="clinical-button-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Patient
              </Button>
              <button className="relative p-2 text-clinical-500 hover:text-clinical-700">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-clinical-50">
          <StatsCards />

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Consultant Management Panel (only for clinicians) */}
            {user?.currentRole === "clinician" && <ConsultantManagement />}

            {/* Recent Activity & Quick Actions */}
            <div className={`space-y-6 ${user?.currentRole === "clinician" ? "" : "lg:col-span-3"}`}>
              
              {/* Quick Actions */}
              <Card className="clinical-card">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-clinical-800 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Button
                      variant="ghost"
                      className="w-full justify-start p-3 border border-clinical-200 hover:bg-clinical-50"
                    >
                      <UserPlus className="w-5 h-5 mr-3 text-primary" />
                      <span className="font-medium text-clinical-700">Add New Patient</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start p-3 border border-clinical-200 hover:bg-clinical-50"
                      onClick={() => setIsImageUploadOpen(true)}
                    >
                      <Camera className="w-5 h-5 mr-3 text-health-600" />
                      <span className="font-medium text-clinical-700">Upload Images</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start p-3 border border-clinical-200 hover:bg-clinical-50"
                    >
                      <FileText className="w-5 h-5 mr-3 text-purple-600" />
                      <span className="font-medium text-clinical-700">Create Treatment Plan</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start p-3 border border-clinical-200 hover:bg-clinical-50"
                    >
                      <DollarSign className="w-5 h-5 mr-3 text-yellow-600" />
                      <span className="font-medium text-clinical-700">Record Payment</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="clinical-card">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-clinical-800 mb-4">Recent Activity</h3>
                  {activitiesLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-clinical-200 rounded-full"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-clinical-200 rounded w-3/4 mb-2"></div>
                              <div className="h-3 bg-clinical-200 rounded w-1/2"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : activities?.length === 0 ? (
                    <p className="text-clinical-500 text-center py-4">No recent activity</p>
                  ) : (
                    <div className="space-y-4">
                      {activities?.map((activity: any) => (
                        <div key={activity.id} className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-clinical-100 rounded-full flex items-center justify-center flex-shrink-0">
                            {getActivityIcon(activity.action)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-clinical-700">{activity.description}</p>
                            <p className="text-xs text-clinical-500 mt-1">
                              {getTimeSince(activity.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Patient Management Section */}
          <div className="mt-8">
            <PatientTable />
          </div>
        </main>
      </div>

      {/* Modals */}
      <TreatmentModal
        patientId={selectedPatientId}
        isOpen={!!selectedPatientId}
        onClose={() => setSelectedPatientId(null)}
      />
      
      <ImageUpload
        patientId={selectedPatientId}
        isOpen={isImageUploadOpen}
        onClose={() => setIsImageUploadOpen(false)}
      />
    </div>
  );
}
