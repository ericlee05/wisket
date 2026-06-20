import HomePage from './pages/HomePage'
import BasketDetailPage from './pages/BasketDetailPage'
import ProductDetailPage from './pages/ProductDetailPage'

const routes = [
  { path: '/', component: HomePage },
  { path: '/basket/:id/', component: BasketDetailPage },
  { path: '/basket/:basketId/product/:productId/', component: ProductDetailPage },
]

export default routes
