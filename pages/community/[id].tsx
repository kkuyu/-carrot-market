import type { NextPage } from "next";

const CommunityPostDetail: NextPage = () => {
  return (
    <div className="px-4">
      <div className="mt-3">
        <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full">동네질문</span>
      </div>
      <div className="-mx-4 border-b">
        <button className="flex items-center w-full space-x-3 px-4 py-3 text-left">
          <div className="flex-none w-12 h-12 bg-slate-300 rounded-full" />
          <div>
            <strong className="text-sm font-semibold text-gray-700">Steve Jebs</strong>
            <p className="text-xs font-semibold text-gray-500">View profile &rarr;</p>
          </div>
        </button>
      </div>

      <div className="-mx-4 border-b border-b-gray-300">
        <button type="button" className="flex flex-col items-stretch w-full text-left">
          <div className="pt-8 px-4">
            <div className="mt-2 text-gray-700">
              <span className="font-semibold text-orange-500">Q.</span> What is the best mandu restaurant?
            </div>
          </div>
          <div className="mt-5 px-4 border-t">
            <div className="flex w-full py-2.5 space-x-5 text-gray-700">
              <span className="flex items-center space-x-2 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>궁금해요 1</span>
              </span>
              <span className="flex items-center space-x-2 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  ></path>
                </svg>
                <span>답변 1</span>
              </span>
            </div>
          </div>
        </button>
      </div>

      <div className="mt-5 space-y-5">
        <div className="flex items-start space-x-3">
          <div className="flex-none w-8 h-8 bg-slate-200 rounded-full" />
          <div>
            <span className="block text-sm font-medium text-gray-700">Steve Jebs</span>
            <span className="block text-xs text-gray-500">2시간 전</span>
            <p className="mt-2 text-gray-700">The best mandu restaurant is the one next to my house.</p>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <textarea
          className="w-full shadow-sm border border-gray-300 rounded-md shadow-sm
              focus:outline-none focus:ring-orange-500 focus:border-orange-500"
          rows={4}
          placeholder="Answer this question!"
        />
      </div>
      <div className="mt-5">
        <button
          className="w-full px-4 py-2 text-sm font-semibold text-white bg-orange-500 border border-transparent rounded-md shadow-sm
        hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          Reply
        </button>
      </div>
    </div>
  );
};

export default CommunityPostDetail;
