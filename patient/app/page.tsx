'use client'
import PatientTokenClient from "@/component/patient-token-client";
import { NotificationBell } from "@/component/ui/notification-bell";
import { useState } from 'react';

export default  function Page() {
  const[permissionState,setPermissionState]=useState<NotificationPermission>("default")
  return <><PatientTokenClient setPermision={(val:any)=>{setPermissionState(val)}}/>
        <NotificationBell permissionHandle={permissionState} setPermissionHandle={(val:any)=>{setPermissionState(val)}}/>

  </>
}