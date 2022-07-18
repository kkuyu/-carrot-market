export const ReviewSatisfactionEnum = {
  ["별로예요"]: "dislike",
  ["좋아요"]: "good",
  ["최고예요"]: "best",
} as const;

export type ReviewSatisfactionEnum = typeof ReviewSatisfactionEnum[keyof typeof ReviewSatisfactionEnum];

export const ReviewSatisfaction: { text: keyof typeof ReviewSatisfactionEnum; value: ReviewSatisfactionEnum }[] = [
  { text: "별로예요", value: "dislike" },
  { text: "좋아요", value: "good" },
  { text: "최고예요", value: "best" },
];

export const ReviewInquiryEnum = {
  ["제가 있는 곳까지 와서 거래했어요"]: "come-to-my-place-and-trade",
  ["친절하고 매너가 좋아요"]: "kind-and-good-manners",
  ["시간 약속을 잘 지켜요"]: "keep-your-appointment-on-time",
  ["응답이 빨라요"]: "response-is-fast",
  ["나눔을 해주셨어요"]: "gave-it-to-me",
  ["상품상태가 설명한 것과 같아요"]: "product-status-is-the-same-as-described",
  ["상품 설명이 자세해요"]: "detailed-product-description",
  ["좋은 상품을 저렴하게 판매해요"]: "sell-good-products-at-a-reasonable-price",
  ["불친절해요"]: "be-unfriendly",
  ["반말을 사용해요"]: "use-half-a-word",
  ["거래 시간과 장소를 정한 후 거래 직전 취소했어요"]: "after-setting-the-time-and-place-but-canceled-right.",
  ["거래 시간과 장소를 정한 후 연락이 안돼요"]: "after-setting-the-time-and-place-but-can-not-contact",
  ["약속 장소에 나타나지 않았어요"]: "did-not-show-up-for-the-appointment",
  ["거래와 관련없는 대화를 해요"]: "conversations-that-are-not-related-to-the-transaction",
  ["시간약속을 안지켜요"]: "not-keeping-the-promised-time",
  ["게시글에 없는 정보를 자세히 알려주지 않아요"]: "do-not-give-detailed-information-that-not-in-the-post.",
  ["구매의사 없이 계속 상품 관련 문의를 해요"]: "no-intention-of-buying-and-asking-questions-about-the-product",
  ["예약만 하고 거래 시간을 명확하게 알려주지 않아요"]: "reservation-but-transaction-time-is-not-clearly-stated",
  ["채팅 메세지를 읽고도 답이 없어요"]: "read-the-chat-messages-and-no-answer",
  ["원하지 않는 가격을 계속 요구해요"]: "asking-for-the-price-do-not-want",
} as const;

export type ReviewInquiryEnum = typeof ReviewInquiryEnum[keyof typeof ReviewInquiryEnum];

export const ReviewInquiry: { text: keyof typeof ReviewInquiryEnum; value: ReviewInquiryEnum; satisfaction: ReviewSatisfactionEnum[]; role: ("sellUser" | "purchaseUser")[] }[] = [
  { text: "제가 있는 곳까지 와서 거래했어요", value: "come-to-my-place-and-trade", satisfaction: ["best", "good"], role: ["sellUser"] },
  { text: "친절하고 매너가 좋아요", value: "kind-and-good-manners", satisfaction: ["best", "good"], role: ["sellUser", "purchaseUser"] },
  { text: "시간 약속을 잘 지켜요", value: "keep-your-appointment-on-time", satisfaction: ["best", "good"], role: ["sellUser", "purchaseUser"] },
  { text: "응답이 빨라요", value: "response-is-fast", satisfaction: ["best", "good"], role: ["sellUser", "purchaseUser"] },
  { text: "나눔을 해주셨어요", value: "gave-it-to-me", satisfaction: ["best", "good"], role: ["purchaseUser"] },
  { text: "상품상태가 설명한 것과 같아요", value: "product-status-is-the-same-as-described", satisfaction: ["best", "good"], role: ["purchaseUser"] },
  { text: "상품 설명이 자세해요", value: "detailed-product-description", satisfaction: ["best", "good"], role: ["purchaseUser"] },
  { text: "좋은 상품을 저렴하게 판매해요", value: "sell-good-products-at-a-reasonable-price", satisfaction: ["best", "good"], role: ["purchaseUser"] },
  { text: "불친절해요", value: "be-unfriendly", satisfaction: ["dislike"], role: ["sellUser", "purchaseUser"] },
  { text: "반말을 사용해요", value: "use-half-a-word", satisfaction: ["dislike"], role: ["sellUser", "purchaseUser"] },
  { text: "거래 시간과 장소를 정한 후 거래 직전 취소했어요", value: "after-setting-the-time-and-place-but-canceled-right.", satisfaction: ["dislike"], role: ["sellUser", "purchaseUser"] },
  { text: "거래 시간과 장소를 정한 후 연락이 안돼요", value: "after-setting-the-time-and-place-but-can-not-contact", satisfaction: ["dislike"], role: ["sellUser", "purchaseUser"] },
  { text: "약속 장소에 나타나지 않았어요", value: "did-not-show-up-for-the-appointment", satisfaction: ["dislike"], role: ["sellUser", "purchaseUser"] },
  { text: "거래와 관련없는 대화를 해요", value: "conversations-that-are-not-related-to-the-transaction", satisfaction: ["dislike"], role: ["sellUser", "purchaseUser"] },
  { text: "시간약속을 안지켜요", value: "not-keeping-the-promised-time", satisfaction: ["dislike"], role: ["sellUser", "purchaseUser"] },
  { text: "게시글에 없는 정보를 자세히 알려주지 않아요", value: "do-not-give-detailed-information-that-not-in-the-post.", satisfaction: ["dislike"], role: ["sellUser", "purchaseUser"] },
  { text: "구매의사 없이 계속 상품 관련 문의를 해요", value: "no-intention-of-buying-and-asking-questions-about-the-product", satisfaction: ["dislike"], role: ["sellUser", "purchaseUser"] },
  { text: "예약만 하고 거래 시간을 명확하게 알려주지 않아요", value: "reservation-but-transaction-time-is-not-clearly-stated", satisfaction: ["dislike"], role: ["sellUser", "purchaseUser"] },
  { text: "채팅 메세지를 읽고도 답이 없어요", value: "read-the-chat-messages-and-no-answer", satisfaction: ["dislike"], role: ["sellUser", "purchaseUser"] },
  { text: "원하지 않는 가격을 계속 요구해요", value: "asking-for-the-price-do-not-want", satisfaction: ["dislike"], role: ["sellUser", "purchaseUser"] },
];
