import Head from "next/head";

import React from "react";
import { cls } from "@libs/utils";

import Header, { HeaderProps } from "@components/layouts/header";
import NavBar, { NavBarProps } from "@components/layouts/navBar";

interface LayoutProps extends HeaderProps, NavBarProps {
  title?: string;
  seoTitle?: string;
  children: React.ReactNode;
}

const Layout = ({ title, seoTitle, headerUtils = [], navBarUtils = [], children }: LayoutProps) => {
  return (
    <div>
      <Head>
        <title>{seoTitle || title ? `${seoTitle || title}  | Carrot Market` : "Carrot Market"}</title>
      </Head>
      <Header title={title} headerUtils={headerUtils} />
      <div className={cls("main", headerUtils.length ? "pt-12" : "", navBarUtils.length ? "pb-16" : "")}>{children}</div>
      <NavBar navBarUtils={navBarUtils} />
    </div>
  );
};

export default Layout;
