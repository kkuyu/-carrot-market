import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { NextPage } from "next";
import { useRouter } from "next/router";

import { getRandomName } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";

import Layout from "@components/layout";
import Button from "@components/button";
import Input from "@components/input";

interface EditProfileForm {
  avatar?: FileList;
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

  const { register, setValue, setError, clearErrors, formState, handleSubmit, watch } = useForm<EditProfileForm>();

  const { user } = useUser();
  const [editProfile, { data, loading }] = useMutation<EditProfileResponse>("/api/users/my");

  const onValid = async (data: EditProfileForm) => {
    if (loading) return;
    if (!data.email && !data.phone) {
      return setError("formError", { message: "Email OR Phone number are required. You need to choose one." });
    }

    const { avatar, ...restData } = data;
    let avatarId = "";
    if (avatar && avatar.length > 0) {
      const { uploadURL } = await (await fetch(`/api/files`)).json();
      const form = new FormData();
      form.append("file", avatar[0], user?.id + "");
      const { result } = await (
        await fetch(uploadURL, {
          method: "POST",
          body: form,
        })
      ).json();
      avatarId = result.id;
    }
    editProfile({
      ...restData,
      ...(avatarId && { avatarId }),
    });
  };

  const onChange = () => {
    if (formState.errors.formError?.message) {
      clearErrors("formError");
    }
  };

  const onNameGeneratorClick = () => {
    setValue("name", getRandomName());
  };

  const [avatarPreview, setAvatarPreview] = useState("");
  const avatar = watch("avatar");
  useEffect(() => {
    if (avatar && avatar.length > 0) {
      const file = avatar[0];
      setAvatarPreview(URL.createObjectURL(file));
    }
  }, [avatar]);

  useEffect(() => {
    if (user?.name) setValue("name", user.name);
    if (user?.email) setValue("email", user.email);
    if (user?.phone) setValue("phone", user.phone);
    if (user?.avatar) setAvatarPreview(`https://imagedelivery.net/QG2MZZsP6KQnt-Ryd54wog/${user?.avatar}/avatar`);
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
      router.push("/profile");
    }
  }, [data, router]);

  return (
    <Layout canGoBack title="Edit Profile">
      <div className="container pt-5 pb-5">
        <form onChange={onChange} onSubmit={handleSubmit(onValid)} noValidate className="space-y-4">
          <div className="flex items-center space-x-3">
            {avatarPreview ? <img src={avatarPreview} className="flex-none w-14 h-14 rounded-full bg-slate-500" /> : <div className="flex-none w-14 h-14 rounded-full bg-slate-500" />}
            <label htmlFor="picture" className="px-3 py-2 border border-gray-300 rounded-md shadow-sm">
              <span className="text-sm font-semibold text-gray-700">Change photo</span>
              <input {...register("avatar")} type="file" id="picture" className="a11y-hidden" name="avatar" accept="image/*" />
            </label>
          </div>
          <Input
            register={register("name", { required: true })}
            required
            label="Name"
            name="name"
            type="text"
            appendButtons={
              <button
                onClick={onNameGeneratorClick}
                type="button"
                className="flex items-center justify-center p-2 text-gray-400 rounded-md outline-none hover:bg-gray-100 hover:text-gray-500 focus:bg-gray-100 focus:text-gray-500"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  ></path>
                </svg>
              </button>
            }
          />
          <Input register={register("email")} label="Email address" name="email" type="email" />
          <Input register={register("phone")} label="Phone number" name="phone" type="number" kind="text" />

          {formState.errors ? <span className="block mt-2 text-sm font-bold text-red-500">{formState.errors.formError?.message}</span> : null}
          <Button type="submit" text={loading ? "Loading" : "Update profile"} disabled={loading} />
        </form>
      </div>
    </Layout>
  );
};

export default EditProfile;
