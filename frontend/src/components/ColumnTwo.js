import React from 'react';
import CanvasArea from './CanvasArea';
import Toolbar from './Toolbar';
import FileMonitor from './FileMonitor'

function ColumnTwo({ selectedElement }) {
    return (
        <div className="column">

            <Toolbar />
            {/* { console.log("selectedElement 2 :::: ", selectedElement) } */}
            <CanvasArea selectedElement={selectedElement} />
            {/* <div className="output-panel">
              
                <p>Output Panel</p>
                <p>...</p>
                <p>...</p>
            </div> */}
            <FileMonitor />
        </div>
    );
}

export default ColumnTwo;
