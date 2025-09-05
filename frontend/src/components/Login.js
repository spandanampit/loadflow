import React, { useState } from "react";
import { Encrypt } from "../helper/Utils";
import { useAppState } from "../StateContext";

import { LuUser2, LuLock } from "react-icons/lu";

function Login() {
        const [username, setUsername] = useState("");
        const [password, setPassword] = useState("");
        const [error, setError] = useState("");
        const { state, dispatch } = useAppState();

        const handleLogin = async (e) => {
                e.preventDefault();

                // Static credentials
                const validUsername = "Admin";
                const validPassword =
                        "$2a$10$WlbUAEZ8.NAZ91lLL/QVauIZ9PlNMYgFKtcZrY84o/cSEvI1FrW.i";

                const comparePassword = await Encrypt.comparePassword(
                        password,
                        validPassword
                );

                //   if (username === validUsername && comparePassword) {
                localStorage.setItem("isLoggedIn", "true");
                // onLoginSuccess();  // Trigger the login state update in App component
                dispatch({ type: "LOGIN", payload: true });
                //   } else {
                //       setError('Invalid username or password');
                //   }
        };

        return (
                <>
                        <h2 className="site-title">Ready to Login</h2>
                        <hr className="login-divider"></hr>
                        <h3 className="site-sub-title">
                                Load-ﬂow, Fault 8. Harmonic Program (LFH)
                        </h3>
                        <div className="login-container">
                                <div className="login-left-wrapper"></div>
                                <div className="login-right-wrapper">
                                        <form onSubmit={handleLogin}>
                                                <div>
                                                        <label>Username:</label>
                                                        <div className="loginInputWrapper">
                                                                <LuUser2 />
                                                                <input
                                                                        type="text"
                                                                        placeholder="Enter your username"
                                                                        value={
                                                                                username
                                                                        }
                                                                        onChange={(
                                                                                e
                                                                        ) =>
                                                                                setUsername(
                                                                                        e
                                                                                                .target
                                                                                                .value
                                                                                )
                                                                        }
                                                                        required
                                                                />
                                                        </div>
                                                </div>
                                                <div>
                                                        <label>Password:</label>
                                                        <div className="loginInputWrapper">
                                                                {/* LuFileLock, LuFileLock2, LuLock */}
                                                                <LuLock />

                                                                <input
                                                                        type="password"
                                                                        placeholder="********************"
                                                                        value={
                                                                                password
                                                                        }
                                                                        onChange={(
                                                                                e
                                                                        ) =>
                                                                                setPassword(
                                                                                        e
                                                                                                .target
                                                                                                .value
                                                                                )
                                                                        }
                                                                        required
                                                                />
                                                        </div>
                                                </div>
                                                {error && (
                                                        <p className="error">
                                                                {error}
                                                        </p>
                                                )}
                                                <button type="submit">
                                                        Login
                                                </button>
                                        </form>
                                </div>
                        </div>
                </>
        );
}

export default Login;
