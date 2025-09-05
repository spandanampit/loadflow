import React from "react";
import { useAppState } from "../StateContext";

const Popup = ({ isOpen, onClose, title, children, object, editPopup }) => {
        if (!isOpen) return null;
        const { state, dispatch } = useAppState();

        let isPasteButtonEnabled = false;
        let isCopied = false;
        if (state.isCopiedObjectProps) {
                // console.log("current-onj:",object);
                if (state.isCopiedObjectProps.id == object.id) {
                        isCopied = true;
                }
                if (state.isCopiedObjectProps.id != object.id) {
                        if (
                                state.isCopiedObjectProps.category ==
                                object.elementCategory
                        ) {
                                isPasteButtonEnabled = true;
                        }
                }
        }

        const Buttons = () => {
                // if(isPasteButtonEnabled){
                //   return (<button onClick={()=>dispatch({ type: 'PASTE_OBJECT_PROPERTY', payload: true })} className="close-btn">Paste</button>)
                // }
                // return (<>
                // <button onClick={()=>dispatch({ type: 'COPY_OBJECT_PROPERTY', payload: {category:object?.elementCategory,id:object?.id} })} className="close-btn">{isCopied?"Copied":"Copy"}</button>
                // <button onClick={()=>dispatch({ type: 'PASTE_OBJECT_PROPERTY', payload: true })} className="close-btn">Paste</button>
                // </>
                // )

                return (
                        <>
                                <button
                                        onClick={() =>
                                                dispatch({
                                                        type: "COPY_OBJECT_PROPERTY",
                                                        payload: true,
                                                })
                                        }
                                        className="close-btn"
                                >
                                        {isCopied ? "Copied" : "Copy"}
                                </button>
                                <button
                                        onClick={() =>
                                                dispatch({
                                                        type: "PASTE_OBJECT_PROPERTY",
                                                        payload: true,
                                                })
                                        }
                                        className="close-btn"
                                >
                                        Paste
                                </button>
                        </>
                );
        };

        return (
                <div className="popup-overlay">
                        <div className="popup-content">
                                <div className="popup-header">
                                        <h2>{title}</h2>
                                        <div className="popup-header-buttons">
                                                {editPopup ? <Buttons /> : ""}
                                                <button
                                                        onClick={onClose}
                                                        className="close-btn"
                                                >
                                                        X
                                                </button>
                                        </div>
                                </div>
                                <div className="popup-body">{children}</div>
                        </div>
                </div>
        );
};

export default Popup;
