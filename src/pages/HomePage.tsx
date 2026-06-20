import { useEffect, useState } from 'react'
import { Page, Navbar, NavRight, Link, Tabs, Toolbar, ToolbarPane } from 'framework7-react'
import BasketTab, { basketTabTitle } from './tabs/BasketTab'
import SettingsTab, { settingsTabTitle } from './tabs/SettingsTab'
import AddBasketPopup, { type SaveBasketData } from '../components/AddBasketPopup'
import { addBasket, addTraitCategory, deleteBasket, getBaskets, type Basket } from '../db'

type TabId = 'basket' | 'settings'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabId>('basket')
  const [baskets, setBaskets] = useState<Basket[]>([])
  const [popupOpened, setPopupOpened] = useState(false)

  const loadBaskets = () => {
    getBaskets().then(setBaskets)
  }

  useEffect(() => {
    loadBaskets()
  }, [])

  const handleSaveBasket = async ({ name, description, categories }: SaveBasketData) => {
    const basketId = await addBasket({ name, description })
    await Promise.all(categories.map((category) => addTraitCategory({ basketId, name: category.name, color: category.color })))
    loadBaskets()
  }

  const handleDeleteBasket = (id: number) => {
    deleteBasket(id).then(loadBaskets)
  }

  const navbarTitle = activeTab === 'basket' ? basketTabTitle : settingsTabTitle

  return (
    <Page name="home">
      <Navbar title={navbarTitle} large>
        {activeTab === 'basket' && (
          <NavRight>
            <Link iconIos="f7:plus" iconOnly onClick={() => setPopupOpened(true)} />
          </NavRight>
        )}
      </Navbar>

      <Tabs animated>
        <BasketTab
          baskets={baskets}
          onDeleteBasket={handleDeleteBasket}
          onTabShow={() => setActiveTab('basket')}
        />
        <SettingsTab onTabShow={() => setActiveTab('settings')} />
      </Tabs>

      <Toolbar tabbar icons bottom>
        <ToolbarPane>
          <Link tabLink="#basket" iconIos="f7:cart_fill" text="Basket" />
          <Link tabLink="#settings" iconIos="f7:gear_alt_fill" text="Settings" />
        </ToolbarPane>
      </Toolbar>

      <AddBasketPopup
        opened={popupOpened}
        onClose={() => setPopupOpened(false)}
        onSave={handleSaveBasket}
      />
    </Page>
  )
}
