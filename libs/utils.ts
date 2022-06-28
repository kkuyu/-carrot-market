import { IncomingMessage } from "http";
import { uniqueNamesGenerator, Config, adjectives, starWars } from "unique-names-generator";

export const cls: (...props: string[]) => string = (...classnames) => {
  return classnames.join(" ");
};

export const objMap = (obj: object, fn: (value: [string, any]) => [string, any]) => {
  return Object.fromEntries(Object.entries(obj).map(fn));
};

export const getAbsoluteUrl: (req?: IncomingMessage) => { protocol: string; host: string; origin: string } = (req) => {
  const host = (req && req.headers ? req.headers["x-forwarded-host"] || req.headers.host : window.location.host)?.toString() || "";
  const protocol = /^localhost(:\d+)?$/.test(host) ? "http:" : "https:";
  return {
    protocol: protocol,
    host: host,
    origin: protocol + "//" + host,
  };
};

export const getRandomName: () => string = () => {
  const config: Config = {
    dictionaries: [adjectives, starWars],
    separator: "-",
    length: 2,
    style: "capital",
  };

  return uniqueNamesGenerator(config).replace(/\s/g, "-");
};
