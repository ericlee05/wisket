import { useRef } from 'react'
import { Popup, Page, Navbar, NavRight, Link, List, ListItem, BlockTitle, f7 } from 'framework7-react'
import { exportBackup, importBackup, type BackupData } from '../db'

interface BackupPopupProps {
  opened: boolean
  onClose: () => void
}

export default function BackupPopup({ opened, onClose }: BackupPopupProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    f7.preloader.show()
    try {
      const backup = await exportBackup()
      const json = JSON.stringify(backup)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const date = new Date().toISOString().slice(0, 10)
      const a = document.createElement('a')
      a.href = url
      a.download = `wisket-backup-${date}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error(error)
      f7.dialog.alert('백업 파일을 내보내는 중 오류가 발생했습니다.')
    } finally {
      f7.preloader.hide()
    }
  }

  const handleImportClick = () => {
    f7.dialog.confirm('백업 파일을 불러오면 현재 기기에 저장된 모든 데이터가 백업 파일의 내용으로 교체됩니다. 계속하시겠습니까?', () =>
      fileInputRef.current?.click(),
    )
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    f7.preloader.show()
    try {
      const text = await file.text()
      const data = JSON.parse(text) as BackupData
      await importBackup(data)
      f7.dialog.alert('백업 파일을 불러왔습니다.', () => window.location.reload())
    } catch (error) {
      console.error(error)
      f7.dialog.alert('백업 파일을 불러오는 중 오류가 발생했습니다. 올바른 백업 파일인지 확인해주세요.')
    } finally {
      f7.preloader.hide()
    }
  }

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
          <ListItem link title="백업 파일 내보내기" onClick={handleExport} />
        </List>

        <BlockTitle>복원</BlockTitle>
        <List strong inset dividersIos>
          <ListItem link title="백업 파일 불러오기" onClick={handleImportClick} />
        </List>
        <input ref={fileInputRef} type="file" accept="application/json" onChange={handleFileChange} style={{ display: 'none' }} />
      </Page>
    </Popup>
  )
}
