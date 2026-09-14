import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Download, FileText, GraduationCap, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MAJORS, LEVELS, levelLabel } from "@/lib/licencehub";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CorrigéPro — Sujets et corrections par filière" },
      {
        name: "description",
        content:
          "CorrigéPro réunit les sujets d'examens et leurs corrections pour les étudiants de Licence 1, 2 et 3 en SEG, PC et AGRO. Demandez un accès, puis révisez.",
      },
      { property: "og:title", content: "CorrigéPro — Sujets et corrections par filière" },
      {
        property: "og:description",
        content:
          "Sujets d'examens et corrections des années passées, classés par filière et par niveau de licence.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </span>
          <span className="font-display text-lg font-bold">CorrigéPro</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link to="/auth">Se connecter</Link>
          </Button>
          <Button asChild>
            <Link to="/auth" search={{ mode: "signup" }}>
              Demander un accès
            </Link>
          </Button>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-5 pt-10 pb-20">
        <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
          <BadgeCheck className="size-3.5 text-primary" /> Accès réservé aux étudiants validés
        </p>
        <h1 className="mt-6 max-w-3xl text-4xl leading-[1.05] font-extrabold sm:text-6xl">
          Tous les sujets d'examens et leurs corrections, au même endroit.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          CorrigéPro rassemble les épreuves des années passées pour les Licences 1, 2 et 3, classées
          par filière et par niveau. Vous cherchez, vous consultez, vous téléchargez.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/auth" search={{ mode: "signup" }}>
              Créer mon compte étudiant <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/auth">J'ai déjà un compte</Link>
          </Button>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {MAJORS.map((m) => (
            <article
              key={m.key}
              className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
            >
              <div className={`bg-gradient-to-br ${m.gradient} px-6 py-8 text-white`}>
                <p className="font-display text-3xl font-extrabold">{m.label}</p>
                <p className="mt-1 text-sm opacity-90">{m.full}</p>
              </div>
              <div className="space-y-2 px-6 py-5">
                {LEVELS.map((l) => (
                  <p key={l} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className={`size-4 ${m.text}`} /> {levelLabel(l)} — sujets &
                    corrections
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 md:grid-cols-3">
          {[
            {
              icon: GraduationCap,
              title: "1. Vous vous inscrivez",
              text: "Nom, prénom, Gmail, WhatsApp, votre filière et votre niveau. Avec Google, c'est encore plus rapide.",
            },
            {
              icon: ShieldCheck,
              title: "2. Un responsable valide",
              text: "Votre demande passe en attente. Dès qu'elle est acceptée, votre espace s'ouvre.",
            },
            {
              icon: Download,
              title: "3. Vous révisez",
              text: "Filtrez par filière, niveau, matière et année, puis consultez ou téléchargez.",
            },
          ].map((s) => (
            <div key={s.title}>
              <span className="grid size-11 place-items-center rounded-2xl bg-secondary text-primary">
                <s.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-5 py-10 text-sm text-muted-foreground">
        CorrigéPro — sujets et corrections pour les étudiants en licence.
      </footer>
    </div>
  );
}
