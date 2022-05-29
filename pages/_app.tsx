import "../styles/globals.css";

import Head from "next/head";
import type { AppProps } from "next/app";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css" />
      </Head>
      <div className="mx-auto w-full max-w-xl">
        <Component {...pageProps} />
      </div>
    </>
  );
}

export default MyApp;
