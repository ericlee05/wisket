import { useEffect, useState } from 'react'
import { Popup, Page, Navbar, NavRight, Link, List, ListItem, ListInput, BlockTitle, Block, Toggle } from 'framework7-react'
import type { ColorPicker } from 'framework7/types'
import { BASKET_TRAIT_TYPE_LABELS, BasketTraitType, type Basket, type BasketTraitCategory } from '../db'

export interface CategoryDraft {
  id?: number
  name: string
  color: string
  dataType: BasketTraitType
  showDetailPageOnly: boolean
}

export interface SaveBasketData {
  name: string
  description: string
  usePrice: boolean
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
  const [usePrice, setUsePrice] = useState(true)
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [deletedCategoryIds, setDeletedCategoryIds] = useState<number[]>([])

  useEffect(() => {
    if (!opened) return
    setName(basket?.name ?? '')
    setDescription(basket?.description ?? '')
    setUsePrice(basket?.usePrice ?? true)
    setCategories(
      traitCategories.map((category) => {
        const dataType = category.dataType ?? BasketTraitType.TEXT
        return {
          key: `existing-${category.id}`,
          id: category.id,
          name: category.name,
          color: category.color,
          dataType,
          showDetailPageOnly: dataType === BasketTraitType.URL ? true : category.showDetailPageOnly ?? false,
        }
      }),
    )
    setDeletedCategoryIds([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, basket])

  const handlePopupClosed = () => {
    setName('')
    setDescription('')
    setUsePrice(true)
    setCategories([])
    setDeletedCategoryIds([])
    onClose()
  }

  const handleAddCategory = () => {
    setCategories((prev) => [
      ...prev,
      {
        key: `new-${Date.now()}-${Math.random()}`,
        name: '',
        color: DEFAULT_CATEGORY_COLOR,
        dataType: BasketTraitType.TEXT,
        showDetailPageOnly: false,
      },
    ])
  }

  const handleUpdateCategory = (key: string, changes: Partial<CategoryDraft>) => {
    setCategories((prev) =>
      prev.map((category) => {
        if (category.key !== key) return category
        const updated = { ...category, ...changes }
        if (updated.dataType === BasketTraitType.URL) updated.showDetailPageOnly = true
        return updated
      }),
    )
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
      usePrice,
      categories: categories
        .filter((category) => category.name.trim() !== '')
        .map((category) => ({
          id: category.id,
          name: category.name.trim(),
          color: category.color,
          dataType: category.dataType,
          showDetailPageOnly: category.dataType === BasketTraitType.URL ? true : category.showDetailPageOnly,
        })),
      deletedCategoryIds,
    })
  }

  return (
    <Popup opened={opened} push onPopupClosed={handlePopupClosed}>
      <Page>
        <Navbar title={basket ? '컬렉션 수정' : '새 컬렉션'}>
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
            placeholder="컬렉션 이름"
            value={name}
            onInput={(e) => setName(e.target.value)}
            clearButton
          />
          <ListInput
            label="설명"
            type="textarea"
            placeholder="컬렉션 설명"
            value={description}
            onInput={(e) => setDescription(e.target.value)}
          />
          <ListItem
            checkbox
            title="가격 사용"
            checked={usePrice}
            onChange={(e) => setUsePrice(e.target.checked)}
          />
        </List>

        <BlockTitle>속성 카테고리</BlockTitle>
        <Block strong inset>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {categories.map((category) => (
              <div key={category.key} style={{ paddingBottom: 8, borderBottom: '1px solid var(--f7-list-item-border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
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
                <List strong inset dividersIos style={{ margin: 0 }}>
                  <ListInput
                    label="색상"
                    type="colorpicker"
                    value={{ hex: category.color }}
                    colorPickerParams={{ modules: ['wheel'] } as ColorPicker.Parameters}
                    onColorPickerChange={(value) =>
                      handleUpdateCategory(category.key, { color: value.hex ?? category.color })
                    }
                  >
                    <div
                      slot="media"
                      style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: category.color }}
                    />
                  </ListInput>
                  <ListItem title="유형" smartSelect smartSelectParams={{ openIn: 'popover' }}>
                    <select
                      value={category.dataType}
                      onChange={(e) =>
                        handleUpdateCategory(category.key, { dataType: e.target.value as BasketTraitType })
                      }
                    >
                      {Object.values(BasketTraitType).map((type) => (
                        <option key={type} value={type}>
                          {BASKET_TRAIT_TYPE_LABELS[type]}
                        </option>
                      ))}
                    </select>
                  </ListItem>
                  {category.dataType !== BasketTraitType.URL && (
                    <ListItem title="상세 페이지에서만 표시">
                      <Toggle
                        slot="after"
                        checked={category.showDetailPageOnly}
                        onToggleChange={(checked: boolean) =>
                          handleUpdateCategory(category.key, { showDetailPageOnly: checked })
                        }
                      />
                    </ListItem>
                  )}
                </List>
              </div>
            ))}
            <Link onClick={handleAddCategory}>+ 카테고리 추가</Link>
          </div>
        </Block>
      </Page>
    </Popup>
  )
}
