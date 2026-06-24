import { useEffect, useState } from 'react'
import { Popup, Page, Navbar, NavRight, Link } from 'framework7-react'
import MapView from './MapView'

const DEFAULT_LAT = 37.5665
const DEFAULT_LNG = 126.978

function parseLocationValue(value?: string): { lat: number; lng: number } {
  if (value) {
    const [lat, lng] = value.split(',').map(Number)
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng }
  }
  return { lat: DEFAULT_LAT, lng: DEFAULT_LNG }
}

interface LocationPickerPopupProps {
  opened: boolean
  value?: string
  onClose: () => void
  onSave: (value: string) => void
}

export default function LocationPickerPopup({ opened, value, onClose, onSave }: LocationPickerPopupProps) {
  const [lat, setLat] = useState(DEFAULT_LAT)
  const [lng, setLng] = useState(DEFAULT_LNG)

  useEffect(() => {
    if (!opened) return
    const parsed = parseLocationValue(value)
    setLat(parsed.lat)
    setLng(parsed.lng)
  }, [opened, value])

  const handleSave = () => {
    onSave(`${lat},${lng}`)
  }

  return (
    <Popup opened={opened} push onPopupClosed={onClose}>
      <Page pageContent={false}>
        <Navbar title="위치 지정">
          <NavRight>
            <Link popupClose onClick={handleSave}>
              완료
            </Link>
          </NavRight>
        </Navbar>
        <div
          style={{
            position: 'absolute',
            top: 'calc(var(--f7-navbar-height) + var(--f7-safe-area-top))',
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <MapView
            lat={lat}
            lng={lng}
            height="100%"
            onLocationChange={(newLat, newLng) => {
              setLat(newLat)
              setLng(newLng)
            }}
          />
        </div>
      </Page>
    </Popup>
  )
}
