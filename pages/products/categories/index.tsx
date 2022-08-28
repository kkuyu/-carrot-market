import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";
import { useEffect } from "react";
import { ProductCategory } from "@prisma/client";
// @libs
import { getCategory } from "@libs/utils";
import useLayouts from "@libs/client/useLayouts";
// @api
import { ProductCategories } from "@api/products/types";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import Buttons from "@components/buttons";

const ProductsCategoryIndexPage: NextPage = () => {
  const { changeLayout } = useLayouts();
  const productCategories = Object.values(ProductCategory).map((category) => getCategory<ProductCategories>(category)!);

  useEffect(() => {
    changeLayout({
      meta: {},
      header: {},
      navBar: {},
    });
  }, []);

  return (
    <div className="container pt-3 pb-3">
      <ul className="flex flex-wrap">
        {productCategories.map((category) => (
          <li key={category.value} className="w-1/2 min-w-[10rem]">
            <Link href={`/products/categories/${category.kebabValue}`} passHref>
              <Buttons tag="a" sort="text-link" size="base" status="unset" className="w-full">
                <span className="inline-flex items-center justify-center w-8 h-8">{category.emoji}</span>
                <span>{category.text}</span>
              </Buttons>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

const Page: NextPageWithLayout = () => {
  return <ProductsCategoryIndexPage />;
};

Page.getLayout = getLayout;

export const getStaticProps: GetStaticProps = async () => {
  // defaultLayout
  const defaultLayout = {
    meta: {
      title: "중고거래 카테고리",
    },
    header: {
      title: "중고거래 카테고리",
      titleTag: "h1",
      utils: ["back", "title"],
    },
    navBar: {
      utils: [],
    },
  };

  return {
    props: {
      defaultLayout,
    },
  };
};

export default Page;
