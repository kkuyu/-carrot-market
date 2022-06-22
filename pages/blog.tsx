import { NextPage } from "next";

import Layout from "@components/layout";

const Blog: NextPage = () => {
  return (
    <Layout title="Blog">
      <h1 className="font-semibold text-lg">Latest Posts:</h1>
      <ul></ul>
    </Layout>
  );
};

export default Blog;
