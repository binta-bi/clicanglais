'use client'
import { Suspense, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Compte les visites sans aucune donnée personnelle :
// identifiant au hasard propre à l'onglet (effacé à sa fermeture), jamais de nom ni d'email.
function Interne() {
  const chemin = usePathname()
  useEffect(() => {
    if (!chemin || chemin.startsWith('/admin')) return
    try {
      let id = sessionStorage.getItem('visiteur')
      if (!id) {
        id = crypto.randomUUID()
        sessionStorage.setItem('visiteur', id)
      }
      const page = chemin.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '[id]')
      supabase.rpc('enregistrer_visite', { p_visiteur: id, p_chemin: page }).then(
        () => {},
        () => {}
      )
    } catch {
      // stockage indisponible : on ne compte pas, sans bloquer le site
    }
  }, [chemin])
  return null
}

export default function SuiviVisites() {
  return (
    <Suspense fallback={null}>
      <Interne />
    </Suspense>
  )
}
