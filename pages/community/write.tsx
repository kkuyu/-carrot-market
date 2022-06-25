import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { Post } from "@prisma/client";

import useCoords from "@libs/client/useCoords";
import useMutation from "@libs/client/useMutation";

import Layout from "@components/layout";
import Button from "@components/button";
import TextArea from "@components/textarea";

interface WriteForm {
  question: string;
}

interface MutationResult {
  success: boolean;
  post: Post;
}

const Write: NextPage = () => {
  const router = useRouter();
  const { register, handleSubmit } = useForm<WriteForm>();

  const { state, latitude, longitude } = useCoords();
  const [post, { loading, data }] = useMutation<MutationResult>("/api/posts");

  const onValid = (data: WriteForm) => {
    if (loading) return;
    post({ ...data, latitude, longitude });
  };

  useEffect(() => {
    if (data && data.success) {
      router.push(`/community/${data.post.id}`);
    }
  }, [data, router]);

  return (
    <Layout hasBackBtn title="Write Post">
      <div className="container pt-5 pb-5">
        <div className="flex items-center justify-end w-full text-xs font-semibold text-gray-500">
          <span className="flex-none">Location permission: {state}</span>
        </div>
        <form onSubmit={handleSubmit(onValid)} noValidate className="mt-1 space-y-5">
          <TextArea
            register={register("question", {
              required: true,
              minLength: 10,
            })}
            required
            minLength="10"
            name="question"
            placeholder="Ask a question!"
          />
          <Button type="submit" text={loading ? "Loading" : "Submit"} disabled={loading} />
        </form>
      </div>
    </Layout>
  );
};

export default Write;
