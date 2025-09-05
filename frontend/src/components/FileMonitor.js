import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAppState } from '../StateContext';

const FileMonitor = () => {
    const [fileContent, setFileContent] = useState('');  
    const { state, dispatch } = useAppState(); 

    useEffect(() => {
        let socket;

        if (state.generateOutput) {
            // Connect to the server
            socket = io('http://localhost:3001');
        
            // Listen for file updates
            socket.on('fileUpdate', (data) => {
                console.log('File updated:', data);
                setFileContent(data);
            });
        }

        // Cleanup on component unmount
        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, []);

    return (
       fileContent ? (<div className="output-panel">
            <p>Output Panel</p>
            <pre>{fileContent}</pre>
        </div>  ) : null
    );
};

export default FileMonitor;
