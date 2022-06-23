import { GetStaticProps, NextPage } from "next";
import Link from "next/link";

import { readdirSync, readFileSync } from "fs";
import matter from "gray-matter";

import Layout from "@components/layout";

export interface PostData {
  title: string;
  date: string;
  category: string;
}

const Blog: NextPage<{ posts: (PostData & { slug: string })[] }> = ({ posts }) => {
  return (
    <Layout title="Blog">
      <div className="container">
        <h1 className="mt-5 text-xl text-center font-semibold">Latest Posts:</h1>
        <ul className="mt-10 space-y-5">
          {posts.map((post, index) => (
            <li key={index}>
              <Link href={`/blog/${post.slug}`}>
                <a>
                  <span className="text-lg text-red-500">{post.title}</span>
                  <div>
                    <span>{post.date}</span> | <span>{post.category}</span>
                  </div>
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const blogPosts = readdirSync("./posts").map((fileName) => {
    const content = readFileSync(`./posts/${fileName}`, "utf-8");
    const [slug] = fileName.split(".");
    const { title, date, category } = matter(content).data;
    return {
      title,
      date,
      category,
      slug,
    };
  });
  return {
    props: {
      posts: blogPosts.reverse(),
    },
  };
};

export default Blog;
