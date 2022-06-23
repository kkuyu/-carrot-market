import { GetStaticProps, NextPage } from "next";

import { readdirSync } from "fs";
import matter from "gray-matter";
import remarkHtml from "remark-html";
import remarkParse from "remark-parse/lib";
import { unified } from "unified";

import Layout from "@components/layout";

const Post: NextPage<{ post: string }> = ({ post }) => {
  return (
    <Layout canGoBack>
      <div className="container">{post}</div>
    </Layout>
  );
};

export const getStaticPaths = () => {
  const files = readdirSync("./posts").map((fileName) => {
    const [slug] = fileName.split(".");
    return {
      params: {
        slug,
      },
    };
  });
  return {
    paths: files,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async (context) => {
  const { content } = matter.read(`./posts/${context.params?.slug}.md`);
  const { value } = await unified().use(remarkParse).use(remarkHtml).process(content);
  return {
    props: {
      post: value,
    },
  };
};

export default Post;
