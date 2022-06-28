import { objMap } from "@libs/utils";
import { useRouter } from "next/router";

// Resolves query or returns null
export default function useQuery() {
  const router = useRouter();
  const hasQuery = /\[.+\]/.test(router.route) || /\?./.test(router.asPath);

  const isReady = !hasQuery || Object.keys(router.query).length > 0;
  const result = !isReady ? null : objMap(router.query, ([key, value]) => [key, decodeURIComponent(value || "")]);

  return {
    hasQuery,
    isReady,
    query: result,
  };
}
