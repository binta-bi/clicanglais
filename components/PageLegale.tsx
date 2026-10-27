export default function PageLegale({
  titre,
  miseAJour,
  children,
}: {
  titre: string
  miseAJour: string
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight">{titre}</h1>
      <p className="mt-2 text-sm text-ink/70">Dernière mise à jour : {miseAJour}</p>
      <div className="mt-8 flex flex-col gap-8 text-lg leading-relaxed [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1">
        {children}
      </div>
    </div>
  )
}
