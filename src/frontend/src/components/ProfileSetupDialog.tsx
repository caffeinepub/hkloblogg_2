import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useSaveProfile } from "../hooks/useQueries";

interface Props {
  open: boolean;
  onSaved: () => void;
}

export function ProfileSetupDialog({ open, onSaved }: Props) {
  const [name, setName] = useState("");
  const save = useSaveProfile();

  const handleSubmit = () => {
    if (!name.trim()) return;
    save.mutate({ name: name.trim() }, { onSuccess: onSaved });
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" data-ocid="profile.dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Välkommen till HKLOblogg!
          </DialogTitle>
          <DialogDescription>
            Ange ett visningsnamn för att komma igång.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3">
          <Label htmlFor="profile-name">Visningsnamn</Label>
          <Input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ditt namn"
            data-ocid="profile.name.input"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || save.isPending}
            data-ocid="profile.save_button"
          >
            {save.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Spara
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
