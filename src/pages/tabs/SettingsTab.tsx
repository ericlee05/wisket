import { Tab, List, ListItem } from 'framework7-react'

export const settingsTabTitle = 'Settings'

interface SettingsTabProps {
  onTabShow: () => void
}

export default function SettingsTab({ onTabShow }: SettingsTabProps) {
  return (
    <Tab id="settings" onTabShow={onTabShow}>
      <List strong inset dividersIos>
        <ListItem title="계정" link="#" />
        <ListItem title="알림" link="#" />
        <ListItem title="테마" link="#" />
      </List>
    </Tab>
  )
}
