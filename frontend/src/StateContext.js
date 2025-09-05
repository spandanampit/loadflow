import React, { createContext, useReducer, useContext } from 'react';

// Define initial state
const initialState = {
        isLoggedIn: localStorage.getItem("isLoggedIn") === "true",
    reset: false,
    clicked: false,
    dragging: false,
    dropped: false,
    rotating: false,
    position: { x: 0, y: 0 },
    groupObject:  false,
    ungroupObject:  false,
    isPopupOpen:  false,
    isSystemPopupOpen:  false,
    isSaveAsCanvas:  false,
    isLoadCanvas:  false,
    isEditPopupOpen:  false,
    isDeleteObject:  false,
    elementPropertyData: {},
    isLinkObject:  false,
    isUnLinkObject:  false,
    object1: null,
    object2: null,
    isFontPopupOpen:  false,
    fontSize:  12,
    isPrintWithoutResult:  false,
    isPrintWithResult:  false,
    currentLine: null,
    searchValue: "",
    canvasState: [],
    canvasMods: 0,
    undoStack:false,
    redoStack:false,
    generateInput:false,
    executedEngine:false,
    generateOutput:false,
    isExportData:false,
    isCopied:false,
    isPasted:false,
    isCopiedObjectProps:false,
    isCopiedObjectPropsValue:null,
    isCopiedObjectPropsDynamicValue:null,
    isPastedObjectProps:false,
    lineProperty:null,
    elementsList: [],
    isSelectedTransformer:false,
    deactivedElement:false,
    isFileUploadPopup:  false,
    fileUploadData:  false,
    isPropertiesBarVisible:  true,
    engineURLPopup:false,
    isMinMapEnabled:true,
    isGUIAdded: true,
    indexValueBus:1,
    indexValueFilter:1,
    indexValueGenerator:1,
    indexValueInduction:1,
    indexValueLoad:1,
    indexValueShunt:1,
    indexValueLine:1,
    indexValueTransformer:1,
    isZoomEnabled:false, // Zoom Related Changes
    defaultvoltagebuscolor:"black",
    voltageColors: {}, 
};

