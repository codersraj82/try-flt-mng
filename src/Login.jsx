import React, { useState, useEffect } from "react";
import {
  GoogleOAuthProvider,
  useGoogleLogin,
  googleLogout,
} from "@react-oauth/google";
import Faults from "./Faults";

const clientId =
  "260551266904-s5p0g8452l1ldhnu084g5ckvn4s4ai1h.apps.googleusercontent.com";

function LoginWrapper() {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <Login />
    </GoogleOAuthProvider>
  );
}

function Login() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Restore from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("google_user");
    const storedToken = localStorage.getItem("google_token");

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
  }, []);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const accessToken = tokenResponse.access_token;
      setToken(accessToken);
      localStorage.setItem("google_token", accessToken);

      try {
        const res = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const userInfo = await res.json();
        console.log("Google user info:", userInfo);
        setUser(userInfo);
        localStorage.setItem("google_user", JSON.stringify(userInfo));
      } catch (error) {
        console.error("User info fetch failed", error);
      }
    },
    onError: () => console.log("Login Failed"),
    scope: "profile email",
  });

  const handleLogout = () => {
    googleLogout();
    setUser(null);
    setToken(null);
    localStorage.removeItem("google_user");
    localStorage.removeItem("google_token");
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      {user ? (
        <>
          <div>
            <p>Welcome, {user.name}</p>
            <img
              src={user.picture}
              alt="User"
              style={{ borderRadius: "50%", width: "60px" }}
            />
            <p>Email: {user.email}</p>
            <button onClick={handleLogout}>Logout</button>
          </div>
          <Faults />
        </>
      ) : (
        <button onClick={() => login()}>Login with Google</button>
      )}
    </div>
  );
}

export default LoginWrapper;
