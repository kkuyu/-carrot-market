import { readFileSync } from "fs";
import { NextPage } from "next";

const Post: NextPage = () => {
  return <div>Hello</div>;
};

export const getStaticProps = async () => {
  return {
    props: {},
  };
};

export default Post;
