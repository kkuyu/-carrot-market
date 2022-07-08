import { getCategory, getDiffTimeStr } from "@libs/utils";
import { GetPostsResponse } from "@api/posts";

export type PostItem = GetPostsResponse["posts"][0];

interface PostProps {
  item: PostItem;
}

const Post = ({ item }: PostProps) => {
  const today = new Date();
  const diffTime = getDiffTimeStr(new Date(item?.updatedAt).getTime(), today.getTime());
  const category = getCategory("post", item?.category);

  return (
    <div className="relative">
      <div>
        <em className="px-2 py-1 text-sm not-italic bg-gray-200 rounded-sm">{category?.text}</em>
        <strong className="mt-2 block font-normal">{item?.content}</strong>
      </div>
      <div className="mt-2 flex justify-between">
        <span className="text-sm text-gray-500">
          {item?.user?.name} · {item?.emdPosNm}
        </span>
        <span className="text-sm text-gray-500">{diffTime}</span>
      </div>
    </div>
  );
};

export default Post;
