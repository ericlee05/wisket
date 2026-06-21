import { openDB, type DBSchema } from 'idb'

export interface Basket {
  id: number
  name: string
  description: string
}

export interface Product {
  id: number
  name: string
  description: string
  price: number
  basketId: number
}

export interface ProductImage {
  id: number
  productId: number
  blob: Blob
}

export interface BasketTraitCategory {
  id: number
  basketId: number
  name: string
  color: string
}

export interface BasketProductTrait {
  id: number
  productId: number
  traitCategoryId: number
  value: string
}

interface WisketDB extends DBSchema {
  baskets: {
    key: number
    value: Basket
  }
  products: {
    key: number
    value: Product
    indexes: { basketId: number }
  }
  productImages: {
    key: number
    value: ProductImage
    indexes: { productId: number }
  }
  basketTraitCategories: {
    key: number
    value: BasketTraitCategory
    indexes: { basketId: number }
  }
  basketProductTraits: {
    key: number
    value: BasketProductTrait
    indexes: { productId: number; traitCategoryId: number }
  }
}

const dbPromise = openDB<WisketDB>('wisket', 3, {
  upgrade(db, oldVersion) {
    if (oldVersion < 1) {
      db.createObjectStore('baskets', { keyPath: 'id', autoIncrement: true })
      const products = db.createObjectStore('products', { keyPath: 'id', autoIncrement: true })
      products.createIndex('basketId', 'basketId')
    }
    if (oldVersion < 2) {
      const productImages = db.createObjectStore('productImages', { keyPath: 'id', autoIncrement: true })
      productImages.createIndex('productId', 'productId')
    }
    if (oldVersion < 3) {
      const traitCategories = db.createObjectStore('basketTraitCategories', { keyPath: 'id', autoIncrement: true })
      traitCategories.createIndex('basketId', 'basketId')
      const productTraits = db.createObjectStore('basketProductTraits', { keyPath: 'id', autoIncrement: true })
      productTraits.createIndex('productId', 'productId')
      productTraits.createIndex('traitCategoryId', 'traitCategoryId')
    }
  },
})

export async function getBaskets(): Promise<Basket[]> {
  return (await dbPromise).getAll('baskets')
}

export async function getBasket(id: number): Promise<Basket | undefined> {
  return (await dbPromise).get('baskets', id)
}

export async function addBasket(basket: Omit<Basket, 'id'>): Promise<number> {
  return (await dbPromise).add('baskets', basket as Basket)
}

export async function updateBasket(basket: Basket): Promise<number> {
  return (await dbPromise).put('baskets', basket)
}

export async function deleteBasket(id: number): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction(
    ['baskets', 'products', 'productImages', 'basketTraitCategories', 'basketProductTraits'],
    'readwrite',
  )
  await tx.objectStore('baskets').delete(id)
  const productKeys = await tx.objectStore('products').index('basketId').getAllKeys(id)
  await Promise.all(productKeys.map((key) => tx.objectStore('products').delete(key)))
  const imageKeys = (
    await Promise.all(
      productKeys.map((productId) => tx.objectStore('productImages').index('productId').getAllKeys(productId)),
    )
  ).flat()
  await Promise.all(imageKeys.map((key) => tx.objectStore('productImages').delete(key)))
  const traitKeys = (
    await Promise.all(
      productKeys.map((productId) => tx.objectStore('basketProductTraits').index('productId').getAllKeys(productId)),
    )
  ).flat()
  await Promise.all(traitKeys.map((key) => tx.objectStore('basketProductTraits').delete(key)))
  const categoryKeys = await tx.objectStore('basketTraitCategories').index('basketId').getAllKeys(id)
  await Promise.all(categoryKeys.map((key) => tx.objectStore('basketTraitCategories').delete(key)))
  await tx.done
}

export async function getProducts(basketId: number): Promise<Product[]> {
  return (await dbPromise).getAllFromIndex('products', 'basketId', basketId)
}

export async function getProduct(id: number): Promise<Product | undefined> {
  return (await dbPromise).get('products', id)
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<number> {
  return (await dbPromise).add('products', product as Product)
}

export async function updateProduct(product: Product): Promise<number> {
  return (await dbPromise).put('products', product)
}

export async function deleteProduct(id: number): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction(['products', 'productImages', 'basketProductTraits'], 'readwrite')
  await tx.objectStore('products').delete(id)
  const imageKeys = await tx.objectStore('productImages').index('productId').getAllKeys(id)
  await Promise.all(imageKeys.map((key) => tx.objectStore('productImages').delete(key)))
  const traitKeys = await tx.objectStore('basketProductTraits').index('productId').getAllKeys(id)
  await Promise.all(traitKeys.map((key) => tx.objectStore('basketProductTraits').delete(key)))
  await tx.done
}

export async function getProductImages(productId: number): Promise<ProductImage[]> {
  return (await dbPromise).getAllFromIndex('productImages', 'productId', productId)
}

