import { Popup, Page, Navbar, NavRight, Link, List, ListItem, BlockTitle } from 'framework7-react'

interface BackupPopupProps {
  opened: boolean
  onClose: () => void
}

export default function BackupPopup({ opened, onClose }: BackupPopupProps) {
  return (
    <Popup opened={opened} push onPopupClosed={onClose}>
      <Page>
        <Navbar title="백업 및 불러오기">
          <NavRight>
            <Link popupClose>닫기</Link>
          </NavRight>
        </Navbar>

        <BlockTitle>백업</BlockTitle>
        <List strong inset dividersIos>
          <ListItem link title="백업 파일 내보내기" />
        </List>

        <BlockTitle>복원</BlockTitle>
        <List strong inset dividersIos>
          <ListItem link title="백업 파일 불러오기" />
        </List>
      </Page>
    </Popup>
  )
}
