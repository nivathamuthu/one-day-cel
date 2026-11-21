import { randomInt } from 'node:crypto'

const ID_ALPHABET = 'abcdefghijkmnopqrstuvwxyz23456789'
const ID_LENGTH = 10

export function newId() {
  let id = ''
  for (let i = 0; i < ID_LENGTH; i += 1) id += ID_ALPHABET[randomInt(ID_ALPHABET.length)]
  return id
}
