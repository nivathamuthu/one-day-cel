export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function daysInMonth(month) {
  const value = Number(month)
  if (value === 2) return 29
  if ([4, 6, 9, 11].includes(value)) return 30
  return 31
}

export function formatBirthday(day, month) {
  return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}`
}

export function parseBirthday(birthday) {
  const [day, month] = String(birthday || '').split('-').map(Number)
  if (!day || !month || month < 1 || month > 12 || day < 1 || day > daysInMonth(month)) {
    return null
  }
  return { day, month }
}

export function birthdayLabel(birthday) {
  const parsed = parseBirthday(birthday)
  if (!parsed) return 'their birthday'
  return `${MONTHS[parsed.month - 1]} ${parsed.day}`
}

export function isBirthdayToday(birthday, now = new Date()) {
  const parsed = parseBirthday(birthday)
  if (!parsed) return false
  return now.getDate() === parsed.day && now.getMonth() + 1 === parsed.month
}

export function nextBirthday(birthday, now = new Date()) {
  const parsed = parseBirthday(birthday)
  if (!parsed) return new Date(now)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let target = new Date(now.getFullYear(), parsed.month - 1, parsed.day)
  if (target < today) target = new Date(now.getFullYear() + 1, parsed.month - 1, parsed.day)
  return target
}
