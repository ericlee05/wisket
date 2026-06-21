import { App as F7App, View } from 'framework7-react'
import routes from './routes'

const f7params = {
  name: 'Wisket',
  theme: 'ios' as const,
  darkMode: 'auto' as const,
}

function App() {
  return (
    <F7App {...f7params}>
      <View main url="/" routes={routes} />
    </F7App>
  )
}

export default App
