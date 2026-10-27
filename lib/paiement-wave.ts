// Logique du paiement Wave, côté serveur uniquement.
// Les dépendances (base de données, appels Wave) sont injectées pour pouvoir tester sans réseau.

export type Commande = {
  id: string
  student_id: string
  amount: number
  status: 'en_attente' | 'paye' | 'echoue'
  provider: string
  provider_ref: string | null
}

export type SessionWave = {
  id: string
  wave_launch_url?: string
  checkout_status?: 'open' | 'complete' | 'expired'
  payment_status?: 'processing' | 'cancelled' | 'succeeded'
  client_reference?: string | null
  transaction_id?: string | null
  amount?: string | number
  currency?: string
}

export type Deps = {
  // Renvoie l'id de l'utilisateur correspondant au jeton, ou null
  utilisateur: (token: string) => Promise<string | null>
  // Lit une commande AVEC les droits de l'utilisateur (donc seulement les siennes)
  commande: (token: string, id: string) => Promise<Commande | null>
  majCommande: (id: string, champs: Partial<Pick<Commande, 'provider' | 'provider_ref' | 'status'>>) => Promise<void>
  finaliser: (id: string, ref: string) => Promise<void>
  wave: {
    creer: (corps: Record<string, string>) => Promise<SessionWave>
    lire: (id: string) => Promise<SessionWave>
  }
}

export class ErreurPaiement extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

async function commandeDe(d: Deps, token: string, id: unknown): Promise<Commande> {
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) throw new ErreurPaiement('Commande invalide.')
  const uid = await d.utilisateur(token)
  if (!uid) throw new ErreurPaiement('Connecte-toi pour payer.', 401)
  const c = await d.commande(token, id)
  if (!c || c.student_id !== uid) throw new ErreurPaiement('Commande introuvable.', 404)
  return c
}

// Démarre (ou reprend) un paiement Wave et renvoie le lien vers Wave
export async function creerPaiement(d: Deps, token: string, orderId: unknown, siteUrl: string) {
  const c = await commandeDe(d, token, orderId)
  if (c.status === 'paye') throw new ErreurPaiement('Cette commande est déjà payée.')
  if (c.status === 'echoue') throw new ErreurPaiement('Cette commande est clôturée. Recommence l\'achat depuis la page du cours.')
  if (!Number.isInteger(Number(c.amount)) || Number(c.amount) <= 0) throw new ErreurPaiement('Montant invalide.')

  // Un paiement Wave déjà ouvert est réutilisé : on évite de créer des doublons
  if (c.provider === 'wave' && c.provider_ref) {
    const ancienne = await d.wave.lire(c.provider_ref).catch(() => null)
    if (ancienne?.checkout_status === 'open' && ancienne.wave_launch_url) {
      return { url: ancienne.wave_launch_url }
    }
  }

  const base = siteUrl.replace(/\/$/, '')
  const session = await d.wave.creer({
    amount: String(Math.round(Number(c.amount))),
    currency: 'XOF',
    client_reference: c.id,
    success_url: `${base}/paiement/${c.id}?retour=1`,
    error_url: `${base}/paiement/${c.id}?erreur=1`,
  })
  if (!session?.id || !session.wave_launch_url) throw new ErreurPaiement('Wave n\'a pas renvoyé de lien de paiement.', 502)
  await d.majCommande(c.id, { provider: 'wave', provider_ref: session.id })
  return { url: session.wave_launch_url }
}

