import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSortDown, faBars } from '@fortawesome/free-solid-svg-icons';
import { useAppState } from '../StateContext';

function MenuBar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { state, dispatch } = useAppState(); 

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };
    const handleNewCanvas = () => {
        const userConfirmed = window.confirm("Are you sure you want to proceed and lose current changes?");
        if (userConfirmed) {
            dispatch({ type: 'SET_RESET', payload: true })
        }
    }

    const handleLogout = () => {
        // Clear login state from localStorage and dispatch logout action
        localStorage.removeItem("isLoggedIn");
        dispatch({ type: 'LOGIN', payload: false });
    };            /*ar win = window.open("about:blank", "_self");
    win.close(); */
    const closeCurrentTab = () => {
        const conf = window.confirm("Are you sure you want to Exit this app?");
        if (conf) {
          close();
        }
      };

    return (
        <div className="menu-bar">
            <div className='container'>
                <div className="burger-menu" onClick={toggleMenu}>
                    <FontAwesomeIcon icon={faBars} size="lg" />
                </div>
                <ul className={isMenuOpen ? 'menu-open' : ''}>
                    <li className="dropdown">File
                    <span className="dropdown-arrow"><FontAwesomeIcon icon={faSortDown} /></span>
                        <ul className="dropdown-content">
                            <li onClick={handleNewCanvas}>New</li>
                            <li onClick={() => dispatch({ type: 'SET_LOAD_CANVAS', payload: true })}>Open</li>
                            <li onClick={() => dispatch({ type: 'SET_POPUP', payload: true })}>Save</li>
                            <li onClick={() => dispatch({ type: 'SET_SAVEAS_CANVAS', payload: true })}>Save As</li>
                            <li onClick={handleLogout}>Logout</li>
                            <li onClick={() => {var win = window.open("about:blank", "_self"); win.close();}}>Exit</li>
                        </ul>
            
                    </li>
                    <li className="dropdown">Edit
                    <span className="dropdown-arrow"><FontAwesomeIcon icon={faSortDown} /></span>
                        <ul className="dropdown-content">
                            <li onClick={() => dispatch({ type: 'UNDO_STATE', payload: true })} >Undo</li>
                            <li onClick={() => dispatch({ type: 'REDO_STATE', payload: true })} >Redo</li>
                            <li onClick={() => dispatch({ type: 'COPY_OBJECT', payload: true })}>Copy</li>
                            <li onClick={() => dispatch({ type: 'PASTE_OBJECT', payload: true })}>Paste</li>
                            <li onClick={() => dispatch({ type: 'DELETE_OBJECT', payload: true })}>Delete</li>
                        </ul>
                    </li>
                    <li className="dropdown">Window
                    <span className="dropdown-arrow"><FontAwesomeIcon icon={faSortDown} /></span>
                        <ul className="dropdown-content">                            
                            <li onClick={() => dispatch({ type: 'SET_PROPERTY_BAR_VISIABLE', payload: false })}>Drawing Tools</li>
                            <li onClick={() => dispatch({ type: 'SET_PROPERTY_BAR_VISIABLE', payload: true })}>Properties</li>
                            {state.isMinMapEnabled? 
                            <li onClick={() => dispatch({ type: 'ENABLE_MIN_MAP', payload: false})}>Minimap - Disable</li>
                            :<li onClick={() => dispatch({ type: 'ENABLE_MIN_MAP', payload: true})}>Minimap - Enable</li>
                            }
                            
                        </ul>
                    </li>
                    <li className="dropdown">Execute
                    <span className="dropdown-arrow"><FontAwesomeIcon icon={faSortDown} /></span>
                        <ul className="dropdown-content">                            
                            <li onClick={() => dispatch({ type: 'SET_ENGINE_URL', payload: true })}>Set Engine URL</li>
                            <li onClick={() => dispatch({ type: 'GENERATE_INPUT', payload: true })}>Generate Input</li>
                        </ul>
                    </li>
                    <li className="dropdown">Help
                    <span className="dropdown-arrow"><FontAwesomeIcon icon={faSortDown} /></span>
                        <ul className="dropdown-content">
                            <li>LFH Technical Documentation</li>
                            <li onClick={() => window.open(`${process.env.PUBLIC_URL}/LFH User Manual.pdf`, '_blank')}> 
                                User Manual
                                </li>
                            <li>Database Related</li>
                        </ul>
                    </li>
                    <li onClick={() => dispatch({ type: 'GENERATE_OUTPUT', payload: true })}>Plot Result</li>
                    {/* <li>Preview</li> */}
                    <li>Export/Import
                    <span className="dropdown-arrow"><FontAwesomeIcon icon={faSortDown} /></span>
                        <ul className="dropdown-content">
                            <li onClick={() => dispatch({ type: 'EXPORT_EXCEL', payload: true })}>Export</li>
                            <li onClick={() => dispatch({ type: 'IMPORT_FILE', payload: true })}>Import</li>
                        </ul>
                    </li>
                    <li className="dropdown">
                        Print
                        <span className="dropdown-arrow"><FontAwesomeIcon icon={faSortDown} /></span>
                        <ul className="dropdown-content">
                            <li onClick={() => dispatch({ type: 'SET_PRINT_WITH_TEXT', payload: true })}>With Results</li>
                            <li onClick={() => dispatch({ type: 'SET_PRINT_WITHOUT_TEXT', payload: true })}>Without Results</li>
                        </ul>
                    </li>
                </ul>
            </div>
        </div>
    );
}

export default MenuBar;
