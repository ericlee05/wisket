import { useEffect, useState } from 'react'
import { Popup, Page, Navbar, NavRight, Link, List, ListInput, BlockTitle, Block } from 'framework7-react'
import type { Basket, BasketTraitCategory } from '../db'

export interface CategoryDraft {
  id?: number
  name: string
  color: string
}

export interface SaveBasketData {
  name: string
  description: string
  categories: CategoryDraft[]
  deletedCategoryIds: number[]
}

interface AddBasketPopupProps {
  opened: boolean
  basket?: Basket | null
  traitCategories?: BasketTraitCategory[]
  onClose: () => void
  onSave: (data: SaveBasketData) => void
}

interface CategoryRow extends CategoryDraft {
  key: string
}

const DEFAULT_CATEGORY_COLOR = '#007aff'

export default function AddBasketPopup({
  opened,
  basket,
  traitCategories = [],
  onClose,
  onSave,
}: AddBasketPopupProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [deletedCategoryIds, setDeletedCategoryIds] = useState<number[]>([])

  useEffect(() => {
    if (!opened) return
    setName(basket?.name ?? '')
    setDescription(basket?.description ?? '')
    setCategories(
      traitCategories.map((category) => ({
        key: `existing-${category.id}`,
        id: category.id,
        name: category.name,
        color: category.color,
      })),
    )
    setDeletedCategoryIds([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, basket])

  const handlePopupClosed = () => {
    setName('')
    setDescription('')
    setCategories([])
    setDeletedCategoryIds([])
    onClose()
  }

  const handleAddCategory = () => {
    setCategories((prev) => [
      ...prev,
      { key: `new-${Date.now()}-${Math.random()}`, name: '', color: DEFAULT_CATEGORY_COLOR },
    ])
  }

  const handleUpdateCategory = (key: string, changes: Partial<CategoryDraft>) => {
    setCategories((prev) => prev.map((category) => (category.key === key ? { ...category, ...changes } : category)))
  }

  const handleRemoveCategory = (key: string) => {
    setCategories((prev) => {
      const target = prev.find((category) => category.key === key)
      if (target?.id !== undefined) setDeletedCategoryIds((ids) => [...ids, target.id as number])
      return prev.filter((category) => category.key !== key)
    })
  }

  const handleSave = () => {
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      description: description.trim(),
      categories: categories
        .filter((category) => category.name.trim() !== '')
        .map((category) => ({ id: category.id, name: category.name.trim(), color: category.color })),
      deletedCategoryIds,
    })
  }

  return (
    <Popup opened={opened} push onPopupClosed={handlePopupClosed}>
      <Page>
        <Navbar title={basket ? '바스켓 수정' : '새 바스켓'}>
          <NavRight>
            <Link popupClose onClick={handleSave}>
              저장
            </Link>
          </NavRight>
        </Navbar>
        <List strong inset dividersIos>
          <ListInput
            label="이름"
            type="text"
            placeholder="바스켓 이름"
            value={name}
            onInput={(e) => setName(e.target.value)}
            clearButton
          />
          <ListInput
            label="설명"
            type="textarea"
            placeholder="바스켓 설명"
            value={description}
            onInput={(e) => setDescription(e.target.value)}
          />
        </List>

        <BlockTitle>속성 카테고리</BlockTitle>
        <Block strong inset>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {categories.map((category) => (
              <div key={category.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="color"
                  value={category.color}
                  onChange={(e) => handleUpdateCategory(category.key, { color: e.target.value })}
                  style={{ width: 32, height: 32, border: 'none', padding: 0, borderRadius: 6, flexShrink: 0 }}
                />
                <input
                  type="text"
                  placeholder="카테고리 명칭"
                  value={category.name}
                  onChange={(e) => handleUpdateCategory(category.key, { name: e.target.value })}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    border: 'none',
                    outline: 'none',
                    fontSize: 16,
                    background: 'transparent',
                    color: 'var(--f7-text-color)',
                  }}
                />
                <Link
                  iconIos="f7:xmark_circle_fill"
                  iconMd="f7:xmark_circle_fill"
                  iconOnly
                  onClick={() => handleRemoveCategory(category.key)}
                />
              </div>
            ))}
            <Link onClick={handleAddCategory}>+ 카테고리 추가</Link>
          </div>
        </Block>
      </Page>
    </Popup>
  )
}
