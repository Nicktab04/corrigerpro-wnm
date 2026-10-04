import { useQueryClient } from "@tanstack/react-query";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  type Major,
} from "@/lib/licencehub";

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
  const [file, setFile] = useState<File | null>(null);
  const [tdFile, setTdFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isFree, setIsFree] = useState(false);
  const [resumeFree, setResumeFree] = useState(false);

  function resetForm() {
    setTitle("");
    setSubject("");
    setFile(null);
    setTdFile(null);
    setResumeFile(null);
    setIsFree(false);
    setResumeFree(false);
  }

  async function uploadFile(target: File, m: Major, l: number) {
    const safeName = target.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${m}/L${l}/${crypto.randomUUID()}-${safeName}`;
    const { error } = await supabase.storage.from("documents").upload(path, target);
    if (error) throw new Error(error.message);
    return path;
  }

  async function insertDocument(values: {
    title: string;
    subject: string;
    major: Major;
    level: number;
    year: number;
    kind: DocKind;
    storage_path: string;
    td_id?: string | null;
    resume_id?: string | null;
    is_free?: boolean;
  }) {
    const { data, error } = await supabase
      .from("documents")
      .insert({ ...values, uploaded_by: userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return data.id;
  }

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
      toast.error("Choisissez le fichier principal");
      return;
    }
    const base = parsed.data;
    const isCourse = base.kind === "cours";
    setBusy(true);
    try {
      let tdId: string | null = null;
      let resumeId: string | null = null;

      if (isCourse && tdFile) {
        const path = await uploadFile(tdFile, base.major, base.level);
        tdId = await insertDocument({
          ...base,
          kind: "td",
          title: `TD — ${base.title}`,
          storage_path: path,
        });
      }
      if (isCourse && resumeFile) {
        const path = await uploadFile(resumeFile, base.major, base.level);
        resumeId = await insertDocument({
          ...base,
          kind: "resume",
          title: `Résumé — ${base.title}`,
          storage_path: path,
          is_free: resumeFree,
        });
      }

      const mainPath = await uploadFile(file, base.major, base.level);
      await insertDocument({
        ...base,
        storage_path: mainPath,
        td_id: isCourse ? tdId : null,
        resume_id: isCourse ? resumeId : null,
        is_free: base.kind === "correction" || base.kind === "resume" ? isFree : false,
      });

      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      await queryClient.invalidateQueries({ queryKey: ["linked-documents"] });
      await queryClient.invalidateQueries({ queryKey: ["linkable-documents"] });
      toast.success(
        isCourse && (tdFile || resumeFile) ? "Cours et documents associés ajoutés" : "Document ajouté",
      );
      setOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Envoi impossible");
    } finally {
      setBusy(false);
    }
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

          <div className="space-y-2">
            <Label htmlFor="doc-file">
              {kind === "cours" ? "Fichier du Cours" : "Fichier (PDF, image, document)"}
            </Label>
            <Input
              id="doc-file"
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {kind === "cours" ? (
            <div className="space-y-4 rounded-2xl border border-border bg-muted/40 p-4">
              <div className="space-y-2">
                <Label htmlFor="doc-td-file">Fichier du TD (optionnel)</Label>
                <Input
                  id="doc-td-file"
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={(e) => setTdFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-resume-file">Fichier du Résumé (optionnel)</Label>
                <Input
                  id="doc-resume-file"
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Le TD et le résumé déposés ici sont créés et rattachés automatiquement au cours.
              </p>
            </div>
          ) : null}

          {kind === "correction" || kind === "resume" ? (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={isFree} onCheckedChange={(v) => setIsFree(v === true)} />
              Rendre ce document gratuit
            </label>
          ) : null}
          {kind === "cours" && resumeFile ? (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={resumeFree} onCheckedChange={(v) => setResumeFree(v === true)} />
              Rendre le Résumé gratuit
            </label>
          ) : null}

          <Button className="w-full" onClick={submit} disabled={busy}>
            {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Envoyer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
