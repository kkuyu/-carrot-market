import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { Stream } from "@prisma/client";

import useMutation from "@libs/client/useMutation";

import Layout from "@components/layout";
import Button from "@components/button";
import Input from "@components/input";
import TextArea from "@components/textarea";

interface CreateForm {
  name: string;
  price: number;
  description: string;
}

interface CreateResponse {
  success: boolean;
  stream: Stream;
}

const Create: NextPage = () => {
  const router = useRouter();
  const { register, handleSubmit } = useForm<CreateForm>();

  const [createStream, { loading, data }] = useMutation<CreateResponse>("/api/streams");

  const onValid = (data: CreateForm) => {
    if (loading) return;
    createStream(data);
  };

  useEffect(() => {
    if (data && data.success) {
      router.push(`/streams/${data.stream.id}`);
    }
  }, [data, router]);

  return (
    <Layout hasBackBtn title="Go Live Stream">
      <div className="container pt-5 pb-5">
        <form onSubmit={handleSubmit(onValid)} noValidate className="space-y-5">
          <Input register={register("name", { required: true })} required label="Name" name="name" type="text" />
          <Input register={register("price", { required: true, valueAsNumber: true })} required label="Price" placeholder="0.00" name="price" type="text" kind="price" />
          <TextArea
            register={register("description", {
              required: true,
              minLength: 10,
            })}
            required
            minLength="10"
            label="Description"
            name="description"
          />
          <Button type="submit" text={loading ? "Loading" : "Go live"} />
        </form>
      </div>
    </Layout>
  );
};

export default Create;
