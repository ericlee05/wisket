import { useEffect, useState, type MouseEvent } from 'react'
import { Page, Navbar, NavRight, Link, List, ListItem, Searchbar, SwipeoutActions, SwipeoutButton, Fab, Icon, Popover, f7 } from 'framework7-react'
import AddBasketPopup, { type SaveBasketData } from '../components/AddBasketPopup'
import BackupPopup from '../components/BackupPopup'
import BasketThumbnail from '../components/BasketThumbnail'
import { addBasket, addTraitCategory, deleteBasket, getBasketThumbnails, getBaskets, type Basket } from '../db'

export default function HomePage() {
  const [baskets, setBaskets] = useState<Basket[]>([])
  const [popupOpened, setPopupOpened] = useState(false)
  const [backupPopupOpened, setBackupPopupOpened] = useState(false)
  const [thumbnailsByBasketId, setThumbnailsByBasketId] = useState<Record<number, string[]>>({})

  const loadBaskets = () => {
    getBaskets().then(setBaskets)
  }

  useEffect(() => {
    loadBaskets()
  }, [])

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

  const handleSaveBasket = async ({ name, description, categories }: SaveBasketData) => {
    const basketId = await addBasket({ name, description })
    await Promise.all(categories.map((category) => addTraitCategory({ basketId, name: category.name, color: category.color })))
    loadBaskets()
  }

  const handleDeleteBasket = (id: number) => {
    deleteBasket(id).then(loadBaskets)
  }

  const handleOpenSortOrderPopover = (e: MouseEvent<HTMLElement>) => {
    const targetEl = e.currentTarget
    f7.popover.close('.home-actions-popover')
    f7.popover.open('.sort-order-popover', targetEl)
  }

  return (
    <Page name="home">
      <Navbar title="Wisket" large>
        <NavRight>
          <Link iconIos="f7:search" iconMd="material:search" searchbarEnable=".searchbar-basket" />
          <Link iconIos="f7:ellipsis" iconMd="f7:ellipsis" iconOnly popoverOpen=".home-actions-popover" />
        </NavRight>
      </Navbar>

      <Searchbar
        expandable
        className="searchbar-basket"
        searchContainer=".basket-list"
        searchIn=".item-title, .item-text"
        placeholder="검색"
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
            onSwipeoutDeleted={() => handleDeleteBasket(basket.id)}
          >
            <div slot="media">
              <BasketThumbnail imageUrls={thumbnailsByBasketId[basket.id] ?? []} />
            </div>
            <SwipeoutActions right>
              <SwipeoutButton delete onClick={() => handleDeleteBasket(basket.id)}>
                삭제
              </SwipeoutButton>
            </SwipeoutActions>
          </ListItem>
        ))}
      </List>
      <List strong inset dividersIos className="searchbar-not-found">
        <ListItem title="검색 결과가 없습니다" />
      </List>

      <Fab position="right-bottom" onClick={() => setPopupOpened(true)}>
        <Icon ios="f7:plus" md="material:add" />
      </Fab>

      <Popover className="home-actions-popover">
        <List dividersIos strongIos outlineIos>
          <ListItem link title="정렬 방식" onClick={handleOpenSortOrderPopover}>
            <Icon slot="media" ios="f7:arrow_up_arrow_down" md="material:swap_vert" />
          </ListItem>
          <ListItem link popoverClose title="백업 및 불러오기" onClick={() => setBackupPopupOpened(true)}>
            <Icon slot="media" ios="f7:archivebox_fill" md="material:backup" />
          </ListItem>
        </List>
      </Popover>

      <Popover className="sort-order-popover">
        <List dividersIos strongIos outlineIos>
          <ListItem radio title="이름순">
            <Icon slot="media" ios="f7:textformat_abc" md="material:sort_by_alpha" />
          </ListItem>
          <ListItem radio title="최신순">
            <Icon slot="media" ios="f7:arrow_down_circle" md="material:arrow_downward" />
          </ListItem>
          <ListItem radio title="오래된순">
            <Icon slot="media" ios="f7:arrow_up_circle" md="material:arrow_upward" />
          </ListItem>
        </List>
      </Popover>

      <AddBasketPopup
        opened={popupOpened}
        onClose={() => setPopupOpened(false)}
        onSave={handleSaveBasket}
      />

      <BackupPopup opened={backupPopupOpened} onClose={() => setBackupPopupOpened(false)} />
    </Page>
  )
}
