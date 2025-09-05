import React, { useState, useEffect } from "react";
import Login from './Login';
import MenuBar from './MenuBar';
import MainContent from './MainContent';
import { useAppState } from "../StateContext";

function ContentSection() {

    const { state, dispatch } = useAppState();
// Initialize isLoggedIn based on localStorage
//const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem("isLoggedIn") === "true");

// Effect to update localStorage when login status changes
// useEffect(() => {
//     localStorage.setItem("isLoggedIn", isLoggedIn);
// }, [isLoggedIn]);
    return (
        <div className="App">
            {state.isLoggedIn ? (
                <>
                    <MenuBar />
                    <MainContent />
                </>
            ) : (
                <Login />
            )}
        </div>
    );
}

export default ContentSection;
