import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Sidebar } from "@/components/sidebar";
import { ImageUpload } from "@/components/image-upload";
import { 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  Upload, 
  Edit,
  Calendar,
  DollarSign,
  FileText,
  Camera,
  Phone,
  Mail,
  User
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function PatientProfile() {
  const { id } = useParams();
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: patient, isLoading, error } = useQuery({
    queryKey: ["/api/patients", id],
    enabled: !!id,
  });

  const updateNotesMutation = useMutation({
    mutationFn: async (notes: string) => {
      const response = await apiRequest("PUT", `/api/patients/${id}`, {
        clinicalNotes: notes,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Notes updated",
        description: "Clinical notes have been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/patients", id] });
      setClinicalNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update clinical notes",
        variant: "destructive",
      });
    },
  });

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const getStepIcon = (status: string, stepNumber: number) => {
    if (status === "completed") {
      return <CheckCircle className="w-6 h-6 text-white" />;
    }
    return <span className="text-white font-bold text-sm">{stepNumber}</span>;
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-health-500";
      case "scheduled":
        return "bg-primary";
      default:
        return "bg-clinical-300";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "scheduled":
        return "bg-primary/10 text-primary";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-clinical-100 text-clinical-700";
    }
  };

  const handleSaveNotes = () => {
    if (!clinicalNotes.trim()) {
      toast({
        title: "Empty notes",
        description: "Please enter some clinical notes before saving",
        variant: "destructive",
      });
      return;
    }
    updateNotesMutation.mutate(clinicalNotes);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-clinical-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="flex h-screen bg-clinical-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="clinical-card max-w-md mx-4">
            <CardContent className="pt-6 text-center">
              <h1 className="text-xl font-bold text-clinical-800 mb-2">Patient Not Found</h1>
              <p className="text-clinical-500 mb-4">
                The patient you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <Link href="/">
                <Button className="clinical-button-primary">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalCost = parseFloat(patient.totalCost);
  const amountPaid = parseFloat(patient.amountPaid);
  const remaining = totalCost - amountPaid;
  const progressPercentage = totalCost > 0 ? Math.round((amountPaid / totalCost) * 100) : 0;

  return (
    <div className="flex h-screen bg-clinical-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-clinical-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-clinical-600 hover:text-clinical-800">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h2 className="text-2xl font-bold text-clinical-800">Patient Profile</h2>
                <p className="text-clinical-500 mt-1">Complete treatment overview and management</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                className="clinical-button-secondary"
                onClick={() => setIsImageUploadOpen(true)}
              >
                <Camera className="w-4 h-4 mr-2" />
                Upload Images
              </Button>
              <Button className="clinical-button-primary">
                <Edit className="w-4 h-4 mr-2" />
                Edit Patient
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-clinical-50">
          
          {/* Patient Info Header */}
          <Card className="clinical-card mb-6">
            <CardContent className="p-6">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">{getInitials(patient.name)}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <h1 className="text-2xl font-bold text-clinical-800">{patient.name}</h1>
                    <Badge className={`${patient.treatmentStatus === "active" ? "bg-health-100 text-health-700" : "bg-clinical-100 text-clinical-700"}`}>
                      {patient.treatmentStatus}
                    </Badge>
                  </div>
                  <p className="text-lg text-clinical-600 mb-3">{patient.treatmentType}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-clinical-400" />
                      <span className="text-clinical-500">ID: {patient.patientId}</span>
                    </div>
                    {patient.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-clinical-400" />
                        <span className="text-clinical-500">{patient.email}</span>
                      </div>
                    )}
                    {patient.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-clinical-400" />
                        <span className="text-clinical-500">{patient.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-clinical-400" />
                      <span className="text-clinical-500">
                        Next: {patient.nextAppointment 
                          ? new Date(patient.nextAppointment).toLocaleDateString()
                          : "Not scheduled"
                        }
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-clinical-800">{patient.progressPercentage}%</div>
                  <div className="text-sm text-clinical-500 mb-2">Treatment Progress</div>
                  <Progress value={patient.progressPercentage} className="w-32 h-2" />
                </div>
              </div>
              
              {patient.consultant && (
                <div className="mt-4 pt-4 border-t border-clinical-200">
                  <div className="flex items-center space-x-2">
                    <span className="text-clinical-500">Consultant:</span>
                    <span className="font-medium text-clinical-700">{patient.consultant.name}</span>
                    {patient.consultant.specialty && (
                      <Badge variant="outline" className="text-xs">
                        {patient.consultant.specialty}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Treatment Timeline */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Payment Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-clinical-50 border-clinical-200">
                  <CardContent className="p-4 text-center">
                    <DollarSign className="w-6 h-6 text-clinical-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-clinical-800">${totalCost.toLocaleString()}</div>
                    <div className="text-sm text-clinical-500">Total Treatment Cost</div>
                  </CardContent>
                </Card>
                <Card className="bg-health-50 border-clinical-200">
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="w-6 h-6 text-health-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-health-700">${amountPaid.toLocaleString()}</div>
                    <div className="text-sm text-clinical-500">Amount Paid</div>
                  </CardContent>
                </Card>
                <Card className="bg-yellow-50 border-clinical-200">
                  <CardContent className="p-4 text-center">
                    <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-700">${remaining.toLocaleString()}</div>
                    <div className="text-sm text-clinical-500">Remaining Balance</div>
                  </CardContent>
                </Card>
              </div>

              {/* Treatment Plans */}
              <Card className="clinical-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-clinical-800">Treatment Timeline</h3>
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      Add Step
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {patient.treatmentPlans?.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-clinical-300 mx-auto mb-4" />
                      <p className="text-clinical-500 mb-4">No treatment plan created yet</p>
                      <Button className="clinical-button-primary">
                        Create Treatment Plan
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {patient.treatmentPlans?.map((step: any) => (
                        <div key={step.id} className="flex items-start space-x-4">
                          <div className={`w-10 h-10 ${getStepColor(step.status)} rounded-full flex items-center justify-center flex-shrink-0`}>
                            {getStepIcon(step.status, step.stepNumber)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h6 className="font-semibold text-clinical-800">{step.title}</h6>
                                <p className="text-clinical-600 mt-1">{step.description}</p>
                              </div>
                              <div className="text-right text-sm">
                                <div className="text-clinical-500">
                                  {step.scheduledDate 
                                    ? new Date(step.scheduledDate).toLocaleDateString()
                                    : "Not scheduled"
                                  }
                                </div>
                                {step.completedDate && (
                                  <div className="text-health-600 font-medium">
                                    Completed: {new Date(step.completedDate).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center mt-3 space-x-4">
                              <Badge className={`text-xs ${getStatusBadgeColor(step.status)}`}>
                                {step.status}
                              </Badge>
                              <span className="text-sm text-clinical-500">
                                Cost: ${parseFloat(step.cost).toLocaleString()}
                              </span>
                              {step.paymentRequired && (
                                <span className="text-xs text-yellow-600">
                                  Payment Required
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Chief Complaint */}
              {patient.chiefComplaint && (
                <Card className="clinical-card">
                  <CardHeader>
                    <h3 className="text-lg font-semibold text-clinical-800">Chief Complaint</h3>
                  </CardHeader>
                  <CardContent>
                    <p className="text-clinical-700">{patient.chiefComplaint}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              
              {/* Medical Images */}
              <Card className="clinical-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-clinical-800">Medical Images</h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsImageUploadOpen(true)}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {!patient.medicalImages || patient.medicalImages.length === 0 ? (
                    <div className="text-center py-8">
                      <Camera className="w-12 h-12 text-clinical-300 mx-auto mb-4" />
                      <p className="text-clinical-500 mb-4">No images uploaded yet</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsImageUploadOpen(true)}
                      >
                        Upload First Image
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {patient.medicalImages.map((image: any) => (
                        <div key={image.id} className="relative group cursor-pointer">
                          <div className="w-full h-20 bg-clinical-200 rounded-lg flex items-center justify-center border border-clinical-300 hover:border-primary transition-colors">
                            <div className="text-center">
                              <Camera className="w-6 h-6 text-clinical-400 mx-auto mb-1" />
                              <span className="text-xs text-clinical-500 capitalize">
                                {image.imageType}
                              </span>
                            </div>
                          </div>
                          <div className="absolute bottom-1 left-1 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                            {image.imageType}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment History */}
              <Card className="clinical-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-clinical-800">Payment History</h3>
                    <Button variant="outline" size="sm">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Add Payment
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {!patient.payments || patient.payments.length === 0 ? (
                    <div className="text-center py-6">
                      <DollarSign className="w-8 h-8 text-clinical-300 mx-auto mb-2" />
                      <p className="text-clinical-500 text-sm">No payments recorded</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {patient.payments.map((payment: any) => (
                        <div key={payment.id} className="flex items-center justify-between p-3 bg-clinical-50 rounded-lg">
                          <div>
                            <div className="font-medium text-clinical-800">
                              ${parseFloat(payment.amount).toLocaleString()}
                            </div>
                            <div className="text-xs text-clinical-500">
                              {new Date(payment.paymentDate).toLocaleDateString()}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {payment.paymentMethod}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Clinical Notes */}
          <Card className="clinical-card mt-6">
            <CardHeader>
              <h3 className="text-lg font-semibold text-clinical-800">Clinical Notes</h3>
            </CardHeader>
            <CardContent>
              {patient.clinicalNotes && (
                <div className="mb-4 p-4 bg-clinical-50 rounded-lg">
                  <h6 className="font-medium text-clinical-700 mb-2">Current Notes:</h6>
                  <p className="text-clinical-600 text-sm whitespace-pre-wrap">{patient.clinicalNotes}</p>
                  <div className="mt-2 text-xs text-clinical-500">
                    Last updated: {new Date(patient.updatedAt).toLocaleString()}
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                <Textarea
                  className="w-full h-32 border border-clinical-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  placeholder="Add new clinical notes..."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                />
                <div className="flex items-center justify-end space-x-3">
                  <Button 
                    variant="outline"
                    onClick={() => setClinicalNotes("")}
                    disabled={!clinicalNotes.trim()}
                  >
                    Clear
                  </Button>
                  <Button 
                    onClick={handleSaveNotes}
                    disabled={updateNotesMutation.isPending || !clinicalNotes.trim()}
                    className="clinical-button-primary"
                  >
                    {updateNotesMutation.isPending ? "Saving..." : "Save Notes"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Image Upload Modal */}
      <ImageUpload
        patientId={id || null}
        isOpen={isImageUploadOpen}
        onClose={() => setIsImageUploadOpen(false)}
      />
    </div>
  );
}
