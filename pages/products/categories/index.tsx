import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";
import { useEffect } from "react";
import type { ReactElement, HTMLAttributes } from "react";
// @libs
import useLayouts from "@libs/client/useLayouts";
// @api
import { ProductCategoryEnum, ProductCategory } from "@api/products/types";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import Buttons from "@components/buttons";

const ProductsCategoryPage: NextPage = () => {
  const { changeLayout } = useLayouts();

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
        {ProductCategory.map((category) => (
          <li key={category.value} className="w-1/2 min-w-[10rem]">
            <Link href={`/categories/${category.value}`} passHref>
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
  return <ProductsCategoryPage />;
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
