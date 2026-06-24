import { useEffect, useState, type MouseEvent } from 'react'
import {
  Page,
  Navbar,
  NavRight,
  Link,
  List,
  ListButton,
  ListItem,
  Searchbar,
  SwipeoutActions,
  SwipeoutButton,
  Popover,
  Badge,
  Icon,
  Card,
  CardContent,
  CardFooter,
  f7,
} from 'framework7-react'
import type { Router } from 'framework7/types'
import {
  addProduct,
  addProductImage,
  addTraitCategory,
  deleteBasket,
  deleteProduct,
  deleteTraitCategory,
  getBasket,
  getProductImages,
  getProducts,
  getProductTraits,
  getTraitCategories,
  isDetailPageOnly,
  isPriceEnabled,
  setProductTraits,
  updateBasket,
  updateTraitCategory,
  type Basket,
  type BasketProductTrait,
  type BasketTraitCategory,
  type Product,
} from '../db'
import AddProductPopup, { type SaveProductData } from '../components/AddProductPopup'
import AddBasketPopup, { type SaveBasketData } from '../components/AddBasketPopup'
import ProductThumbnail from '../components/ProductThumbnail'
import { formatTraitBadgeText } from '../utils/traitDisplay'

export default function BasketDetailPage({ id, f7router }: { id: string; f7router: Router.Router }) {
  const [basket, setBasket] = useState<Basket | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [traitCategories, setTraitCategories] = useState<BasketTraitCategory[]>([])
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null)
  const [productThumbnails, setProductThumbnails] = useState<Record<number, string>>({})
  const [productTraitsById, setProductTraitsById] = useState<Record<number, BasketProductTrait[]>>({})
  const [addProductPopupOpened, setAddProductPopupOpened] = useState(false)
  const [editBasketPopupOpened, setEditBasketPopupOpened] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'gallery'>('list')
  const basketId = Number(id)

  const loadBasket = async () => {
    const found = await getBasket(basketId)
    setBasket(found ?? null)
  }

  const loadTraitCategories = async () => {
    setTraitCategories(await getTraitCategories(basketId))
  }

  const loadProducts = async () => {
    const found = await getProducts(basketId)
    setProducts(found)

    const imagesByProduct = await Promise.all(found.map((product) => getProductImages(product.id)))
    const images = imagesByProduct.flat()
    setHeroImageUrl((prevUrl) => {
      if (prevUrl) URL.revokeObjectURL(prevUrl)
      if (images.length === 0) return null
      const random = images[Math.floor(Math.random() * images.length)]
      return URL.createObjectURL(random.blob)
    })

    setProductThumbnails((prevThumbnails) => {
      Object.values(prevThumbnails).forEach((url) => URL.revokeObjectURL(url))
      const next: Record<number, string> = {}
      found.forEach((product, index) => {
        const firstImage = imagesByProduct[index][0]
        if (firstImage) next[product.id] = URL.createObjectURL(firstImage.blob)
      })
      return next
    })

    const traitsByProduct = await Promise.all(found.map((product) => getProductTraits(product.id)))
    setProductTraitsById(Object.fromEntries(found.map((product, index) => [product.id, traitsByProduct[index]])))
  }

  useEffect(() => {
    loadBasket()
    loadProducts()
    loadTraitCategories()
    return () => {
      setHeroImageUrl((prevUrl) => {
        if (prevUrl) URL.revokeObjectURL(prevUrl)
        return prevUrl
      })
      setProductThumbnails((prevThumbnails) => {
        Object.values(prevThumbnails).forEach((url) => URL.revokeObjectURL(url))
        return {}
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basketId])

  const handleSaveProduct = async ({ name, description, price, newImages, traits }: SaveProductData) => {
    const productId = await addProduct({ name, description, price, basketId })
    await Promise.all(newImages.map((blob) => addProductImage({ productId, blob })))
    await setProductTraits(productId, traits)
    loadProducts()
  }

  const handleDeleteProduct = async (productId: number) => {
    await deleteProduct(productId)
    loadProducts()
  }

  const handleSaveBasket = async ({ name, description, usePrice, categories, deletedCategoryIds }: SaveBasketData) => {
    await updateBasket({ id: basketId, name, description, usePrice })
    await Promise.all(deletedCategoryIds.map((categoryId) => deleteTraitCategory(categoryId)))
    await Promise.all(
      categories.map((category) =>
        category.id !== undefined
          ? updateTraitCategory({
              id: category.id,
              basketId,
              name: category.name,
              color: category.color,
              dataType: category.dataType,
              showDetailPageOnly: category.showDetailPageOnly,
            })
          : addTraitCategory({
              basketId,
              name: category.name,
              color: category.color,
              dataType: category.dataType,
              showDetailPageOnly: category.showDetailPageOnly,
            }),
      ),
    )
    loadBasket()
    loadTraitCategories()
  }

  const handleRemoveBasket = async () => {
    await deleteBasket(basketId)
    f7router.back()
  }

  const handleOpenViewModePopover = (e: MouseEvent<HTMLElement>) => {
    const targetEl = e.currentTarget
    f7.popover.close('.basket-actions-popover')
    f7.popover.open('.view-mode-popover', targetEl)
  }

  const categoriesById = new Map(traitCategories.map((category) => [category.id, category]))

  return (
    <Page noNavbar>
      <Navbar backLink="Back" transparent textColor="white">
        <NavRight>
          <Link iconIos="f7:search" iconMd="material:search" searchbarEnable=".searchbar-product" />
          <Link iconIos="f7:ellipsis" iconMd="f7:ellipsis" iconOnly popoverOpen=".basket-actions-popover" />
        </NavRight>
        <Searchbar
          expandable
          className="searchbar-product"
          searchContainer=".product-list"
          searchIn=".item-title"
          placeholder="검색"
          disableButton={false}
        />
      </Navbar>

      <div style={{ position: 'relative', width: '100%', height: 280, backgroundColor: '#1c1c1e' }}>
        {heroImageUrl && (
          <img
            src={heroImageUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', backgroundColor: 'transparent' }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.85) 100%)',
          }}
        />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '16px 16px 20px' }}>
          <div style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>{basket?.name}</div>
          {basket?.description && (
            <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 4 }}>{basket.description}</div>
          )}
        </div>
      </div>

      {viewMode === 'list' ? (
        <List strong inset dividersIos mediaList className="product-list searchbar-found" style={{ marginTop: 16 }}>
          {products.length === 0 && <ListItem title="항목이 없습니다" />}
          {products.map((product) => (
            <ListItem
              key={product.id}
              title={product.name}
              link={`/basket/${basketId}/product/${product.id}/`}
              swipeout
              mediaItem
              onSwipeoutDeleted={() => handleDeleteProduct(product.id)}
            >
              <div slot="media">
                <ProductThumbnail imageUrl={productThumbnails[product.id]} />
              </div>
              <div
                slot="text"
                style={{
                  display: 'block',
                  overflow: 'visible',
                  maxHeight: 'none',
                  WebkitLineClamp: 'unset',
                  WebkitBoxOrient: 'unset',
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                  {isPriceEnabled(basket) && (
                    <Badge key="default_trait_price" style={{ backgroundColor: 'gray', padding: '7px' }}>
                        {`${(product.price ?? 0).toLocaleString()}원`}
                    </Badge>
                  )}
                  {(productTraitsById[product.id] ?? []).map((trait) => {
                    const category = categoriesById.get(trait.traitCategoryId)
                    if (!category || isDetailPageOnly(category)) return null
                    return (
                      <Badge key={trait.id} style={{ backgroundColor: category.color, padding: '7px' }}>
                        {formatTraitBadgeText(category, trait.value)}
                      </Badge>
                    )
                  })}
                </div>
              </div>
              <SwipeoutActions right>
                <SwipeoutButton delete onClick={() => handleDeleteProduct(product.id)}>
                  삭제
                </SwipeoutButton>
              </SwipeoutActions>
            </ListItem>
          ))}
        </List>
      ) : (
        <div
          className="grid grid-cols-4 grid-gap product-list searchbar-found"
          style={{ padding: '0 16px 16px', marginTop: 16 }}
        >
          {products.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--f7-text-color)', padding: 16 }}>
              항목이 없습니다
            </div>
          )}
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/basket/${basketId}/product/${product.id}/`}
              style={{ color: 'inherit', display: 'block' }}
            >
              <Card style={{ margin: 0 }}>
                <CardContent
                  style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    borderRadius: 8,
                    overflow: 'hidden',
                    backgroundColor: productThumbnails[product.id] ? 'var(--f7-page-bg-color)' : '#000',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'flex-start',
                    padding: productThumbnails[product.id] ? 0 : 8,
                  }}
                >
                  {productThumbnails[product.id] ? (
                    <img
                      src={productThumbnails[product.id]}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <span
                      style={{
                        color: '#fff',
                        fontSize: 16,
                        maxWidth: '85%',
                        textAlign: 'left',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {product.name}
                    </span>
                  )}
                </CardContent>
                {productThumbnails[product.id] ? (
                  <CardContent
                    className="item-title"
                    style={{
                      padding: 0,
                      fontSize: 21,
                      maxWidth: '75%',
                      margin: '4px auto 0',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {product.name}
                  </CardContent>
                ) : (
                  <span className="item-title" style={{ display: 'none' }}>
                    {product.name}
                  </span>
                )}
                <CardFooter
                  style={{
                    padding: 0,
                    minHeight: 'auto',
                    flexWrap: 'wrap',
                    justifyContent: 'flex-start',
                    gap: 4,
                    marginTop: 4,
                    maxWidth: '100%',
                    overflow: 'hidden',
                  }}
                >
                  {isPriceEnabled(basket) && (
                    <Badge
                      key="default_trait_price"
                      style={{
                        backgroundColor: 'gray',
                        padding: '5px',
                        maxWidth: '100%',
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: 10,
                      }}
                    >
                      {`${(product.price ?? 0).toLocaleString()}원`}
                    </Badge>
                  )}
                  {(productTraitsById[product.id] ?? []).map((trait) => {
                    const category = categoriesById.get(trait.traitCategoryId)
                    if (!category || isDetailPageOnly(category)) return null
                    return (
                      <Badge
                        key={trait.id}
                        style={{
                          backgroundColor: category.color,
                          padding: '5px',
                          maxWidth: '100%',
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: 10,
                        }}
                      >
                        {formatTraitBadgeText(category, trait.value)}
                      </Badge>
                    )
                  })}
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
      <List strong inset dividersIos className="searchbar-not-found">
        <ListItem title="검색 결과가 없습니다" />
      </List>

      <Popover className="basket-actions-popover">
        <List dividersIos strongIos outlineIos>
          <ListItem link title="보기 방식" onClick={handleOpenViewModePopover}>
            <Icon slot="media" ios="f7:square_grid_2x2" md="material:grid_view" />
          </ListItem>
          <ListButton popoverClose title="항목 추가" onClick={() => setAddProductPopupOpened(true)} />
          <ListButton popoverClose title="수정" onClick={() => setEditBasketPopupOpened(true)} />
          <ListButton popoverClose title="삭제" onClick={handleRemoveBasket} color='red' />
        </List>
      </Popover>

      <Popover className="view-mode-popover">
        <List dividersIos strongIos outlineIos>
          <ListItem
            radio
            checked={viewMode === 'list'}
            popoverClose
            title="리스트 뷰로 보기"
            onClick={() => setViewMode('list')}
          >
            <Icon slot="media" ios="f7:list_bullet" md="material:view_list" />
          </ListItem>
          <ListItem
            radio
            checked={viewMode === 'gallery'}
            popoverClose
            title="갤러리 뷰로 보기"
            onClick={() => setViewMode('gallery')}
          >
            <Icon slot="media" ios="f7:square_grid_2x2_fill" md="material:grid_view" />
          </ListItem>
        </List>
      </Popover>

      <AddProductPopup
        opened={addProductPopupOpened}
        traitCategories={traitCategories}
        usePrice={isPriceEnabled(basket)}
        onClose={() => setAddProductPopupOpened(false)}
        onSave={handleSaveProduct}
      />

      <AddBasketPopup
        opened={editBasketPopupOpened}
        basket={basket}
        traitCategories={traitCategories}
        onClose={() => setEditBasketPopupOpened(false)}
        onSave={handleSaveBasket}
      />
    </Page>
  )
}
