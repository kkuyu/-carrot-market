import { MannerValue } from "@prisma/client";

export type ProductReviewScores = {
  value: number;
  text: string;
}[];

export const ProductReviewScores: ProductReviewScores = [
  { value: 40, text: "별로예요" },
  { value: 60, text: "좋아요" },
  { value: 80, text: "최고예요" },
];

export type ProductMannerValues = {
  value: MannerValue;
  text: string;
  validScore: (score: number) => boolean;
  validRole: (role: string) => boolean;
}[];

export const ProductMannerValues: ProductMannerValues = [
  {
    value: MannerValue.COME_CLOSE_TO_MAKE_A_TRADE,
    text: "제가 있는 곳까지 와서 거래했어요",
    validScore: (score) => score > 40,
    validRole: (role) => ["sellUser"].includes(role),
  },
  {
    value: MannerValue.KIND_AND_GOOD_MANNERS,
    text: "친절하고 매너가 좋아요",
    validScore: (score) => score > 40,
    validRole: (role) => ["sellUser", "purchaseUser"].includes(role),
  },
  {
    value: MannerValue.PUNCTUAL,
    text: "시간 약속을 잘 지켜요",
    validScore: (score) => score > 40,
    validRole: (role) => ["sellUser", "purchaseUser"].includes(role),
  },
  {
    value: MannerValue.RESPOND_QUICKLY,
    text: "응답이 빨라요",
    validScore: (score) => score > 40,
    validRole: (role) => ["sellUser", "purchaseUser"].includes(role),
  },
  {
    value: MannerValue.GAVE_FOR_FREE,
    text: "나눔을 해주셨어요",
    validScore: (score) => score > 40,
    validRole: (role) => ["purchaseUser"].includes(role),
  },
  {
    value: MannerValue.PRODUCT_STATUS_IS_AS_DESCRIBED,
    text: "상품상태가 설명한 것과 같아요",
    validScore: (score) => score > 40,
    validRole: (role) => ["purchaseUser"].includes(role),
  },
  {
    value: MannerValue.PRODUCT_DESCRIPTION_IS_DETAILED,
    text: "상품 설명이 자세해요",
    validScore: (score) => score > 40,
    validRole: (role) => ["purchaseUser"].includes(role),
  },
  {
    value: MannerValue.GOOD_PRODUCT_AT_REASONABLE_PRICE,
    text: "좋은 상품을 저렴하게 판매해요",
    validScore: (score) => score > 40,
    validRole: (role) => ["purchaseUser"].includes(role),
  },
  {
    value: MannerValue.UNFRIENDLY,
    text: "불친절해요",
    validScore: (score) => score <= 40,
    validRole: (role) => ["sellUser", "purchaseUser"].includes(role),
  },
  {
    value: MannerValue.SPEAKS_INFORMALLY,
    text: "반말을 사용해요",
    validScore: (score) => score <= 40,
    validRole: (role) => ["sellUser", "purchaseUser"].includes(role),
  },
  {
    value: MannerValue.DECIDED_TIME_AND_PLACE_BUT_CANCELED_RIGHT_BEFORE_TRADE,
    text: "거래 시간과 장소를 정한 후 거래 직전 취소했어요",
    validScore: (score) => score <= 40,
    validRole: (role) => ["sellUser", "purchaseUser"].includes(role),
  },
  {
    value: MannerValue.DECIDED_TIME_AND_PLACE_BUT_CAN_NOT_CONTACT,
    text: "거래 시간과 장소를 정한 후 연락이 안돼요",
    validScore: (score) => score <= 40,
    validRole: (role) => ["sellUser", "purchaseUser"].includes(role),
  },
  {
    value: MannerValue.DID_NOT_SHOW_UP_FOR_THE_MEETING_PLACE,
    text: "약속 장소에 나타나지 않았어요",
    validScore: (score) => score <= 40,
    validRole: (role) => ["sellUser", "purchaseUser"].includes(role),
  },
  {
    value: MannerValue.CONVERSATION_HAS_NOTHING_TO_DO_WITH_THE_TRADE,
    text: "거래와 관련없는 대화를 해요",
    validScore: (score) => score <= 40,
    validRole: (role) => ["sellUser", "purchaseUser"].includes(role),
  },
  { value: MannerValue.NOT_PUNCTUAL, text: "시간약속을 안지켜요", validScore: (score) => score <= 40, validRole: (role) => ["sellUser", "purchaseUser"].includes(role) },
  {
    value: MannerValue.DOES_NOT_PROVIDE_DETAILS_THAT_ARE_NOT_IN_THE_POST,
    text: "게시글에 없는 정보를 자세히 알려주지 않아요",
    validScore: (score) => score <= 40,
    validRole: (role) => ["sellUser", "purchaseUser"].includes(role),
  },
  {
    value: MannerValue.KEEP_ASKING_ABOUT_PRODUCT_EVEN_THOUGH_DOES_NOT_WANT_TO_BUY,
    text: "구매의사 없이 계속 상품 관련 문의를 해요",
    validScore: (score) => score <= 40,
    validRole: (role) => ["sellUser", "purchaseUser"].includes(role),
  },
  {
    value: MannerValue.MADE_RESERVATION_BUT_DOES_NOT_SET_A_TRADE_TIME,
    text: "예약만 하고 거래 시간을 명확하게 알려주지 않아요",
    validScore: (score) => score <= 40,
    validRole: (role) => ["sellUser", "purchaseUser"].includes(role),
  },
  {
    value: MannerValue.SAW_THE_CHAT_MESSAGE_BUT_NO_RESPONSE,
    text: "채팅 메세지를 읽고도 답이 없어요",
    validScore: (score) => score <= 40,
    validRole: (role) => ["sellUser", "purchaseUser"].includes(role),
  },
  {
    value: MannerValue.KEEP_ASKING_FOR_PRICES_DO_NOT_WANT,
    text: "원하지 않는 가격을 계속 요구해요",
    validScore: (score) => score <= 40,
    validRole: (role) => ["sellUser", "purchaseUser"].includes(role),
  },
];
