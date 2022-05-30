import type { NextPage } from "next";

import Layout from "../../components/layout";
import TextArea from "../../components/textarea";
import Button from "../../components/button";

const CommunityPostDetail: NextPage = () => {
  return (
    <Layout canGoBack>
      <div className="container pt-5 pb-5">
        <div>
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
            <div className="pt-5 px-4">
              <div className="text-gray-700">
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

        <div className="mt-6 space-y-5">
          <div className="flex items-start space-x-3">
            <div className="flex-none w-8 h-8 bg-slate-200 rounded-full" />
            <div>
              <span className="block text-sm font-semibold text-gray-700">Steve Jebs</span>
              <span className="block text-xs text-gray-500">2시간 전</span>
              <p className="mt-2 text-gray-700">The best mandu restaurant is the one next to my house.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-none w-8 h-8 bg-slate-200 rounded-full" />
            <div>
              <span className="block text-sm font-semibold text-gray-700">Steve Jebs</span>
              <span className="block text-xs text-gray-500">2시간 전</span>
              <p className="mt-2 text-gray-700">The best mandu restaurant is the one next to my house.</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <form className="space-y-5">
            <TextArea name="description" placeholder="Answer this question!" required />
            <Button text="Reply" />
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default CommunityPostDetail;
