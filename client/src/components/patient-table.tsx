import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, Eye, Edit, Images } from "lucide-react";
import { Link } from "wouter";

export function PatientTable() {
  const [search, setSearch] = useState("");
  const [consultantFilter, setConsultantFilter] = useState("all");

  const { data: patients, isLoading } = useQuery({
    queryKey: ["/api/patients"],
  });

  const { data: consultants } = useQuery({
    queryKey: ["/api/consultants"],
  });

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const getPatientColor = (index: number) => {
    const colors = [
      "bg-primary/10 text-primary",
      "bg-health-100 text-health-700",
      "bg-purple-100 text-purple-700",
      "bg-yellow-100 text-yellow-700",
      "bg-pink-100 text-pink-700",
    ];
    return colors[index % colors.length];
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "current":
        return "bg-health-100 text-health-700";
      case "overdue":
        return "bg-red-100 text-red-700";
      default:
        return "bg-clinical-100 text-clinical-700";
    }
  };

  const filteredPatients = patients?.filter((patient: any) => {
    const matchesSearch = patient.name.toLowerCase().includes(search.toLowerCase()) ||
                         patient.patientId.includes(search);
    const matchesConsultant = consultantFilter === "all" || 
                             patient.consultant?.name === consultantFilter;
    return matchesSearch && matchesConsultant;
  }) || [];

  return (
    <Card className="clinical-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-clinical-800">Patient Overview</h3>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search patients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="clinical-input pl-10"
              />
              <Search className="absolute left-3 top-3 text-clinical-400 w-4 h-4" />
            </div>
            <Select value={consultantFilter} onValueChange={setConsultantFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Consultants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Consultants</SelectItem>
                {consultants?.map((consultant: any) => (
                  <SelectItem key={consultant.id} value={consultant.user?.name || ""}>
                    {consultant.user?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4 py-4">
                    <div className="w-10 h-10 bg-clinical-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-clinical-200 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-clinical-200 rounded w-24"></div>
                    </div>
                    <div className="w-20 h-3 bg-clinical-200 rounded"></div>
                    <div className="w-16 h-6 bg-clinical-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-clinical-500 mb-4">
              {search || consultantFilter !== "all" ? "No patients match your filters" : "No patients added yet"}
            </p>
            <Button className="clinical-button-primary">
              Add Patient
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-clinical-50">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-clinical-700">Patient</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-clinical-700">Consultant</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-clinical-700">Treatment</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-clinical-700">Progress</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-clinical-700">Payment Status</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-clinical-700">Next Visit</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-clinical-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-clinical-200">
                {filteredPatients.map((patient: any, index: number) => (
                  <tr key={patient.id} className="hover:bg-clinical-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getPatientColor(index)}`}>
                          <span className="font-medium text-sm">{getInitials(patient.name)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-clinical-800">{patient.name}</p>
                          <p className="text-sm text-clinical-500">ID: {patient.patientId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-clinical-700">{patient.consultant?.name || "Unassigned"}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-clinical-700">{patient.treatmentType}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Progress value={patient.progressPercentage} className="w-20 h-2" />
                        <span className="text-sm text-clinical-600">{patient.progressPercentage}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge className={`text-xs ${getPaymentStatusColor(patient.paymentStatus)}`}>
                        {patient.paymentStatus}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-clinical-700">
                      {patient.nextAppointment 
                        ? new Date(patient.nextAppointment).toLocaleDateString()
                        : "Not scheduled"
                      }
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Link href={`/patients/${patient.id}`}>
                          <Button variant="ghost" size="sm" className="text-clinical-400 hover:text-primary">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" className="text-clinical-400 hover:text-health-600">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-clinical-400 hover:text-purple-600">
                          <Images className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
