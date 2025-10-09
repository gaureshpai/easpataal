import webpush from "web-push";

const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
  privateKey: process.env.VAPID_PRIVATE_KEY as string,
};

webpush.setVapidDetails(
  "mailto:your-email@example.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export async function sendNotification(subscription: webpush.PushSubscription, payload: any) {
  try {
    await webpush.sendNotification(subscription, payload);
    console.log("Web push notification sent successfully.");
  } catch (error) {
    console.error("Error sending web push notification:", error);
    if (error instanceof Error && "statusCode" in error && error.statusCode === 410) {
      console.log("Subscription expired or no longer valid.");
    }
  }
}
