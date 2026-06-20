interface ProductThumbnailProps {
  imageUrl?: string
  size?: number
}

export default function ProductThumbnail({ imageUrl, size = 56 }: ProductThumbnailProps) {
  if (!imageUrl) return null

  return (
    <img
      src={imageUrl}
      alt=""
      style={{ width: size, height: size, objectFit: 'cover', borderRadius: 8, display: 'block' }}
    />
  )
}