// Demande à Wave si la commande est payée ; si oui, débloque les cours.
// On ne fait JAMAIS confiance à la page de retour : seule la réponse de Wave compte.
export async function verifierPaiement(d: Deps, token: string, orderId: unknown) {
  const c = await commandeDe(d, token, orderId)
  if (c.status !== 'en_attente') return { status: c.status }
  if (c.provider !== 'wave' || !c.provider_ref) return { status: c.status }

  const s = await d.wave.lire(c.provider_ref)
  if (s.client_reference && s.client_reference !== c.id) {
    throw new ErreurPaiement('Ce paiement ne correspond pas à la commande.', 409)
  }
  if (s.payment_status === 'succeeded') {
    if (s.amount !== undefined && Number(s.amount) !== Number(c.amount)) {
      throw new ErreurPaiement('Le montant payé ne correspond pas à la commande. Contacte le professeur.', 409)
    }
    if (s.currency !== undefined && s.currency !== 'XOF') {
      throw new ErreurPaiement('La devise du paiement est incorrecte. Contacte le professeur.', 409)
    }
    await d.finaliser(c.id, s.transaction_id || s.id)
    return { status: 'paye' as const }
  }
  if (s.checkout_status === 'expired') {
    await d.majCommande(c.id, { status: 'echoue' })
    return { status: 'echoue' as const }
  }
  return { status: 'en_attente' as const }
}

// --- Vrais appels (production) -----------------------------------------------------

export function depsReelles(): Deps {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publique = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const secrete = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  const cleWave = process.env.WAVE_API_KEY
  const baseWave = process.env.WAVE_API_BASE || 'https://api.wave.com'
  if (!url || !publique || !secrete) throw new ErreurPaiement('Le paiement n\'est pas encore configuré.', 503)
  if (!cleWave) throw new ErreurPaiement('Le paiement Wave n\'est pas encore configuré.', 503)

  const rest = (chemin: string, init: RequestInit & { cle: string; token?: string }) =>
    fetch(`${url}${chemin}`, {
      ...init,
      cache: 'no-store',
      headers: {
        apikey: init.cle,
        Authorization: `Bearer ${init.token ?? init.cle}`,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    })

  async function appelWave(chemin: string, init?: RequestInit): Promise<SessionWave> {
    const r = await fetch(`${baseWave}${chemin}`, {
      ...init,
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${cleWave}`, 'Content-Type': 'application/json' },
    })
    if (!r.ok) {
      let detail = ''
      try {
        detail = ((await r.json()) as { message?: string; code?: string }).message || ''
      } catch {}
      console.error('Erreur Wave', r.status, detail)
      throw new ErreurPaiement('Wave a refusé la demande. Réessaie dans un instant.', 502)
    }
    return (await r.json()) as SessionWave
  }

  return {
    async utilisateur(token) {
      const r = await rest('/auth/v1/user', { cle: publique, token })
      if (!r.ok) return null
      return ((await r.json()) as { id?: string }).id ?? null
    },
    async commande(token, id) {
      const r = await rest(
        `/rest/v1/orders?id=eq.${id}&select=id,student_id,amount,status,provider,provider_ref`,
        { cle: publique, token },
      )
      if (!r.ok) return null
      const lignes = (await r.json()) as Commande[]
      return lignes[0] ?? null
    },
    async majCommande(id, champs) {
      const r = await rest(`/rest/v1/orders?id=eq.${id}&status=eq.en_attente`, {
        cle: secrete,
        method: 'PATCH',
        body: JSON.stringify(champs),
      })
      if (!r.ok) throw new ErreurPaiement('Impossible de mettre à jour la commande.', 500)
    },
    async finaliser(id, ref) {
      const r = await rest('/rest/v1/rpc/_finaliser_commande', {
        cle: secrete,
        method: 'POST',
        body: JSON.stringify({ p_order: id, p_ref: ref }),
      })
      if (!r.ok) {
        console.error('Finalisation impossible', r.status, await r.text())
        throw new ErreurPaiement('Paiement reçu mais accès non débloqué. Contacte le professeur.', 500)
      }
    },
    wave: {
      creer: (corps) => appelWave('/v1/checkout/sessions', { method: 'POST', body: JSON.stringify(corps) }),
      lire: (id) => appelWave(`/v1/checkout/sessions/${encodeURIComponent(id)}`),
    },
  }
}

export function jetonDe(req: Request): string {
  const h = req.headers.get('authorization') || ''
  return h.startsWith('Bearer ') ? h.slice(7).trim() : ''
}
