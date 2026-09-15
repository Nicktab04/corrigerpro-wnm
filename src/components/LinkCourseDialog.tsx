import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { DocumentRow } from "@/lib/licencehub";

const NONE = "none";

export function LinkCourseDialog({ course }: { course: DocumentRow }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tdId, setTdId] = useState(course.td_id ?? NONE);
  const [resumeId, setResumeId] = useState(course.resume_id ?? NONE);

  useEffect(() => {
    setTdId(course.td_id ?? NONE);
    setResumeId(course.resume_id ?? NONE);
  }, [course.td_id, course.resume_id]);

  const { data: linkable } = useQuery({
    queryKey: ["linkable-documents"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id, title, subject, kind")
        .in("kind", ["td", "resume"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Pick<DocumentRow, "id" | "title" | "subject" | "kind">[];
    },
  });

  async function save() {
    setBusy(true);
    const { error } = await supabase
      .from("documents")
      .update({
        td_id: tdId === NONE ? null : tdId,
        resume_id: resumeId === NONE ? null : resumeId,
      })
      .eq("id", course.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["documents"] });
    toast.success("Documents rattachés");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" aria-label="Rattacher un TD ou un résumé">
          <Link2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Documents associés</DialogTitle>
          <DialogDescription>{course.title}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>TD associé</Label>
            <Select value={tdId} onValueChange={setTdId}>
              <SelectTrigger>
                <SelectValue placeholder="Aucun TD" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Aucun TD</SelectItem>
                {(linkable ?? [])
                  .filter((d) => d.kind === "td")
                  .map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.title} — {d.subject}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Résumé associé</Label>
            <Select value={resumeId} onValueChange={setResumeId}>
              <SelectTrigger>
                <SelectValue placeholder="Aucun résumé" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Aucun résumé</SelectItem>
                {(linkable ?? [])
                  .filter((d) => d.kind === "resume")
                  .map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.title} — {d.subject}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" onClick={save} disabled={busy}>
            {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
