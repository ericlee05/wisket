import { useEffect, useState } from 'react'
import { Popup, Page, Navbar, NavRight, Link, List, ListInput, BlockTitle, Block } from 'framework7-react'
import type { BasketProductTrait, BasketTraitCategory, Product, ProductImage } from '../db'

export interface SaveProductData {
  name: string
  description: string
  price: number
  newImages: Blob[]
  removedImageIds: number[]
  traits: { traitCategoryId: number; value: string }[]
}

interface AddProductPopupProps {
  opened: boolean
  product?: Product | null
  existingImages?: ProductImage[]
  traitCategories?: BasketTraitCategory[]
  existingTraits?: BasketProductTrait[]
  onClose: () => void
  onSave: (data: SaveProductData) => void
}

interface ImagePreview {
  blob: Blob
  url: string
}

export default function AddProductPopup({
  opened,
  product,
  existingImages = [],
  traitCategories = [],
  existingTraits = [],
  onClose,
  onSave,
}: AddProductPopupProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [images, setImages] = useState<ImagePreview[]>([])
  const [existingPreviews, setExistingPreviews] = useState<{ id: number; url: string }[]>([])
  const [removedImageIds, setRemovedImageIds] = useState<number[]>([])
  const [traitValues, setTraitValues] = useState<Record<number, string>>({})

  useEffect(() => {
    if (!opened) return
    setName(product?.name ?? '')
    setDescription(product?.description ?? '')
    setPrice(product ? String(product.price) : '')
    setRemovedImageIds([])
    setExistingPreviews(existingImages.map((image) => ({ id: image.id, url: URL.createObjectURL(image.blob) })))
    const initialTraitValues: Record<number, string> = {}
    existingTraits.forEach((trait) => {
      initialTraitValues[trait.traitCategoryId] = trait.value
    })
    setTraitValues(initialTraitValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, product])

  const handlePopupClosed = () => {
    images.forEach((image) => URL.revokeObjectURL(image.url))
    existingPreviews.forEach((preview) => URL.revokeObjectURL(preview.url))
    setName('')
    setDescription('')
    setPrice('')
    setImages([])
    setExistingPreviews([])
    setRemovedImageIds([])
    setTraitValues({})
    onClose()
  }

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    setImages((prev) => [...prev, ...files.map((file) => ({ blob: file, url: URL.createObjectURL(file) }))])
    e.target.value = ''
  }

  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].url)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleRemoveExistingImage = (id: number) => {
    setExistingPreviews((prev) => prev.filter((preview) => preview.id !== id))
    setRemovedImageIds((prev) => [...prev, id])
  }

  const handleSave = () => {
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      description: description.trim(),
      price: Number(price) || 0,
      newImages: images.map((image) => image.blob),
      removedImageIds,
      traits: traitCategories.map((category) => ({
        traitCategoryId: category.id,
        value: traitValues[category.id] ?? '',
      })),
    })
  }

  return (
    <Popup opened={opened} push onPopupClosed={handlePopupClosed}>
      <Page>
        <Navbar title={product ? '제품 수정' : '새 제품'}>
          <NavRight>
            <Link popupClose onClick={handleSave}>
              저장
            </Link>
          </NavRight>
        </Navbar>
        <List strong inset dividersIos>
          <ListInput
            label="제품명"
            type="text"
            placeholder="제품 이름"
            value={name}
            onInput={(e) => setName(e.target.value)}
            clearButton
          />
          <ListInput
            label="설명"
            type="textarea"
            placeholder="제품 설명"
            value={description}
            onInput={(e) => setDescription(e.target.value)}
          />
          <ListInput
            label="가격 (원)"
            type="number"
            placeholder="0"
            value={price}
            onInput={(e) => setPrice(e.target.value)}
            clearButton
          />
        </List>

        {traitCategories.length > 0 && (
          <>
            <BlockTitle>속성</BlockTitle>
            <List strong inset dividersIos>
              {traitCategories.map((category) => (
                <ListInput
                  key={category.id}
                  label={category.name}
                  type="text"
                  placeholder={category.name}
                  value={traitValues[category.id] ?? ''}
                  onInput={(e) => setTraitValues((prev) => ({ ...prev, [category.id]: e.target.value }))}
                  clearButton
                >
                  <div
                    slot="media"
                    style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: category.color }}
                  />
                </ListInput>
              ))}
            </List>
          </>
        )}

        <BlockTitle>이미지</BlockTitle>
        <Block strong inset>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {existingPreviews.map((preview) => (
              <div key={`existing-${preview.id}`} style={{ position: 'relative', width: 72, height: 72 }}>
                <img
                  src={preview.url}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
                />
                <Link
                  iconIos="f7:xmark_circle_fill"
                  iconMd="f7:xmark_circle_fill"
                  iconOnly
                  onClick={() => handleRemoveExistingImage(preview.id)}
                  style={{ position: 'absolute', top: -8, right: -8 }}
                />
              </div>
            ))}
            {images.map((image, index) => (
              <div key={image.url} style={{ position: 'relative', width: 72, height: 72 }}>
                <img
                  src={image.url}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
                />
                <Link
                  iconIos="f7:xmark_circle_fill"
                  iconMd="f7:xmark_circle_fill"
                  iconOnly
                  onClick={() => handleRemoveImage(index)}
                  style={{ position: 'absolute', top: -8, right: -8 }}
                />
              </div>
            ))}
            <label
              style={{
                width: 72,
                height: 72,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px dashed var(--f7-list-item-border-color)',
                borderRadius: 8,
                fontSize: 28,
                color: 'var(--f7-theme-color)',
                cursor: 'pointer',
              }}
            >
              +
              <input type="file" accept="image/*" multiple onChange={handleAddImages} style={{ display: 'none' }} />
            </label>
          </div>
        </Block>
      </Page>
    </Popup>
  )
}
