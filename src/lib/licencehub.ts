export type Major = "SEG" | "PC" | "AGRO";
export type DocKind = "exam" | "correction" | "cours" | "td" | "resume";
export type AccessStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  nom: string;
  prenom: string;
  gmail: string;
  whatsapp: string;
  major: Major;
  level: number;
  status: AccessStatus;
  plan?: "free" | "paid";
  created_at: string;
}

export interface DocumentRow {
  id: string;
  title: string;
  subject: string;
  major: Major;
  level: number;
  year: number;
  kind: DocKind;
  storage_path: string;
  created_at: string;
  td_id?: string | null;
  resume_id?: string | null;
  is_free?: boolean;
  price?: number | null;
}

/** Corrections et Résumés sont réservés aux membres payants, sauf s'ils sont marqués gratuits. */
export const isPremiumKind = (kind: DocKind) => kind === "correction" || kind === "resume";
export const isLocked = (doc: DocumentRow, opts: { isAdmin: boolean; plan?: string | undefined }) =>
  !opts.isAdmin && isPremiumKind(doc.kind) && !doc.is_free && opts.plan !== "paid";
export const LOCKED_MESSAGE = "Contenu réservé aux membres payants";

export const MAJORS: {
  key: Major;
  label: string;
  full: string;
  text: string;
  bg: string;
  soft: string;
  border: string;
  gradient: string;
}[] = [
  {
    key: "SEG",
    label: "SEG",
    full: "Sciences Économiques et de Gestion",
    text: "text-seg",
    bg: "bg-seg",
    soft: "bg-seg-soft",
    border: "border-seg/30",
    gradient: "from-seg to-seg-accent",
  },
  {
    key: "PC",
    label: "PC",
    full: "Physique — Chimie",
    text: "text-pc",
    bg: "bg-pc",
    soft: "bg-pc-soft",
    border: "border-pc/30",
    gradient: "from-pc-accent to-pc",
  },
  {
    key: "AGRO",
    label: "AGRO",
    full: "Sciences Agronomiques",
    text: "text-agro",
    bg: "bg-agro",
    soft: "bg-agro-soft",
    border: "border-agro/30",
    gradient: "from-agro to-agro-accent",
  },
];

export const majorStyle = (major: Major) => MAJORS.find((m) => m.key === major) ?? MAJORS[0]!;

export const LEVELS = [1, 2, 3] as const;
export const levelLabel = (level: number) => `Licence ${level}`;
export const KIND_LABELS: Record<DocKind, string> = {
  exam: "Sujet",
  correction: "Correction",
  cours: "Cours",
  td: "TD",
  resume: "Résumé",
};

export const DOC_KINDS: DocKind[] = ["exam", "correction", "cours", "td", "resume"];

/** Types proposés dans les filtres : TD et Résumé ne sont jamais proposés seuls,
 *  ils restent accessibles depuis le cours auquel ils sont rattachés. */
export const FILTER_KINDS: DocKind[] = ["exam", "correction", "cours"];

export const kindLabel = (kind: DocKind) => KIND_LABELS[kind] ?? kind;
