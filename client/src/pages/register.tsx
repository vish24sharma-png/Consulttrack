import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Stethoscope } from "lucide-react";

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    name: "",
    email: "",
    specialty: "",
    clinicName: "",
    isClinic: false,
    isConsultant: false,
  });
  
  const { register, isLoading } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.isClinic && !formData.isConsultant) {
      toast({
        title: "Role selection required",
        description: "Please select at least one role",
        variant: "destructive",
      });
      return;
    }

    const roles = [];
    if (formData.isClinic) roles.push("clinician");
    if (formData.isConsultant) roles.push("consultant");

    try {
      await register({
        username: formData.username,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        name: formData.name,
        email: formData.email,
        roles,
        currentRole: roles[0],
        specialty: formData.isConsultant ? formData.specialty : null,
        clinicName: formData.isClinic ? formData.clinicName : null,
      });
      
      toast({
        title: "Account created!",
        description: "Welcome to ConsulTrack",
      });
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-clinical-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-clinical-800">Join ConsulTrack</CardTitle>
          <p className="text-clinical-500">Create your professional account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-clinical-700">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="clinical-input"
                  placeholder="Dr. John Smith"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-clinical-700">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="clinical-input"
                  placeholder="drjohnsmith"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-clinical-700">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="clinical-input"
                placeholder="dr.smith@example.com"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-clinical-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="clinical-input"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-clinical-700">Confirm</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="clinical-input"
                  required
                />
              </div>
            </div>

            <div className="space-y-4 p-4 bg-clinical-50 rounded-lg">
              <Label className="text-clinical-700 font-medium">Professional Role(s)</Label>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isClinic"
                    checked={formData.isClinic}
                    onCheckedChange={(checked) => setFormData({ ...formData, isClinic: checked as boolean })}
                  />
                  <Label htmlFor="isClinic" className="text-sm text-clinical-700">
                    Clinic Owner/Manager
                  </Label>
                </div>
                
                {formData.isClinic && (
                  <Input
                    placeholder="Clinic name"
                    value={formData.clinicName}
                    onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                    className="clinical-input text-sm"
                  />
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isConsultant"
                    checked={formData.isConsultant}
                    onCheckedChange={(checked) => setFormData({ ...formData, isConsultant: checked as boolean })}
                  />
                  <Label htmlFor="isConsultant" className="text-sm text-clinical-700">
                    Visiting Consultant
                  </Label>
                </div>
                
                {formData.isConsultant && (
                  <Input
                    placeholder="Specialty (e.g., Orthodontist)"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    className="clinical-input text-sm"
                  />
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full clinical-button-primary"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-clinical-500">
              Already have an account?{" "}
              <Link href="/" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
