"use client";

import { useState } from "react";
import { Bell, X } from "lucide-react";

export function NotificationBell({permissionHandle, setPermissionHandle}:any) {
  // const [permission, setPermission] = useState<NotificationPermission>('default');
  // console.log(setPermisions)

  // // Check current notification permission when mounted
  // useEffect(() => {
  //   if ("Notification" in window) {
  //     setPermission(Notification.permission);
  //   }
  // }, []);

  // Request notification permission
  const handleEnableNotifications = async () => {
    console.log('kjsdhfjksahdfjhasjkdfhsahkdjfjsahfd')
    if ("Notification" in window) {
      const result = await window.Notification.requestPermission();
      setPermissionHandle(result);
      
      // Show a test notification if permission granted
      if (result === "granted") {
        new Notification("Notifications Enabled!", {
          body: "You'll now receive notifications from this site.",
          icon: "/notification-icon.png" // Optional: add your icon path
        });
      }
    }
  };

  // Hide the banner
  // const handleDismiss = () => {
  //   setIsVisible(false);
  // };

  // Don't render if permission already granted, denied, or dismissed
  if ( permissionHandle === "granted") {
    return null;
  }

  return (
    <div className="fixed w-full bottom-10 animate-in slide-in-from-bottom-5">
      <div className="flex w-full items-center gap-3 rounded-lg bg-white p-4 shadow-lg border border-gray-200">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Bell className="h-5 w-5 text-blue-600" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">
            Enable Notifications to stay updated on your tokens
          </p>
          
        </div>

       
      </div>
    </div>
  );
}