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

const SiteLayout = ({ children }: SiteLayoutProps) => {
  return (
    <>
      <MetaWrapper defaultMetaState={children?.props?.defaultLayout?.meta || {}} />
      <HeaderWrapper defaultHeaderState={children?.props?.defaultLayout?.header || {}} />
      <div className="main h-min-full-screen">{children}</div>
      <NavBarWrapper defaultNavBarState={children?.props?.defaultLayout?.navBar || {}} />
    </>
  );
};

export const getLayout = (page: React.ReactElement) => <SiteLayout>{page}</SiteLayout>;

export default SiteLayout;
