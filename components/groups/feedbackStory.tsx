import { FocusEvent, useState } from "react";
// @libs
import { getCategory } from "@libs/utils";
// @api
import { GetStoriesResponse } from "@api/stories";
import { FeelingIcon, FeelingKeys } from "@api/stories/types";
import { GetStoriesDetailResponse } from "@api/stories/[id]";

export type FeedbackStoryItem = GetStoriesResponse["stories"][0] | GetStoriesDetailResponse["story"];

interface FeedbackStoryProps {
  item: FeedbackStoryItem;
  curiosityItem: (item: FeedbackStoryItem) => void;
  emotionItem: (item: FeedbackStoryItem, feeling: FeelingKeys) => void;
  commentItem: (item: FeedbackStoryItem) => void;
}

const FeedbackStory = ({ item, curiosityItem, emotionItem, commentItem }: FeedbackStoryProps) => {
  const [pop, setPop] = useState(false);

  const category = getCategory("story", item?.category);
  const emotions = ["Like", "Love", "Haha", "Wow", "Sad", "Angry"] as FeelingKeys[];

  // action curiosity
  const curiosityClick = () => curiosityItem(item);

  // action emotion
  const emotionClick = () => setPop((prev) => !prev);
  const emotionBlur = (e: FocusEvent<HTMLButtonElement, Element>) => {
    const boxEl = e.relatedTarget?.closest(".emotionBox");
    if (boxEl?.isSameNode(e.relatedTarget)) return;
    if (boxEl?.contains(e.relatedTarget)) return;
    setPop(false);
  };
  const emotionBoxBlur = (e: FocusEvent<HTMLDivElement, Element>) => {
    const boxEl = e.target.closest(".emotionBox");
    const prevEl = boxEl?.previousElementSibling as HTMLElement;
    if (boxEl?.isSameNode(e.relatedTarget)) return;
    if (boxEl?.contains(e.relatedTarget)) return;
    prevEl?.focus();
    setPop(false);
  };

  // action comment
  const commentClick = () => commentItem(item);

  return (
    <div className="relative px-5 border-t">
      {/* 궁금해요 */}
      {category?.feedback.includes("curiosity") && (
        <button type="button" onClick={curiosityClick} className="py-2">
          <svg className={`inline-block w-5 h-5 ${item?.curiosity ? "text-orange-500" : "text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span className={`ml-1 text-sm ${item?.curiosity ? "text-orange-500" : "text-gray-500"}`}>궁금해요 {item?.curiosities?.count || item?._count?.curiosities || null}</span>
        </button>
      )}
      {/* 공감하기: button */}
      {category?.feedback.includes("emotion") && (
        <button type="button" onClick={emotionClick} onBlur={emotionBlur} className="py-2">
          {!item.emotion ? (
            <>
              <svg className="inline-block w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="ml-1 text-sm text-gray-500">공감하기</span>
            </>
          ) : (
            <>
              <span className="inline-block w-5 h-5">{FeelingIcon[item.emotion]}</span>
              <span className="ml-1 text-sm text-orange-500">공감했어요</span>
            </>
          )}
        </button>
      )}
      {/* 공감하기: box */}
      {category?.feedback.includes("emotion") && (
        <div onBlur={emotionBoxBlur} className={`absolute bottom-12 left-5 scale-0 origin-bottom-left transition-all ${pop ? "visible scale-100" : "invisible"} emotionBox`} tabIndex={0}>
          <div className="px-2 bg-white border border-gray-300 rounded-lg">
            {emotions.map((feeling) => {
              const emotionBoxClick = () => {
                emotionItem(item, feeling);
                setPop(false);
              };
              return (
                <button key={feeling} type="button" onClick={emotionBoxClick} className="p-1">
                  {FeelingIcon[feeling]}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {/* 공감하기: result */}
      {category?.feedback.includes("emotion") && Boolean(item?.emotions?.count || item?._count?.emotions) && (
        <div className="absolute bottom-0 right-0 flex items-center h-10 pr-5">
          <span className="text-xs">
            {!item.emotion ? (
              <svg className="inline-block w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              item?.emotions?.feelings.map((feeling) => FeelingIcon[feeling])
            )}
          </span>
          <span className="ml-1 block text-sm text-gray-500">{item?.emotions?.count || item?._count?.emotions || null}</span>
        </div>
      )}
      {/* 댓글 */}
      <button type="button" className="ml-4 py-2" onClick={commentClick}>
        <svg className="inline-block w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          ></path>
        </svg>
        <span className="ml-1 text-sm text-gray-500">댓글 {item?._count?.comments || null}</span>
      </button>
    </div>
  );
};

export default FeedbackStory;
