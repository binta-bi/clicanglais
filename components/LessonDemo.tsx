'use client'
import { useEffect, useState } from 'react'

const lignes = [
  { en: 'Good evening, my name is Awa.', fr: 'Bonsoir, je m’appelle Awa.' },
  { en: 'I am twenty-five years old.', fr: 'J’ai vingt-cinq ans.' },
  { en: 'I am a nurse.', fr: 'Je suis infirmière.' },
  { en: 'Nice to meet you.', fr: 'Enchantée.' },
]

export default function LessonDemo() {
  const [actif, setActif] = useState(0)
  const [auto, setAuto] = useState(true)

  useEffect(() => {
    if (!auto) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = setInterval(() => {
      setActif((i) => (i + 1) % lignes.length)
    }, 2600)
    return () => clearInterval(timer)
  }, [auto])

  function choisir(i: number) {
    setActif(i)
    setAuto(false)
  }

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div
        aria-hidden="true"
        className="absolute -bottom-3 -right-3 h-full w-full rounded-3xl bg-navy"
      />
      <div
        role="group"
        aria-label="Exemple de leçon avec transcription cliquable"
        className="relative rounded-3xl bg-white p-4 ring-1 ring-line"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-bold leading-tight">Self-Introduction</p>
            <p className="text-sm text-ink/70">Exemple de leçon du niveau Débutant</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-mist px-3 py-1 text-sm font-semibold">
            <span className="size-2 rounded-full bg-brand" aria-hidden="true" />
            Replay
          </span>
        </div>

        <div className="relative aspect-video overflow-hidden rounded-2xl bg-ink">
          <div className="absolute inset-0 grid place-items-center" aria-hidden="true">
            <span className="grid size-16 place-items-center rounded-[22%] bg-white/10 ring-1 ring-white/25">
              <span className="ml-1 block size-6 bg-white [clip-path:polygon(0_0,100%_50%,0_100%)]" />
            </span>
          </div>
          <p className="absolute inset-x-3 bottom-5 text-center">
            <span className="inline-block rounded bg-black/55 px-2 py-1 text-sm font-semibold text-white">
              {lignes[actif].en}
            </span>
          </p>
          <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/20" aria-hidden="true">
            <div
              className="h-full bg-brand transition-[width] duration-500"
              style={{ width: `${((actif + 1) / lignes.length) * 100}%` }}
            />
          </div>
        </div>

        <ul className="mt-3 flex flex-col gap-1.5">
          {lignes.map((ligne, i) => {
            const estActif = i === actif
            return (
              <li key={ligne.en}>
                <button
                  type="button"
                  onClick={() => choisir(i)}
                  aria-current={estActif ? 'true' : undefined}
                  className={`w-full rounded-xl px-3 py-2 text-left transition-colors ${
                    estActif ? 'bg-brand-deep text-white' : 'hover:bg-mist'
                  }`}
                >
                  <span className="block font-semibold">{ligne.en}</span>
                  <span className={`block text-sm ${estActif ? 'text-white/90' : 'text-ink/70'}`}>
                    {ligne.fr}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        <p className="mt-3 text-sm text-ink/70">
          Clique sur une phrase pour revenir à ce moment de la vidéo.
        </p>
      </div>
    </div>
  )
}
