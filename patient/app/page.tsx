'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import PatientTokenClient from '@/component/patient-token-client'

function Search() {


  return (
    <>
      <PatientTokenClient  />
     
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
