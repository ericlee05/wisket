import { useEffect, useState } from 'react'
import { Tab, List, ListItem, Searchbar, SwipeoutActions, SwipeoutButton } from 'framework7-react'
import { getBasketThumbnails, type Basket } from '../../db'
import BasketThumbnail from '../../components/BasketThumbnail'

export const basketTabTitle = 'Wisket'

interface BasketTabProps {
  baskets: Basket[]
  onDeleteBasket: (id: number) => void
  onTabShow: () => void
}

export default function BasketTab({ baskets, onDeleteBasket, onTabShow }: BasketTabProps) {
  const [thumbnailsByBasketId, setThumbnailsByBasketId] = useState<Record<number, string[]>>({})

  useEffect(() => {
    let cancelled = false
    const createdUrls: string[] = []

    Promise.all(
      baskets.map(async (basket) => {
        const blobs = await getBasketThumbnails(basket.id)
        const urls = blobs.map((blob) => URL.createObjectURL(blob))
        createdUrls.push(...urls)
        return [basket.id, urls] as const
      }),
    ).then((entries) => {
      if (cancelled) return
      setThumbnailsByBasketId(Object.fromEntries(entries))
    })

    return () => {
      cancelled = true
      createdUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [baskets])

  return (
    <Tab id="basket" tabActive onTabShow={onTabShow}>
      <Searchbar
        searchContainer=".basket-list"
        searchIn=".item-title, .item-text"
        placeholder="바스켓 검색"
        disableButton={false}
      />
      <List strong inset dividersIos mediaList className="basket-list searchbar-found">
        {baskets.length === 0 && <ListItem title="바스켓이 없습니다" />}
        {baskets.map((basket) => (
          <ListItem
            key={basket.id}
            title={basket.name}
            text={basket.description}
            link={`/basket/${basket.id}/`}
            swipeout
            mediaItem
            onSwipeoutDeleted={() => onDeleteBasket(basket.id)}
          >
            <div slot="media">
              <BasketThumbnail imageUrls={thumbnailsByBasketId[basket.id] ?? []} />
            </div>
            <SwipeoutActions right>
              <SwipeoutButton delete onClick={() => onDeleteBasket(basket.id)}>
                삭제
              </SwipeoutButton>
            </SwipeoutActions>
          </ListItem>
        ))}
      </List>
      <List strong inset dividersIos className="searchbar-not-found">
        <ListItem title="검색 결과가 없습니다" />
      </List>
    </Tab>
  )
}
