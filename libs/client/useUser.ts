import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((response) => response.json());

function useUser() {
  const router = useRouter();

  const { data, error } = useSWR("/api/users/me", fetcher);
  return data;

  // const [user, setUser] = useState();
  // useEffect(() => {
  //   fetch("/api/users/me")
  //     .then((response) => response.json())
  //     .then((data) => {
  //       if (!data.success) {
  //         router.replace("/enter");
  //       }
  //       setUser(data.profile);
  //     });
  // }, [router]);
  // return user;
}

export default useUser;
