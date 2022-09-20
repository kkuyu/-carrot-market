import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
// @components
import { TabItem } from "@components/groups/tabList";

interface UseRouterTabsProps {
  list: TabItem[];
}

export interface UseRouterTabsState {
  currentTab: TabItem | null;
}

const useRouterTabs = (props: UseRouterTabsProps) => {
  const { list } = props;
  const router = useRouter();

  const listContainer = useRef<HTMLElement | null>(null);
  const [listState, setListState] = useState<UseRouterTabsState>({ currentTab: null });

  useEffect(() => {
    setListState(() => {
      if (!list?.length) return { currentTab: null };
      return {
        currentTab:
          list?.find((item?) => {
            const { models, filter } = router?.query;
            if (models && item?.models !== models?.toString()) return false;
            if (filter && item?.filter !== filter?.toString()) return false;
            return true;
          }) ?? null,
      };
    });
  }, [router?.query?.models, router?.query?.filter]);

  return {
    list,
    listContainer,
    ...listState,
  };
};

export default useRouterTabs;
