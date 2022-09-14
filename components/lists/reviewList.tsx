import { useRouter } from "next/router";
import Link from "next/link";
import { Fragment, HTMLAttributes } from "react";
// @libs
import useUser from "@libs/client/useUser";
// @components
import Review, { ReviewItem, ReviewProps } from "@components/cards/review";

interface ReviewListProps extends HTMLAttributes<HTMLUListElement> {
  list: ReviewItem[];
  cardProps?: Partial<ReviewProps>;
}

const ReviewList = (props: ReviewListProps) => {
  const { list, cardProps = {}, className = "", ...restProps } = props;
  const router = useRouter();
  const { user } = useUser();

  if (!Boolean(list.length)) return null;

  return (
    <ul className={`${className}`} {...restProps}>
      {list.map((item) => {
        const review = <Review item={item} {...cardProps} />;
        return (
          <li key={item?.id}>
            {user?.id?.toString() !== router.query.id ? (
              <Fragment>{review}</Fragment>
            ) : (
              <Link href={`/products/reviews/${item?.id}`}>
                <a>{review}</a>
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default ReviewList;
