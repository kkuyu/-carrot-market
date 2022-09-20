import Link from "next/link";
import { ForwardedRef, forwardRef, Fragment, HTMLAttributes } from "react";

export type TabItem = {
  key: string;
  isInfinite: boolean;
  models: string;
  filter: string;
  caption: string;
  tabName: string;
  extraInfo?: { [key: string]: string };
};

interface TabListProps extends HTMLAttributes<HTMLElement> {
  list: TabItem[];
  currentTab: TabItem | null;
  hrefPathname: string;
  hrefQuery: Exclude<keyof TabItem, "extraInfo">[];
  hrefExtraQuery?: { [key: string]: string };
}

const TabList = (props: TabListProps, ref?: ForwardedRef<HTMLElement>) => {
  const { list, currentTab, hrefPathname, hrefQuery = [], hrefExtraQuery = {}, className = "", ...restProps } = props;

  if (!list.length) return null;

  const visibleList = list.filter((item) => item.key === currentTab?.key);
  const activeIndex = visibleList?.findIndex((item) => item.models === currentTab?.models && item.filter === currentTab?.filter);

  if (visibleList.length < 2) return null;

  return (
    <nav ref={ref} className={`empty:hidden sticky top-12 left-0 flex bg-white border-b z-[1] ${className}`} {...restProps}>
      {visibleList.map((item, index) => (
        <Fragment key={`${item.models}-${item.filter}`}>
          <Link href={{ pathname: hrefPathname, query: { ...hrefExtraQuery, ...Object.fromEntries(hrefQuery.map((query) => [query, item?.[query] ?? null])) } }} replace passHref>
            <a className={`basis-full py-2 text-sm text-center font-semibold ${index === activeIndex ? "text-black" : "text-gray-500"}`}>
              {item.tabName} {item?.models} {item?.filter}
            </a>
          </Link>
        </Fragment>
      ))}
      {activeIndex !== -1 && (
        <span
          className="absolute bottom-0 left-0 h-[2px] bg-black transition-transform"
          style={{
            width: `${100 / visibleList.length}%`,
            transform: `translateX(${100 * activeIndex}%)`,
          }}
        />
      )}
    </nav>
  );
};

export default forwardRef(TabList);
