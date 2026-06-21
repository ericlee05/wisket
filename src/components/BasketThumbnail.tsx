interface BasketThumbnailProps {
  imageUrls: string[]
  size?: number
}

export default function BasketThumbnail({ imageUrls, size = 56 }: BasketThumbnailProps) {
  if (imageUrls.length === 0) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 8,
          backgroundColor: 'var(--f7-list-item-border-color)',
        }}
      />
    )
  }

  if (imageUrls.length < 4) {
    return (
      <img
        src={imageUrls[0]}
        alt=""
        style={{
          width: size,
          height: size,
          objectFit: 'cover',
          borderRadius: 8,
          display: 'block',
          backgroundColor: 'transparent',
        }}
      />
    )
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: 1,
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {imageUrls.slice(0, 4).map((url, index) => (
        <img
          key={index}
          src={url}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', backgroundColor: 'transparent' }}
        />
      ))}
    </div>
  )
}
