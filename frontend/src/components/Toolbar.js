import React,{useState} from 'react';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { RiText,RiDeleteBin6Line } from "react-icons/ri";
import { IoMoveOutline,IoSettings } from "react-icons/io5";
import { PiCopySimpleDuotone, PiCopySimpleFill } from "react-icons/pi";
import { FaFileCirclePlus,FaRegFolderOpen } from "react-icons/fa6";
import { LuRotateCw,LuGroup,LuUngroup } from "react-icons/lu";
import { CiSearch } from "react-icons/ci";
import { FaRegSave} from "react-icons/fa";
import { useAppState } from '../StateContext';
import { LuUndoDot,LuRedoDot,LuTimerReset } from "react-icons/lu";


function Toolbar() {
    const { state, dispatch } = useAppState(); 
    const [inputValue, setInputValue] = useState('');
    const handleSearch = (event) => {
        const value = event.target.value;
        dispatch({ type: 'SET_SEARCH_VALUE', payload: event.target.value });
    }
    const handleNewCanvas = () => {
        const userConfirmed = window.confirm("Are you sure you want to proceed and lose current changes?");
        if (userConfirmed) {
            dispatch({ type: 'SET_RESET', payload: true })
        }
    }

         // <div className="icon">
            //     <IoMoveOutline />
            //     <span>Move</span>
            // </div>
    return (
        // <div className='container'>
        <div className="toolbar">
            <div className="icon" onClick={() => dispatch({ type: 'IS_POPUP_OPEN', payload: true })}>
                <RiText />
                <span>Text</span>
            </div>
   
            <div className="icon" onClick={() => dispatch({ type: 'COPY_OBJECT', payload: true })}>
                <PiCopySimpleDuotone />
                <span>Copy</span>
            </div>
            <div className="icon" onClick={() => dispatch({ type: 'PASTE_OBJECT', payload: true })}>
                <PiCopySimpleFill />
                <span>Paste</span>
            </div>
            <div className="icon" onClick={() => dispatch({ type: 'SET_ROTATING', payload: true })}>
                <LuRotateCw />
                <span>Rotate</span>
            </div>
            <div className="icon" onClick={() => dispatch({ type: 'SET_RESET', payload: true })}>
                <LuTimerReset />
                <span>Reset</span>
            </div>
            <div className="icon" onClick={() => dispatch({ type: 'OPEN_SYSTEM_POPUP', payload: true })}>
                <IoSettings  />
                <span>System Configuration</span>
            </div>
            <div className="search-bar">
                <CiSearch />
                <input type="text" placeholder="Search..." value={state.searchValue}
        onChange={handleSearch} />
            </div>
            <div className="icon"  onClick={handleNewCanvas}>
                <FaFileCirclePlus />
                <span>New</span>
            </div>
            <div className="icon"  onClick={() => dispatch({ type: 'SET_LOAD_CANVAS', payload: true })}>
                <FaRegFolderOpen />
                <span>Open</span>
            </div>
            <div className="icon" onClick={() => dispatch({ type: 'SET_POPUP', payload: true })}>
                <FaRegSave />
                <span>Save</span>
            </div>
            <div className="icon"  onClick={() => dispatch({ type: 'DELETE_OBJECT', payload: true })}>
                <RiDeleteBin6Line />
                <span>Delete</span>
            </div>
            <div className="icon" onClick={() => dispatch({ type: 'SET_GROUPING', payload: true })}>
                <LuGroup />
                <span>Group</span>
            </div>
            <div className="icon" onClick={() => dispatch({ type: 'SET_UNGROUPING', payload: true })}>
                <LuUngroup />
                <span>Ungroup</span>
            </div>
            <div className="icon" onClick={() => dispatch({ type: 'UNDO_STATE', payload: true })} >
                <LuUndoDot />
                <span>Undo</span>
            </div>
            <div className="icon" onClick={() => dispatch({ type: 'REDO_STATE', payload: true })}>
                <LuRedoDot />
                <span>Redo</span>
            </div>
         
        </div>
        // </div>
    );
}

export default Toolbar;
