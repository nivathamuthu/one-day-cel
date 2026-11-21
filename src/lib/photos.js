const TARGET_CHARS = 90000

function render(image, edge, quality) {
  const scale = Math.min(1, edge / Math.max(image.width, image.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.width * scale))
  canvas.height = Math.max(1, Math.round(image.height * scale))
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', quality)
}

export function compressImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      let edge = 480
      let quality = 0.62
      let data = render(image, edge, quality)
      while (data.length > TARGET_CHARS && (quality > 0.36 || edge > 280)) {
        if (quality > 0.36) quality = Math.round((quality - 0.08) * 100) / 100
        else edge -= 80
        data = render(image, edge, quality)
      }
      resolve(data)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('This photo format is not supported. Use a JPG or PNG.'))
    }
    image.src = url
  })
}
