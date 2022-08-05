import type { AppProps } from "next/app";
import Script from "next/script";
import { SWRConfig } from "swr";
import "../styles/globals.css";
// @components
import CommonProvider from "@components/commons/commonProvider";
import LayoutProvider from "@components/layouts/layoutProvider";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <SWRConfig value={{ fetcher: (url: string) => fetch(url).then((response) => response.json()) }}>
        <CommonProvider>
          <LayoutProvider>
            <div className="main h-min-full-screen">
              <Component {...pageProps} />
            </div>
          </LayoutProvider>
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

export default MyApp;
