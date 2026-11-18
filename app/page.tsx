import Link from 'next/link'
import LessonDemo from '@/components/LessonDemo'
import HeroPhoto from '@/components/HeroPhoto'
import CompteurAnime from '@/components/CompteurAnime'
import { IllustrationAvance, IllustrationDebutant, IllustrationIntermediaire } from '@/components/Illustrations'
import { niveaux, PRIX_MOIS, PRIX_NIVEAU, fcfa, type Niveau } from '@/lib/niveaux'

// Délai d'apparition d'un bloc du héros (animation échelonnée)
const retard = (d: string) => ({ '--d': d }) as React.CSSProperties

const etapes = [
  {
    titre: 'Passe le test de niveau',
    texte:
      'Il est gratuit et se passe en ligne. Tu peux aussi commencer directement au niveau Débutant.',
  },
  {
    titre: 'Choisis ton mois ou ton niveau',
    texte: `${fcfa(PRIX_MOIS)} le mois, ou ${fcfa(PRIX_NIVEAU)} pour les trois mois d’un niveau.`,
  },
  {
    titre: 'Suis la séance en direct',
    texte: 'Deux fois par semaine, de 20h à 21h30, avec ton professeur.',
  },
  {
    titre: 'Revois-la quand tu veux',
    texte: 'L’enregistrement reste sur la plateforme, avec sa transcription cliquable.',
  },
]

const themes: Record<
  Niveau['slug'],
  { band: string; sous: string; puce: string; coche: string; trait: string }
> = {
  debutant: {
    band: 'bg-mist text-ink',
    sous: 'text-ink/80',
    puce: 'bg-white',
    coche: 'text-brand-deep',
    trait: 'border-ink/20',
  },
  intermediaire: {
    band: 'bg-navy text-white',
    sous: 'text-white/85',
    puce: 'bg-white/10',
    coche: 'text-brand',
    trait: 'border-white/30',
  },
  avance: {
    band: 'bg-ink text-white',
    sous: 'text-white/85',
    puce: 'bg-white/10',
    coche: 'text-brand',
    trait: 'border-white/30',
  },
}

const lignesTests = [
  { label: 'Pour entrer en', t1: 'Intermédiaire', t2: 'Avancé' },
  { label: 'Questions', t1: '30 QCM', t2: '60 QCM' },
  { label: 'Temps', t1: '30 minutes', t2: '50 minutes' },
  { label: 'Score à atteindre', t1: '24 sur 30 (80\u00a0%)', t2: '48 sur 60 (80\u00a0%)' },
]

const regles = [
  'Les tests sont gratuits et se passent sur la plateforme. La correction est automatique : tu vois ton score dès que tu envoies tes réponses.',
  'Chaque test ne se passe qu’une fois. Il ne se repasse pas.',
  'Le temps est compté dès que tu cliques sur « Commencer le test ». Une réponse envoyée après le temps imparti compte comme un échec.',
  'Pour entrer en Avancé, passe d’abord le test Intermédiaire. Si tu penses déjà maîtriser l’Intermédiaire, tu peux passer directement le test Avancé.',
  'Si tu rates le test Intermédiaire, tu commences au niveau Débutant. Si tu rates le test Avancé, tu passes le test Intermédiaire.',
  'Les tests de niveau ne remplacent pas l’examen final de chaque niveau. Cet examen est obligatoire pour recevoir l’attestation.',
]

