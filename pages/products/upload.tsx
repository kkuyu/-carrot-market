import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { Product } from "@prisma/client";

import useMutation from "@libs/client/useMutation";

import Layout from "@components/layout";
import Button from "@components/button";
import Input from "@components/input";
import TextArea from "@components/textarea";

interface UploadProductForm {
  name: string;
  price: number;
  description: string;
}

interface MutationResult {
  success: boolean;
  product: Product;
}

const Upload: NextPage = () => {
  const router = useRouter();
  const { register, handleSubmit } = useForm<UploadProductForm>();

  const [uploadProduct, { loading, data }] = useMutation<MutationResult>("/api/products");

  const onValid = (data: UploadProductForm) => {
    if (loading) return;
    uploadProduct(data);
  };

  useEffect(() => {
    if (data && data.success) {
      router.push(`/products/${data.product.id}`);
    }
  }, [data, router]);

  return (
    <Layout canGoBack title="Upload Product">
      <div className="container pt-5 pb-5">
        <form onSubmit={handleSubmit(onValid)} noValidate className="space-y-5">
          <div>
            <label className="w-full flex items-center justify-center h-48 text-gray-600 border-2 border-dashed border-gray-300 rounded-md hover:text-orange-500 hover:border-orange-500">
              <svg className="h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <input className="a11y-hidden" type="file" />
            </label>
          </div>
          <Input register={register("name", { required: true })} required label="Name" name="name" type="text" />
          <Input register={register("price", { required: true })} required label="Price" placeholder="0.00" name="price" type="text" kind="price" />
          <TextArea
            register={register("description", {
              required: true,
              minLength: 10,
            })}
            required
            minLength="10"
            name="description"
            label="Description"
          />
          <Button type="submit" text={loading ? "Loading" : "Upload product"} disabled={loading} />
        </form>
      </div>
    </Layout>
  );
};

export default Upload;
