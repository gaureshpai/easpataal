// urlB64ToUint8Array is a magic function that will encode the base64 public key
// to Array buffer which is needed by the subscription option
let userId = null;
console.log('service worker');

const urlB64ToUint8Array = base64String => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const saveSubscription = async subscription => {
  if (!userId) {
    console.error("Cannot save subscription without a userId.");
    return;
  }
  const subscriptionData = { userIds: userId, subscription }; // Note: server expects userIds array
  const SERVER_URL = 'http://10.28.152.189:3000/api/save-subscription'; // Using updated IP from ipconfig
  const response = await fetch(SERVER_URL, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(subscriptionData),
  });
  return response.json();
};

self.addEventListener("message", async (event) => {
  if (event.data?.type === "SET_USER_ID") {
    userId = JSON.parse(event.data.userId) || "";
    console.log("User ID received in service worker:", userId);
  }
   try {
    const applicationServerKey = urlB64ToUint8Array(
      'BCRoHbGjLkhm9x-nh6xqM5xCkEbFNy3iDPlazZ5n0zKkm8lXQEITRpAaciqOBwQSDiW9VtVeDhM0BusA9jmHIuI'
    );
    const options = { applicationServerKey, userVisibleOnly: true };
    const subscription = await self.registration.pushManager.subscribe(options);
    console.log('New subscription created:', subscription);
    const response = await saveSubscription(subscription);
    console.log('Subscription saved:', response);
  } catch (err) {
    console.log('Error during subscription process:', err);
  }
});


self.addEventListener('activate', async () => {
  console.log('Service worker activated.');
});

self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    console.log('Push event!!', data);
    showLocalNotification(data.title, data.body, self.registration, data.data?.userId, data.badge,data.image, data.sound);
  } else {
    console.log('Push event but no data');
  }
});

const showLocalNotification = (title, body, swRegistration, userId, badge, image,sound) => {
  const options = {
    body,
    badge: badge,
    image: image,
    sound: sound, // Play sound
    vibrate: [200, 100, 200], // Vibrate pattern
    data: {
      url: `/?id=${userId}` // The URL to open on click
    }
  };
  swRegistration.showNotification(title, options);
};

self.addEventListener('notificationclick', function(event) {
    console.log("Clicked notification.")
  event.notification.close(); // Close the notification

  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});