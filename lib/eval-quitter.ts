import { supabase } from '@/lib/supabase'

// Envoie les réponses au moment où l'élève quitte la page. Un appel "keepalive" part
// même si la page se ferme ; sans lui, la clôture se fait au prochain passage sur le site.
export function envoyerEnQuittant(code: string, reponses: Record<string, string>, token: string | null) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const cle = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const corps = JSON.stringify({ p_code: code, p_reponses: reponses, p_motif: 'quitte' })
  if (url && cle && token) {
    try {
      fetch(`${url}/rest/v1/rpc/eval_soumettre`, {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json', apikey: cle, Authorization: `Bearer ${token}` },
        body: corps,
      }).catch(() => {})
      return
    } catch {
      // on retombe sur l'appel normal ci-dessous
    }
  }
  supabase.rpc('eval_soumettre', { p_code: code, p_reponses: reponses, p_motif: 'quitte' }).then(
    () => {},
    () => {},
  )
}
