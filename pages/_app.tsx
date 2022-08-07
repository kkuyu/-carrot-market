import type { NextPage } from "next";
import type { AppProps } from "next/app";
import Script from "next/script";
import { ReactElement, ReactNode } from "react";
import { SWRConfig } from "swr";
import "../styles/globals.css";
// @components
import CommonProvider from "@components/commons/commonProvider";
import LayoutProvider from "@components/layouts/layoutProvider";
import SiteLayout from "@components/layouts/case/siteLayout";

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

export type AppPropsWithLayout<P> = AppProps<P> & {
  Component: NextPageWithLayout<P>;
};

function CustomApp({ Component, pageProps }: AppPropsWithLayout<{}>) {
  const getLayout = Component.getLayout || ((page: ReactElement) => <SiteLayout>{page}</SiteLayout>);

  return (
    <>
      <SWRConfig value={{ fetcher: (url: string) => fetch(url).then((response) => response.json()) }}>
        <CommonProvider>
          <LayoutProvider>{getLayout(<Component {...pageProps} />)}</LayoutProvider>
        </CommonProvider>
      </SWRConfig>
      {/* todo: remove */}
      <Script src="https://www.jsdelivr.com/package/npm/vanillajs" strategy="lazyOnload" />
      {/* todo: remove */}
      <Script
        src="https://www.jsdelivr.com/package/npm/vanillajs"
        onLoad={() => {
          console.log("Script test");
        }}
      />
    </>
  );
}

export default CustomApp;
