'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import PatientTokenClient, { PatientTokenClientSkeleton } from '@/component/patient-token-client'

function Search() {
  return <PatientTokenClient />;
}

export default function Page() {
  return (
    <Suspense fallback={<PatientTokenClientSkeleton />}>
      <Search />
    </Suspense>
  )
}
