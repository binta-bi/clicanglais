import Link from 'next/link'

export default function AdminAccueil() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Espace professeur</h1>
      <p className="text-gray-600">
        Bienvenue. Ici tu peux gérer tes cours, le test de placement et suivre tes ventes.
      </p>
      <Link href="/admin/cours" className="bg-[#2d3a6b] text-white px-4 py-2 rounded w-fit">
        Gérer mes cours
      </Link>
    </div>
  )
}