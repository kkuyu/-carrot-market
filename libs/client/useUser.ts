import { useEffect, useState } from "react";
import { useRouter } from "next/router";

function useUser() {
  const router = useRouter();

  const [user, setUser] = useState();

  useEffect(() => {
    fetch("/api/users/me")
      .then((response) => response.json())
      .then((data) => {
        if (!data.success) {
          router.replace("/enter");
        }
        setUser(data.profile);
      });
  }, [router]);
  return user;
}

export default useUser;