const atouts = [
  {
    titre: 'Cours en direct',
    texte: 'Deux séances par semaine, de 20h à 21h30, avec ton professeur. Tu poses tes questions en temps réel.',
    icone: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>',
  },
  {
    titre: 'Replays cliquables',
    texte: 'Chaque séance est enregistrée avec sa transcription. Clique sur une phrase pour revenir à ce moment de la vidéo.',
    icone: '<circle cx="12" cy="12" r="9"/><path d="m10 8.5 5 3.5-5 3.5z"/>',
  },
  {
    titre: 'Club par niveau',
    texte: 'Discute et pratique avec les autres élèves de ton niveau, dans un espace réservé aux inscrits.',
    icone: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 5.2a3 3 0 0 1 0 5.6M18 14.4c1.8.8 3 2.6 3 4.6"/>',
  },
  {
    titre: 'Messages avec le professeur',
    texte: 'Écris-lui directement, avec des photos, des fichiers ou des messages vocaux.',
    icone: '<path d="M4 5h16v11H9l-5 4z"/>',
  },
  {
    titre: 'Évaluations corrigées',
    texte: 'Des QCM chronométrés en fin de mois : tu vois ton score dès que tu envoies tes réponses.',
    icone: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 14l2 2 4-4"/>',
  },
  {
    titre: 'Attestation de fin de niveau',
    texte: 'Après l’examen final de chaque niveau, tu reçois ton attestation.',
    icone: '<circle cx="12" cy="9" r="5"/><path d="m8.5 13.5-1.5 7 5-3 5 3-1.5-7"/>',
  },
]

const formations: Record<Niveau['slug'], { accroche: string; Illustration: () => React.JSX.Element }> = {
  debutant: { accroche: 'Les bases pour te débrouiller en anglais au quotidien.', Illustration: IllustrationDebutant },
  intermediaire: { accroche: 'Maîtrise la grammaire et exprime-toi avec précision.', Illustration: IllustrationIntermediaire },
  avance: { accroche: 'Fais de l’anglais un véritable outil professionnel.', Illustration: IllustrationAvance },
}

const chiffres = [
  { valeur: '3', label: 'niveaux' },
  { valeur: '9', label: 'mois de cours' },
  { valeur: '2', label: 'séances par semaine' },
  { valeur: '20h–21h30', label: 'chaque séance' },
]

const questions = [
  {
    q: 'Comment je paie ?',
    r: 'Le paiement se fait par Wave. Après avoir payé, tu indiques ton numéro de transaction sur le site. Ton accès est activé dès que le professeur a vérifié ton paiement, en général en quelques heures.',
  },
  {
    q: 'Je dois passer le test pour commencer ?',
    r: 'Non. Le niveau Débutant est ouvert à tous, sans test. Le test de niveau sert à entrer directement en Intermédiaire ou en Avancé.',
  },
  {
    q: 'Et si je rate une séance en direct ?',
    r: 'Chaque séance est enregistrée sur la plateforme, avec sa transcription cliquable. Tu peux la revoir quand tu veux.',
  },
  {
    q: 'Puis-je être remboursé ?',
    r: 'Un cours activé n’est pas remboursé. Un remboursement est possible en cas de double paiement ou de problème technique qui t’empêche d’accéder au cours, si tu en fais la demande dans les 7 jours.',
  },
  {
    q: 'Comment recevoir mon attestation ?',
    r: 'Chaque niveau se termine par un examen final. Cet examen est obligatoire pour recevoir l’attestation.',
  },
]

