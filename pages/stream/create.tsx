import type { NextPage } from "next";

import Layout from "../../components/layout";

const Create: NextPage = () => {
  return (
    <Layout canGoBack>
      <div className="container pt-5 pb-5">
        <form className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
              Name
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="name"
                className="w-full px-3 py-2 appearance-none border border-gray-300 rounded-md shadow-sm placeholder-gray-400
                focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-semibold text-gray-700">
              Price
            </label>
            <div className="relative mt-1 flex items-center">
              <div className="absolute left-0 flex items-center justify-center pl-3 pointer-events-none">
                <span className="text-sm text-gray-500">$</span>
              </div>
              <input
                type="text"
                id="price"
                placeholder="0.00"
                className="w-full px-3 pl-7 py-2 appearance-none border border-gray-300 rounded-md shadow-sm placeholder-gray-400
              focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              />
              <div className="absolute right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500">USD</span>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700">Description</label>
            <div className="mt-1">
              <textarea
                className="w-full shadow-sm border border-gray-300 rounded-md shadow-sm
              focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                rows={4}
              />
            </div>
          </div>
          <div>
            <button
              className="w-full px-4 py-2 text-sm font-semibold text-white bg-orange-500 border border-transparent rounded-md shadow-sm
        hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Go live
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default Create;
