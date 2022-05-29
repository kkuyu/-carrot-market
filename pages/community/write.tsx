import type { NextPage } from "next";

import Layout from "../../components/layout";

const Write: NextPage = () => {
  return (
    <Layout canGoBack>
      <div className="container pt-5 pb-5">
        <form>
          <div>
            <textarea
              className="w-full shadow-sm border border-gray-300 rounded-md shadow-sm
            focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              rows={4}
              placeholder="Ask a question!"
            />
          </div>
          <div className="mt-5">
            <button
              className="w-full px-4 py-2 text-sm font-semibold text-white bg-orange-500 border border-transparent rounded-md shadow-sm
      hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default Write;
