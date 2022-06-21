import type { AppProps } from "next/app";
import Script from "next/script";
import { SWRConfig } from "swr";

import "../styles/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <SWRConfig value={{ fetcher: (url: string) => fetch(url).then((response) => response.json()) }}>
        <div className="mx-auto w-full max-w-xl">
          <Component {...pageProps} />
        </div>
      </SWRConfig>
      <Script src="https://www.jsdelivr.com/package/npm/vanillajs" strategy="lazyOnload" />
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