// Reducer function to handle actions
const stateReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN':
            return { ...state, isLoggedIn: action.payload };
        case 'SET_RESET':
            return { ...state, reset: action.payload };
        case 'SET_CLICKED':
            return { ...state, clicked: action.payload };
        case 'SET_DRAGGING':
            return { ...state, dragging: action.payload };
        case 'SET_POSITION':
            return { ...state, position: action.payload };
        case 'SET_ROTATING':
             return { ...state, rotating: action.payload };
        case 'SET_DROPPED':
            return { ...state, dropped: action.payload };
        case 'SET_GROUPING':
                return { ...state, groupObject: action.payload };
        case 'SET_UNGROUPING':
                return { ...state, ungroupObject: action.payload };
        case 'SET_POPUP':
                return { ...state, isPopupOpen: action.payload };
        case 'OPEN_SYSTEM_POPUP':
                return { ...state, isSystemPopupOpen: action.payload };
        case 'SET_EDIT_POPUP':
                return { ...state, isEditPopupOpen: action.payload };
        case 'SET_SAVEAS_CANVAS':
                return { ...state, isSaveAsCanvas: action.payload };
        case 'SET_LOAD_CANVAS':
                return { ...state, isLoadCanvas: action.payload };
        case 'DELETE_OBJECT':
                return { ...state, isDeleteObject: action.payload };
        case 'SET_ELEMENT_PROPERTY':
                return { ...state, elementPropertyData: action.payload };
        case 'LINK_OBJECT':
                return { ...state, isLinkObject: action.payload };
        case 'UNLINK_OBJECT':
                return { ...state, isUnLinkObject: action.payload };                
        case 'SET_CURRENT_LINE':
                return { ...state, activePolyline: action.payload };
        case 'SET_OBJECT_1':
                return { ...state, object1: action.payload };
        case 'SET_OBJECT_2':
                return { ...state, object2: action.payload };
        case 'IS_POPUP_OPEN':
                return { ...state, isFontPopupOpen: action.payload };
        case 'UPDATE_FONT_SIZE':
                return { ...state, fontSize: action.payload };
        case 'SET_PRINT_WITHOUT_TEXT':
                return { ...state, isPrintWithoutResult: action.payload };
        case 'SET_PRINT_WITH_TEXT':
                return { ...state, isPrintWithResult: action.payload };
        case 'SET_SEARCH_VALUE':
                return { ...state, searchValue: action.payload };
        case 'SAVE_STATE':
                return { ...state, 
                        canvasState: [...state.canvasState, action.payload]
                 }; 
        case 'SAVE_MODS':
                return { ...state, canvasMods: action.payload };   
        case 'UNDO_STATE':
                return { ...state, undoStack: action.payload };  
        case 'REDO_STATE':
                return { ...state, redoStack: action.payload }; 
        case 'GENERATE_INPUT':
                return { ...state, generateInput: action.payload };
        case 'EXECUTE_ENGINE':
                return { ...state, executedEngine: action.payload };
        case 'GENERATE_OUTPUT':
                return { ...state, generateOutput: action.payload }; 
        case 'SET_ENGINE_URL':
                return { ...state, engineURLPopup: action.payload }; 
        case 'EXPORT_EXCEL':
                return { ...state, isExportData: action.payload }; 
        case 'COPY_OBJECT':
                return { ...state, isCopied: action.payload };   
        case 'PASTE_OBJECT':
                return { ...state, isPasted: action.payload };
        case 'COPY_OBJECT_PROPERTY':
                return { ...state, isCopiedObjectProps: action.payload };
        case 'COPY_OBJECT_PROPERTY_VALUE':
                return { ...state, isCopiedObjectPropsValue: action.payload };
        case 'COPY_OBJECT_PROPERTY_DYNAMIC_VALUE':
                return { ...state, isCopiedObjectPropsDynamicValue: action.payload };
        case 'PASTE_OBJECT_PROPERTY':
                return { ...state, isPastedObjectProps: action.payload }; 
        case 'SET_LINE_PROPERTY':
                return { ...state, lineProperty: action.payload };
        case 'SET_ELEMENT':
                return { ...state, elementsList: action.payload }; 
        case 'IS_TRANSFORMER_SELECTED':
                return { ...state, isSelectedTransformer: action.payload };  
        case 'SET_DEACTIVED_ELEMENT':
                return { ...state, deactivedElement: action.payload };
        case 'IMPORT_FILE':
                return { ...state, isFileUploadPopup: action.payload }; 
        case 'IMPORT_DATA':
                return { ...state, fileUploadData: action.payload };  
        case 'SET_PROPERTY_BAR_VISIABLE':
                return { ...state, isPropertiesBarVisible: action.payload }; 
        case 'ENABLE_MIN_MAP':
                return { ...state, isMinMapEnabled: action.payload };   
        case 'SET_GUI_ADDED':
                return { ...state, isGUIAdded: action.payload }; 
        case 'SET_INDEX_VALUE':
                return { ...state, indexValue: action.payload };  
        case 'SET_INDEX_VALUE_BUS':
                return { ...state, indexValueBus: action.payload };  
        case 'SET_INDEX_VALUE_FILTER':
                return { ...state, indexValueFilter: action.payload };
        case 'SET_INDEX_VALUE_GENERATOR':
                return { ...state, indexValueGenerator: action.payload };     
        case 'SET_INDEX_VALUE_INDUCTION_MOTOR':
                return { ...state, indexValueInduction: action.payload };   
        case 'SET_INDEX_VALUE_LOAD':
                return { ...state, indexValueLoad: action.payload };       
        case 'SET_INDEX_VALUE_SHUNT_DEVICE':
                return { ...state, indexValueShunt: action.payload };
        case 'SET_INDEX_VALUE_LINE':
                return { ...state, indexValueLine: action.payload };    
        case 'SET_INDEX_VALUE_TRANSFORMER':
                return { ...state, indexValueTransformer: action.payload };  
        case 'SET_ZOOM_ENABLED': // Zoom Related Changes
                return { ...state, isZoomEnabled: action.payload }; 
                case 'SET_DEFAULT_VOLTAGE_BUS_COLOR':
                return { ...state, defaultvoltagebuscolor: action.payload };   
        case 'SET_VOLTAGE_COLOR':
                return {
                        ...state,
                        voltageColors: {
                        ...state.voltageColors, // Keep existing mappings
                        [action.payload.voltage]: action.payload.color, // Add or update voltage-color mapping
                        },
                };                               
                                           
        default:
            return state;
    }
};

// Create context
const StateContext = createContext();

// Context provider
export const StateProvider = ({ children }) => {
    const [state, dispatch] = useReducer(stateReducer, initialState);

    return (
        <StateContext.Provider value={{ state, dispatch }}>
            {children}
        </StateContext.Provider>
    );
};

// Custom hook to use state context
export const useAppState = () => useContext(StateContext);
