import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, Upload, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TreatmentModalProps {
  patientId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TreatmentModal({ patientId, isOpen, onClose }: TreatmentModalProps) {
  const [clinicalNotes, setClinicalNotes] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: patient, isLoading } = useQuery({
    queryKey: ["/api/patients", patientId],
    enabled: !!patientId,
  });

  const updateNotesMutation = useMutation({
    mutationFn: async (notes: string) => {
      const response = await apiRequest("PUT", `/api/patients/${patientId}`, {
        clinicalNotes: notes,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Notes updated",
        description: "Clinical notes have been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/patients", patientId] });
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

  const handleSaveNotes = () => {
    updateNotesMutation.mutate(clinicalNotes);
  };

  if (!patient) return null;

  const totalCost = parseFloat(patient.totalCost);
  const amountPaid = parseFloat(patient.amountPaid);
  const remaining = totalCost - amountPaid;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-clinical-800">
              Patient Treatment Plan
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-20 bg-clinical-200 rounded-lg"></div>
              <div className="h-40 bg-clinical-200 rounded-lg"></div>
              <div className="h-32 bg-clinical-200 rounded-lg"></div>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {/* Patient Info Header */}
            <div className="flex items-center space-x-4 mb-6 p-4 bg-clinical-50 rounded-lg">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">{getInitials(patient.name)}</span>
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-clinical-800">{patient.name}</h4>
                <p className="text-clinical-600">{patient.treatmentType}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-sm text-clinical-500">Patient ID: {patient.patientId}</span>
                  <span className="text-sm text-clinical-500">
                    Consultant: {patient.consultant?.name || "Unassigned"}
                  </span>
                </div>
              </div>
            </div>

            {/* Treatment Timeline */}
            <div className="mb-8">
              <h5 className="text-lg font-semibold text-clinical-800 mb-4">Treatment Timeline</h5>
              <div className="space-y-4">
                {patient.treatmentPlans?.map((step: any, index: number) => (
                  <div key={step.id} className="flex items-start space-x-4">
                    <div className={`w-8 h-8 ${getStepColor(step.status)} rounded-full flex items-center justify-center flex-shrink-0`}>
                      {getStepIcon(step.status, step.stepNumber)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h6 className="font-medium text-clinical-800">{step.title}</h6>
                        <span className="text-sm text-clinical-500">
                          {step.scheduledDate ? new Date(step.scheduledDate).toLocaleDateString() : "Not scheduled"}
                        </span>
                      </div>
                      <p className="text-sm text-clinical-600 mt-1">{step.description}</p>
                      <div className="flex items-center mt-2 space-x-4">
                        <Badge 
                          className={`text-xs ${
                            step.status === "completed" 
                              ? "bg-green-100 text-green-700"
                              : step.status === "scheduled"
                              ? "bg-primary/10 text-primary"
                              : "bg-clinical-100 text-clinical-700"
                          }`}
                        >
                          {step.status}
                        </Badge>
                        <span className="text-xs text-clinical-500">
                          Payment: ${step.cost} - {step.status === "completed" ? "Paid" : "Pending"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="bg-clinical-50">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-clinical-800">${totalCost.toLocaleString()}</div>
                  <div className="text-sm text-clinical-500">Total Treatment Cost</div>
                </CardContent>
              </Card>
              <Card className="bg-health-50">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-health-700">${amountPaid.toLocaleString()}</div>
                  <div className="text-sm text-clinical-500">Amount Paid</div>
                </CardContent>
              </Card>
              <Card className="bg-yellow-50">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-yellow-700">${remaining.toLocaleString()}</div>
                  <div className="text-sm text-clinical-500">Remaining Balance</div>
                </CardContent>
              </Card>
            </div>

            {/* Medical Images Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-lg font-semibold text-clinical-800">Medical Images</h5>
                <Button className="clinical-button-primary">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Images
                </Button>
              </div>
              {patient.medicalImages?.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {patient.medicalImages.map((image: any) => (
                    <div key={image.id} className="relative group cursor-pointer">
                      <div className="w-full h-24 bg-clinical-200 rounded-lg flex items-center justify-center">
                        <span className="text-clinical-500 text-sm">{image.imageType}</span>
                      </div>
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        {image.imageType}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-clinical-200 rounded-lg">
                  <p className="text-clinical-500">No images uploaded yet</p>
                </div>
              )}
            </div>

            {/* Clinical Notes */}
            <div>
              <h5 className="text-lg font-semibold text-clinical-800 mb-4">Clinical Notes</h5>
              <div className="bg-clinical-50 rounded-lg p-4">
                <Textarea
                  className="w-full h-32 border border-clinical-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  placeholder="Add clinical notes..."
                  value={clinicalNotes || patient.clinicalNotes || ""}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-clinical-500">
                  Last updated: {patient.updatedAt ? new Date(patient.updatedAt).toLocaleDateString() : "Never"}
                </div>
                <Button 
                  onClick={handleSaveNotes}
                  disabled={updateNotesMutation.isPending}
                  className="clinical-button-primary"
                >
                  {updateNotesMutation.isPending ? "Saving..." : "Save Notes"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