export async function getBasketThumbnails(basketId: number, limit = 4): Promise<Blob[]> {
  const products = await getProducts(basketId)
  const firstImages = await Promise.all(products.map((product) => getProductImages(product.id)))
  return firstImages
    .map((images) => images[0])
    .filter((image): image is ProductImage => image !== undefined)
    .slice(0, limit)
    .map((image) => image.blob)
}

export async function addProductImage(image: Omit<ProductImage, 'id'>): Promise<number> {
  return (await dbPromise).add('productImages', image as ProductImage)
}

export async function deleteProductImage(id: number): Promise<void> {
  await (await dbPromise).delete('productImages', id)
}

export async function getTraitCategories(basketId: number): Promise<BasketTraitCategory[]> {
  return (await dbPromise).getAllFromIndex('basketTraitCategories', 'basketId', basketId)
}

export async function addTraitCategory(category: Omit<BasketTraitCategory, 'id'>): Promise<number> {
  return (await dbPromise).add('basketTraitCategories', category as BasketTraitCategory)
}

export async function updateTraitCategory(category: BasketTraitCategory): Promise<number> {
  return (await dbPromise).put('basketTraitCategories', category)
}

export async function deleteTraitCategory(id: number): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction(['basketTraitCategories', 'basketProductTraits'], 'readwrite')
  await tx.objectStore('basketTraitCategories').delete(id)
  const traitKeys = await tx.objectStore('basketProductTraits').index('traitCategoryId').getAllKeys(id)
  await Promise.all(traitKeys.map((key) => tx.objectStore('basketProductTraits').delete(key)))
  await tx.done
}

export async function getProductTraits(productId: number): Promise<BasketProductTrait[]> {
  return (await dbPromise).getAllFromIndex('basketProductTraits', 'productId', productId)
}

export interface BackupData {
  version: number
  exportedAt: string
  baskets: Basket[]
  products: Product[]
  productImages: { id: number; productId: number; blob: string }[]
  basketTraitCategories: BasketTraitCategory[]
  basketProductTraits: BasketProductTrait[]
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export async function exportBackup(): Promise<BackupData> {
  const db = await dbPromise
  const [baskets, products, productImages, basketTraitCategories, basketProductTraits] = await Promise.all([
    db.getAll('baskets'),
    db.getAll('products'),
    db.getAll('productImages'),
    db.getAll('basketTraitCategories'),
    db.getAll('basketProductTraits'),
  ])
  const encodedImages = await Promise.all(
    productImages.map(async (image) => ({
      id: image.id,
      productId: image.productId,
      blob: await blobToDataUrl(image.blob),
    })),
  )
  return {
    version: 3,
    exportedAt: new Date().toISOString(),
    baskets,
    products,
    productImages: encodedImages,
    basketTraitCategories,
    basketProductTraits,
  }
}

function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return fetch(dataUrl).then((res) => res.blob())
}

export async function importBackup(data: BackupData): Promise<void> {
  if (
    !data ||
    !Array.isArray(data.baskets) ||
    !Array.isArray(data.products) ||
    !Array.isArray(data.productImages) ||
    !Array.isArray(data.basketTraitCategories) ||
    !Array.isArray(data.basketProductTraits)
  ) {
    throw new Error('Invalid backup file')
  }

  const decodedImages = await Promise.all(
    data.productImages.map(async (image) => ({
      id: image.id,
      productId: image.productId,
      blob: await dataUrlToBlob(image.blob),
    })),
  )

  const db = await dbPromise
  const storeNames = ['baskets', 'products', 'productImages', 'basketTraitCategories', 'basketProductTraits'] as const
  const tx = db.transaction(storeNames, 'readwrite')
  await Promise.all(storeNames.map((name) => tx.objectStore(name).clear()))
  await Promise.all(data.baskets.map((basket) => tx.objectStore('baskets').put(basket)))
  await Promise.all(data.products.map((product) => tx.objectStore('products').put(product)))
  await Promise.all(decodedImages.map((image) => tx.objectStore('productImages').put(image)))
  await Promise.all(data.basketTraitCategories.map((category) => tx.objectStore('basketTraitCategories').put(category)))
  await Promise.all(data.basketProductTraits.map((trait) => tx.objectStore('basketProductTraits').put(trait)))
  await tx.done
}

export async function setProductTraits(
  productId: number,
  traits: { traitCategoryId: number; value: string }[],
): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction('basketProductTraits', 'readwrite')
  const existingKeys = await tx.store.index('productId').getAllKeys(productId)
  await Promise.all(existingKeys.map((key) => tx.store.delete(key)))
  await Promise.all(
    traits
      .filter((trait) => trait.value.trim() !== '')
      .map((trait) => tx.store.add({ productId, traitCategoryId: trait.traitCategoryId, value: trait.value.trim() } as BasketProductTrait)),
  )
  await tx.done
}
