import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { NextPage } from "next";
import { useRouter } from "next/router";

import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";

import Layout from "@components/layout";
import Button from "@components/button";
import Input from "@components/input";

interface EditProfileForm {
  name: string;
  email?: string;
  phone?: string;
  formError: string;
}

interface EditProfileResponse {
  success: boolean;
  error?: string;
}

const EditProfile: NextPage = () => {
  const router = useRouter();

  const { register, setValue, setError, clearErrors, formState, handleSubmit } = useForm<EditProfileForm>();

  const { user } = useUser();
  const [editProfile, { data, loading }] = useMutation<EditProfileResponse>("/api/users/my");

  const onValid = (data: EditProfileForm) => {
    if (loading) return;
    if (!data.email && !data.phone) {
      return setError("formError", { message: "Email OR Phone number are required. You need to choose one." });
    }
    editProfile(data);
  };

  const onChange = () => {
    if (formState.errors) {
      clearErrors("formError");
    }
  };

  useEffect(() => {
    if (user?.name) setValue("name", user?.name);
    if (user?.email) setValue("email", user.email);
    if (user?.phone) setValue("phone", user.phone);
  }, [user, setValue]);

  useEffect(() => {
    if (data && !data.success) {
      if (data?.error) {
        setError("formError", { message: data.error });
      }
    }
  }, [data, setError]);

  useEffect(() => {
    if (data && data.success) {
      router.push("/users/profile");
    }
  }, [data, router]);

  return (
    <Layout canGoBack title="Edit Profile">
      <div className="container pt-5 pb-5">
        <form
          onChange={onChange}
          onSubmit={(e) => {
            e.preventDefault();
            clearErrors("formError");
            handleSubmit(onValid)(e);
          }}
          noValidate
          className="space-y-4"
        >
          <div className="flex items-center space-x-3">
            <div className="flex-none w-14 h-14 bg-slate-500 rounded-full" />
            <label htmlFor="picture" className="px-3 py-2 border border-gray-300 rounded-md shadow-sm">
              <span className="text-sm font-semibold text-gray-700">Change photo</span>
              <input type="file" id="picture" className="a11y-hidden" name="" accept="image/*" />
            </label>
          </div>
          <Input register={register("name", { required: true })} required label="name" name="name" type="text" />
          <Input register={register("email")} label="Email address" name="email" type="email" />
          <Input register={register("phone")} label="Phone number" name="phone" type="number" kind="phone" />
          {formState.errors ? <span className="block mt-2 text-sm font-bold text-red-500">{formState.errors.formError?.message}</span> : null}
          <Button type="submit" text={loading ? "Loading" : "Update profile"} disabled={loading} />
        </form>
      </div>
    </Layout>
  );
};

export default EditProfile;
