import React, { useState } from 'react';
import MenuBar from './components/MenuBar';

import MainContent from './components/MainContent';
import Login from './components/Login';
import ContentSection from './components/ContentSection';
import './App.css';
import { StateProvider } from './StateContext';

function App() {
    //const [isLoggedIn, setIsLoggedIn] = useState(false);

    return (
        <StateProvider>
        {/* <div className="App">
            {state.isLoggedIn ? (
                <>
                    <MenuBar />

                    <MainContent />
                </>
            ) : (
                <Login  />
            )}
        </div> */}
        <ContentSection />
        </StateProvider>
    );
}

export default App;


// <div className="App">
//     {isLoggedIn ? (
//         <>
//             <MenuBar />
//             <Toolbar />
//             {/* <div className="main-content">
//                         <ColumnOne onElementSelect={handleElementSelect} />
//                         <FabricCanvas selectedElement={selectedElement} />
//                     </div> */}
//         </>
//     ) : (
//         <Login onLogin={setIsLoggedIn} />
//     )}
// </div>