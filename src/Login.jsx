// src/Login.jsx
import React, { useState } from "react";
import {
  GoogleOAuthProvider,
  useGoogleLogin,
  googleLogout,
} from "@react-oauth/google";

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

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setToken(tokenResponse.access_token);

      try {
        const res = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          }
        );
        const userInfo = await res.json();
        console.log("Google user info:", userInfo);
        setUser(userInfo);
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
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      {user ? (
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
      ) : (
        <button onClick={() => login()}>Login with Google</button>
      )}
    </div>
  );
}

export default LoginWrapper;
