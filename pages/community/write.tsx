import type { NextPage } from "next";

const Write: NextPage = () => {
  return (
    <form className="px-4 py-10">
      <div className="mt-5">
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
  );
};

export default Write;
