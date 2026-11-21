function scene(bg, body) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="800" viewBox="0 0 640 800"><rect width="640" height="800" fill="${bg}"/>${body}</svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export function samplePhotos() {
  return [
    {
      src: scene('#f6c1b5', '<circle cx="320" cy="300" r="110" fill="#fff4ea"/><path d="M250 520c40-60 100-60 140 0" stroke="#c2415c" stroke-width="18" fill="none" stroke-linecap="round"/><text x="320" y="660" text-anchor="middle" fill="#7a2638" font-size="46" font-family="Georgia">Beach day</text>'),
      caption: 'Pondy, 2024',
    },
    {
      src: scene('#b9dfd0', '<rect x="210" y="250" width="220" height="260" rx="30" fill="#fffaf2"/><circle cx="320" cy="200" r="60" fill="#ffd9a8"/><text x="320" y="660" text-anchor="middle" fill="#245c4c" font-size="46" font-family="Georgia">Coffee run</text>'),
      caption: 'Our first coffee',
    },
    {
      src: scene('#c9c3f0', '<polygon points="320,170 362,262 462,272 386,340 410,440 320,388 230,440 254,340 178,272 278,262" fill="#ffe08a"/><text x="320" y="660" text-anchor="middle" fill="#3a2f7a" font-size="46" font-family="Georgia">Always</text>'),
      caption: 'Home, wherever we are',
    },
  ]
}

export function sampleDraft(now = new Date()) {
  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const photos = samplePhotos()
  return {
    v: 1,
    name: 'Avery',
    from: 'Jordan',
    age: 24,
    birthday: `${day}-${month}`,
    theme: 'rose',
    reasons: [
      'You laugh at your own jokes first',
      'You remember the small things',
      'You make ordinary days feel special',
      'You stay, even when it is hard',
      'You are my favourite person to tell things to',
    ],
    photos: photos.map((photo) => photo.src),
    captions: photos.map((photo) => photo.caption),
    message: 'Another year of you in the world. I hope today feels as warm as you make everyone around you feel. Happy birthday — I am so glad it is you.',
  }
}
