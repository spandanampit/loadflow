import React, { useState } from 'react';
import ColumnOne from './ColumnOne';
import ColumnTwo from './ColumnTwo';
import { useAppState } from '../StateContext';

function MainContent() {
    const [selectedElement, setSelectedElement] = useState(null);
    const { state, dispatch } = useAppState(); 

    const handleElementSelect = (element) => {
        setSelectedElement(element);
    };
// Zoom Related Changes - start
    return (
        <div className={state.isZoomEnabled ? "main-content zoom-in" : "main-content"}> 
            <div className='container'>
            {state.isPropertiesBarVisible &&<ColumnOne onElementSelect={handleElementSelect} />}
                <ColumnTwo selectedElement={selectedElement} />
            </div>
        </div>
    ); 
// Zoom Related Changes - end
}

export default MainContent;
