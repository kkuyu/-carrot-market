import { IncomingMessage } from "http";
import { uniqueNamesGenerator, Config, adjectives, starWars } from "unique-names-generator";

import { PostCategory } from "@api/posts/types";
import { ProductCategory } from "@api/products/types";

export const isInstance = <T extends object>(value: string | number, type: T): type is T => {
  return Object.values(type).includes(value);
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

export const getCategory = (type: "product" | "post", categoryKey: string) => {
  if (type === "product") return ProductCategory.find((v) => v.value === categoryKey) || null;
  if (type === "post") return PostCategory.find((v) => v.value === categoryKey) || null;
  return null;
};

export const getDiffTimeStr = (originTime: number, currentTime: number) => {
  let resultStr = "";

  const diffTime = currentTime - originTime;
  const times = [
    { ms: 1000 * 60, label: "분" },
    { ms: 1000 * 60 * 60, label: "시간" },
    { ms: 1000 * 60 * 60 * 24, label: "일" },
    { ms: 1000 * 60 * 60 * 24 * 30, label: "개월" },
    { ms: 1000 * 60 * 60 * 24 * 365, label: "년" },
  ].reverse();

  for (let index = 0; index < times.length; index++) {
    const diff = Math.floor(diffTime / times[index].ms);
    if (diff > 0) {
      resultStr = `${diff}${times[index].label} 전`;
      break;
    }
  }

  return resultStr || "방금 전";
};

export type FileOptions = {
  maxLength?: number;
  acceptTypes?: string[];
};

export const validateFiles = (originalFiles: FileList, options: FileOptions = {}) => {
  let validFiles = Array.from(originalFiles);
  let errors: { [key in keyof typeof options]?: boolean } = {};

  // acceptTypes
  if (options?.acceptTypes) {
    validFiles = validFiles.filter((file: File) => {
      if (options?.acceptTypes?.includes(file.type)) return true;
      errors.acceptTypes = true;
      return false;
    });
  }

  // maxLength
  if (options?.maxLength) {
    if (originalFiles.length > options.maxLength) {
      errors.maxLength = true;
    }
    if (validFiles.length > options.maxLength) {
      validFiles = validFiles.slice(0, options.maxLength);
    }
  }

  return { errors, validFiles };
};
