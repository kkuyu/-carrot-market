import type { NextPage } from "next";

import Layout from "../../components/layout";
import Message from "../../components/message";

const StreamDetail: NextPage = () => {
  return (
    <Layout canGoBack>
      <div className="container pt-5 pb-16">
        <div>
          <div className="w-full aspect-video bg-slate-300 rounded-md shadow-md" />
          <h3 className="mt-5 text-2xl font-semibold text-gray-800">Let&apos;s try carrot</h3>
        </div>
        <div className="mt-4 pt-4 -mx-4 px-4 h-[50vh] border-t overflow-y-auto">
          <div className="space-y-4">
            <Message message="Lorem ipsum dolor sit" />
            <Message message="amet consectetur adipisicing elit." reversed />
            <Message message="Odit neque fuga" />
            <Message message="ex perspiciatis quibusdam totam molestiae ducimus dignissimos fugiat impedit id" />
            <Message message="aspernatur consequuntur quas accusantium et dolore amet!" reversed />
            <Message message="At, accusamus?" />
          </div>
          <div className="fixed bottom-0 left-0 w-full">
            <div className="mx-auto w-full max-w-xl bg-white border-t">
              <form className="relative px-2 py-2">
                <input type="text" className="w-full pl-3.5 pr-10 py-1.5 border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500" />
                <div className="absolute top-1/2 right-4 -translate-y-1/2">
                  <button
                    type="submit"
                    className="flex items-center justify-center w-6 h-6 text-sm text-white bg-orange-500 rounded-full
                focus:outline-none hover:bg-orange-600 focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    &rarr;
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StreamDetail;
