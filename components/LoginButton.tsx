import { useLogin, useLogout, usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/router";
import { getRoute } from "../utils/routes";
import { useEffect, useState } from "react";

export default function LoginButton() {
  const router = useRouter();
  const { login } = useLogin({
    onComplete: () => {},
  });
  const { logout } = useLogout({
    onSuccess: () => {
      setShowLogout(false);
    }
  })
  const { ready, authenticated } = usePrivy();
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
          className="bf-button text-lg py-3 px-8"
          onClick={logout}
        >
          Logout
      </button>
    );
  }

  return (
    <button
        className="bf-button text-lg py-3 px-8"
        onClick={login}
      >
        Login
    </button>
  );

}