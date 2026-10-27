import { creerPaiement, depsReelles, ErreurPaiement, jetonDe } from '@/lib/paiement-wave'

function siteUrl(req: Request) {
  return process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin
}

export async function POST(req: Request) {
  try {
    const token = jetonDe(req)
    if (!token) throw new ErreurPaiement('Connecte-toi pour payer.', 401)
    const corps = (await req.json().catch(() => ({}))) as { order_id?: unknown }
    const resultat = await creerPaiement(depsReelles(), token, corps.order_id, siteUrl(req))
    return Response.json(resultat)
  } catch (e) {
    if (e instanceof ErreurPaiement) return Response.json({ erreur: e.message }, { status: e.status })
    console.error(e)
    return Response.json({ erreur: 'Erreur inattendue. Réessaie.' }, { status: 500 })
  }
}
