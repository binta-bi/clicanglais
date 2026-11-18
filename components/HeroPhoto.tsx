'use client'
import { useEffect, useRef, useState } from 'react'
import { IllustrationApprenante } from '@/components/Illustrations'

// Affiche la photo /apprenant.jpg (dossier public). Si elle est absente, une illustration de secours prend la place.
export default function HeroPhoto() {
  const [etat, setEtat] = useState<'attente' | 'ok' | 'absente'>('attente')
  const img = useRef<HTMLImageElement>(null)

  useEffect(() => {
    // la photo peut déjà être chargée avant que React ne prenne la main
    const el = img.current
    if (el?.complete) setEtat(el.naturalWidth > 0 ? 'ok' : 'absente')
  }, [])

  if (etat === 'absente') {
    return (
      <div className="absolute inset-0">
        <IllustrationApprenante />
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={img}
      src="/apprenant.jpg"
      width={800}
      height={1000}
      alt="Une apprenante suit un cours d’anglais en ligne sur son ordinateur"
      fetchPriority="high"
      onLoad={() => setEtat('ok')}
      onError={() => setEtat('absente')}
      className={`hero-zoom absolute inset-0 h-full w-full object-cover object-[50%_32%] transition-opacity duration-700 ${
        etat === 'ok' ? 'opacity-100' : 'opacity-0'
      }`}
    />
  )
}
