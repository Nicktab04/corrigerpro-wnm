import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Download, Eye, FileText, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { DocumentViewerDialog } from "@/components/DocumentViewerDialog";
import { UploadDocumentDialog } from "@/components/UploadDocumentDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  downloadDocument,
  openDocument,
  useIsAdmin,
  useProfile,
  useSessionUser,
} from "@/hooks/useLicenceHub";
import {
  LEVELS,
  MAJORS,
  kindLabel,
  levelLabel,
  majorStyle,
  type DocKind,
  type DocumentRow,
  type Major,
} from "@/lib/licencehub";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Mes annales — LicenceHub" },
      {
        name: "description",
        content: "Filtrez les sujets d'examens et corrections par filière, niveau, matière et année.",
      },
      { property: "og:title", content: "Mes annales — LicenceHub" },
      {
        property: "og:description",
        content: "Filtrez les sujets d'examens et corrections par filière, niveau, matière et année.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSessionUser();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const rolesQuery = useIsAdmin(user?.id);
  const roles = rolesQuery.data;
  const rolesResolved = Boolean(user) && (rolesQuery.isSuccess || rolesQuery.isError);
  const isAdmin = roles?.isAdmin ?? false;
  const canUpload = isAdmin || (roles?.canUpload ?? false);

  const [major, setMajor] = useState<Major | "all">("all");
  const [level, setLevel] = useState<string>("all");
  const [kind, setKind] = useState<DocKind | "all">("all");
  const [search, setSearch] = useState("");
  const [viewerDocument, setViewerDocument] = useState<DocumentRow | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (profileLoading || !rolesResolved) return;
    if (isAdmin) return;
    if (!profile) {
      navigate({ to: "/register", replace: true });
      return;
    }
    if (profile.status !== "approved") {
      navigate({ to: "/pending", replace: true });
    }
  }, [profile, profileLoading, rolesResolved, isAdmin, navigate]);


  useEffect(() => {
    if (profile) {
      setMajor(profile.major);
      setLevel(String(profile.level));
    }
  }, [profile]);

  const approved = isAdmin || profile?.status === "approved";

  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents", major, level, kind, search],
    enabled: Boolean(approved),
    queryFn: async () => {
      let query = supabase
        .from("documents")
        .select("*")
        .order("year", { ascending: false })
        .order("created_at", { ascending: false });
      if (major !== "all") query = query.eq("major", major);
      if (level !== "all") query = query.eq("level", Number(level));
      if (kind !== "all") query = query.eq("kind", kind);
      if (search.trim()) query = query.or(`title.ilike.%${search.trim()}%,subject.ilike.%${search.trim()}%`);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as DocumentRow[];
    },
  });

  async function view(doc: DocumentRow) {
    setViewerDocument(doc);
    setViewerUrl(null);
    try {
      const url = await openDocument(doc.storage_path);
      setViewerUrl(url);
    } catch {
      setViewerDocument(null);
      toast.error("Impossible d'ouvrir ce fichier");
    }
  }

  async function download(doc: DocumentRow) {
    setDownloadingId(doc.id);
    try {
      await downloadDocument(doc.storage_path, doc.title);
    } catch {
      toast.error("Impossible de télécharger ce fichier");
    } finally {
      setDownloadingId(null);
    }
  }

  async function remove(doc: DocumentRow) {
    const { error } = await supabase.from("documents").delete().eq("id", doc.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await supabase.storage.from("documents").remove([doc.storage_path]);
    await queryClient.invalidateQueries({ queryKey: ["documents"] });
    toast.success("Document supprimé");
  }

  return (
    <AppShell isAdmin={isAdmin} subtitle={profile ? `${profile.prenom} ${profile.nom}` : "Espace admin"}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Annales et corrections</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {profile
              ? `Votre filière : ${profile.major} — ${levelLabel(profile.level)}. Vous pouvez consulter toutes les filières.`
              : "Toutes les filières et tous les niveaux."}
          </p>
        </div>
        {canUpload && user ? <UploadDocumentDialog userId={user.id} /> : null}
      </div>

      <div className="mt-8 grid gap-3 rounded-3xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Select value={major} onValueChange={(v) => setMajor(v as Major | "all")}>
          <SelectTrigger>
            <SelectValue placeholder="Filière" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les filières</SelectItem>
            {MAJORS.map((m) => (
              <SelectItem key={m.key} value={m.key}>
                {m.key} — {m.full}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger>
            <SelectValue placeholder="Niveau" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les niveaux</SelectItem>
            {LEVELS.map((l) => (
              <SelectItem key={l} value={String(l)}>
                {levelLabel(l)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={kind} onValueChange={(v) => setKind(v as DocKind | "all")}>
          <SelectTrigger>
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Sujets et corrections</SelectItem>
            <SelectItem value="exam">Sujets</SelectItem>
            <SelectItem value="correction">Corrections</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Matière ou titre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <Loader2 className="mt-10 size-5 animate-spin text-muted-foreground" />
      ) : !documents || documents.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-border p-12 text-center">
          <FileText className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">Aucun document pour ces filtres</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Élargissez la recherche ou revenez après le prochain dépôt.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {documents.map((doc) => {
            const style = majorStyle(doc.major);
            return (
              <article
                key={doc.id}
                className={`flex flex-col overflow-hidden rounded-3xl border bg-card ${style.border}`}
              >
                <div className={`h-1.5 bg-gradient-to-r ${style.gradient}`} />
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={`${style.bg} text-white`}>{doc.major}</Badge>
                    <Badge variant="secondary">{levelLabel(doc.level)}</Badge>
                    <Badge variant="outline">{kindLabel(doc.kind)}</Badge>
                    <span className="text-xs text-muted-foreground">{doc.year}</span>
                  </div>
                  <h2 className="mt-3 text-base font-bold">{doc.title}</h2>
                  <p className="text-sm text-muted-foreground">{doc.subject}</p>
                  <div className="mt-4 flex flex-wrap gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => view(doc)}>
                      <Eye className="mr-1.5 size-4" /> Consulter
                    </Button>
                    <Button size="sm" onClick={() => download(doc)} disabled={downloadingId === doc.id}>
                      {downloadingId === doc.id ? (
                        <Loader2 className="mr-1.5 size-4 animate-spin" />
                      ) : (
                        <Download className="mr-1.5 size-4" />
                      )}
                      Télécharger
                    </Button>
                    {isAdmin ? (
                      <Button size="sm" variant="ghost" onClick={() => remove(doc)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <DocumentViewerDialog
        document={viewerDocument}
        url={viewerUrl}
        open={Boolean(viewerDocument)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setViewerDocument(null);
            setViewerUrl(null);
          }
        }}
        onDownload={() => {
          if (viewerDocument) void download(viewerDocument);
        }}
        downloading={Boolean(viewerDocument && downloadingId === viewerDocument.id)}
      />
    </AppShell>
  );
}