function Coche({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={`mt-1 size-5 shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m4 10.5 4 4 8-9" />
    </svg>
  )
}

export default function Accueil() {
  return (
    <>
      {/* Héros */}
      <section className="hero-ivoire relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-6 md:grid-cols-[1.08fr_0.92fr] md:gap-14 md:pb-28 md:pt-16 lg:gap-20">
          <div>
            <p className="h-monte hero-pastille">
              <span className="size-2 rounded-full bg-cuivre" aria-hidden="true" />
              Cours d’anglais en direct, avec replays
            </p>
            <h1
              className="h-monte mt-6 text-balance text-[2.1rem] font-extrabold leading-[1.07] tracking-[-0.025em] text-nuit sm:text-5xl lg:text-[3.8rem]"
              style={retard('0.1s')}
            >
              Apprends l’anglais en direct, revois chaque cours <span className="hero-souligne">quand tu veux</span>
            </h1>
            <p
              className="h-monte mt-6 max-w-xl text-base leading-[1.7] text-ardoise-texte sm:text-lg"
              style={retard('0.2s')}
            >
              Un professeur, trois niveaux, deux séances par semaine de 20h à 21h30. Chaque séance est
              enregistrée sur la plateforme, avec une transcription sur laquelle tu peux cliquer.
            </p>
            <div className="h-monte mt-8 grid gap-3 sm:grid-cols-[auto_auto] sm:justify-start" style={retard('0.3s')}>
              <Link href="/inscription" className="btn-hero">
                Passer le test de niveau
                <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 10h12m-5-5 5 5-5 5" />
                </svg>
              </Link>
              <Link href="#niveaux" className="btn-hero-sec">
                Découvrir les formations
              </Link>
            </div>
            <p className="h-monte mt-5 flex max-w-md items-start gap-2.5 text-sm leading-relaxed text-ardoise-texte" style={retard('0.4s')}>
              <svg viewBox="0 0 20 20" aria-hidden="true" className="mt-0.5 size-[1.1rem] shrink-0 text-royal" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 2.5 3.5 5v4.7c0 3.9 2.7 6.9 6.5 7.8 3.8-.9 6.5-3.9 6.5-7.8V5L10 2.5Z" />
                <path d="m7.2 10 2 2 3.6-4" />
              </svg>
              Pas sûr de ton niveau ? Le niveau Débutant est ouvert à tous, sans test : tu peux commencer dès aujourd’hui.
            </p>
            <ul
              className="h-monte mt-6 hidden flex-wrap md:flex gap-x-6 gap-y-2 border-t border-nuit/10 pt-5 text-sm font-semibold text-nuit"
              style={retard('0.5s')}
            >
              {['Test de niveau gratuit', 'Paiement par Wave', 'Replay de chaque séance'].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Coche className="!mt-0 size-4 text-cuivre" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="h-monte relative mx-auto w-full max-w-md md:max-w-none" style={retard('0.25s')}>
            <div className="hero-cadre" aria-hidden="true" />
            <svg aria-hidden="true" className="hero-points absolute -left-6 -top-6 size-24 text-cuivre" fill="currentColor">
              <defs>
                <pattern id="pts" width="12" height="12" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.6" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#pts)" />
            </svg>
            <div className="relative aspect-[5/6] overflow-hidden rounded-[2rem] bg-royal/10 shadow-[0_40px_70px_-34px_rgb(20_36_58/0.6)] ring-1 ring-nuit/10 md:aspect-[4/5]">
              <HeroPhoto />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-nuit/45 to-transparent" />
            </div>
            <p className="flotte absolute -left-2 bottom-8 flex items-center gap-2.5 rounded-2xl bg-white/90 px-4 py-3 text-sm font-bold text-nuit shadow-[0_18px_34px_-18px_rgb(20_36_58/0.6)] ring-1 ring-nuit/10 backdrop-blur sm:-left-6">
              <span className="relative flex size-3" aria-hidden="true">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-cuivre opacity-60" />
                <span className="relative inline-flex size-3 rounded-full bg-cuivre" />
              </span>
              En direct · 20h–21h30
            </p>
            <p className="flotte flotte-2 absolute -right-2 top-8 flex items-center gap-2 rounded-2xl bg-nuit px-4 py-3 text-sm font-bold text-white shadow-[0_18px_34px_-18px_rgb(20_36_58/0.7)] sm:-right-5">
              <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4 text-cuivre" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 10.5 3.5 3.5L15 6.5" />
              </svg>
              Replay disponible
            </p>
          </div>
          <ul className="h-monte flex flex-wrap gap-x-5 gap-y-2 px-1 text-sm font-semibold text-nuit md:hidden" style={retard('0.5s')}>
            {['Test de niveau gratuit', 'Paiement par Wave', 'Replay de chaque séance'].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Coche className="!mt-0 size-4 text-cuivre" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Chiffres */}
      <section aria-label="L’essentiel en chiffres" className="relative z-10 -mt-8 px-5">
        <dl className="mx-auto grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-2xl bg-line shadow-[0_18px_40px_-20px_rgb(27_35_71/0.35)] ring-1 ring-line md:grid-cols-4">
          {chiffres.map((c) => (
            <div key={c.label} className="bg-white px-4 py-5 text-center">
              <dt className="sr-only">{c.label}</dt>
              <dd className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
                {/^\d+$/.test(c.valeur) ? <CompteurAnime valeur={Number(c.valeur)} /> : c.valeur}
              </dd>
              <dd className="mt-1 text-sm text-ink/70">{c.label}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Formations */}
      <section aria-labelledby="titre-formations" className="bg-white pb-16 pt-20 md:pb-24 md:pt-28">
        <div className="mx-auto max-w-6xl px-5">
          <p className="text-sm font-bold uppercase tracking-widest text-brand-deep">Nos formations</p>
          <h2 id="titre-formations" className="mt-2 max-w-2xl text-balance text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            Trois niveaux pour aller de zéro à l’anglais professionnel
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink/75">
            Chaque formation dure trois mois. Tu avances à ton rythme, avec un examen final et une attestation à la fin
            de chaque niveau.
          </p>
          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {niveaux.map((n) => {
              const f = formations[n.slug]
              return (
                <li key={n.slug} className="reveal">
                  <Link
                    href={`#${n.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-line transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_44px_-22px_rgb(27_35_71/0.45)]"
                  >
                    <div className="aspect-[16/10] overflow-hidden">
                      <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
                        <f.Illustration />
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <p className="text-sm font-bold uppercase tracking-wider text-brand-deep">{n.badge}</p>
                      <h3 className="mt-1 text-2xl font-extrabold tracking-tight">{n.nom}</h3>
                      <p className="mt-2 leading-relaxed text-ink/75">{f.accroche}</p>
                      <ul className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
                        <li className="rounded-full bg-mist px-3 py-1">3 mois</li>
                        <li className="rounded-full bg-mist px-3 py-1">{n.programme.length} leçons</li>
                        <li className="rounded-full bg-mist px-3 py-1">{fcfa(PRIX_MOIS)} / mois</li>
                      </ul>
                      <span className="mt-6 inline-flex items-center gap-2 pt-2 font-bold text-navy">
                        Découvrir le niveau
                        <svg viewBox="0 0 20 20" aria-hidden="true" className="size-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 10h12m-5-5 5 5-5 5" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* Une leçon type */}
      <section aria-labelledby="titre-lecon" className="bg-mist py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 md:grid-cols-2 md:gap-16">
          <div className="reveal">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-deep">Les replays</p>
            <h2 id="titre-lecon" className="mt-2 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
              Revois chaque séance, phrase par phrase
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink/75">
              Chaque cours est enregistré avec sa transcription. Tu cliques sur une phrase et la vidéo revient
              exactement à ce moment : idéal pour réviser, répéter et retenir.
            </p>
          </div>
          <div className="reveal">
            <LessonDemo />
          </div>
        </div>
      </section>

      {/* Atouts */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <p className="text-sm font-bold uppercase tracking-widest text-brand-deep">Pourquoi ClicAnglais</p>
          <h2 className="mt-2 max-w-2xl text-balance text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            Tout ce qu’il faut pour progresser, au même endroit
          </h2>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {atouts.map((a) => (
              <li key={a.titre} className="carte reveal">
                <span className="grid size-12 place-items-center rounded-xl bg-mist text-navy">
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="size-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    dangerouslySetInnerHTML={{ __html: a.icone }}
                  />
                </span>
                <h3 className="mt-4 text-xl font-bold leading-snug">{a.titre}</h3>
                <p className="mt-2 leading-relaxed text-ink/80">{a.texte}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Déroulement */}
      <section className="bg-mist py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <p className="text-sm font-bold uppercase tracking-widest text-brand-deep">En 4 étapes</p>
          <h2 className="mt-2 max-w-2xl text-balance text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            Comment ça se passe
          </h2>
          <ol className="relative mt-10 grid gap-8 md:grid-cols-4 md:gap-6">
            <div
              aria-hidden="true"
              className="absolute left-0 right-0 top-[22px] hidden h-0.5 bg-line md:block"
            />
            {etapes.map((etape, i) => (
              <li key={etape.titre} className="relative flex gap-4 md:block">
                <span className="relative grid size-11 shrink-0 place-items-center rounded-[22%] bg-navy text-lg font-extrabold text-white shadow-[0_8px_18px_-8px_rgb(45_58_107/0.7)]">
                  {i + 1}
                </span>
                <div className="md:mt-5">
                  <h3 className="text-xl font-bold leading-snug">{etape.titre}</h3>
                  <p className="mt-2 leading-relaxed text-ink/80">{etape.texte}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Niveaux */}
      <section id="niveaux" className="scroll-mt-20 bg-white pt-16 md:pt-24">
        <div className="mx-auto max-w-6xl px-5 pb-12">
          <p className="text-sm font-bold uppercase tracking-widest text-brand-deep">Le parcours</p>
          <h2 className="mt-2 max-w-2xl text-balance text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            Trois niveaux, trois mois chacun
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink/80">
            Chaque niveau compte environ 24 leçons d’1h30. Tu paies {fcfa(PRIX_MOIS)} par
            mois, ou {fcfa(PRIX_NIVEAU)} pour les trois mois d’un niveau.
          </p>
        </div>

        {niveaux.map((n) => {
          const t = themes[n.slug]
          return (
            <article key={n.slug} id={n.slug} className={`relative scroll-mt-20 overflow-hidden ${t.band}`}>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-brand/10 blur-2xl"
              />
              <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-14 lg:grid-cols-[5fr_7fr] lg:gap-16 lg:py-20">
                <div>
                  <p className="inline-block rounded-full border border-current/25 px-3 py-1 text-sm font-semibold">
                    {n.badge}
                  </p>
                  <h3 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">{n.nom}</h3>
                  <p className={`mt-5 max-w-md text-lg leading-relaxed ${t.sous}`}>{n.objectif}</p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <p className={`rounded-xl px-4 py-3 ring-1 ring-current/10 ${t.puce}`}>
                      <span className="block text-2xl font-extrabold">{fcfa(PRIX_MOIS)}</span>
                      <span className={`text-sm ${t.sous}`}>par mois</span>
                    </p>
                    <p className={`rounded-xl px-4 py-3 ring-1 ring-current/10 ${t.puce}`}>
                      <span className="block text-2xl font-extrabold">{fcfa(PRIX_NIVEAU)}</span>
                      <span className={`text-sm ${t.sous}`}>le niveau, trois mois</span>
                    </p>
                  </div>
                  <Link href="/inscription" className="btn-primary mt-7">
                    {n.cta}
                  </Link>
                </div>

                <div>
                  <h4 className="text-xl font-bold">Compétences acquises à la fin du niveau</h4>
                  <ul className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                    {n.avantages.map((a) => (
                      <li key={a} className="flex gap-3 leading-snug">
                        <Coche className={t.coche} />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>

                  <details className={`group mt-8 border-t pt-5 ${t.trait}`}>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold [&::-webkit-details-marker]:hidden">
                      Voir les {n.programme.length} leçons du programme
                      <svg
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                        className="size-5 shrink-0 transition-transform group-open:rotate-180"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m5 8 5 5 5-5" />
                      </svg>
                    </summary>
                    <ol className="mt-4 list-decimal gap-x-8 pl-6 sm:columns-2">
                      {n.programme.map((lecon) => (
                        <li key={lecon} className="break-inside-avoid py-1 pl-1">
                          {lecon}
                        </li>
                      ))}
                    </ol>
                  </details>
                </div>
              </div>
            </article>
          )
        })}
      </section>

      {/* Admission */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-brand-deep">Les tests</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Admission et test de niveau
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink/80">
              Le niveau Débutant est ouvert à tous, sans test. Pour entrer plus haut, passe d’abord
              le test Intermédiaire, ou le test Avancé si tu maîtrises déjà l’Intermédiaire.
            </p>
            <ul className="mt-8 flex flex-col gap-4">
              {regles.map((regle) => (
                <li key={regle} className="flex gap-3 leading-relaxed">
                  <Coche className="text-brand-deep" />
                  <span>{regle}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="self-start">
            <div className="overflow-x-auto rounded-2xl bg-white shadow-[0_18px_40px_-24px_rgb(27_35_71/0.35)] ring-1 ring-line">
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">Comparaison des deux tests de niveau</caption>
                <thead className="bg-navy text-white">
                  <tr>
                    <th scope="col" className="p-3 sm:p-4">
                      <span className="sr-only">Critère</span>
                    </th>
                    <th scope="col" className="p-3 text-lg font-extrabold sm:p-4">
                      Test 1
                    </th>
                    <th scope="col" className="p-3 text-lg font-extrabold sm:p-4">
                      Test 2
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {lignesTests.map((l) => (
                    <tr key={l.label}>
                      <th scope="row" className="p-3 font-medium text-ink/70 sm:p-4">
                        {l.label}
                      </th>
                      <td className="p-3 font-semibold sm:p-4">{l.t1}</td>
                      <td className="p-3 font-semibold sm:p-4">{l.t2}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-ink/70">
              Le Test 2 comprend 30 questions de niveau Débutant et 30 de niveau Intermédiaire.
            </p>
          </div>
        </div>
      </section>

      {/* Questions fréquentes */}
      <section className="bg-mist py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-5">
          <p className="text-sm font-bold uppercase tracking-widest text-brand-deep">FAQ</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Questions fréquentes</h2>
          <div className="mt-8 flex flex-col gap-3">
            {questions.map((q) => (
              <details key={q.q} className="group rounded-2xl bg-white p-5 ring-1 ring-line open:shadow-[0_14px_30px_-18px_rgb(27_35_71/0.3)]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold [&::-webkit-details-marker]:hidden">
                  {q.q}
                  <svg
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                    className="size-5 shrink-0 text-brand-deep transition-transform group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m5 8 5 5 5-5" />
                  </svg>
                </summary>
                <p className="mt-3 leading-relaxed text-ink/80">{q.r}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-ink/80">
            Une autre question ? Écris-nous à{' '}
            <a href="mailto:clicanglais@gmail.com" className="font-bold text-navy underline">
              clicanglais@gmail.com
            </a>
            .
          </p>
        </div>
      </section>

      {/* Appel final */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 -top-24 size-80 rounded-full bg-brand/20 blur-3xl"
        />
        <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 py-16 md:flex-row md:items-center md:justify-between md:py-20">
          <div>
            <h2 className="max-w-xl text-3xl font-extrabold tracking-tight sm:text-4xl">
              Prêt à commencer ?
            </h2>
            <p className="mt-3 max-w-xl text-lg leading-relaxed text-white/85">
              Crée ton compte, passe le test si tu vises un niveau plus haut, puis choisis ton mois.
            </p>
          </div>
          <Link href="/inscription" className="btn-primary shrink-0">
            Créer mon compte
          </Link>
        </div>
      </section>

      <footer className="bg-ink text-white/80">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <p className="text-2xl font-extrabold text-white">
              Clic<span className="text-brand">Anglais</span>
            </p>
            <p className="mt-2 max-w-sm leading-relaxed">
              Cours d’anglais en direct, replays et exercices, pour tous les niveaux.
            </p>
          </div>
          <nav aria-label="Pied de page" className="flex flex-col gap-2 text-sm font-medium">
            <Link href="/cours" className="hover:text-white">Cours</Link>
            <Link href="/connexion" className="hover:text-white">Connexion</Link>
            <Link href="/inscription" className="hover:text-white">Inscription</Link>
          </nav>
          <nav aria-label="Informations légales" className="flex flex-col gap-2 text-sm font-medium">
            <Link href="/cgu" className="hover:text-white">Conditions d’utilisation</Link>
            <Link href="/confidentialite" className="hover:text-white">Confidentialité</Link>
            <a href="mailto:clicanglais@gmail.com" className="hover:text-white">clicanglais@gmail.com</a>
          </nav>
        </div>
        <p className="border-t border-white/10 px-5 py-5 text-center text-sm text-white/60">
          © 2026 ClicAnglais. Tous droits réservés.
        </p>
      </footer>
    </>
  )
}
