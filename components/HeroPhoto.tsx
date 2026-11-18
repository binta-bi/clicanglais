'use client'
import { useEffect, useState } from 'react'
import { IllustrationApprenante } from '@/components/Illustrations'

// Affiche la photo /apprenant.jpg (à déposer dans le dossier public) si elle existe,
// sinon une illustration de secours aux couleurs du site.
export default function HeroPhoto() {
  const [photo, setPhoto] = useState(false)

  useEffect(() => {
    const img = new window.Image()
    img.onload = () => setPhoto(true)
    img.src = '/apprenant.jpg'
  }, [])

  return (
    <div className="absolute inset-0">
      <IllustrationApprenante />
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/apprenant.jpg"
          alt="Une apprenante suit un cours d’anglais sur son ordinateur"
          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700"
          onLoad={(e) => e.currentTarget.classList.replace('opacity-0', 'opacity-100')}
        />
      )}
    </div>
  )
}
