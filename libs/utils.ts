import { IncomingMessage } from "http";
// @libs
import name from "@libs/name.json";
// @api
import { StoryCategory } from "@api/stories/types";
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

export const getRandomName = () => {
  const adjectiveIndex = Math.floor(Math.random() * name.adjective.length);
  const animalIndex = Math.floor(Math.random() * name.animal.length);
  return `${name.adjective[adjectiveIndex]} ${name.animal[animalIndex]}`;
};

export const getCategory = (type: "product" | "story", categoryKey: string) => {
  if (type === "product") return ProductCategory.find((v) => v.value === categoryKey) || null;
  if (type === "story") return StoryCategory.find((v) => v.value === categoryKey) || null;
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

export const convertPhotoToFile = async (photoId: string, variant: string = "public") => {
  const response = await fetch(`https://imagedelivery.net/QG2MZZsP6KQnt-Ryd54wog/${photoId}/${variant}`);
  const data = await response.blob();
  const metadata = { type: data.type };
  return new File([data], photoId!, metadata);
};

export type TimerRef = React.MutableRefObject<NodeJS.Timeout | null>;

export const setTimer = (ref: TimerRef, timeToDelay: number) =>
  new Promise((resolve) => {
    ref.current = setTimeout(() => {
      clearTimer(ref);
      resolve(null);
    }, timeToDelay);
  });

export const clearTimer = (ref: TimerRef) => {
  if (ref.current) {
    clearTimeout(ref.current);
    ref.current = null;
  }
};
