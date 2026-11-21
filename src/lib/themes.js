export const THEMES = [
  {
    id: 'rose',
    name: 'Strawberry',
    tune: 'Bright and bouncy',
    music: '/music/rose.wav',
    frosting: '#ffd6e0',
    sponge: '#ef6f8e',
    plate: '#fff4ea',
    bg: '#3a1424',
    accent: '#ffd6e0',
  },
  {
    id: 'cocoa',
    name: 'Chocolate',
    tune: 'Warm and jazzy',
    music: '/music/cocoa.wav',
    frosting: '#f6e2c8',
    sponge: '#7a4a30',
    plate: '#f3eadf',
    bg: '#24170f',
    accent: '#f6e2c8',
  },
  {
    id: 'mint',
    name: 'Pistachio',
    tune: 'Light and sparkly',
    music: '/music/mint.wav',
    frosting: '#e3fbef',
    sponge: '#3fb58f',
    plate: '#f3fff9',
    bg: '#0b2a22',
    accent: '#d8fff1',
  },
  {
    id: 'midnight',
    name: 'Blueberry',
    tune: 'Slow and dreamy',
    music: '/music/midnight.wav',
    frosting: '#e4e8ff',
    sponge: '#4a4aa6',
    plate: '#eef1ff',
    bg: '#0f1330',
    accent: '#fde68a',
  },
]

export function themeById(id) {
  return THEMES.find((theme) => theme.id === id) || THEMES[0]
}
