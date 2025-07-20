// src/Login.jsx
import React from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

const clientId =
  "260551266904-s5p0g8452l1ldhnu084g5ckvn4s4ai1h.apps.googleusercontent.com"; // replace with actual ID

function Login() {
  //hello
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "100px",
        }}
      >
        <GoogleLogin
          onSuccess={(credentialResponse) => {
            console.log("Login Success:", credentialResponse);
            // Save token in state, context, or localStorage
          }}
          onError={() => {
            console.log("Login Failed");
          }}
        />
      </div>
    </GoogleOAuthProvider>
  );
}

export default Login;
