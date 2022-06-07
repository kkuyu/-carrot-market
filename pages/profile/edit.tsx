import type { NextPage } from "next";

import Layout from "@components/layout";
import Button from "@components/button";
import Input from "@components/input";

const EditProfile: NextPage = () => {
  return (
    <Layout canGoBack title="Edit Profile">
      <div className="container pt-5 pb-5">
        <form className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-none w-14 h-14 bg-slate-500 rounded-full" />
            <label htmlFor="picture" className="px-3 py-2 border border-gray-300 rounded-md shadow-sm">
              <span className="text-sm font-semibold text-gray-700">Change photo</span>
              <input type="file" id="picture" className="a11y-hidden" name="" accept="image/*" />
            </label>
          </div>
          <Input required label="Email address" name="email" type="email" />
          <Input required label="Phone number" name="phone" type="number" kind="phone" />
          <Button type="submit" text="Update profile" />
        </form>
      </div>
    </Layout>
  );
};

export default EditProfile;
