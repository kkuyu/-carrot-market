import { readdirSync } from "fs";
import { NextPage } from "next";

const Post: NextPage = () => {
  return <div>Hello</div>;
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

export const getStaticProps = async () => {
  return {
    props: {},
  };
};

export default Post;
