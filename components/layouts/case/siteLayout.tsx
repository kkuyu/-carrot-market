import React from "react";
// @components
import MetaWrapper, { MetaOptions } from "@components/layouts/meta/metaWrapper";
import HeaderWrapper, { HeaderOptions } from "@components/layouts/header/headerWrapper";
import NavBarWrapper, { NavBarOptions } from "@components/layouts/navBar/navBarWrapper";

export interface SiteLayoutProps {
  children: React.ReactElement<{
    defaultLayout?: {
      meta?: MetaOptions;
      header?: HeaderOptions;
      navBar?: NavBarOptions;
    };
  }>;
}

const SiteLayout = (props: SiteLayoutProps) => {
  const { children } = props;
  return (
    <>
      <MetaWrapper defaultMetaState={children?.props?.defaultLayout?.meta || null} />
      <HeaderWrapper defaultHeaderState={children?.props?.defaultLayout?.header || null} />
      <div className="main h-min-full-screen">{children}</div>
      <NavBarWrapper defaultNavBarState={children?.props?.defaultLayout?.navBar || null} />
    </>
  );
};

export const getLayout = (page: React.ReactElement) => <SiteLayout>{page}</SiteLayout>;

export default SiteLayout;
