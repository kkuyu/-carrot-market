import type { NextPage } from "next";

import Layout from "../../components/layout";

const Upload: NextPage = () => {
  return (
    <Layout canGoBack>
      <div className="container pt-5 pb-5">
        <form className="space-y-5">
          <div>
            <label className="w-full flex items-center justify-center h-48 text-gray-600 border-2 border-dashed border-gray-300 rounded-md hover:text-orange-500 hover:border-orange-500">
              <svg className="h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <input className="a11y-hidden" type="file" />
            </label>
          </div>
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
              Upload product
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default Upload;
