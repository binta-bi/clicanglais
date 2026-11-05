// Numéro WhatsApp : "+" + indicatif du pays + numéro, chiffres seulement (8 à 15 chiffres).
// Accepte les espaces, tirets, points et parenthèses à la saisie : +225 07 07 07 07 07
export function normaliserTelephone(saisie: string): string | null {
  const net = saisie.replace(/[\s().-]/g, '')
  return /^\+[0-9]{8,15}$/.test(net) ? net : null
}
