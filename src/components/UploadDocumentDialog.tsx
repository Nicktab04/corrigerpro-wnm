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
import { LEVELS, MAJORS, levelLabel, type DocKind, type Major } from "@/lib/licencehub";

const schema = z.object({
  title: z.string().trim().min(3, "Titre trop court").max(140),
  subject: z.string().trim().min(2, "Matière manquante").max(80),
  major: z.enum(["SEG", "PC", "AGRO"]),
  level: z.number().int().min(1).max(3),
  year: z.number().int().min(1990).max(2100),
  kind: z.enum(["exam", "correction"]),
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
    const { error } = await supabase
      .from("documents")
      .insert({ ...parsed.data, storage_path: path, uploaded_by: userId });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["documents"] });
    toast.success("Document ajouté");
    setOpen(false);
    setTitle("");
    setSubject("");
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
          <DialogTitle>Ajouter un sujet ou une correction</DialogTitle>
          <DialogDescription>
            Les fichiers restent privés et ne sont visibles que par les étudiants validés.
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
                  <SelectItem value="exam">Sujet</SelectItem>
                  <SelectItem value="correction">Correction</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
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
