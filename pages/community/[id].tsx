import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { Comment, Post, User } from "@prisma/client";
import useSWR from "swr";

import { cls } from "@libs/utils";
import useMutation from "@libs/client/useMutation";

import Layout from "@components/layout";
import TextArea from "@components/textarea";
import Button from "@components/button";

interface CommentForm {
  comment: string;
}

interface CommunityDetailResponse {
  success: boolean;
  post: Post & {
    user: Pick<User, "id" | "name" | "avatar">;
    comments: (Comment & { user: Pick<User, "name"> })[];
    _count: { curiosities: number; comments: number };
  };
  isCuriosity: boolean;
}

interface MutationResult {
  success: true;
}

const CommunityDetail: NextPage = () => {
  const router = useRouter();
  const { register, handleSubmit, reset } = useForm<CommentForm>();

  const { data, error, mutate: boundMutate } = useSWR<CommunityDetailResponse>(router.query.id ? `/api/posts/${router.query.id}` : null);

  const [curiosityToggle, { loading: curiosityLoading }] = useMutation(`/api/posts/${router.query.id}/curiosity`);
  const [commentSend, { data: commentData, loading: commentLoading }] = useMutation<MutationResult>(`/api/posts/${router.query.id}/comment`);

  const onCuriosityClick = () => {
    if (!data) return;
    if (curiosityLoading) return;
    boundMutate(
      {
        ...data,
        post: {
          ...data.post,
          _count: {
            ...data.post._count,
            curiosities: data.isCuriosity ? data.post._count.curiosities - 1 : data.post._count.curiosities + 1,
          },
        },
        isCuriosity: !data.isCuriosity,
      },
      false
    );
    curiosityToggle({});
  };

  const onValid = (data: CommentForm) => {
    if (!data) return;
    if (commentLoading) return;
    commentSend(data);
  };

  useEffect(() => {
    if (data && !data.success) {
      router.push("/community");
    }
  }, [data, router]);

  useEffect(() => {
    if (commentData && commentData.success) {
      reset();
      boundMutate();
    }
  }, [commentData, reset, boundMutate]);

  if (!data || !data.success || error) {
    return null;
  }

  return (
    <Layout canGoBack>
      <div className="container pt-5 pb-5">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full">Community</span>
        </div>
        <div className="-mx-4 border-b">
          <div className="flex items-center w-full space-x-3 px-4 py-3 text-left">
            <div className="flex-none w-12 h-12 bg-slate-300 rounded-full" />
            <div>
              <strong className="block text-sm font-semibold text-gray-700">{data.post.user.name}</strong>
              <Link href={`/users/profiles/${data.post.user.id}`}>
                <a className="block text-xs font-semibold text-gray-500">View profile &rarr;</a>
              </Link>
            </div>
          </div>
        </div>

        <div className="-mx-4 border-b border-b-gray-300">
          <div className="flex flex-col items-stretch w-full text-left">
            <div className="pt-5 px-4">
              <div className="text-gray-700">
                <span className="font-semibold text-orange-500">Q.</span> {data?.post.question}
              </div>
            </div>
            <div className="mt-5 px-4">
              <div className="flex items-center justify-end w-full text-xs font-semibold text-gray-500">
                <span className="flex-none">{String(data.post.createdAt)}</span>
              </div>
            </div>
            <div className="mt-3 px-4 border-t">
              <div className="flex w-full py-2.5 space-x-5 text-gray-700">
                <button type="button" onClick={onCuriosityClick} className={cls("flex items-center space-x-1 text-sm", data.isCuriosity ? "text-teal-600" : "")} disabled={curiosityLoading}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>Curiosities {data.post._count.curiosities}</span>
                </button>
                <span className="flex items-center space-x-1 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    ></path>
                  </svg>
                  <span>Comments {data.post._count.comments}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {data?.post?.comments && !data.post.comments.length
          ? null
          : data.post.comments.map((comment) => (
              <div className="mt-6 space-y-5" key={comment.id}>
                <div className="flex items-start space-x-3">
                  <div className="flex-none w-8 h-8 bg-slate-200 rounded-full" />
                  <div>
                    <span className="block text-sm font-semibold text-gray-700">{comment.user.name}</span>
                    <span className="block text-xs text-gray-500">{String(comment.createdAt)}</span>
                    <p className="mt-2 text-gray-700">{comment.comment}</p>
                  </div>
                </div>
              </div>
            ))}

        <div className="mt-6">
          <form onSubmit={handleSubmit(onValid)} noValidate className="space-y-5">
            <TextArea
              register={register("comment", {
                required: true,
                minLength: 10,
              })}
              required
              minLength="10"
              name="comment"
              placeholder="Answer this question!"
            />
            <Button type="submit" text={commentLoading ? "Loading" : "Reply"} disabled={commentLoading} />
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default CommunityDetail;
