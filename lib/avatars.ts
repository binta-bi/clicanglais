'use client'
// Photos de profil : lecture groupée des adresses (une seule requête pour plusieurs personnes).
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

const cache = new Map<string, string | null>()

export function useAvatars(ids: string[], rafraichir = 0): Record<string, string | null> {
  const [, setVersion] = useState(0)
  const cle = Array.from(new Set(ids.filter(Boolean))).sort().join(',')
  const precedent = useRef(rafraichir)

  useEffect(() => {
    let annule = false
    const force = precedent.current !== rafraichir
    precedent.current = rafraichir
    const demandes = cle ? cle.split(',').filter((id) => force || !cache.has(id)) : []
    if (demandes.length === 0) return
    supabase.rpc('avatars_de', { p_ids: demandes }).then(({ data, error }) => {
      if (annule || error) return
      const trouves = new Map(((data as { id: string; avatar_url: string | null }[]) || []).map((r) => [r.id, r.avatar_url]))
      for (const id of demandes) cache.set(id, trouves.get(id) ?? null)
      setVersion((v) => v + 1)
    })
    return () => {
      annule = true
    }
  }, [cle, rafraichir])

  const sortie: Record<string, string | null> = {}
  for (const id of cle ? cle.split(',') : []) sortie[id] = cache.get(id) ?? null
  return sortie
}

export function oublierAvatar(id: string) {
  cache.delete(id)
}
