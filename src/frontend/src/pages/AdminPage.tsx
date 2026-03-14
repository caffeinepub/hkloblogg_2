import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Principal } from "@icp-sdk/core/principal";
import { Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { UserRole } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useAssignRole, useUserRole } from "../hooks/useQueries";

export function AdminPage() {
  const { identity } = useInternetIdentity();
  const isLoggedIn = !!identity;
  const { data: role } = useUserRole();
  const isAdmin = role === UserRole.admin;

  const [principalInput, setPrincipalInput] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.user);
  const assignRole = useAssignRole();

  if (!isLoggedIn || !isAdmin) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-20 text-center">
        <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
        <p className="text-muted-foreground">
          Åtkomst nekad. Endast administratörer har tillgång till denna sida.
        </p>
      </div>
    );
  }

  const handleAssign = () => {
    let principal: Principal;
    try {
      principal = Principal.fromText(principalInput.trim());
    } catch {
      toast.error("Ogiltigt Principal-format");
      return;
    }

    assignRole.mutate(
      { user: principal, role: selectedRole },
      {
        onSuccess: () => {
          toast.success(`Roll '${selectedRole}' tilldelad!`);
          setPrincipalInput("");
        },
        onError: () => toast.error("Kunde inte tilldela rollen"),
      },
    );
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-3">
        <ShieldCheck className="h-8 w-8 text-primary" />
        Adminpanel
      </h1>
      <p className="text-muted-foreground mb-10">
        Hantera användarroller och behörigheter.
      </p>

      {/* Assign role */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 className="font-display text-lg font-semibold">Tilldela roll</h2>

        <div className="space-y-2">
          <Label htmlFor="admin-principal">Principal ID</Label>
          <Input
            id="admin-principal"
            value={principalInput}
            onChange={(e) => setPrincipalInput(e.target.value)}
            placeholder="xxxxx-xxxxx-xxxxx-xxxxx-xxx"
            data-ocid="admin.principal.input"
            className="font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label>Roll</Label>
          <Select
            value={selectedRole}
            onValueChange={(v) => setSelectedRole(v as UserRole)}
          >
            <SelectTrigger data-ocid="admin.role.select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UserRole.user}>Användare</SelectItem>
              <SelectItem value={UserRole.admin}>Superadmin</SelectItem>
              <SelectItem value={UserRole.guest}>Gäst</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleAssign}
          disabled={!principalInput.trim() || assignRole.isPending}
          data-ocid="admin.assign_button"
        >
          {assignRole.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Tilldela roll
        </Button>
      </div>
    </div>
  );
}
