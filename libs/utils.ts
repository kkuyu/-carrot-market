import { IncomingMessage } from "http";
import type { MutableRefObject } from "react";
import { ProductCategory, StoryCategory, Kind } from "@prisma/client";
// @libs
import name from "@libs/name.json";
import { ResponseDataType } from "@libs/server/withHandler";
// @api
import { ProductCategories } from "@api/products/types";
import { StoryCategories } from "@api/stories/types";
import { CommentEmotionIcon } from "@api/comments/types";
import { GetFilesResponse, DeleteFilesResponse, ImageDeliveryUpdateResponse } from "@api/files";
import { ProductCondition, GetProductsDetailResponse } from "@api/products/[id]";
import { GetStoriesDetailResponse, StoryCondition } from "@api/stories/[id]";
import { GetCommentsDetailResponse, StoryCommentCondition, StoryCommentItem } from "@api/comments/[id]";

export const getKey = <T extends ResponseDataType>(pageIndex: number, previousPageData: T | null, options: { url: string; query?: string }) => {
  const { url = "", query = "" } = options;
  if (pageIndex === 0) return `${url}?prevCursor=0&${query}`;
  if (previousPageData && previousPageData.lastCursor === -1) return null;
  if (previousPageData) return `${url}?prevCursor=${previousPageData.lastCursor}&${query}`;
  return null;
};

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

export const truncateStr = (str: string = "", count: number = 0) => {
  if (!str.length) return "";
  return str.length > count ? str.slice(0, count - 1) + "..." : str;
};

export const getRandomName = () => {
  const adjectiveIndex = Math.floor(Math.random() * name.adjective.length);
  const animalIndex = Math.floor(Math.random() * name.animal.length);
  return `${name.adjective[adjectiveIndex]} ${name.animal[animalIndex]}`;
};

export const getCategory = <T extends ProductCategories | StoryCategories>(
  categoryStr: string = "",
  options?: { excludeCategory: (ProductCategories | StoryCategories | string)[] }
): (T[number] & { kebabCaseValue: string }) | null => {
  let category = null;
  const kebabCaseValue = categoryStr.toLowerCase().replace(/_/g, "-");
  const screamingSnakeValue = categoryStr.toUpperCase().replace(/-/g, "_");
  if (isInstance(screamingSnakeValue, ProductCategory)) category = ProductCategories.find((v) => v.value === screamingSnakeValue)!;
  if (isInstance(screamingSnakeValue, StoryCategory)) category = StoryCategories.find((v) => v.value === screamingSnakeValue)!;
  if (!category) return null;
  if (options?.excludeCategory?.includes(category.value)) return null;
  return { ...category, kebabCaseValue };
};

export const getProductCondition = (product: Partial<GetProductsDetailResponse["product"]> | null, userId: number | null = null): ProductCondition | null => {
  if (!product || !product?.records) return null;
  const category = getCategory<ProductCategories>(product?.category);
  const purchaseRecord = product?.records?.find((record) => record.kind === Kind.ProductPurchase) || null;
  const myRole = userId === null ? "unknown" : userId === product?.userId ? "sellUser" : userId === purchaseRecord?.userId ? "purchaseUser" : "unrelatedUser";
  const partnerRole = userId === null ? "unknown" : myRole === "unrelatedUser" || !purchaseRecord ? "unrelatedUser" : myRole === "sellUser" ? "purchaseUser" : "sellUser";
  const partnerUserId = partnerRole === "unknown" ? null : partnerRole === "sellUser" ? product?.userId : partnerRole === "purchaseUser" ? purchaseRecord?.userId : null;
  return {
    role: { myRole, partnerRole, partnerUserId: partnerUserId || null },
    likes: product?.records?.filter((record) => record.kind === Kind.ProductLike)?.length || 0,
    ...(category ? { category } : {}),
    ...(product?.chats ? { chats: product?.chats?.filter((chat) => chat._count.chatMessages > 0)?.length || 0 } : {}),
    ...(product?.reviews && (myRole === "sellUser" || myRole === "purchaseUser")
      ? {
          review: {
            sentReviewId: product?.reviews?.find((review) => review.role === myRole && review[`${myRole}Id`] === userId)?.id || null,
            receiveReviewId: product?.reviews?.find((review) => review.role === partnerRole && review[`${myRole}Id`] === userId)?.id || null,
          },
        }
      : {}),
    isSale: Boolean(product?.records?.find((record) => record.kind === Kind.ProductSale)),
    isPurchase: Boolean(product?.records?.find((record) => record.kind === Kind.ProductPurchase)),
    ...(userId ? { isLike: Boolean(product?.records?.find((record) => record.kind === Kind.ProductLike && record.userId === userId)) } : {}),
  };
};

