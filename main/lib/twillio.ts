const accountSid = process.env.TWILLIO_SID;
const authToken = process.env.TWILLIO_AUTH_TOKEN;
// const client = require("twilio")(accountSid, authToken);
import twilio from "twilio"
const client = twilio(accountSid, authToken);

export default function sendSMS(to: string, message: string) {
  try {
    client.messages
      .create({
        body: message,
        from: "+12293048072",
        to: `+91${to}`, 
      })
      .then((message: any) => console.log(message.sid))
  } catch (e) {
    console.log('hodjfs')
    console.log(e);
  }
}
