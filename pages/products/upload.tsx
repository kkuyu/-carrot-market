import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSetRecoilState } from "recoil";
// @libs
import { PageLayout } from "@libs/states";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
// @api
import { PostProductsResponse } from "@api/products";
import { GetFileResponse, ImageDeliveryResponse } from "@api/files";
// @components
import EditProduct, { EditProductTypes } from "@components/forms/editProduct";

const ProductUpload: NextPage = () => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { user, currentAddr } = useUser();

  const formData = useForm<EditProductTypes>();

  const [photoLoading, setPhotoLoading] = useState(false);
  const [uploadProduct, { loading, data }] = useMutation<PostProductsResponse>("/api/products", {
    onSuccess: (data) => {
      setPhotoLoading(false);
      router.replace(`/products/${data.product.id}`);
    },
    onError: (data) => {
      setPhotoLoading(false);
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  const submitUploadProduct = async ({ photos: _photos, ...data }: EditProductTypes) => {
    if (loading || photoLoading) return;

    if (!_photos || !_photos.length) {
      uploadProduct({ ...data, photos: "", ...currentAddr });
      return;
    }

    let photos = [];
    setPhotoLoading(true);

    for (let index = 0; index < _photos.length; index++) {
      // new photo
      const form = new FormData();
      form.append("file", _photos[index], `${user?.id}-${index}-${_photos[index].name}`);
      // get cloudflare file data
      const fileResponse: GetFileResponse = await (await fetch("/api/files")).json();
      if (!fileResponse.success) {
        const error = new Error("GetFileError");
        error.name = "GetFileError";
        console.error(error);
        return;
      }
      // upload image delivery
      const imageResponse: ImageDeliveryResponse = await (await fetch(fileResponse.uploadURL, { method: "POST", body: form })).json();
      if (!imageResponse.success) {
        const error = new Error("UploadFileError");
        error.name = "UploadFileError";
        console.error(error);
        return;
      }
      photos.push(imageResponse.result.id);
    }

    uploadProduct({ ...data, photos: photos.join(","), ...currentAddr });
  };

  useEffect(() => {
    setLayout(() => ({
      title: "중고거래 글 쓰기",
      header: {
        headerUtils: ["back", "title", "submit"],
        submitId: "upload-product",
      },
      navBar: {
        navBarUtils: [],
      },
    }));
  }, []);

  return (
    <div className="container pt-5 pb-5">
      <EditProduct formId="upload-product" formData={formData} onValid={submitUploadProduct} isLoading={loading || photoLoading} emdPosNm={currentAddr?.emdPosNm || ""} />
    </div>
  );
};

export const getServerSideProps = withSsrSession(async ({ req }) => {
  // getUser
  const ssrUser = await getSsrUser(req);

  // redirect: welcome
  if (!ssrUser.profile && !ssrUser.dummyProfile) {
    return {
      redirect: {
        permanent: false,
        destination: `/welcome`,
      },
    };
  }

  // redirect: join
  if (ssrUser.dummyProfile) {
    return {
      redirect: {
        permanent: false,
        destination: `/join?addrNm=${ssrUser?.currentAddr?.emdAddrNm}`,
      },
    };
  }

  return {
    props: {},
  };
});

export default ProductUpload;
