import { ProductCategory } from "@prisma/client";

export type ProductCategories = { value: ProductCategory; text: string; emoji?: string }[];

export const ProductCategories: ProductCategories = [
  { value: ProductCategory["POPULAR_PRODUCT"], text: "인기매물", emoji: "🌟" },
  { value: ProductCategory["DIGITAL_DEVICE"], text: "디지털기기", emoji: "💻" },
  { value: ProductCategory["HOME_APPLIANCES"], text: "생활가전", emoji: "📻" },
  { value: ProductCategory["FURNITURE_AND_INTERIOR"], text: "가구/인테리어", emoji: "🛋️" },
  { value: ProductCategory["LIFE_AND_KITCHEN"], text: "생활/주방", emoji: "🍳" },
  { value: ProductCategory["INFANT"], text: "유아동", emoji: "🍼" },
  { value: ProductCategory["CHILDREN_BOOK"], text: "유아도서", emoji: "📙" },
  { value: ProductCategory["FEMALE_FASHION"], text: "여성의류", emoji: "👚" },
  { value: ProductCategory["FEMALE_SUNDRIES"], text: "여성잡화", emoji: "👒" },
  { value: ProductCategory["MALE_FASHION_AND_MALE_SUNDRIES"], text: "남성패션/잡화", emoji: "👔" },
  { value: ProductCategory["BEAUTY_AND_COSMETOLOGY"], text: "뷰티/미용", emoji: "🧴" },
  { value: ProductCategory["SPORTS_AND_LEISURE"], text: "스포츠/레저", emoji: "🏸" },
  { value: ProductCategory["HOBBY_AND_GAME_AND_ALBUM"], text: "취미/게임/음반", emoji: "🎮" },
  { value: ProductCategory["BOOK"], text: "도서", emoji: "📚" },
  { value: ProductCategory["TICKET_AND_COUPON"], text: "티켓/교환권", emoji: "🎫" },
  { value: ProductCategory["PROCESSED_FOOD"], text: "가공식품", emoji: "🥫" },
  { value: ProductCategory["COMPANION_ANIMAL_SUPPLIES"], text: "반려동물용품", emoji: "🐾" },
  { value: ProductCategory["PLANT"], text: "식물", emoji: "🌱" },
  { value: ProductCategory["ETC"], text: "기타 중고물품", emoji: "📦" },
  { value: ProductCategory["SEEK"], text: "삽니다", emoji: "📢" },
];
