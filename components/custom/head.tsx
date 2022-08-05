import Head from "next/head";

interface CustomHeadProps {
  title?: string;
}

const CustomHead = ({ title = "" }: CustomHeadProps) => {
  return (
    <Head>
      <title>{`${title ? `${title} | ` : ""}Carrot Market`}</title>
    </Head>
  );
};

export default CustomHead;
