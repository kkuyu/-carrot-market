// @libs
import { EmailTemplateKey, getHeader, getSignature } from "@libs/server/getUtilsNcp";

interface SendEmailData {
  sendTo: string;
  templateId: EmailTemplateKey;
  parameters: Record<string, string>;
}

const sendEmail = ({ templateId, sendTo, parameters }: SendEmailData) => {
  const method = "POST";
  const date = Date.now().toString();
  const apiUrl = `https://mail.apigw.ntruss.com`;
  const requestUrl = `/api/v1/mails`;

  const headers = getHeader({
    type: "email",
    date,
    signature: getSignature({ method, requestUrl, date }),
  });

  const body = JSON.stringify({
    templateSid: templateId,
    recipients: [
      {
        address: sendTo,
        name: null,
        type: "R",
        parameters,
      },
    ],
    individual: true,
    advertising: false,
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

export default sendEmail;
