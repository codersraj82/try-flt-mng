// src/Login.jsx
import React, { useState } from "react";
import {
  GoogleOAuthProvider,
  GoogleLogin,
  googleLogout,
} from "@react-oauth/google";
import jwt_decode from "jwt-decode";

const clientId =
  "260551266904-s5p0g8452l1ldhnu084g5ckvn4s4ai1h.apps.googleusercontent.com"; // 🔁 Replace with actual client ID

function Login() {
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (credentialResponse) => {
    if (credentialResponse.credential) {
      const decoded = jwt_decode(credentialResponse.credential);
      console.log("Decoded user info:", decoded);
      setUser(decoded); // decoded has name, email, picture, etc.
    }
  };

  const handleLogout = () => {
    googleLogout();
    setUser(null);
    console.log("Logged out");
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        {user ? (
          <div>
            <p>Welcome, {user.name} 👋</p>
            <img
              src={user.picture}
              alt="User"
              style={{ borderRadius: "50%", width: "60px" }}
            />
            <p>Email: {user.email}</p>
            <button onClick={handleLogout} style={{ marginTop: "10px" }}>
              Logout
            </button>
          </div>
        ) : (
          <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={() => console.log("Login Failed")}
          />
        )}
      </div>
    </GoogleOAuthProvider>
  );
}

export default Login;
