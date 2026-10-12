import Link from 'next/link'
import Image from 'next/image'

export default function Accueil() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col items-center text-center gap-6">
      <Image src="/logo.png" alt="ClicAnglais" width={200} height={200} className="w-48 h-auto" priority />
      <h1 className="text-3xl font-bold text-[#2d3a6b]">
        Apprends l&apos;anglais à ton rythme
      </h1>
      <p className="text-gray-600">
        Des cours vidéo avec transcription synchronisée, adaptés à ton niveau.
        Commence par un test gratuit pour savoir où tu en es.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Link href="/inscription" className="bg-[#e8652d] text-white px-5 py-2 rounded">
          Passer le test de niveau
        </Link>
        <Link href="/cours" className="border border-[#2d3a6b] text-[#2d3a6b] px-5 py-2 rounded">
          Voir les cours
        </Link>
      </div>
    </div>
  )
}