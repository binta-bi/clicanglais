import { verifierPaiement, depsReelles, ErreurPaiement, jetonDe } from '@/lib/paiement-wave'


export async function POST(req: Request) {
  try {
    const token = jetonDe(req)
    if (!token) throw new ErreurPaiement('Connecte-toi pour payer.', 401)
    const corps = (await req.json().catch(() => ({}))) as { order_id?: unknown }
    const resultat = await verifierPaiement(depsReelles(), token, corps.order_id)
    return Response.json(resultat)
  } catch (e) {
    if (e instanceof ErreurPaiement) return Response.json({ erreur: e.message }, { status: e.status })
    console.error(e)
    return Response.json({ erreur: 'Erreur inattendue. Réessaie.' }, { status: 500 })
  }
}
