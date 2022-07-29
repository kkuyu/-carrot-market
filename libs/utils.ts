import { IncomingMessage } from "http";
// @libs
import name from "@libs/name.json";
// @api
import { StoryCategory } from "@api/stories/types";
import { ProductCategory } from "@api/products/types";
import { ReviewManners } from "@api/reviews/types";
import { StoryCommentItem } from "@api/comments/[id]";

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

export const getProductCategory = (categoryKey: string) => {
  return ProductCategory.find((v) => v.value === categoryKey) || null;
};

export const getStoryCategory = (categoryKey: string) => {
  return StoryCategory.find((v) => v.value === categoryKey) || null;
};

export const getReviewManners = (mannerKey: string) => {
  return ReviewManners.find((v) => v.value === mannerKey) || null;
};

type timeLabel = "분" | "시간" | "일" | "개월" | "년";

export const getDiffTimeStr = (originTime: number, currentTime: number, config?: { defaultValue?: string; suffixStr?: string; diffLabel?: timeLabel }) => {
  let resultStr = config?.defaultValue || `방금${config?.suffixStr || " 전"}`;

  const diffTime = currentTime - originTime;
  const times = [
    { ms: 1000 * 60, label: "분" as timeLabel },
    { ms: 1000 * 60 * 60, label: "시간" as timeLabel },
    { ms: 1000 * 60 * 60 * 24, label: "일" as timeLabel },
    { ms: 1000 * 60 * 60 * 24 * 30, label: "개월" as timeLabel },
    { ms: 1000 * 60 * 60 * 24 * 365, label: "년" as timeLabel },
  ].reverse();

  for (let index = 0; index < times.length; index++) {
    const diff = Math.floor(diffTime / times[index].ms);
    if (diff > 0) {
      resultStr = `${diff}${times[index].label}${config?.suffixStr || " 전"}`;
      break;
    }
    if (times[index].label === config?.diffLabel) {
      break;
    }
  }

  return resultStr;
};

export type FileOptions = {
  duplicateDelete?: boolean;
  acceptTypes?: string[];
  maxLength?: number;
};

export const validateFiles = (originalFiles: FileList, options: FileOptions = {}) => {
  let newFiles: File[] = [];
  let errors: Set<keyof typeof options> = new Set();

  // check duplicateDelete
  for (let index = 0; index < originalFiles.length; index++) {
    if (!options?.duplicateDelete) {
      newFiles.push(originalFiles[index]);
      continue;
    }
    if (!newFiles.length) {
      newFiles.push(originalFiles[index]);
      continue;
    }
    const isDuplicate = newFiles.find((file) => file.name === originalFiles[index].name && file.lastModified === originalFiles[index].lastModified);
    if (!isDuplicate) {
      newFiles.push(originalFiles[index]);
      continue;
    }
    errors.add("duplicateDelete");
  }

  // check acceptTypes
  if (options?.acceptTypes) {
    newFiles = newFiles.filter((file: File) => {
      if (options?.acceptTypes?.includes(file.type)) return true;
      errors.add("acceptTypes");
      return false;
    });
  }

  // check maxLength
  if (options?.maxLength) {
    if (originalFiles.length > options.maxLength) {
      errors.add("maxLength");
    }
    if (newFiles.length > options.maxLength) {
      errors.add("maxLength");
      newFiles = newFiles.slice(0, options.maxLength);
    }
  }

  const transfer = new DataTransfer();
  newFiles.forEach((file) => transfer.items.add(file));

  return {
    errors: Array.from(errors).map((error: keyof FileOptions) => {
      let message = "";
      if (error === "duplicateDelete") message = "중복되지 않은 파일만 등록할 수 있어요";
      if (error === "acceptTypes") message = `${options?.acceptTypes?.map((v) => v.replace(/^\w*\//, "")).join(", ")} 형식의 파일만 등록할 수 있어요`;
      if (error === "maxLength") message = `최대 ${options?.maxLength}개까지 등록할 수 있어요.`;
      return { type: error, message };
    }),
    validFiles: transfer.files,
  };
};

export const convertPhotoToFile = async (photoId: string, variant: string = "public") => {
  try {
    if (!photoId) throw new Error();
    const response = await fetch(`https://imagedelivery.net/QG2MZZsP6KQnt-Ryd54wog/${photoId}/${variant}`);
    const data = await response.blob();
    const metadata = { type: data.type };
    return new File([data], photoId!, metadata);
  } catch {
    console.error("convertPhotoToFile", photoId, variant);
    return null;
  }
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

export const getCommentTree: (depth: number, arr: StoryCommentItem[]) => StoryCommentItem[] | StoryCommentItem[] = (depth, arr = []) => {
  if (depth === 0) return arr;
  if (arr.length === 0) return arr;
  if (arr.length === 1) return arr;
  const copyArr = [...arr];
  for (let index = copyArr.length - 1; index >= 0; index--) {
    if (copyArr[index].depth !== depth) continue;
    if (copyArr[index].reCommentRefId === null) continue;
    const [current] = copyArr.splice(index, 1);
    const refIndex = copyArr.findIndex((item) => current.reCommentRefId === item.id);
    copyArr[refIndex]?.reComments?.unshift(current);
  }
  return getCommentTree(depth - 1, copyArr);
};
