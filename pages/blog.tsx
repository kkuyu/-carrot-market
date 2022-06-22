import { NextPage } from "next";

import { readdirSync, readFileSync } from "fs";
import matter from "gray-matter";

import Layout from "@components/layout";

interface Post {
  title: string;
  date: string;
  category: string;
}

const Blog: NextPage<{ posts: Post[] }> = ({ posts }) => {
  return (
    <Layout title="Blog">
      <div className="container">
        <h1 className="mt-5 text-xl text-center font-semibold">Latest Posts:</h1>
        <ul className="mt-10 space-y-5">
          {posts.map((post, index) => (
            <li key={index}>
              <span className="text-lg text-red-500">{post.title}</span>
              <div>
                <span>{post.date}</span> | <span>{post.category}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
};

export const getStaticProps = async () => {
  const blogPosts = readdirSync("./posts").map((fileName) => {
    const content = readFileSync(`./posts/${fileName}`, "utf-8");
    return matter(content).data;
  });
  return {
    props: {
      posts: blogPosts.reverse(),
    },
  };
};

export default Blog;
