import { createHmac } from "crypto";

interface HeaderParams {
  type: "message" | "email";
  date?: string;
  signature?: string;
}

interface SignatureParams {
  method: string;
  requestUrl: string;
  date: string;
}

export const enum EmailTemplateKey {
  verificationEmail = "6955",
  accountEmail = "8146",
}

export const enum MessageTemplateKey {
  verificationPhone = "0001",
}

export const getSignature = ({ method, requestUrl, date }: SignatureParams) => {
  const space = " ";
  const newLine = "\n";
  const hmac = createHmac("sha256", process.env.NCP_SECRET_KEY!);

  hmac.update(method);
  hmac.update(space);
  hmac.update(requestUrl);
  hmac.update(newLine);
  hmac.update(date);
  hmac.update(newLine);
  hmac.update(process.env.NCP_ACCESS_ID!);
  return hmac.digest("base64");
};

export const getHeader = ({ type, date, signature }: HeaderParams) => {
  const headers: HeadersInit = new Headers();

  switch (type) {
    case "message":
    case "email":
      headers.set("Content-Type", "application/json; charset=utf-8");
      headers.set("x-ncp-apigw-timestamp", date!);
      headers.set("x-ncp-iam-access-key", process.env.NCP_ACCESS_ID!);
      headers.set("x-ncp-apigw-signature-v2", signature!);
      break;
    default:
      headers.set("Content-Type", "application/json; charset=utf-8");
      break;
  }
  return headers;
};

export const getMessageTemplate = (id: MessageTemplateKey, parameters: Record<string, string>) => {
  switch (id) {
    case "0001":
      return `[당근마켓] 인증번호 [${parameters?.token}] *타인에게 절대 알리지 마세요.(계정 도용 위험)`;
    default:
      return `[테스트] id: ${id}, parameters: ${JSON.stringify(parameters)}`;
  }
};
