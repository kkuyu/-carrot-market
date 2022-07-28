import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSetRecoilState } from "recoil";
// @libs
import { PageLayout } from "@libs/states";
import { convertPhotoToFile } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";
import client from "@libs/server/client";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetProductsDetailResponse } from "@api/products/[id]";
import { PostProductsUpdateResponse } from "@api/products/[id]/update";
import { GetFileResponse, ImageDeliveryResponse } from "@api/files";
// @components
import EditProduct, { EditProductTypes } from "@components/forms/editProduct";

const ProductUpload: NextPage<{
  staticProps: {
    product: GetProductsDetailResponse["product"];
  };
}> = ({ staticProps }) => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { user } = useUser();

  const formData = useForm<EditProductTypes>({
    defaultValues: {
      category: staticProps?.product?.category as EditProductTypes["category"],
      name: staticProps?.product?.name,
      description: staticProps?.product?.description,
      price: staticProps?.product?.price,
    },
  });

  const [photoLoading, setPhotoLoading] = useState(false);
  const [editProduct, { loading }] = useMutation<PostProductsUpdateResponse>(`/api/products/${router.query.id}/update`, {
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

  const setDefaultPhotos = async () => {
    if (!staticProps?.product || !staticProps?.product?.photos) return;

    const transfer = new DataTransfer();
    const photos = staticProps.product.photos.length ? staticProps.product.photos.split(",") : [];
    for (let index = 0; index < photos.length; index++) {
      const file = await convertPhotoToFile(photos[index]);
      if (file !== null) transfer.items.add(file);
    }

    formData.setValue("photos", transfer.files);
  };

  const submitEditProduct = async ({ photos: _photos, ...data }: EditProductTypes) => {
    if (loading || photoLoading) return;

    if (!_photos || !_photos.length) {
      editProduct({ ...data, photos: "" });
      return;
    }

    let photos = [];
    setPhotoLoading(true);

    for (let index = 0; index < _photos.length; index++) {
      try {
        // same photo
        if (staticProps?.product?.photos && staticProps.product.photos.includes(_photos[index].name)) {
          photos.push(_photos[index].name);
          continue;
        }
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
      } catch {
        console.error(`Failed Upload: ${_photos[index].name}`);
      }
    }

    editProduct({ photos: photos.join(","), ...data });
  };

  useEffect(() => {
    setDefaultPhotos();

    setLayout(() => ({
      title: "중고거래 글 수정",
      header: {
        headerUtils: ["back", "title", "submit"],
        submitId: "edit-product",
      },
      navBar: {
        navBarUtils: [],
      },
    }));
  }, []);

  return (
    <div className="container pt-5 pb-5">
      <EditProduct formId="edit-product" formData={formData} onValid={submitEditProduct} isLoading={loading || photoLoading} emdPosNm={staticProps?.product?.emdPosNm || ""} />
    </div>
  );
};

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
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

  const productId = params?.id?.toString();

  // invalid params: productId
  if (!productId || isNaN(+productId)) {
    return {
      redirect: {
        permanent: false,
        destination: `/`,
      },
    };
  }

  // find product
  const product = await client.product.findUnique({
    where: {
      id: +productId,
    },
  });

  // invalid product: not found
  if (!product) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  // invalid product: not my product
  if (product.userId !== ssrUser?.profile?.id) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  return {
    props: {
      staticProps: {
        product: JSON.parse(JSON.stringify(product || {})),
      },
    },
  };
});

export default ProductUpload;
