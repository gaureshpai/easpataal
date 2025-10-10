'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import PatientTokenClient from '@/component/patient-token-client'
import { NotificationBell } from '@/component/ui/notification-bell'

function Search() {
  const searchParams = useSearchParams()
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default')

  return (
    <>
      <PatientTokenClient setPermission={(val: NotificationPermission) => setPermissionState(val)} />
      <NotificationBell
        permissionHandle={permissionState}
        setPermissionHandle={(val: NotificationPermission) => setPermissionState(val)}
      />
    </>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Search />
    </Suspense>
  )
}
