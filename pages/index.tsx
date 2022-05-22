import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <div className="grid gap-10 px-20 py-20 bg-slate-400">
      <div className="p-6 bg-white rounded-3xl shadow-xl">
        <strong className="block font-semibold text-3xl">Select Item</strong>
        <div className="mt-4">
          <div className="flex justify-between">
            <strong className="font-normal text-gray-500">Grey Chair</strong>
            <span className="font-semibold">$19</span>
          </div>
          <div className="flex justify-between mt-1">
            <strong className="font-normal text-gray-500">Grey Chair</strong>
            <span className="font-semibold">$19</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t-2 border-dashed">
          <div className="flex justify-between">
            <strong className="font-normal">Total</strong>
            <span className="font-semibold">$10</span>
          </div>
        </div>
        <div className="mt-6">
          <button className="mx-auto block w-1/2 text-center text-white p-2 bg-blue-500 rounded-xl">Checkout</button>
        </div>
      </div>
      <div className="bg-white overflow-hidden rounded-3xl shadow-xl">
        <div className="p-6 pb-14 bg-blue-500">
          <span className="text-2xl text-white">Profile</span>
        </div>
        <div className="relative -top-5 p-6 bg-white rounded-3xl">
          <div className="relative -top-16 flex items-end justify-between">
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-500">Orders</span>
              <span className="font-medium">340</span>
            </div>
            <div className="w-24 h-24 bg-red-400 rounded-full" />
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-500">Spent</span>
              <span className="font-medium">$340</span>
            </div>
          </div>
          <div className="relative -mt-10 -mb-5 flex flex-col items-center">
            <span className="text-lg font-medium">Tony Molloy</span>
            <span className="text-sm text-gray-500">미국</span>
          </div>
        </div>
      </div>
      <div className="p-10 bg-white rounded-2xl shadow-xl"></div>
      <div className="p-10 bg-white rounded-2xl shadow-xl"></div>
    </div>
  );
};

export default Home;
