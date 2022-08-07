import Head from "next/head";
// @components
import { MetaOptions } from "@components/layouts/meta/metaWrapper";

export interface MetaProps extends MetaOptions {}

const Meta = ({ title = "", description = "" }: MetaProps) => {
  return (
    <>
      <Head>
        <title>{`${title ? `${title} | ` : ""}당신 근처의 당근마켓`}</title>
        <meta name="description" content={`${description ? `${description} | ` : ""}Carrot Market`}></meta>
      </Head>
    </>
  );
};

export default Meta;
