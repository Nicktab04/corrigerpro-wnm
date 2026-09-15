import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  DOC_KINDS,
  LEVELS,
  MAJORS,
  kindLabel,
  levelLabel,
  type DocKind,
  type DocumentRow,
  type Major,
} from "@/lib/licencehub";

const NONE = "none";

const schema = z.object({
  title: z.string().trim().min(3, "Titre trop court").max(140),
  subject: z.string().trim().min(2, "Matière manquante").max(80),
  major: z.enum(["SEG", "PC", "AGRO"]),
  level: z.number().int().min(1).max(3),
  year: z.number().int().min(1990).max(2100),
  kind: z.enum(["exam", "correction", "cours", "td", "resume"]),
});

export function UploadDocumentDialog({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [major, setMajor] = useState<Major | "">("");
  const [level, setLevel] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear() - 1));
  const [kind, setKind] = useState<DocKind | "">("");
  const [tdId, setTdId] = useState<string>(NONE);
  const [resumeId, setResumeId] = useState<string>(NONE);
  const [file, setFile] = useState<File | null>(null);

  const { data: linkable } = useQuery({
    queryKey: ["linkable-documents"],
    enabled: open && kind === "cours",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id, title, subject, kind, major, level, year")
        .in("kind", ["td", "resume"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Pick<
        DocumentRow,
        "id" | "title" | "subject" | "kind" | "major" | "level" | "year"
      >[];
    },
  });

  const tdOptions = (linkable ?? []).filter((d) => d.kind === "td");
  const resumeOptions = (linkable ?? []).filter((d) => d.kind === "resume");

  async function submit() {
    const parsed = schema.safeParse({
      title,
      subject,
      major,
      level: Number(level),
      year: Number(year),
      kind,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Formulaire incomplet");
      return;
    }
    if (!file) {
      toast.error("Choisissez un fichier");
      return;
    }
    setBusy(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${parsed.data.major}/L${parsed.data.level}/${crypto.randomUUID()}-${safeName}`;
    const upload = await supabase.storage.from("documents").upload(path, file);
    if (upload.error) {
      setBusy(false);
      toast.error(upload.error.message);
      return;
    }
    const isCourse = parsed.data.kind === "cours";
    const { error } = await supabase.from("documents").insert({
      ...parsed.data,
      storage_path: path,
      uploaded_by: userId,
      td_id: isCourse && tdId !== NONE ? tdId : null,
      resume_id: isCourse && resumeId !== NONE ? resumeId : null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["documents"] });
    await queryClient.invalidateQueries({ queryKey: ["linkable-documents"] });
    toast.success("Document ajouté");
    setOpen(false);
    setTitle("");
    setSubject("");
    setTdId(NONE);
    setResumeId(NONE);
    setFile(null);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-1.5 size-4" /> Ajouter un document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter un document</DialogTitle>
          <DialogDescription>
            Sujet, correction, cours, TD ou résumé. Les fichiers restent privés et ne sont visibles
            que par les étudiants validés.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="doc-title">Titre</Label>
            <Input
              id="doc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Examen final de Microéconomie"
              maxLength={140}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="doc-subject">Matière</Label>
              <Input
                id="doc-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Microéconomie"
                maxLength={80}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-year">Année</Label>
              <Input
                id="doc-year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Filière</Label>
              <Select value={major} onValueChange={(v) => setMajor(v as Major)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filière" />
                </SelectTrigger>
                <SelectContent>
                  {MAJORS.map((m) => (
                    <SelectItem key={m.key} value={m.key}>
                      {m.key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Niveau</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Niveau" />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => (
                    <SelectItem key={l} value={String(l)}>
                      {levelLabel(l)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as DocKind)}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {DOC_KINDS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {kindLabel(k)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {kind === "cours" ? (
            <div className="grid gap-4 rounded-2xl border border-border bg-muted/40 p-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>TD associé (optionnel)</Label>
                <Select value={tdId} onValueChange={setTdId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Aucun TD" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Aucun TD</SelectItem>
                    {tdOptions.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.title} — {d.subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Résumé associé (optionnel)</Label>
                <Select value={resumeId} onValueChange={setResumeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Aucun résumé" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Aucun résumé</SelectItem>
                    {resumeOptions.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.title} — {d.subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Déposez d'abord le TD et le résumé, puis rattachez-les ici au cours.
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="doc-file">Fichier (PDF, image, document)</Label>
            <Input
              id="doc-file"
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <Button className="w-full" onClick={submit} disabled={busy}>
            {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Envoyer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
