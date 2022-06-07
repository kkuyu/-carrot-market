import type { NextPage } from "next";

import Layout from "@components/layout";
import Button from "@components/button";
import Input from "@components/input";
import TextArea from "@components/textarea";

const Create: NextPage = () => {
  return (
    <Layout canGoBack title="Go Live">
      <div className="container pt-5 pb-5">
        <form className="space-y-5">
          <Input required label="Name" name="name" type="text" />
          <Input required label="Price" placeholder="0.00" name="price" type="text" kind="price" />
          <TextArea name="description" label="Description" />
          <Button type="submit" text="Go live" />
        </form>
      </div>
    </Layout>
  );
};

export default Create;
