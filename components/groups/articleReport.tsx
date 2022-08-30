import { useEffect, useState } from "react";
import type { HTMLAttributes, ReactElement } from "react";
// @libs
import { ResponseDataType } from "@libs/server/withHandler";

interface ArticleReportProps<T> extends HTMLAttributes<HTMLDivElement> {
  fetchUrl: string | null;
  initialState: { id: number; views: number };
  children?: ReactElement | ReactElement[];
}

const ArticleReport = <T extends ResponseDataType & { article: { id: number; views: number } }>(props: ArticleReportProps<T>) => {
  const { fetchUrl, initialState, className = "", children, ...restProps } = props;
  const [articleInfo, setArticleInfo] = useState<T["article"]>(initialState);

  const registerView = (url: string) => {
    const onSuccess = (json: T) => (!json.success ? onError(json) : setArticleInfo(json.article));
    const onError = (error: T) => console.error("ArticleReport", url, error);

    fetch(`${url}`, { method: "POST" })
      .then((response) => response.json().catch(onError))
      .then(onSuccess)
      .catch(onError);
  };

  useEffect(() => {
    if (!fetchUrl) {
      setArticleInfo(initialState);
      return;
    }
    registerView(fetchUrl);
  }, [fetchUrl]);

  return (
    <div className={`text-description text-gray-500 ${className}`} {...restProps}>
      {children}
      {!!articleInfo?.views && <span>조회 {articleInfo?.views}</span>}
    </div>
  );
};

export default ArticleReport;
