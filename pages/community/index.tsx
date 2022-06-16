import { useEffect } from "react";
import type { NextPage } from "next";
import Link from "next/link";
import { Post, User } from "@prisma/client";
import useSWRInfinite from "swr/infinite";

import usePagination from "@libs/client/usePagination";
import useCoords from "@libs/client/useCoords";

import Layout from "@components/layout";
import FloatingButton from "@components/floating-button";

interface PostsResponse {
  success: boolean;
  posts: (Post & {
    user: Pick<User, "name">;
    _count: { curiosities: number; comments: number };
  })[];
  pages: number;
}

const Community: NextPage = () => {
  const { page } = usePagination({ isInfiniteScroll: true });
  const { latitude, longitude } = useCoords();

  const getKey = (pageIndex: number, previousPageData: PostsResponse) => {
    if (!latitude && !longitude) return null;
    if (pageIndex === 0) return `/api/posts?page=1&latitude=${latitude}&longitude=${longitude}`;
    if (previousPageData && !previousPageData.posts.length) return null;
    if (pageIndex + 1 > previousPageData.pages) return null;
    return `/api/posts?page=${pageIndex + 1}&latitude=${latitude}&longitude=${longitude}`;
  };

  const { data, setSize } = useSWRInfinite<PostsResponse>(getKey, (url: string) => fetch(url).then((response) => response.json()), {
    initialSize: 1,
    revalidateFirstPage: false,
  });
  const posts = data ? data.flatMap((item) => item.posts) : [];

  useEffect(() => {
    setSize(page);
  }, [setSize, page]);

  return (
    <Layout hasTabBar title="Community">
      <div className="container">
        <div className="-mx-4 divide-y divide-gray-300">
          {posts.map((post) => (
            <Link key={post.id} href={`/community/${post.id}`}>
              <a className="flex flex-col items-stretch w-full">
                <div className="pt-5 px-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full">Community</span>
                  <div className="mt-2 text-gray-700">
                    <span className="font-semibold text-orange-500">Q.</span> {post.question}
                  </div>
                </div>
                <div className="mt-5 px-4">
                  <div className="flex items-center justify-between w-full text-xs font-semibold text-gray-500">
                    <span>{post.user.name}</span>
                    <span className="flex-none">{String(post.createdAt)}</span>
                  </div>
                </div>
                <div className="mt-3 px-4 border-t">
                  <div className="flex w-full py-2.5 space-x-5 text-gray-700">
                    <span className="flex items-center space-x-1 text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span>Curiosities {post._count.curiosities}</span>
                    </span>
                    <span className="flex items-center space-x-1 text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        ></path>
                      </svg>
                      <span>Comments {post._count.comments}</span>
                    </span>
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </div>
        <FloatingButton href="/community/write">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
          </svg>
        </FloatingButton>
      </div>
    </Layout>
  );
};

export default Community;
