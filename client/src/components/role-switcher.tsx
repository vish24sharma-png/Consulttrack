import { useAuth } from "@/hooks/use-auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export function RoleSwitcher() {
  const { user, switchRole } = useAuth();
  const { toast } = useToast();

  if (!user || user.roles.length <= 1) return null;

  const handleRoleChange = async (newRole: string) => {
    try {
      await switchRole(newRole);
      toast({
        title: "Role switched",
        description: `Now operating as ${newRole}`,
      });
    } catch (error) {
      toast({
        title: "Role switch failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "clinician":
        return "Clinician";
      case "consultant":
        return "Consultant";
      default:
        return role;
    }
  };

  return (
    <div>
      <Label className="text-sm font-medium text-clinical-700 mb-2 block">
        Active Role
      </Label>
      <Select value={user.currentRole} onValueChange={handleRoleChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {user.roles.map((role) => (
            <SelectItem key={role} value={role}>
              {getRoleLabel(role)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
