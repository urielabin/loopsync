// Excludes visually ambiguous characters (I, 1, O, 0) since codes are meant
// to be read aloud or typed by hand.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 6

/**
 * Generates a short, human-shareable room code. Format/uniqueness-shape
 * only -- not collision-checked against existing rooms, which is fine for
 * a casual-jam toy at this scale (33^6 ≈ 1.3 billion combinations).
 */
export function generateRoomCode(): string {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return code
}
