import { createHmac } from "crypto";

interface SendMessageData {
  messageTo: string;
  messageContent: string;
}

const send_message = ({ messageTo, messageContent }: SendMessageData) => {
  const method = "POST";
  const date = Date.now().toString();
  const apiUrl = `https://sens.apigw.ntruss.com`;
  const smsUrl = `/sms/v2/services/${process.env.NCP_SMS_SERVICE_ID}/messages`;

  const makeSignature = () => {
    const space = " ";
    const newLine = "\n";
    const hmac = createHmac("sha256", process.env.NCP_SECRET_KEY!);
    hmac.update(method);
    hmac.update(space);
    hmac.update(smsUrl);
    hmac.update(newLine);
    hmac.update(date);
    hmac.update(newLine);
    hmac.update(process.env.NCP_ACCESS_ID!);
    return hmac.digest("base64");
  };

  const makeHeaders = () => {
    const headers: HeadersInit = new Headers();
    headers.set("Content-Type", "application/json; charset=utf-8");
    headers.set("x-ncp-apigw-timestamp", date);
    headers.set("x-ncp-iam-access-key", process.env.NCP_ACCESS_ID!);
    headers.set("x-ncp-apigw-signature-v2", makeSignature());
    return headers;
  };

  const body = JSON.stringify({
    type: "SMS",
    contentType: "COMM",
    countryCode: "82",
    from: process.env.MY_PHONE,
    content: messageContent,
    messages: [{ to: messageTo, content: messageContent }],
  });

  fetch(`${apiUrl}${smsUrl}`, {
    method,
    body,
    headers: makeHeaders(),
  })
    .then((response) => response.json().catch(() => {}))
    .then((json) => console.log(json))
    .catch((error) => console.log(error));
};

export default send_message;
