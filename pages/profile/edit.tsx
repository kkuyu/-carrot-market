import type { NextPage } from "next";

const EditProfile: NextPage = () => {
  return (
    <div className="container">
      <form className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="flex-none w-14 h-14 bg-slate-500 rounded-full" />
          <label htmlFor="picture" className="px-3 py-2 border border-gray-300 rounded-md shadow-sm">
            <span className="text-sm font-medium text-gray-700">Change photo</span>
            <input type="file" id="picture" className="a11y-hidden" name="" accept="image/*" />
          </label>
        </div>
        <div className="flex flex-col space-y-1">
          <label htmlFor="email" className="text-sm font-semibold text-gray-700">
            Email address
          </label>
          <div>
            <input
              type="email"
              id="email"
              required
              className="w-full px-3 py-2 appearance-none border border-gray-300 rounded-md shadow-sm placeholder-gray-400
                focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>
        <div className="flex flex-col space-y-1">
          <label htmlFor="phone" className="text-sm font-semibold text-gray-700">
            Phone number
          </label>
          <div className="flex rounded-md shadow-sm">
            <span className="px-3 flex items-center justify-center text-sm text-gray-500 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md select-none">+82</span>
            <input
              type="number"
              id="input"
              className="w-full px-3 py-2 appearance-none border border-gray-300 rounded-md rounded-l-none shadow-sm placeholder-gray-400
                focus:border-orange-500 focus:outline-none focus:ring-orange-500"
              required
            />
          </div>
        </div>
        <div>
          <button
            className=" w-full px-4 py-2 text-sm font-semibold text-white bg-orange-500 border border-transparent rounded-md shadow-sm
            hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Update profile
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;
