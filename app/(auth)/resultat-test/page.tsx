import Link from 'next/link'

const labels: Record<string, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
}

export default async function ResultatTest({
  searchParams,
}: {
  searchParams: Promise<{ niveau?: string; score?: string }>
}) {
  const { niveau, score } = await searchParams
  const label = labels[niveau ?? ''] ?? 'Non défini'

  return (
    <div className="max-w-md mx-auto mt-10 text-center flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Ton résultat</h1>
      <p>Score : <strong>{score ?? '?'} / 5</strong></p>
      <p className="text-xl">
        Ton niveau : <strong>{label}</strong>
      </p>
      <Link href="/" className="bg-blue-900 text-white p-2 rounded">
        Voir les cours adaptés à mon niveau
      </Link>
    </div>
  )
}