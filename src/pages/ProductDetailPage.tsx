import { useEffect, useRef, useState } from 'react'
import {
  Page,
  Navbar,
  NavRight,
  Link,
  List,
  ListButton,
  ListInput,
  Popover,
  BlockTitle,
  Badge,
  Card,
  CardContent,
  PhotoBrowser,
  f7,
} from 'framework7-react'
import type { Router } from 'framework7/types'
import {
  addProductImage,
  deleteProduct,
  deleteProductImage,
  getBasket,
  getProduct,
  getProductImages,
  getProductTraits,
  getTraitCategories,
  getTraitType,
  isPriceEnabled,
  setProductTraits,
  updateProduct,
  BasketTraitType,
  type Basket,
  type BasketProductTrait,
  type BasketTraitCategory,
  type Product,
  type ProductImage,
} from '../db'
import AddProductPopup, { type SaveProductData } from '../components/AddProductPopup'
import MapView from '../components/MapView'
import { formatTraitBadgeText, formatTraitValue, parseLocationValue, truncateUrlForDisplay } from '../utils/traitDisplay'

interface ProductDetailPageProps {
  basketId: string
  productId: string
  f7router: Router.Router
}

export default function ProductDetailPage({ basketId, productId, f7router }: ProductDetailPageProps) {
  const [basket, setBasket] = useState<Basket | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [images, setImages] = useState<ProductImage[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [traitCategories, setTraitCategories] = useState<BasketTraitCategory[]>([])
  const [traits, setTraits] = useState<BasketProductTrait[]>([])
  const [editPopupOpened, setEditPopupOpened] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const photoBrowserRef = useRef<any>(null)
  const id = Number(productId)

  const loadProduct = async () => {
    const found = await getProduct(id)
    setProduct(found ?? null)

    const foundImages = await getProductImages(id)
    setImages(foundImages)
    setImageUrls((prevUrls) => {
      prevUrls.forEach((url) => URL.revokeObjectURL(url))
      return foundImages.map((image) => URL.createObjectURL(image.blob))
    })

    setTraits(await getProductTraits(id))
  }

  const loadTraitCategories = async () => {
    setTraitCategories(await getTraitCategories(Number(basketId)))
  }

  const loadBasket = async () => {
    setBasket((await getBasket(Number(basketId))) ?? null)
  }

  useEffect(() => {
    loadProduct()
    loadTraitCategories()
    loadBasket()
    return () => {
      setImageUrls((prevUrls) => {
        prevUrls.forEach((url) => URL.revokeObjectURL(url))
        return prevUrls
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleSaveProduct = async ({
    name,
    description,
    price,
    newImages,
    removedImageIds,
    traits: newTraits,
  }: SaveProductData) => {
    await updateProduct({ id, name, description, price, basketId: Number(basketId) })
    await Promise.all(removedImageIds.map((imageId) => deleteProductImage(imageId)))
    await Promise.all(newImages.map((blob) => addProductImage({ productId: id, blob })))
    await setProductTraits(id, newTraits)
    loadProduct()
  }

  const handleDeleteProduct = async () => {
    await deleteProduct(id)
    f7router.back()
  }

  const handleUrlTraitClick = (url: string) => {
    f7.dialog.confirm(`${url}\n\n이 링크로 이동하시겠습니까?`, '링크 열기', () => {
      window.open(url, '_blank', 'noopener,noreferrer')
    })
  }

  const categoriesById = new Map(traitCategories.map((category) => [category.id, category]))

  return (
    <Page noNavbar>
      <Navbar backLink="Back" transparent textColor="white">
        <NavRight>
          <Link iconIos="f7:ellipsis" iconMd="f7:ellipsis" iconOnly popoverOpen=".product-actions-popover" />
        </NavRight>
      </Navbar>

      <div style={{ position: 'relative', width: '100%', height: 280, backgroundColor: '#1c1c1e' }}>
        {imageUrls[0] && (
          <img
            src={imageUrls[0]}
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
          <div style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>{product?.name}</div>
          {traits.some((trait) => !categoriesById.get(trait.traitCategoryId)?.showDetailPageOnly) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {traits.map((trait) => {
                const category = categoriesById.get(trait.traitCategoryId)
                if (!category || category.showDetailPageOnly) return null
                return (
                  <Badge key={trait.id} style={{ backgroundColor: category.color, padding: '7px' }}>
                    {formatTraitBadgeText(category, trait.value)}
                  </Badge>
                )
              })}
            </div>
          )}
        </div>
      </div>
      
      {product?.description.length != 0 && (
        <>
          <BlockTitle>설명</BlockTitle>
          <Card outline>
            <CardContent>{product?.description}</CardContent>
          </Card>
        </>
      )}
      

      {(traits.length > 0 || isPriceEnabled(basket)) && (
        <>
          <BlockTitle>속성</BlockTitle>
          <div
            onClick={(e) => {
              const url = (e.target as HTMLElement).closest<HTMLElement>('[data-url]')?.dataset.url
              if (url) handleUrlTraitClick(url)
            }}
          >
            <List strong inset dividersIos>
              {isPriceEnabled(basket) && (
                <ListInput key={"default_price"} label="가격" type="text" value={`${(product?.price ?? 0).toLocaleString()}원`} readonly/>
              )}
              {traits
                .filter((trait) => {
                  const category = categoriesById.get(trait.traitCategoryId)
                  return category && getTraitType(category) !== BasketTraitType.LOCATION
                })
                .map((trait) => {
                  const category = categoriesById.get(trait.traitCategoryId)!
                  const isUrl = getTraitType(category) === BasketTraitType.URL
                  return (
                    <ListInput
                      key={trait.id}
                      label={category.name}
                      type="text"
                      value={isUrl ? truncateUrlForDisplay(trait.value) : formatTraitValue(category, trait.value)}
                      readonly
                      inputStyle={isUrl ? { pointerEvents: 'none', cursor: 'pointer' } : undefined}
                      data-url={isUrl ? trait.value : undefined}
                    />
                  )
                })}
            </List>
          </div>
        </>
      )}

      {traits.some((trait) => {
        const category = categoriesById.get(trait.traitCategoryId)
        return !!category && getTraitType(category) === BasketTraitType.LOCATION && !!parseLocationValue(trait.value)
      }) && (
        <>
          <BlockTitle>위치</BlockTitle>
          {traits.map((trait) => {
            const category = categoriesById.get(trait.traitCategoryId)
            if (!category || getTraitType(category) !== BasketTraitType.LOCATION) return null
            const location = parseLocationValue(trait.value)
            if (!location) return null
            return (
              <div key={trait.id} style={{ padding: '0 16px 16px' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--f7-text-color)', marginBottom: 8 }}>
                  {category.name}
                </div>
                <MapView lat={location.lat} lng={location.lng} />
              </div>
            )
          })}
        </>
      )}

      {imageUrls.length > 0 && (
        <>
          <div onClick={() => photoBrowserRef.current?.open(0)} style={{ cursor: 'pointer' }}>
            <BlockTitle>이미지</BlockTitle>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 4,
              padding: '0 16px 16px',
            }}
          >
            {imageUrls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt=""
                onClick={() => photoBrowserRef.current?.open(index)}
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  objectFit: 'cover',
                  borderRadius: 8,
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                }}
              />
            ))}
          </div>
        </>
      )}

      <PhotoBrowser ref={photoBrowserRef} photos={imageUrls} />

      <Popover className="product-actions-popover">
        <List dividersIos strongIos outlineIos>
          <ListButton popoverClose title="수정" onClick={() => setEditPopupOpened(true)} />
          <ListButton popoverClose title="삭제" onClick={handleDeleteProduct} color='red' />
        </List>
      </Popover>

      <AddProductPopup
        opened={editPopupOpened}
        product={product}
        existingImages={images}
        traitCategories={traitCategories}
        existingTraits={traits}
        usePrice={isPriceEnabled(basket)}
        onClose={() => setEditPopupOpened(false)}
        onSave={handleSaveProduct}
      />
    </Page>
  )
}
