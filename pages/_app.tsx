import type { AppProps } from "next/app";
import Script from "next/script";

import { RecoilRoot } from "recoil";
import { SWRConfig } from "swr";
import "../styles/globals.css";

import CommonProvider from "@components/commons/commonProvider";
import Header from "@components/layouts/header";
import NavBar from "@components/layouts/navBar";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <SWRConfig value={{ fetcher: (url: string) => fetch(url).then((response) => response.json()) }}>
        <RecoilRoot>
          <CommonProvider>
            <Header />
            <div className="main">
              <Component {...pageProps} />
            </div>
            <NavBar />
          </CommonProvider>
        </RecoilRoot>
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

export default MyApp;