export const getStoryCondition = (story: Partial<GetStoriesDetailResponse["story"]> | null, userId: number | null = null): StoryCondition | null => {
  if (!story || !story?.records) return null;
  const myRole = userId === null ? "unknown" : userId === story?.userId ? "author" : "reader";
  const category = getCategory<StoryCategories>(story?.category);
  const likeRecords = story?.records?.filter((record) => record.kind === Kind.StoryLike) || [];
  const likeRecord = likeRecords?.find((record) => record.userId === userId) || null;
  const emotions = Object.entries(CommentEmotionIcon).filter(([key]) => likeRecords.find((i) => i.emotion === key));
  return {
    role: { myRole },
    likes: likeRecords.length,
    ...(category ? { category } : {}),
    ...(story?.comments ? { comments: story?.comments?.length || 0 } : {}),
    ...(category?.isLikeWithEmotion
      ? {
          emotion: likeRecord?.emotion,
          emojis: emotions.length ? emotions.map(([key, emotion]) => emotion.emoji).join("") : null,
          emoji: likeRecord?.emotion ? CommentEmotionIcon?.[likeRecord?.emotion].emoji : null,
        }
      : {}),
    ...(userId ? { isLike: Boolean(story?.records?.find((record) => record.kind === Kind.StoryLike && record.userId === userId)) } : {}),
  };
};

export const getCommentCondition = (comment: Partial<GetCommentsDetailResponse["comment"]> | null, userId: number | null = null): StoryCommentCondition | null => {
  if (!comment || !comment?.records) return null;
  const myRole = userId === null ? "unknown" : userId === comment?.userId ? "author" : "reader";
  return {
    role: { myRole },
    likes: comment?.records?.filter((record) => record.kind === Kind.CommentLike)?.length || 0,
    ...(userId ? { isLike: Boolean(comment?.records?.find((record) => record.kind === Kind.CommentLike && record.userId === userId)) } : {}),
  };
};

export type TimeConfig = {
  type?: "pastToPresent" | "presentToPast";
  defaultValue?: string;
  minimumTimeLabel?: "분" | "시간" | "일" | "개월" | "년";
};

export const getDiffTimeStr = (dateFrom: number, dateTo: number, config?: TimeConfig) => {
  let resultStr = null;
  const diffTime = dateTo - dateFrom;
  const suffixStr = config?.type === "presentToPast" ? "후" : "전";
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
      resultStr = `${diff}${times[index].label}${suffixStr}`;
      break;
    }
    if (times[index].label === config?.minimumTimeLabel) {
      break;
    }
  }
  return resultStr || config?.defaultValue || `방금${suffixStr}`;
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
  for (let index = 0; index < originalFiles?.length; index++) {
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
    if (originalFiles?.length > options.maxLength) {
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

export const convertFiles = async (originalPaths: string[], options?: { variant: string }) => {
  const transfer = new DataTransfer();
  for (let index = 0; index < originalPaths?.length; index++) {
    let file = null;
    const isCloudflareImages = /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(originalPaths[index]);
    if (isCloudflareImages) file = await convertFileByPhoto(originalPaths[index], options);
    if (file !== null) transfer.items.add(file);
  }
  return { validFiles: transfer.files };
};

export const convertFileByPhoto = async (imageId: string, options?: { variant: string }) => {
  try {
    if (!imageId) throw new Error();
    const response = await fetch(`https://imagedelivery.net/QG2MZZsP6KQnt-Ryd54wog/${imageId}/${options?.variant || "public"}`);
    const data = await response.blob();
    const metadata = { type: data.type };
    return new File([data], imageId!, metadata);
  } catch (error) {
    console.error("convertPhotoToFile", error, imageId, options);
    return null;
  }
};

export const submitFiles = async (uploadFiles: FileList | [], options?: { originalPaths?: string[] }) => {
  const uploadPaths = [];
  const previousPaths = options?.originalPaths || [];
  for (let index = 0; index < uploadFiles?.length; index++) {
    if (previousPaths?.includes(uploadFiles[index].name)) {
      uploadPaths.push(uploadFiles[index].name);
      previousPaths.splice(previousPaths.indexOf(uploadFiles[index].name), 1);
      continue;
    }
    let path = null;
    const isCloudflareImages = /^image\/\w*$/.test(uploadFiles[index].type);
    if (isCloudflareImages) path = await submitFilesByPhoto(uploadFiles[index]);
    if (path) uploadPaths.push(path);
  }
  for (let index = 0; index < previousPaths?.length; index++) {
    const isCloudflareImages = /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(previousPaths[index]);
    if (isCloudflareImages) await deleteFilesByPhoto(previousPaths[index]);
  }
  return { uploadPaths };
};

export const submitFilesByPhoto = async (file: FileList[number]) => {
  try {
    const form = new FormData();
    form.append("file", file, file.name);
    const fileResponse: GetFilesResponse = await (await fetch("/api/files")).json();
    if (!fileResponse.success) new Error("ErrorFileResponse");
    const imageResponse: ImageDeliveryUpdateResponse = await (await fetch(fileResponse.uploadURL, { method: "POST", body: form })).json();
    if (!imageResponse.success) new Error("ErrorImageResponse");
    return imageResponse.result.id;
  } catch (error) {
    console.error("submitFilesByPhoto", error, file);
    return null;
  }
};

export const deleteFilesByPhoto = async (id: string) => {
  try {
    const fileResponse: DeleteFilesResponse = await (
      await fetch("/api/files", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({ identifier: id }),
      })
    ).json();
    return fileResponse;
  } catch (error) {
    console.error("deleteFilesByPhoto", error);
    return null;
  }
};

export type TimerRef = MutableRefObject<NodeJS.Timeout | null>;

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
