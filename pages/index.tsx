import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <div className="grid gap-10 px-10 py-20 bg-slate-400">
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
      <div className="p-10 bg-white rounded-2xl shadow-xl"></div>
      <div className="p-10 bg-white rounded-2xl shadow-xl"></div>
      <div className="p-10 bg-white rounded-2xl shadow-xl"></div>
    </div>
  );
};

export default Home;
