// urlB64ToUint8Array is a magic function that will encode the base64 public key
// to Array buffer which is needed by the subscription option
let userId = null;
console.log('service worker')
const urlB64ToUint8Array = base64String => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
const saveSubscription = async subscription => {
    subscription = {userIds:userId,subscription}
  const SERVER_URL = 'http://10.28.152.189:3000/api/save-subscription'
  const response = await fetch(SERVER_URL, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(subscription),
  })
  return response.json()
}
self.addEventListener("message", async (event) => {
  if (event.data?.type === "SET_USER_ID") {
    userId = JSON.parse(event.data.userId)||"";
    
    console.log("User ID received in service worker:", userId);
  }
   try {
    const applicationServerKey = urlB64ToUint8Array(
      'BCRoHbGjLkhm9x-nh6xqM5xCkEbFNy3iDPlazZ5n0zKkm8lXQEITRpAaciqOBwQSDiW9VtVeDhM0BusA9jmHIuI'
    )
    const options = { applicationServerKey, userVisibleOnly: true }
    const subscription = await self.registration.pushManager.subscribe(options)
    console.log(subscription+'message')
    const response = await saveSubscription(subscription)
    console.log(response)
  } catch (err) {
    console.log('Error', err)
  }
});


     self.addEventListener('pushsubscriptionchange', function(event) {
      console.log('Push subscription has changed. Re-subscribing.');
     });
self.addEventListener('activate', async () => {
  // This will be called only once when the service worker is installed for first time.
  console.log(await self.registration.pushManager.getSubscription() + 'activated')
    console.log('activated')
})
self.addEventListener('push', function(event) {
  if (event.data) {
    console.log('Push event!! ', event.data.text())
    showLocalNotification('Yolo', event.data.text(), self.registration)
  } else {
    console.log('Push event but no data')
  }
})
const showLocalNotification = (title, body, swRegistration) => {
  const options = {
    body,
    // here you can add more properties like icon, image, vibrate, etc.
  }
  swRegistration.showNotification(title, options)
}