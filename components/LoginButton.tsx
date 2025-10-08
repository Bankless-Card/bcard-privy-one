import styles from './LoginButton.module.css';
import { useLogin, useLogout, usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/router";
import { getRoute } from "../utils/routes";
import { useEffect, useState } from "react";

export default function LoginButton() {
  const router = useRouter();
  const { login } = useLogin({
    onComplete: () => {
      //we have these here to avoid having to consume login state in every other widget
      window.location.reload();
    },
  });
  const { logout } = useLogout({
    onSuccess: () => {
      //setShowLogout(false);
      window.location.reload();
    }
  })
  const { ready, authenticated, user } = usePrivy();
  const [showLogout, setShowLogout] = useState(false);

  // Check authentication status and redirect if already logged in
  useEffect(() => {
    if (ready && authenticated) {
      setShowLogout(true);
    }
  }, [ready, authenticated]);

  if (showLogout) {
    return (
      <button
          className={styles.button}
          onClick={logout}
        >
          {user?.email?.address} Logout
      </button>
    );
  }

  return (
    <button
        className={styles.button}
        onClick={login}
      >
        Login
    </button>
  );

}