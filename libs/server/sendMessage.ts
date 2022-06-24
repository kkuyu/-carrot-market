import { getHeader, getSignature, getMessageTemplate, MessageTemplateKey } from "./getUtilsNcp";

interface SendMessageData {
  templateId: MessageTemplateKey;
  sendTo: string;
  parameters: Record<string, string>;
}

const sendMessage = ({ templateId, sendTo, parameters }: SendMessageData) => {
  const method = "POST";
  const date = Date.now().toString();
  const apiUrl = `https://sens.apigw.ntruss.com`;
  const requestUrl = `/sms/v2/services/${process.env.NCP_SMS_SERVICE_ID}/messages`;

  const headers = getHeader({
    type: "email",
    date,
    signature: getSignature({ method, requestUrl, date }),
  });

  const content = getMessageTemplate(templateId, parameters);

  const body = JSON.stringify({
    type: "SMS",
    contentType: "COMM",
    countryCode: "82",
    from: process.env.MY_PHONE,
    content,
    messages: [{ to: sendTo, content }],
  });

  fetch(`${apiUrl}${requestUrl}`, {
    method,
    body,
    headers,
  })
    .then((response) => response.json().catch(() => {}))
    .then((json) => console.log(json))
    .catch((error) => console.log(error));
};

export default sendMessage;
