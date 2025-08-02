import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreVertical } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function ConsultantManagement() {
  const { user } = useAuth();
  
  const { data: consultants, isLoading } = useQuery({
    queryKey: ["/api/consultants"],
    enabled: user?.currentRole === "clinician",
  });

  if (user?.currentRole !== "clinician") {
    return null;
  }

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const getConsultantColor = (index: number) => {
    const colors = [
      "bg-primary",
      "bg-health-500",
      "bg-purple-500",
      "bg-yellow-500",
      "bg-pink-500",
    ];
    return colors[index % colors.length];
  };

  return (
    <Card className="lg:col-span-2 clinical-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-clinical-800">Consultant Management</h3>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
            <Plus className="w-4 h-4 mr-1" />
            Add Consultant
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4 p-4 border border-clinical-200 rounded-lg">
                  <div className="w-12 h-12 bg-clinical-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-clinical-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-clinical-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-clinical-200 rounded w-40"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : consultants?.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-clinical-500 mb-4">No consultants added yet</p>
            <Button className="clinical-button-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Consultant
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {consultants?.map((consultant: any, index: number) => (
              <div
                key={consultant.id}
                className="flex items-center justify-between p-4 border border-clinical-200 rounded-lg hover:bg-clinical-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 ${getConsultantColor(index)} rounded-full flex items-center justify-center`}>
                    <span className="text-white font-medium">
                      {getInitials(consultant.user?.name || "")}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-clinical-800">
                      {consultant.user?.name}
                    </h4>
                    <p className="text-sm text-clinical-500">{consultant.specialty}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <Badge variant="secondary" className="health-badge">
                        {consultant.patientCount} patients
                      </Badge>
                      {consultant.nextVisit && (
                        <span className="text-xs text-clinical-500">
                          Next visit: {new Date(consultant.nextVisit).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" className="text-primary">
                    View Patients
                  </Button>
                  <Button variant="ghost" size="sm" className="text-clinical-400 hover:text-clinical-600">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
