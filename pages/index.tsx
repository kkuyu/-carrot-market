import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <div
      className="min-h-screen grid gap-10 px-20 py-20 bg-slate-400
      xl:place-content-center xl:grid-cols-3 lg:grid-cols-2"
    >
      <div
        className="p-6 flex flex-col justify-between bg-white rounded-3xl shadow-xl
        dark:bg-black"
      >
        <strong className="block font-semibold text-2xl dark:text-white">Select Item</strong>
        <div className="mt-4">
          <ul>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="my-2 odd:bg-blue-50 even:bg-yellow-50 first:bg-teal-50 last:bg-amber-50">
                <div className="flex justify-between">
                  <strong className="font-normal text-gray-500 dark:text-gray-100">Grey Chair</strong>
                  <span className="font-semibold dark:text-white">$19</span>
                </div>
              </div>
            ))}
          </ul>
          <div className="mt-4">
            <ul>
              {["a", "b", "c", ""].map((c, i) => (
                <li className="my-2 bg-red-100 empty:hidden" key={i}>
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-between mt-1">
            <strong className="font-normal text-gray-500 dark:text-gray-100">Grey Chair</strong>
            <span className="font-semibold dark:text-white">$19</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t-2 border-dashed">
          <div className="flex justify-between">
            <strong className="font-normal">Total</strong>
            <span className="font-semibold">$10</span>
          </div>
        </div>
        <div className="mt-6">
          <button
            className="mx-auto block w-3/4 text-center text-white p-2 bg-blue-500 rounded-xl
           hover:bg-teal-500 hover:text-black active:bg-yellow-500 focus:bg-red-500
           dark:bg-black dark:border-white dark:border dark:hover:bg-white"
          >
            Checkout
          </button>
        </div>
      </div>
      <div className="bg-white overflow-hidden rounded-3xl shadow-xl group">
        <div
          className="p-6 pb-14 bg-blue-500
          portrait:bg-indigo-600 landscape:bg-teal-500 xl:pb-40"
        >
          <span className="text-2xl text-white">Profile</span>
        </div>
        <div className="relative -top-5 p-6 bg-white rounded-3xl">
          <div className="relative -top-16 flex items-end justify-between">
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500">Orders</span>
              <span className="font-medium">340</span>
            </div>
            <div className="w-24 h-24 bg-zinc-300 rounded-full group-hover:bg-red-300 transition-colors" />
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500">Spent</span>
              <span className="font-medium">$340</span>
            </div>
          </div>
          <div className="relative -mt-14 -mb-5 flex flex-col items-center">
            <span className="text-lg font-medium">Tony Molloy</span>
            <span className="text-sm text-gray-500">미국</span>
          </div>
        </div>
      </div>
      <div
        className="p-6 bg-white rounded-3xl shadow-xl
         lg:col-span-2 xl:col-span-1"
      >
        <div className="mb-5 flex justify-between items-center">
          <span>⬅️</span>
          <div className="space-x-3">
            <span>⭐️ 4.9</span>
            <span className="p-2 shadow-xl rounded-md">💖</span>
          </div>
        </div>
        <div className="mb-5 h-72 bg-zinc-400" />
        <div className="flex flex-col">
          <span className="text-xl font-medium">Swoon Lounge</span>
          <span className="text-xs text-gray-500">Chair</span>
          <div className="mt-3 mb-5 flex justify-between items-center">
            <div className="space-x-2">
              <button
                className="w-5 h-5 bg-yellow-500 rounded-full
                focus:ring-2 ring-offset-2 ring-yellow-500 transition"
              />
              <button
                className="w-5 h-5 bg-indigo-500 rounded-full
                focus:ring-2 ring-offset-2 ring-yellow-500 transition"
              />
              <button
                className="w-5 h-5 bg-teal-500 rounded-full
                focus:ring-2 ring-offset-2 ring-yellow-500 transition"
              />
            </div>
            <div className="space-x-5 flex items-center">
              <button className="w-8 flex justify-center items-center aspect-square text-xl text-gray-500 bg-blue-200 rounded-lg">-</button>
              <span>1</span>
              <button className="w-8 flex justify-center items-center aspect-square text-xl text-gray-500 bg-blue-200 rounded-lg">+</button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-2xl font-medium">$450</span>
            <button className="px-8 py-2 text-xs text-center text-white bg-blue-500 rounded-lg">Add to cart</button>
          </div>
        </div>
      </div>
      <div className="p-6 bg-white rounded-3xl shadow-xl">
        <form className="space-y-2 p-5 flex flex-col">
          <input type="text" required placeholder="Username" className="p-1 peer border-gray-400 border rounded-md " />
          <span className="hidden peer-invalid:block peer-invalid:text-red-500">This input is invalid</span>
          <span className="hidden peer-valid:block peer-valid:text-teal-500">Awesome username</span>
          <span className="hidden peer-hover:block peer-hover:text-amber-500">Hello</span>
          <input type="submit" value="Login" className="bg-white" />
        </form>
      </div>
      <div className="p-6 bg-white rounded-3xl shadow-xl">
        <div className="flex flex-col">
          <p className="first-letter:text-4xl first-letter:hover:text-purple-400">Hello everyone!</p>
        </div>
        <ol className="my-5 pl-5 list-decimal marker:text-teal-500">
          <li>Hello.</li>
          <li>Hello..</li>
          <li>Hello...</li>
        </ol>
        <details className="open:bg-indigo-100">
          <summary className="select-none cursor-pointer">Details</summary>
          <div className="selection:bg-indigo-600">
            <p>Something small enough to escape casual notice.</p>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. Corrupti, error iste id maxime voluptate nemo ab delectus laboriosam non enim aliquid possimus magni fugiat voluptatibus ipsam
              iusto, eum asperiores pariatur.
            </p>
          </div>
        </details>
        <div className="my-5">
          <input type="file" className="file:px-5 file:text-purple-300 file:hover:text-purple-600 file:bg-purple-100 file:border-0 file:rounded-md" />
          <div className="bg-[url('/vercel.svg')]">
            <strong className="text-[50px] text-[#abcdef]">lorem</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
