import type { NextPage } from "next";

import Layout from "@components/layout";
import Button from "@components/button";
import TextArea from "@components/textarea";

const Write: NextPage = () => {
  return (
    <Layout canGoBack title="Write Post">
      <div className="container pt-5 pb-5">
        <form className="space-y-5">
          <TextArea required placeholder="Ask a question!" />
          <Button type="submit" text="Submit" />
        </form>
      </div>
    </Layout>
  );
};

export default Write;
