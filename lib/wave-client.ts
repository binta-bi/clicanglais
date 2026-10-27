import { supabase } from '@/lib/supabase'

export type StatutCommande = 'en_attente' | 'paye' | 'echoue'

// Appelle nos routes serveur Wave en envoyant le jeton de connexion de l'élève
async function appel<T>(chemin: string, orderId: string): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error('Connecte-toi pour payer.')
  const r = await fetch(chemin, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ order_id: orderId }),
  })
  const corps = (await r.json().catch(() => ({}))) as { erreur?: string }
  if (!r.ok) throw new Error(corps.erreur || 'Erreur de paiement. Réessaie.')
  return corps as T
}

export const demarrerPaiementWave = (orderId: string) => appel<{ url: string }>('/api/wave/creer', orderId)
export const verifierPaiementWave = (orderId: string) =>
  appel<{ status: StatutCommande }>('/api/wave/verifier', orderId)
