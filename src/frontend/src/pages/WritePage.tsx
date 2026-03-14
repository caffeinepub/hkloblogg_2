import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCallerProfile, useCreatePost } from "../hooks/useQueries";

export function WritePage() {
  const { identity, login } = useInternetIdentity();
  const isLoggedIn = !!identity;
  const { data: profile } = useCallerProfile();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(true);

  const createPost = useCreatePost();

  if (!isLoggedIn) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-4">
          Du måste vara inloggad för att skriva inlägg.
        </p>
        <Button onClick={login}>Logga in</Button>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Titel och innehåll krävs");
      return;
    }
    const authorName = profile?.name ?? "Anonym";
    createPost.mutate(
      { title: title.trim(), content: content.trim(), authorName, published },
      {
        onSuccess: (id) => {
          toast.success(published ? "Inlägg publicerat!" : "Utkast sparat!");
          navigate({ to: "/post/$id", params: { id: id.toString() } });
        },
        onError: () => toast.error("Kunde inte skapa inlägg"),
      },
    );
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-bold mb-8">Nytt inlägg</h1>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="write-title">Titel</Label>
          <Input
            id="write-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ge ditt inlägg en titel…"
            data-ocid="write.title.input"
            className="text-lg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="write-content">Innehåll</Label>
          <Textarea
            id="write-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Börja skriva ditt inlägg…"
            data-ocid="write.content.textarea"
            rows={16}
            className="resize-none font-body leading-relaxed"
          />
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="write-published"
            checked={published}
            onCheckedChange={setPublished}
            data-ocid="write.published.toggle"
          />
          <Label htmlFor="write-published" className="cursor-pointer">
            {published ? "Publicera direkt" : "Spara som utkast"}
          </Label>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!title.trim() || !content.trim() || createPost.isPending}
          data-ocid="write.submit_button"
          size="lg"
        >
          {createPost.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {published ? "Publicera inlägg" : "Spara utkast"}
        </Button>
      </div>
    </div>
  );
}
