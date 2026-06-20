import { useEffect, useState } from 'react'
import {
  Page,
  Navbar,
  NavRight,
  Link,
  List,
  ListItem,
  SwipeoutActions,
  SwipeoutButton,
  Popover,
  Badge,
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

export default function BasketDetailPage({ id, f7router }: { id: string; f7router: Router.Router }) {
  const [basket, setBasket] = useState<Basket | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [traitCategories, setTraitCategories] = useState<BasketTraitCategory[]>([])
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null)
  const [productThumbnails, setProductThumbnails] = useState<Record<number, string>>({})
  const [productTraitsById, setProductTraitsById] = useState<Record<number, BasketProductTrait[]>>({})
  const [addProductPopupOpened, setAddProductPopupOpened] = useState(false)
  const [editBasketPopupOpened, setEditBasketPopupOpened] = useState(false)
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

  const handleSaveBasket = async ({ name, description, categories, deletedCategoryIds }: SaveBasketData) => {
    await updateBasket({ id: basketId, name, description })
    await Promise.all(deletedCategoryIds.map((categoryId) => deleteTraitCategory(categoryId)))
    await Promise.all(
      categories.map((category) =>
        category.id !== undefined
          ? updateTraitCategory({ id: category.id, basketId, name: category.name, color: category.color })
          : addTraitCategory({ basketId, name: category.name, color: category.color }),
      ),
    )
    loadBasket()
    loadTraitCategories()
  }

  const handleRemoveBasket = async () => {
    await deleteBasket(basketId)
    f7router.back()
  }

  const categoriesById = new Map(traitCategories.map((category) => [category.id, category]))

  return (
    <Page noNavbar>
      <Navbar backLink="Back" transparent textColor="white">
        <NavRight>
          <Link iconIos="f7:ellipsis" iconMd="f7:ellipsis" iconOnly popoverOpen=".basket-actions-popover" />
        </NavRight>
      </Navbar>

      <div style={{ position: 'relative', width: '100%', height: 280, backgroundColor: '#1c1c1e' }}>
        {heroImageUrl && (
          <img
            src={heroImageUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
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

      <List strong inset dividersIos mediaList>
        {products.length === 0 && <ListItem title="제품이 없습니다" />}
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
            <div slot="text" style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
              <Badge key="default_price" style={{ backgroundColor: 'gray', padding: '7px' }}>
                {`${(product.price ?? 0).toLocaleString()}원`}
              </Badge>
              {(productTraitsById[product.id] ?? []).map((trait) => {
                const category = categoriesById.get(trait.traitCategoryId)
                if (!category) return null
                return (
                  <Badge key={trait.id} style={{ backgroundColor: category.color, padding: '7px' }}>
                    {trait.value}
                  </Badge>
                )
              })}
            </div>
            <SwipeoutActions right>
              <SwipeoutButton delete onClick={() => handleDeleteProduct(product.id)}>
                삭제
              </SwipeoutButton>
            </SwipeoutActions>
          </ListItem>
        ))}
      </List>

      <Popover className="basket-actions-popover">
        <List dividersIos strongIos outlineIos>
          <ListItem link popoverClose title="제품 추가" onClick={() => setAddProductPopupOpened(true)} />
          <ListItem link popoverClose title="바스켓 수정" onClick={() => setEditBasketPopupOpened(true)} />
          <ListItem link popoverClose title="바스켓 삭제" onClick={handleRemoveBasket} />
        </List>
      </Popover>

      <AddProductPopup
        opened={addProductPopupOpened}
        traitCategories={traitCategories}
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
