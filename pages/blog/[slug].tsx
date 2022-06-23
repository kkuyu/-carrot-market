import { GetStaticPaths, GetStaticProps, NextPage } from "next";

import { readdirSync } from "fs";
import matter from "gray-matter";
import remarkHtml from "remark-html";
import remarkParse from "remark-parse/lib";
import { unified } from "unified";
import { PostData } from ".";

import Layout from "@components/layout";

const Post: NextPage<{ postHtml: string; postData: PostData }> = ({ postHtml, postData }) => {
  return (
    <Layout canGoBack seoTitle={postData.title} title={postData.title}>
      <div className="container">
        <div className="blog-post-content" dangerouslySetInnerHTML={{ __html: postHtml }} />
      </div>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = () => {
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
  const { content, data } = matter.read(`./posts/${context.params?.slug}.md`);
  const { value } = await unified().use(remarkParse).use(remarkHtml).process(content);
  return {
    props: {
      postHtml: value,
      postData: data,
    },
  };
};

export default Post;
