// Numéro WhatsApp : "+" + indicatif du pays + numéro, chiffres seulement (8 à 15 chiffres).
// Accepte les espaces, tirets, points et parenthèses à la saisie : +225 07 07 07 07 07
export function normaliserTelephone(saisie: string): string | null {
  const net = saisie.replace(/[\s().-]/g, '')
  return /^\+[0-9]{8,15}$/.test(net) ? net : null
}

// Assemble l'indicatif choisi dans la liste et le numéro tapé.
// - si la personne tape déjà "+..." ou "00...", on garde ce qu'elle a écrit ;
// - le 0 du début est supprimé (06 12... en France), sauf en Côte d'Ivoire où il fait partie du numéro.
export function composerTelephone(indicatif: string, saisie: string): string | null {
  const net = saisie.replace(/[\s().-]/g, '')
  if (net.startsWith('+')) return normaliserTelephone(net)
  if (net.startsWith('00')) return normaliserTelephone('+' + net.slice(2))
  if (!/^[0-9]+$/.test(net)) return null
  const local = indicatif === '225' ? net : net.replace(/^0+/, '')
  return normaliserTelephone('+' + indicatif + local)
}
