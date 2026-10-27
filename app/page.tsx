import Link from 'next/link'
import LessonDemo from '@/components/LessonDemo'
import { niveaux, PRIX_MOIS, PRIX_NIVEAU, fcfa, type Niveau } from '@/lib/niveaux'

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
    texte: 'Deux fois par semaine, de 19h à 21h, avec ton professeur.',
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
      <section className="bg-mist">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-14 md:grid-cols-2 md:py-20">
          <div>
            <h1 className="text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Apprends l’anglais en direct, revois chaque cours quand tu veux
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/80">
              Un professeur, trois niveaux, deux séances par semaine de 19h à 21h. Chaque séance est
              enregistrée sur la plateforme, avec une transcription sur laquelle tu peux cliquer.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/inscription" className="btn-primary">
                Passer le test de niveau
              </Link>
              <Link href="#niveaux" className="btn-secondary">
                Voir les niveaux
              </Link>
            </div>
            <p className="mt-4 text-sm text-ink/70">
              Le test est gratuit. Tu peux aussi commencer directement au niveau Débutant.
            </p>
          </div>
          <LessonDemo />
        </div>
      </section>

      {/* Déroulement */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
            Comment ça se passe
          </h2>
          <ol className="relative mt-10 grid gap-8 md:grid-cols-4 md:gap-6">
            <div
              aria-hidden="true"
              className="absolute left-0 right-0 top-[22px] hidden h-0.5 bg-line md:block"
            />
            {etapes.map((etape, i) => (
              <li key={etape.titre} className="relative flex gap-4 md:block">
                <span className="relative grid size-11 shrink-0 place-items-center rounded-[22%] bg-navy text-lg font-extrabold text-white">
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
      <section id="niveaux" className="scroll-mt-4 bg-white pt-4">
        <div className="mx-auto max-w-6xl px-5 pb-10">
          <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
            Trois niveaux, trois mois chacun
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink/80">
            Chaque niveau compte environ 24 leçons de deux heures. Tu paies {fcfa(PRIX_MOIS)} par
            mois, ou {fcfa(PRIX_NIVEAU)} pour les trois mois d’un niveau.
          </p>
        </div>

        {niveaux.map((n) => {
          const t = themes[n.slug]
          return (
            <article key={n.slug} id={n.slug} className={`scroll-mt-4 ${t.band}`}>
              <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 lg:grid-cols-[5fr_7fr] lg:gap-16 lg:py-20">
                <div>
                  <p className="text-lg font-semibold">{n.badge}</p>
                  <h3 className="mt-1 text-4xl font-extrabold tracking-tight sm:text-5xl">
                    {n.nom}
                  </h3>
                  <p className={`mt-5 max-w-md text-lg leading-relaxed ${t.sous}`}>{n.objectif}</p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <p className={`rounded-xl px-4 py-3 ${t.puce}`}>
                      <span className="block text-2xl font-extrabold">{fcfa(PRIX_MOIS)}</span>
                      <span className={`text-sm ${t.sous}`}>par mois</span>
                    </p>
                    <p className={`rounded-xl px-4 py-3 ${t.puce}`}>
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
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
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
            <div className="overflow-x-auto rounded-2xl ring-1 ring-line">
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">Comparaison des deux tests de niveau</caption>
                <thead className="bg-mist">
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

      {/* Appel final */}
      <section className="bg-navy text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 py-14 md:flex-row md:items-center md:justify-between md:py-16">
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
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8">
          <p>
            <span className="text-xl font-extrabold text-white">
              Clic<span className="text-brand">Anglais</span>
            </span>
            <span className="ml-3">Apprends l’anglais en quelques clics</span>
          </p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
            <Link href="/cours">Cours</Link>
            <Link href="/connexion">Connexion</Link>
            <Link href="/inscription">Inscription</Link>
            <Link href="/cgu">Conditions</Link>
            <Link href="/confidentialite">Confidentialité</Link>
          </nav>
        </div>
      </footer>
    </>
  )
}
