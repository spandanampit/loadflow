import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { fabric } from "fabric";
import { useAppState } from "../StateContext";
import Popup from "./Popup";
import DynamicForm from "./DynamicForm";
import DirectoryForm from "./DirectoryForm";
import FileUploadForm from "./FileUploadForm";
import {
    storeCanvasAPI,
    getAllCanvasAPI,
    readBusOutputData,
} from "../services/apiService";
import {
    addProperties,
    updateProperties,
    getDataAsFormFields,
    comparePropertyValue,
    getConnectedObject,
    getSpecificSvgRelatedData,
    filterObjectByType,
    getNextAngle,
    validatedShuntElement,
    checkObjectCategories,
    getConnectedObjectToBus,
    deleteValidation,
    systemConfigurationProperties,
    systemConfigurationFormFields,
    NameGenerateString,
    filterObjectWithOutput,
    getRemainingConnectedObjects,
} from "../helper/Utils";
import * as postionFunc from "../helper/Position";
import { jsPDF } from "jspdf";
import { generateFiles, generateExcelFile } from "../helper/FileSaver";
import { faL } from "@fortawesome/free-solid-svg-icons";
import { InductionFormat } from "../helper/FormatInput";
import CanvasLoader from "./CanvasLoader";
import axios from "axios";

function FabricCanvas({
    selectedElement,
    activeObject,
    canvasId,
    savedData,
    onSave,
    onRegister,
    activeTab,
    canvasInstances,
    onCanvasLoaded,
    refdata
}) {
    const canvasRef = useRef(null);
    const minimapRef = useRef(null);

    const fabricCanvasRef = useRef(null);
    const { state, dispatch } = useAppState();
    const [data, setData] = useState([]);
    const [dataToOutput, setDataToOutput] = useState(null);
    const [dataToExcel, setDataToExcel] = useState(null);
    const [copiedSelectedObject, setCopiedSelectedObject] = useState(null);
    const [copiedObjectProps, setCopiedObjectProps] = useState(null);
    const [busObjects, setBusObjects] = useState({
        busObj1: null,
        busObj2: null,
    });
    const [busObjectsPointer, setBusObjectsPointer] = useState({
        busObj1: null,
        busObj2: null,
    });
    const [engineOutput, setEngineOutput] = useState({
        bus: null,
        generator: null,
        load: null,
        filter: null,
        shunt: null,
        Induction: null,
        line: null,
        transformer: null,
    });

    const [canvasObjects, setCanvasObjects] = useState({});
    const [canvasContainerHeight, setCanvasContainerHeight] = useState(window.innerHeight - 100);
    const [canvasContainerWidth, setCanvasContainerWidth] = useState(1500);

    let selectionPos = {};
    let bringAllTimeout;

    let lastClickTime = 0;
    let clickTimeout = null;
    let initialProperties = {};
    let mainCanvasSize = {
        width: 1150,
        height: 400,
    };
    const isLinkObjectRef = useRef(state.isLinkObject);
    const object1Ref = useRef(state.object1);
    const activePolylineRef = useRef(state.activePolyline);
    const [lineAct, setLineAct] = useState(false);
    let isGUIAdded2 = true;
    const propertyVisible = useRef(state.isPropertiesBarVisible);
    const undoJson = useRef(null);
    const redoJson = useRef(null);
    const savehistoryEnabled = useRef(null);
    // let undoJson = [], redoJson = [];
    var allproperties = [
        "id",
        "canvasProperty",
        "elementCategory",
        "elementType",
        "isLine",
        "setControlsVisibility",
        "scaleX",
        "snapAngle",
        "centeredRotation",
        "connectingLine",
        "lineId",
        "textlinkedObjectId",
        "textId",
        "selectable",
        "fromObjectId",
        "toObjectId",
        "objectCaching",
        "textlinkedObjectId",
        "isTransformerLine",
        "name",
        "oldLeft",
        "oldTop",
        "connectingElement",
        "lineStartingPoint",
        "busPointerData",
        "isOutputText",
        "output1TextId",
        "output2TextId",
        "output3TextId",
        "output4TextId",
        "engineOutput",
        "busIndex",
        "generatorIndex",
        "lineIndex",
        "loadIndex",
        "shuntIndex",
        "filterIndex",
        "inductionMotorIndex",
        "transformerIndex",
        "isBusTwo",
        "topOffset",
        "leftOffset",
        "lineCoords",
        "rightOffset",
        "rightOffset2",
        "bottomOffset",
        "topOffset2",
        "bottomOffset2",
        "obj1PointerData",
        "obj2PointerData",
    ];

    const indexData = {
        Bus: "busIndex",
        Generator: "generatorIndex",
        "Transmission Line": "lineIndex",
        Load: "loadIndex",
        "Shunt Device": "shuntIndex",
        Filter: "filterIndex",
        "Induction Motor": "inductionMotorIndex",
        "Two winding transformer": "transformerIndex",
    };

    const [objectProps, setObjectProps] = useState(allproperties);

    const [selectedCanvas, setSelectedCanvas] = useState(null);


    useEffect(() => {
        if (propertyVisible.current !== state.isPropertiesBarVisible) {
            propertyVisible.current = state.isPropertiesBarVisible;
            handleVisibilityChange(state.isPropertiesBarVisible);
        }
    }, [state.isPropertiesBarVisible]);

    const handleVisibilityChange = () => {
        if (propertyVisible.current) {
            const currentWidth = fabricCanvasRef.current.width;
            fabricCanvasRef.current.setWidth(currentWidth - 330);
        } else {
            const currentWidth = fabricCanvasRef.current.width;
            fabricCanvasRef.current.setWidth(currentWidth + 330);
        }
    };

    useEffect(() => {
        isLinkObjectRef.current = state.isLinkObject;
    }, [state.isLinkObject]);

    // Deactived the active element
    useEffect(() => {
        if (state.deactivedElement) {
            fabricCanvasRef.current.discardActiveObject();
            dispatch({
                type: "SET_DEACTIVED_ELEMENT",
                payload: false,
            });
        }
    }, [state.deactivedElement]);

    //Search Function ===============================
    useEffect(() => {
        if (state.searchValue.length > 3) {
            console.log('search :', state.searchValue.toLowerCase());
            const canvas = fabricCanvasRef.current;
            const allObjects = canvas.getObjects();

            const filterObject = allObjects.find(
                (el) =>
                    el.elementType === "svg" &&
                    el.canvasProperty[1].propertyValue.toLowerCase() ===
                        state.searchValue.toLowerCase()
            );

            if (filterObject) {
                canvas.setActiveObject(filterObject);
                filterObject.set("active", true);
                canvas.renderAll();

                const bounding = filterObject.getBoundingRect();

                const container = refdata.current;

                if (container) {
                    container.scrollTo({
                        top: bounding.top - container.clientHeight / 2 + bounding.height / 2,
                        left: bounding.left - container.clientWidth / 2 + bounding.width / 2,
                        behavior: "smooth",
                    });
                }
            }

        }
    }, [state.searchValue]);


    const addHashPrefix = (color) => {
        const namedColors = [
            "black",
            "white",
            "red",
            "green",
            "blue",
            "yellow",
            "purple",
            "gray",
            "brown",
            "orange",
        ];
        return namedColors.includes(color.toLowerCase())
            ? color
            : color.startsWith("#")
            ? color
            : `#${color}`;
    };
    // Object.keys(canvasInstances).forEach((canvasId) => {

    const updateBusColorInAllGUI = (busVoltage, busColor) => {
        // Iterate over all canvas instances
        if (state.isEditPopupOpen) return;
        Object.keys(canvasInstances).forEach((canvasId) => {
            if (canvasId === activeTab) return; // Skip the active canvas

            // Get the stored canvas state from localStorage
            const storedCanvasState = localStorage.getItem(
                `canvasState_tab${canvasId}`
            );
            if (!storedCanvasState) return;

            // Function to identify the connected buses for a given line (polyline)
            const identifyConnectedBuses = (line) => {
                const fromBus = allObjects.find(
                    (obj) => obj.id === line.fromObjectId
                );
                const toBus = allObjects.find(
                    (obj) => obj.id === line.toObjectId
                );
                return { fromBus, toBus };
            };
            // Function to find a bus connected to a line
            const findConnectedBus = (lineId) => {
                const line = allObjects.find(
                    (obj) => obj.id === lineId && obj.elementType === "line"
                );
                if (!line) return null;

                const fromBus = allObjects.find(
                    (obj) =>
                        obj.id === line.fromObjectId &&
                        obj.elementCategory === "Bus"
                );
                const toBus = allObjects.find(
                    (obj) =>
                        obj.id === line.toObjectId &&
                        obj.elementCategory === "Bus"
                );

                return { fromBus, toBus };
            };
            // Find the object linked to a text element
            const findLinkedObject = (linkedObjectId) => {
                return allObjects.find((obj) => obj.id === linkedObjectId);
            };

            // Parse canvas state
            const parsedState = JSON.parse(storedCanvasState);
            const allObjects = parsedState.objects; // Access all objects in the canvas state

            // Iterate through all objects to find and update 'Bus' objects with the matching voltage
            allObjects.forEach((obj) => {
                let setBusColor;

                if (obj.elementCategory === "Bus") {
                    // Find the voltage property of the bus
                    const voltageProperty = obj.canvasProperty?.find(
                        (prop) => prop.propertyName === "fBuskV"
                    );
                    // Check if the voltage matches
                    if (voltageProperty?.propertyValue === busVoltage) {
                        // Update the color properties
                        setBusColor = addHashPrefix(busColor);
                        obj.stroke = setBusColor;
                        obj.fill = setBusColor;

                        // Update the property value in `canvasProperty`
                        const colorProperty = obj.canvasProperty?.find(
                            (prop) => prop.propertyName === "iColor"
                        );
                        if (colorProperty) {
                            colorProperty.propertyValue = busColor;
                        } else {
                            // Add a new color property if not already present
                            obj.canvasProperty = [
                                ...(obj.canvasProperty || []),
                                {
                                    propertyName: "iColor",
                                    propertyValue: busColor,
                                },
                            ];
                        }
                        allObjects.forEach((lineObj) => {
                            if (lineObj.elementType === "line") {
                                const { fromBus, toBus } =
                                    identifyConnectedBuses(lineObj);
                                if (fromBus && toBus) {
                                    if (
                                        fromBus.id === obj.id ||
                                        toBus.id === obj.id
                                    ) {
                                        lineObj.stroke = setBusColor;
                                    }
                                }
                            }
                        });
                        console.log(
                            `Updated Bus Object in Canvas ${canvasId}:`,
                            obj
                        );
                    }
                }
                if (
                    [
                        "Load",
                        "Generator",
                        "Filter",
                        "Induction Motor",
                        "Shunt Device",
                    ].includes(obj.elementCategory)
                ) {
                    allObjects.forEach((lineObj) => {
                        if (lineObj.elementType === "line") {
                            // const { fromShunt, toShunt } = identifyConnectedShuntElements(lineObj);
                            if (obj.id === lineObj.toObjectId) {
                                obj.stroke = lineObj.stroke;
                                let insideObjects = obj.objects;
                                insideObjects.forEach((element) => {
                                    element.stroke = lineObj.stroke;
                                });
                            }
                        }
                    });
                }
            });

            // Loop through all objects to find transformers, buses, and set colors
            allObjects.forEach((obj) => {
                if (
                    obj.elementCategory === "Two winding transformer" &&
                    Array.isArray(obj.connectingLine)
                ) {
                    const [lineId1, lineId2] = obj.connectingLine; // Line IDs connecting to the transformer

                    // Find connected buses for each line
                    const { fromBus: bus1, toBus: bus2 } =
                        findConnectedBus(lineId1) || {};
                    const { fromBus: bus3, toBus: bus4 } =
                        findConnectedBus(lineId2) || {};

                    const connectedBuses = [bus1, bus2, bus3, bus4].filter(
                        Boolean
                    ); // Remove nulls
                    if (connectedBuses.length < 2) return; // Ensure there are two buses connected

                    // Assign the first two buses (assuming no more than two unique buses are connected)
                    const [busObj1, busObj2] = connectedBuses;

                    // Retrieve bus colors
                    const validatedBus1Color = addHashPrefix(
                        busObj1?.canvasProperty.find(
                            (item) => item.propertyName === "iColor"
                        )?.propertyValue || "black"
                    );
                    const validatedBus2Color = addHashPrefix(
                        busObj2?.canvasProperty.find(
                            (item) => item.propertyName === "iColor"
                        )?.propertyValue || "black"
                    );

                    // Assuming transformer has grouped objects (ellipses representing connections)
                    const groupedObject = obj;
                    const ellipse1 = groupedObject.objects[0]; // First ellipse (left)
                    const ellipse2 = groupedObject.objects[1]; // Second ellipse (right)

                    // Assign colors to ellipses based on bus proximity
                    if (busObj1.left < groupedObject.left) {
                        ellipse1.stroke = validatedBus2Color;
                        ellipse2.stroke = validatedBus1Color;
                    } else {
                        ellipse1.stroke = validatedBus1Color;
                        ellipse2.stroke = validatedBus2Color;
                    }
                }

                // Color text elements based on their linked object
                if (obj.elementType === "text" && obj.textlinkedObjectId) {
                    const linkedObject = findLinkedObject(
                        obj.textlinkedObjectId
                    );
                    if (linkedObject) {
                        const linkedColor = linkedObject.stroke || "black"; // Use stroke color of the linked object
                        const validatedColor = addHashPrefix(linkedColor);
                        obj.fill = validatedColor; // Set text color
                    }
                }
            });
            // Save the updated canvas state back to localStorage
            localStorage.setItem(
                `canvasState_tab${canvasId}`,
                JSON.stringify({
                    ...parsedState,
                    objects: allObjects,
                })
            );
        });

        // console.log(`All buses with voltage ${busVoltage} updated to color ${busColor}.`);
    };

    useEffect(() => {
        const canvas = fabricCanvasRef.current; // Reference to your Fabric.js canvas
        if (canvas == null) return;
        // console.log(state.isEditPopupOpen)
        // console.log(state.defaultvoltagebuscolor)
        var activeObject = fabricCanvasRef.current?.getActiveObject();
        let activeBusVolatage = null;
        let activeBusColor = null;

        // Retrieve all objects from the canvas
        const allObjects = canvas.getObjects();
        if (allObjects.length === 0) return; // Exit if no objects are available

        if (
            activeObject &&
            activeObject.elementCategory === "Bus" &&
            !state.isEditPopupOpen
        ) {
            let currentVoltageOfbus =
                activeObject.canvasProperty.find(
                    (item) => item.propertyName === "fBuskV"
                )?.propertyValue || "220";

            let colorOfBusIfPresentPreviously =
                state.voltageColors[currentVoltageOfbus];
            if (colorOfBusIfPresentPreviously) {
                let setBusColor = addHashPrefix(colorOfBusIfPresentPreviously);
                activeObject.set({ stroke: setBusColor });
                activeObject.set({ fill: setBusColor });
                // Update the canvas property for the bus
                let iColorProperty = activeObject.canvasProperty.find(
                    (item) => item.propertyName === "iColor"
                );
                if (iColorProperty) {
                    iColorProperty.propertyValue =
                        colorOfBusIfPresentPreviously;
                }
                console.log("Bus Voltage with color is present");
            }
        }

        if (activeObject && activeObject.elementCategory === "Bus") {
            activeBusVolatage =
                activeObject.canvasProperty.find(
                    (item) => item.propertyName === "fBuskV"
                )?.propertyValue || "220";
            activeBusColor =
                activeObject.canvasProperty.find(
                    (item) => item.propertyName === "iColor"
                )?.propertyValue || "black";
            // if(state.isEditPopupOpen){
            updateBusColorInAllGUI(activeBusVolatage, activeBusColor);

            // }
        }
        // Function to identify the connected buses for a given line (polyline)
        const identifyConnectedBuses = (line) => {
            const fromBus = allObjects.find(
                (obj) => obj.id === line.fromObjectId
            );
            const toBus = allObjects.find((obj) => obj.id === line.toObjectId);
            return { fromBus, toBus };
        };

        // Function to identify connected shunt elements for a given line
        const identifyConnectedShuntElements = (line) => {
            // const fromShunt = allObjects.find(obj => obj.id === line.fromObjectId && ["Load", "Generator", "Filter", "Induction Motor"].includes(obj.elementCategory));
            const toShunt = allObjects.find(
                (obj) =>
                    obj.id === line.toObjectId &&
                    ["Load", "Generator", "Filter", "Induction Motor"].includes(
                        obj.elementCategory
                    )
            );
            return { toShunt };
        };

        // Identify connected buses for the transformer
        // Function to find a bus connected to a line
        const findConnectedBus = (lineId) => {
            const line = allObjects.find(
                (obj) => obj.id === lineId && obj.elementType === "line"
            );
            if (!line) return null;

            const fromBus = allObjects.find(
                (obj) =>
                    obj.id === line.fromObjectId &&
                    obj.elementCategory === "Bus"
            );
            const toBus = allObjects.find(
                (obj) =>
                    obj.id === line.toObjectId && obj.elementCategory === "Bus"
            );

            return { fromBus, toBus };
        };

        // Find the object linked to a text element
        const findLinkedObject = (linkedObjectId) => {
            return allObjects.find((obj) => obj.id === linkedObjectId);
        };

        // Loop through all objects to find buses and lines, and then set stroke colors
        allObjects.forEach((obj) => {
            if (obj.elementCategory === "Bus") {
                let validatedBusColor;
                let busColor =
                    obj.canvasProperty.find(
                        (item) => item.propertyName === "iColor"
                    )?.propertyValue || "black";

                if (!state.isEditPopupOpen) {
                    let objVolatage =
                        obj.canvasProperty.find(
                            (item) => item.propertyName === "fBuskV"
                        )?.propertyValue || "220";
                    if (
                        activeBusColor &&
                        objVolatage &&
                        activeBusVolatage &&
                        objVolatage == activeBusVolatage
                    ) {
                        busColor = activeBusColor;

                        const propertyItem = obj.canvasProperty.find(
                            (item) => item.propertyName === "iColor"
                        );
                        if (propertyItem) {
                            propertyItem.propertyValue = activeBusColor;
                        }
                        let defaultVoltage = obj.canvasProperty.find(
                            (item) => item.propertyName === "fBuskV"
                        )?.defaultValue;
                        if (objVolatage == defaultVoltage) {
                            let setDefaultBusColor = addHashPrefix(busColor);
                            dispatch({
                                type: "SET_DEFAULT_VOLTAGE_BUS_COLOR",
                                payload: setDefaultBusColor,
                            });
                        }
                    }

                    validatedBusColor = addHashPrefix(busColor);
                    obj.set({ stroke: validatedBusColor });
                    obj.set({ fill: validatedBusColor });
                }
                allObjects.forEach((lineObj) => {
                    if (lineObj.elementType === "line") {
                        const { fromBus, toBus } =
                            identifyConnectedBuses(lineObj);
                        if (fromBus && toBus) {
                            if (fromBus.id === obj.id || toBus.id === obj.id) {
                                lineObj.set({
                                    stroke: validatedBusColor,
                                });
                            }
                        }
                    }
                });
            }

            if (
                [
                    "Load",
                    "Generator",
                    "Filter",
                    "Induction Motor",
                    "Shunt Device",
                ].includes(obj.elementCategory)
            ) {
                // const shuntColor = obj.canvasProperty.find(item => item.propertyName === "iColor")?.propertyValue || "black";
                // const validatedShuntColor = addHashPrefix(shuntColor);
                // obj.set({ stroke: validatedShuntColor });

                allObjects.forEach((lineObj) => {
                    if (lineObj.elementType === "line") {
                        // const { fromShunt, toShunt } = identifyConnectedShuntElements(lineObj);
                        if (obj.id === lineObj.toObjectId) {
                            obj.set({
                                stroke: lineObj.stroke,
                            });
                            obj.forEachObject((element) => {
                                element.set({
                                    // fill: null,
                                    stroke: lineObj.stroke,
                                });
                            });
                        }
                    }
                });
            }
        });
        // Loop through all objects to find transformers, buses, and set colors
        allObjects.forEach((obj) => {
            if (
                obj.elementCategory === "Two winding transformer" &&
                Array.isArray(obj.connectingLine)
            ) {
                const [lineId1, lineId2] = obj.connectingLine; // Line IDs connecting to the transformer

                // Find connected buses for each line
                const { fromBus: bus1, toBus: bus2 } =
                    findConnectedBus(lineId1) || {};
                const { fromBus: bus3, toBus: bus4 } =
                    findConnectedBus(lineId2) || {};

                const connectedBuses = [bus1, bus2, bus3, bus4].filter(Boolean); // Remove nulls
                if (connectedBuses.length < 2) return; // Ensure there are two buses connected

                // Assign the first two buses (assuming no more than two unique buses are connected)
                const [busObj1, busObj2] = connectedBuses;

                // Retrieve bus colors
                const validatedBus1Color = addHashPrefix(
                    busObj1?.canvasProperty.find(
                        (item) => item.propertyName === "iColor"
                    )?.propertyValue || "black"
                );
                const validatedBus2Color = addHashPrefix(
                    busObj2?.canvasProperty.find(
                        (item) => item.propertyName === "iColor"
                    )?.propertyValue || "black"
                );

                // Assuming transformer has grouped objects (ellipses representing connections)
                const groupedObject = obj;
                const ellipse1 = groupedObject._objects[0]; // First ellipse (left)
                const ellipse2 = groupedObject._objects[1]; // Second ellipse (right)

                // Assign colors to ellipses based on bus proximity
                if (busObj1.left < groupedObject.left) {
                    ellipse1.set({
                        stroke: validatedBus2Color,
                    });
                    ellipse2.set({
                        stroke: validatedBus1Color,
                    });
                } else {
                    ellipse1.set({
                        stroke: validatedBus1Color,
                    });
                    ellipse2.set({
                        stroke: validatedBus2Color,
                    });
                }
            }

            // Color text elements based on their linked object
            if (obj.elementType === "text" && obj.textlinkedObjectId) {
                const linkedObject = findLinkedObject(obj.textlinkedObjectId);
                if (linkedObject) {
                    const linkedColor = linkedObject.stroke || "black"; // Use stroke color of the linked object
                    const validatedColor = addHashPrefix(linkedColor);
                    obj.set({ fill: validatedColor }); // Set text color
                }
            }
        });

        // Re-render the canvas to apply the color changes
        canvas.renderAll();

        // Cleanup function to reset colors when selection changes
        return () => {
            canvas.renderAll(); // Re-render the canvas to apply changes
        };
    }, [
        selectedElement,
        state.clicked,
        state.dropped,
        state.position,
        // state.isEditPopupOpen,
        state.selectedElement,
    ]); // Dependency on selected element and bus objects

    useEffect(() => {
        if (state.isEditPopupOpen) {
            // Ensure canvasInstance is updated before opening the popup
            const objects = fabricCanvasRef.current
                ? fabricCanvasRef.current.getObjects()
                : [];
            setCanvasObjects(objects); // Assuming setCanvasInstance is your state updater
        }
    }, [state.isEditPopupOpen]);
    // const minimapWrapper = document.createElement('div');
    // minimapWrapper.id = 'minimapWrapper';


    function getScaleFactor() {
        const minimapSize = 400; 
        const maxDimension = Math.max(
            fabricCanvasRef.current.width,
            fabricCanvasRef.current.height
        );
        return minimapSize / maxDimension;
    }

    
    function updateMinimap() {
        const mainCanvas = fabricCanvasRef.current;
        const minimapCanvas = fabricCanvasRef.currentMinimap;
        if (!mainCanvas || !minimapCanvas) return;

        const canvasContent = document.querySelector(".canvas-content");
        if (!canvasContent) return;


        const containerWidth = canvasContent.clientWidth;
        const containerHeight = canvasContent.clientHeight;

        const scrollLeft = canvasContent.scrollLeft;
        const scrollTop = canvasContent.scrollTop;

        const mainWidth = mainCanvas.getWidth();
        const mainHeight = mainCanvas.getHeight();

        const aspectRatio = mainWidth / mainHeight;
        let minimapWidth, minimapHeight;
        if (aspectRatio > 1) {
            minimapWidth = 300;
            minimapHeight = minimapWidth / aspectRatio;
        } else {
            minimapHeight = 300;
            minimapWidth = minimapHeight * aspectRatio;
        }
        minimapCanvas.setWidth(minimapWidth);
        minimapCanvas.setHeight(minimapHeight);

        const scaleX = minimapWidth / mainWidth;
        const scaleY = minimapHeight / mainHeight;

        minimapCanvas.clear();

        const dataURL = mainCanvas.toDataURL({ format: "png", quality: 0.5 });

        fabric.Image.fromURL(dataURL, (img) => {
            img.set({
                scaleX: scaleX,
                scaleY: scaleY,
                left: 0,
                top: 0,
                selectable: false,
                evented: false,
            });
            minimapCanvas.add(img);

            const viewport = new fabric.Rect({
                left: scrollLeft * scaleX,
                top: scrollTop * scaleY,
                width: containerWidth * scaleX,
                height: containerHeight * scaleY,
                fill: "rgba(0, 0, 255, 0.2)",
                stroke: "blue",
                name: "viewport",
                selectable: true,
                hasControls: false,
            });

            viewport.on("moving", () => {
                if (viewport.left < 0) viewport.left = 0;
                if (viewport.top < 0) viewport.top = 0;
                if (viewport.left + viewport.width > minimapCanvas.getWidth()) {
                    viewport.left = minimapCanvas.getWidth() - viewport.width;
                }
                if (viewport.top + viewport.height > minimapCanvas.getHeight()) {
                    viewport.top = minimapCanvas.getHeight() - viewport.height;
                }

                canvasContent.scrollLeft = viewport.left / scaleX;
                canvasContent.scrollTop = viewport.top / scaleY;
            });

            minimapCanvas.add(viewport);
            minimapCanvas.bringToFront(viewport);
            minimapCanvas.renderAll();

            canvasContent.addEventListener("scroll", () => {
                viewport.set({
                    left: canvasContent.scrollLeft * scaleX,
                    top: canvasContent.scrollTop * scaleY,
                });
                viewport.setCoords();
                minimapCanvas.renderAll();
            });
        });
    }


    const handleObjectMoving = (e) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();

        let expandWidth = 0;
        let expandHeight = 0;

        const object = e?.target || canvas.getActiveObject();
        if (!object) return;

        object.setCoords();
        let textBound = 0;

        const textObj = canvas.getObjects().find((o) => o.id === object.textId);
        if (textObj) {
            textObj.setCoords();
            textBound = textObj.getBoundingRect(true);
        }

        const boundingRect = object.getBoundingRect(true);

        if (boundingRect.left + boundingRect.width > canvasWidth) {
            expandWidth =
                Math.max(
                    expandWidth,
                    boundingRect.left + boundingRect.width - canvasWidth
                ) + 100;
        }
        if (textBound && textBound.left + textBound.width > canvasWidth) {
            expandWidth =
                Math.max(expandWidth, textBound.left + textBound.width - canvasWidth) + 100;
        }

        if (boundingRect.top + boundingRect.height > canvasHeight) {
            expandHeight = Math.max(
                expandHeight,
                boundingRect.top + boundingRect.height - canvasHeight
            );
        }
        if (textBound && textBound.top + textBound.height > canvasHeight) {
            expandHeight = Math.max(
                expandHeight,
                textBound.top + textBound.height - canvasHeight
            );
        }

        if (boundingRect.left < 0) {
            expandWidth = Math.max(expandWidth, Math.abs(boundingRect.left));
        }

        if (boundingRect.top < 0) {
            expandHeight = Math.max(expandHeight, Math.abs(boundingRect.top));
        }

        if (expandWidth > 0 || expandHeight > 0) {
            canvas.setWidth(canvasWidth + expandWidth);
            canvas.setHeight(canvasHeight + expandHeight);
            canvas.originalWidth = canvasWidth + expandWidth;
            canvas.originalHeight = canvasHeight + expandHeight;
            canvas.renderAll();
        }
    };



    useEffect(() => {
        if (canvasRef.current && !fabricCanvasRef.current) {
                fabricCanvasRef.current = new fabric.Canvas(canvasRef.current, {
                preserveObjectStacking: true,
            });
        }
        if (minimapRef.current && !fabricCanvasRef.currentMinimap) {
            fabricCanvasRef.currentMinimap = new fabric.Canvas(minimapRef.current, {
                selection: false,
                interactive: true,
            });
        }
    }, []);

    function bringAllIntoView() {
        clearTimeout(bringAllTimeout);
        bringAllTimeout = setTimeout(() => {
            bringAllIntoViewIn(60);
        }, 500);
    }
    async function bringAllIntoViewIn(padding = 10) {
        const canvas = fabricCanvasRef.current;
        const objects = canvas.getObjects();

        if (objects.length === 0) return;
        let minLeft = 0,
            minTop = 0,
            minRight = 0,
            minBottom = 0;
        objects.forEach((obj) => {
            obj.setCoords();
            let objBound = obj.getBoundingRect(true);
            let objLeft = Math.min(objBound.left, obj.left);
            let objTop = Math.min(objBound.top, obj.top);

            minLeft = Math.min(minLeft, objLeft);
            minTop = Math.min(minTop, objTop);
            minRight = Math.max(minRight, objBound.left + objBound.width);
            minBottom = Math.max(minBottom, objBound.top + objBound.height);
        });

        if (minLeft < 0) {
            const deltaX = -minLeft + padding;
            objects.forEach((obj) => {
                if (
                    obj.type === "polyline" &&
                    obj.elementCategory == "Transmission Line"
                ) {
                    obj.points.forEach((point) => {
                        point.x += deltaX;
                    });
                } else {
                    obj.set("left", obj.left + deltaX);
                }
                obj.setCoords();
            });
            if (minRight + deltaX > canvas.width) {
                canvas.setWidth(minRight + deltaX + padding);
            }
        }
        if (minTop < 0) {
            const deltaY = -minTop + padding;
            objects.forEach((obj) => {
                if (
                    obj.type === "polyline" &&
                    obj.elementCategory == "Transmission Line"
                ) {
                    obj.points.forEach((point) => {
                        point.y += deltaY;
                    });
                } else {
                    obj.set("top", obj.top + deltaY);
                }
                obj.setCoords();
            });
            if (minBottom + deltaY > canvas.height) {
                canvas.setHeight(minBottom + deltaY + padding);
            }
        }
        canvas.renderAll();
    }
    // Event for copy-paste functionality
    useEffect(() => {
        // fabricCanvasRef.current.renderAll();
        if (activeObject && state.isGUIAdded && isGUIAdded2) {
            const arrow = new fabric.Triangle({
                width: 15,
                height: 15,
                fill: "grey",
                left: 30, // Adjust to position relative to the bus
                top: 230, // Center vertically with the bus
                angle: -90, // Point left
                selectable: true, // Make the arrow unselectable
                evented: true, // Disable event handling for the arrow
                id: `arrow-head-${activeObject.id}`,
            });
            // Store arrow IDs on the bus object
            activeObject.arrowId = arrow.id;
            // Add the group to the canvas
            fabricCanvasRef.current.add(arrow);
            handlePasteObjectForNewGUI(activeObject);

            // Set the flag to trigger useEffect
            isGUIAdded2 = false;
            activeObject = null;
            // Dispatch the action to set isGUIAdded back to false
            dispatch({ type: "SET_GUI_ADDED", payload: false });
        }
    }, [activeObject, isGUIAdded2, state.isGUIAdded]);

    // Reinitialize objects with custom properties and event listeners
    const reinitializeObjects = () => {
        reattachListeners();
        fabricCanvasRef.current.getObjects().forEach((obj) => {
            // // Reattach event listeners
            if (obj.type === "svg") {
                obj.on("mousedown", () => {
                    console.log("Object clicked: ", obj);
                });
            }

            // Restore custom methods
            if (obj.elementCategory === "Bus") {
                obj.setControlsVisibility({
                    bl: false,
                    br: false,
                    tl: false,
                    tr: false,
                    ml: false,
                    mr: false,
                    mt: false,
                    mb: true,
                    mtr: false,
                });
            }
        });
    };

    const reattachListeners = () => {
        const objects = fabricCanvasRef.current.getObjects();

        objects.forEach((object) => {
            // Reattach moving and mouseup listeners for all objects

            // Attach mousedown listener only for buses
            if (object.elementCategory === "Bus") {
                console.log('bus is moving')
                // updateModifications(true);
                object.on("mousedown", () => {
                    console.log("Bus clicked!");
                });
                object.connectingElement = object.connectingElement || [];
                object.on("mousedown", handleMouseDown2);
                object.on("moving", (event) =>
                    updateSPolyline(event, "moving")
                );
                object.on("mouseup", (event) =>
                    updateSPolyline(event, "mouseup")
                );
            }
            if (object.elementCategory === "Two winding transformer") {
                object.on("mousedown", handleMouseDown);
                object.on("moving", (event) =>
                    updateSPolyline(event, "moving")
                );
                object.on("mouseup", (event) =>
                    updateSPolyline(event, "mouseup")
                );
            }
        });
    };

    function refreshCoordsForAll(polyline) {
        var dims = polyline._calcDimensions();
        polyline.set({
            width: dims.width,
            height: dims.height,
            left: dims.left,
            top: dims.top,
            pathOffset: {
                x: dims.width / 2 + dims.left,
                y: dims.height / 2 + dims.top,
            },
            dirty: true,
        });
        polyline.objectCaching = false; // Disable caching
        polyline.dirty = true;
        fabricCanvasRef.current.renderAll(); // Refresh the canvas after updating coords
    }


    // Handle mouse:down event
    const handleMouseDown2 = (options) => {
        if (isLinkObjectRef.current) {
            console.log("yes :::::::::::::::::::");

            fabricCanvasRef.current.getObjects().forEach((obj) => {
                if (obj.elementCategory !== "Bus") {
                    obj.selectable = false;
                    obj.evented = false;
                }
            });
        } else {
            console.log("no :::::::::::::::::::");
            fabricCanvasRef.current.getObjects().forEach((obj) => {
                // if (obj.elementCategory !== "Bus") {
                if (obj.orSelectable) obj.selectable = obj.orSelectable;
                if (obj.orEvented) obj.evented = obj.orEvented;
                // }
            });
        }
        const target = fabricCanvasRef.current.findTarget(options.e, true);
        //  console.log("options.target==>target:",target);
        // console.log("options.target",options.target);
        if (options.target) {
            const { x, y } = options.pointer;
            const now = new Date().getTime();
            const timeSinceLastClick = now - lastClickTimeRef.current;
            //  console.log(timeSinceLastClick)
            if (timeSinceLastClick > 300) {
                clearTimeout(clickTimeoutRef.current);
                handleDoubleClick(options.target);
                //  handleSingleClick(options.target);
            } else {
                clickTimeoutRef.current = setTimeout(() => {
                    //  handleSingleClick(options.target);
                }, 300);
            }

            lastClickTimeRef.current = now;
        }

        const currentIsLinkObject = isLinkObjectRef.current;

        if (currentIsLinkObject) {
            if (options.target && state.object1) {
                const checkValid = validatedLink(state.object1, options.target);
                if (!checkValid) {
                    const allObjLine = fabricCanvasRef.current
                        .getObjects()
                        .filter(
                            (el) =>
                                el.id === state.object1.id + "-line" &&
                                el.elementType === "line"
                        );
                    allObjLine.forEach((line) =>
                        fabricCanvasRef.current.remove(line)
                    );
                    isVaild = true;
                }
            }

            if (
                options.target &&
                options.target.name !== "grid" &&
                options.target.name !== "connectionLine"
            ) {
                if (!state.object1) {
                    // intermediaryPoints = [];
                    dispatch({
                        type: "SET_OBJECT_1",
                        payload: options.target,
                    });
                    const firstObjectCenter = options.target.getCenterPoint();
                    options.target.setCoords();
                    fabricCanvasRef.current.renderAll();
                    var objPointer = options.target.getLocalPointer();
                    console.log("options.target", objPointer);
                    var LineStartingPoints = objPointer
                        ? {
                              x: firstObjectCenter.x,
                              y: options.target.top + objPointer.y,
                          }
                        : firstObjectCenter;

                    console.log("LineStartingPoints", LineStartingPoints);
                    if ([90, -270].includes(options.target.angle)) {
                        LineStartingPoints = objPointer
                            ? {
                                  x: options.target.left + objPointer.x,
                                  y: firstObjectCenter.y,
                              }
                            : firstObjectCenter;
                    }

                    console.log("LineStartingPoints1", LineStartingPoints);
                    const selectedElement = state.elementsList.find((element) =>
                        ["Transmission Line"].includes(element.category)
                    );

                    const lineProperties =
                        addProperties(
                            selectedElement,
                            fabricCanvasRef.current.get(
                                indexData[selectedElement.category]
                            )
                        ) || "";
                    const lineCategory = selectedElement?.category || "";

                    const lineId = uuidv4();
                    const newPolyline = new fabric.Polyline(
                        [
                            {
                                x: LineStartingPoints.x,
                                y: LineStartingPoints.y,
                            },
                        ],
                        {
                            stroke: "black",
                            strokeWidth: 1,
                            fill: "transparent",
                            name: "connectionLine",
                            id: uuidv4(), //options.target.id + "-line",
                            elementType: "line",
                            isLine: true,
                            elementCategory: lineCategory,
                            canvasProperty: addProperties(
                                selectedElement,
                                fabricCanvasRef.current.get(
                                    indexData[lineCategory]
                                )
                            ),
                            isTransformerLine: false,
                        }
                    );

                    fabricCanvasRef.current.set(
                        indexData[lineCategory],
                        fabricCanvasRef.current.get(indexData[lineCategory]) + 1
                    );

                    newPolyline.set("obj1PointerData", objPointer);
                    // newPolyline.objectCaching = false;
                    newPolyline.setCoords();

                    if (state.lineProperty) {
                        const lineProperties = addProperties(
                            state.lineProperty,
                            fabricCanvasRef.current.get(
                                indexData[state.lineProperty.category]
                            )
                        );
                        newPolyline.set("canvasProperty", lineProperties);
                    }

                    fabricCanvasRef.current.add(newPolyline);
                    newPolyline.setCoords();

                    newPolyline.setCoords();
                    fabricCanvasRef.current.sendToBack(newPolyline); //arasu

                    newPolyline.setCoords();
                    fabricCanvasRef.current.renderAll();
                    if (newPolyline.group) {
                        console.error(
                            "Polyline is part of a group. Move the group instead."
                        );
                    }
                    fabricCanvasRef.current.renderAll();
                    dispatch({
                        type: "SET_CURRENT_LINE",
                        payload: newPolyline,
                    });
                } else if (!state.object2) {
                    if (state.object1.id !== options.target.id) {
                        options.target.setCoords();
                        state.object1.setCoords();
                        fabricCanvasRef.current.renderAll();

                        const obj1Center = state.object1.getCenterPoint();
                        const obj2Center = options.target.getCenterPoint();

                        // Force the polyline points to both centers
                        if (state.activePolyline) {
                            const points = [
                                { x: obj1Center.x, y: obj1Center.y },
                                { x: obj2Center.x, y: obj2Center.y }
                            ];
                            state.activePolyline.set({ points });
                            state.activePolyline.setCoords();
                            fabricCanvasRef.current.renderAll();
                        }

                        dispatch({ type: "SET_OBJECT_2", payload: options.target });
                        dispatch({ type: "LINK_OBJECT", payload: false });

                        createPolyline(
                            state.object1,
                            options.target,
                            [],
                            state.object1.id + "-line",
                            options
                        );
                    }
                }

            } else if (state.object1) {
                //!options.target &&
                console.log("state.activePolyline", state.activePolyline);
                state.activePolyline.set("selectable", false);
                fabricCanvasRef.current.renderAll();
                // Dynamically add points to the polyline
                const { x, y } = options.pointer;
                const firstObjectCenter = state.object1.getCenterPoint();
                ///================== Custom Point Calculation
                console.log("state.object1", state.object1);
                const objPointer = state.activePolyline?.obj1PointerData;
                var LineStartingPoints = objPointer
                    ? {
                          x: firstObjectCenter.x,
                          y: state.object1.top + objPointer.y,
                      }
                    : firstObjectCenter;
                if ([90, -270].includes(state.object1.angle)) {
                    LineStartingPoints = objPointer
                        ? {
                              x: state.object1.left - objPointer.x,
                              y: firstObjectCenter.y,
                          }
                        : firstObjectCenter;
                }
                if ([-90, 270].includes(state.object1.angle)) {
                    LineStartingPoints = objPointer
                        ? {
                              x: state.object1.left + objPointer.x,
                              y: firstObjectCenter.y,
                          }
                        : firstObjectCenter;
                }
                ///================== Custom Point Calculation
                let [xx, yy] =
                    intermediaryPoints.length === 0
                        ? getAlterXY(
                              LineStartingPoints.x,
                              LineStartingPoints.y,
                              x,
                              y
                          )
                        : getAlterXY(
                              intermediaryPoints[intermediaryPoints.length - 1]
                                  .x,
                              intermediaryPoints[intermediaryPoints.length - 1]
                                  .y,
                              x,
                              y
                          );

                intermediaryPoints.push({ x: xx, y: yy });

                const polylinePoints = [
                    {
                        x: firstObjectCenter.x,
                        y: LineStartingPoints.y,
                    },
                    ...intermediaryPoints,
                ];

                if (state.activePolyline) {
                    // console.log("Last Point ::::: ", state.activePolyline.points[state.activePolyline.points.length - 1]);
                    state.activePolyline.set({
                        points: polylinePoints,
                    });
                    // console.log("Last Point ::::: ", state.activePolyline.points[state.activePolyline.points.length - 1]);
                    // console.log("------------------ :::: ");
                }
                state.activePolyline.setCoords();
                refreshCoordsForAll(state.activePolyline);
                fabricCanvasRef.current.renderAll();
            }
        } else {
            fabricCanvasRef.current.selection = true;
        }
    };

    // useEffect(() => {
    //   // Initialize Fabric.js canvas
    //   const fabricCanvas = new fabric.Canvas(canvasRef.current, {
    //     width: 1150,
    //     height: 400,
    //   });

    //   fabricCanvasRef.current = fabricCanvas;

    //   // Restore canvas state if data exists
    //   if (savedData) {
    //     fabricCanvas.loadFromJSON(savedData, () => {
    //       fabricCanvas.renderAll();
    //     });
    //   }

    //   // Cleanup on unmount
    //   return () => {
    //     if (fabricCanvasRef.current) {
    //       // Save current state
    //       const currentData = fabricCanvasRef.current.toJSON();
    //       onSave(currentData);
    //       fabricCanvas.dispose();
    //     }
    //   };
    // }, [canvasId, savedData, onSave]); // Reinitialize when canvasId changes or data updates

    // const updateModifications = (savehistory) => {
    //   const canvas = fabricCanvasRef.current;
    //   if (savehistory === true) {
    //     const myjson = JSON.stringify(canvas);
    //     state.canvasState.push(myjson);
    //     dispatch({ type: "SAVE_STATE", payload: myjson });
    //   }
    // };
    let debounceTimeout;

    const updateModifications = (savehistory) => {
        clearTimeout(debounceTimeout);

        debounceTimeout = setTimeout(() => {
            const canvas = fabricCanvasRef.current;
            if (savehistory === true && savehistoryEnabled.current) {
                const myjson = JSON.stringify(canvas.toJSON(allproperties));
                if (!undoJson.current) undoJson.current = [];
                undoJson.current.push(myjson);
                // console.log("undoJson.current.length :::: ", undoJson.current.length);

                // state.canvasState.push(myjson);
                dispatch({
                    type: "SAVE_STATE",
                    payload: myjson,
                });
            }
        }, 200);
    };

    const undo = () => {
        const canvas = fabricCanvasRef.current;
        if (undoJson.current && undoJson.current.length > 0) {
            savehistoryEnabled.current = false;
            canvas.clear().renderAll();
            console.log("undoJson.current :::: ", undoJson.current.length);

            canvas.loadFromJSON(undoJson.current[undoJson.current.length - 2]);

            canvas.renderAll();
            setTimeout(() => {
                if (!redoJson.current) redoJson.current = [];
                redoJson.current.push(
                    undoJson.current[undoJson.current.length - 1]
                );
                undoJson.current.pop();
                console.log("undoJson.current2 :::: ", undoJson.current.length);
                savehistoryEnabled.current = true;
            }, 300);
            const mods = state.canvasMods + 1;

            dispatch({
                type: "SAVE_MODS",
                payload: state.canvasMods + 1,
            });
            dispatch({ type: "UNDO_STATE", payload: false });
        }
        // const canvas = fabricCanvasRef.current;
        // // if (state.canvasMods < state.canvasState.length) {
        // //   canvas.clear().renderAll();
        // //   canvas.loadFromJSON(
        // //     state.canvasState[state.canvasState.length - 1 - state.canvasMods - 1]
        // //   );
        // //   canvas.renderAll();
        // //   //console.log("geladen " + (state.length-1-mods-1));
        // //   console.log("state " + state.length);
        // //   const mods = state.canvasMods + 1;

        // //   dispatch({ type: "SAVE_MODS", payload: state.canvasMods + 1 });
        // //   //console.log("mods " + mods);
        // //   dispatch({ type: "UNDO_STATE", payload: false });
        // // }
        // const recentJson = undoJson.current[undoJson.current.length - 1];
        // // undoJson.push(myjson);
        //   console.log("undoJson :::: ", undoJson);
        //   console.log("recentJson :::: ", recentJson);
    };

    const redo = () => {
        const canvas = fabricCanvasRef.current;
        if (redoJson.current && redoJson.current.length > 0) {
            savehistoryEnabled.current = false;
            canvas.clear().renderAll();
            canvas.loadFromJSON(redoJson.current[redoJson.current.length - 1]);

            canvas.renderAll();
            setTimeout(() => {
                if (!undoJson.current) undoJson.current = [];
                undoJson.current.push(
                    redoJson.current[redoJson.current.length - 1]
                );
                redoJson.current.pop();
                savehistoryEnabled.current = true;
            }, 300);
            // const mods = state.canvasMods + 1;

            dispatch({
                type: "SAVE_MODS",
                payload: state.canvasMods - 1,
            });
            dispatch({ type: "REDO_STATE", payload: false });
        }
        // const canvas = fabricCanvasRef.current;
        // if (state.canvasMods > 0) {
        //   canvas.clear().renderAll();
        //   canvas.loadFromJSON(
        //     state.canvasState[state.canvasState.length - 1 - state.canvasMods + 1]
        //   );
        //   canvas.renderAll();
        //   //console.log("geladen " + (state.length-1-mods+1));

        //   dispatch({ type: "SAVE_MODS", payload: state.canvasMods - 1 });
        //   //console.log("state " + state.length);
        //   //console.log("mods " + mods);
        //   dispatch({ type: "REDO_STATE", payload: false });
        // }
    };

    useEffect(() => {
        if (!fabricCanvasRef.current) return;

        const canvas = fabricCanvasRef.current;
        let expandedLeft = false;
        let expandedTop = false;
        let expandedRight = false;
        let expandedBottom = false;

        const buffer = 50;

        const handleMoving = (event) => {
            const obj = event.target;

            if (!obj) return;

            obj.setCoords();
            if (
            [
                "Bus",
                "Generator",
                "Load",
                "Shunt Device",
                "Filter",
                "Induction Motor",
                "Two winding transformer",
            ].includes(obj.elementCategory)
            ) {
                updateSPolyline(event, "moving");
            }

            const buffer = 50;

            obj.setCoords();
            const leftEdge   = obj.left;
            const topEdge    = obj.top;
            const rightEdge  = obj.left + obj.width * obj.scaleX;
            const bottomEdge = obj.top + obj.height * obj.scaleY;


            if (!expandedRight && rightEdge > canvas.width - buffer) {
                canvas.setWidth(canvas.width + 200);
                expandedRight = true;
                canvas.renderAll();
                updateMinimap();
            }

            if (!expandedBottom && bottomEdge > canvas.height - buffer) {
                canvas.setHeight(canvas.height + 200);
                expandedBottom = true;
                canvas.renderAll();
                updateMinimap();

            }

            if (!expandedLeft && leftEdge < buffer) {
                canvas.setWidth(canvas.width + 200);

                canvas.getObjects().forEach((o) => {
                    o.left += 200; // shift all objects
                    o.setCoords(); // recalc bounding boxes for hit detection
                });

                obj.setCoords();
                obj.left += 200;
                
                canvas.renderAll();
                updateMinimap();
                expandedLeft = true;
            }

            if (!expandedTop && topEdge < buffer) {
                canvas.setHeight(canvas.height + 200);

                canvas.getObjects().forEach((o) => {
                    o.top += 200;
                });

                obj.setCoords();
                obj.top += 200;
                canvas.renderAll();
                updateMinimap();
                
                expandedTop = true;
            }
        };

        const resetFlags = () => {
            expandedLeft = expandedTop = expandedRight = expandedBottom = false;
        };


        canvas.on("object:moving", handleMoving);
        canvas.on("object:modified", resetFlags);

        return () => {
            canvas.off("object:moving", handleMoving);
            canvas.off("object:modified", resetFlags);
        };
    }, []);


    useEffect(() => {
        if (state.redoStack) {
            redo();
        }
        if (state.undoStack) {
            undo();
        }
    }, [state.redoStack, state.undoStack]);
    

    const createPolyline = (firstObject, secondObject, points, lineId, opt) => {
        firstObject.setCoords();
        secondObject.setCoords();
        fabricCanvasRef.current.renderAll();

        const { x, y } = opt.pointer;
        //console.log("state.activePolyline",state.activePolyline);
        const firstObjectCenter = firstObject.getCenterPoint();
        const secondObjectCenter = secondObject.getCenterPoint();

        const rect = canvasRef.current.getBoundingClientRect();
        const getPointer = secondObject.getLocalPointer();

        // Create a polyline or update it dynamically
        const currentPlyline = state.activePolyline;
        ///console.log("currentPlyline",currentPlyline);
        const obj1Pointer = currentPlyline?.obj1PointerData;
        let LineStartingPoints = obj1Pointer
            ? {
                  x: firstObjectCenter.x,
                  y: state.object1.top + obj1Pointer.y,
              }
            : firstObjectCenter;

        if ([90, -270].includes(firstObject.angle)) {
            console.log("A ==========")
            LineStartingPoints = obj1Pointer
                ? {
                      x: state.object1.left - obj1Pointer.x,
                      y: firstObjectCenter.y,
                  }
                : firstObjectCenter;
        }
        if ([270, -90].includes(firstObject.angle)) {
            console.log("B ==========")

            LineStartingPoints = obj1Pointer
                ? {
                      x: state.object1.left + obj1Pointer.x,
                      y: firstObjectCenter.y,
                  }
                : firstObjectCenter;
        }

        let LineEndingPoints = getPointer
            ? {
                  x: secondObjectCenter.x,
                  y: secondObject.top + getPointer.y,
              }
            : secondObjectCenter;

        if ([90, -270].includes(secondObject.angle)) {
            console.log("C ==========")

            LineEndingPoints = getPointer
                ? {
                      x: secondObjectCenter.x,
                      y: secondObjectCenter.y,
                  }
                : secondObjectCenter;
            LineEndingPoints.x = x;
            console.log("LineEndingPoints", LineEndingPoints);
            console.log("LineEndingPoints.getPointer", getPointer);
        }
        if ([-90, 270].includes(secondObject.angle)) {
            console.log("D ==========")

            LineEndingPoints = getPointer
                ? {
                      x: secondObject.left + getPointer.x,
                      y: secondObjectCenter.y,
                  }
                : secondObjectCenter;
            LineEndingPoints.x = x;
        }

        // Add the start point (center of the first object)
        const polylinePoints = [
            // { x: LineStartingPoints.x, y: LineStartingPoints.y },
            state.activePolyline
                ? state.activePolyline.points[0]
                : {
                      x: LineStartingPoints.x,
                      y: LineStartingPoints.y,
                  },
            ...points, // Intermediary points added by the user
            { x: LineEndingPoints.x, y: LineEndingPoints.y }, // End point (center of second object)
        ];

        let leftOffsetofPoint1withObject2 =
            LineEndingPoints.x - secondObject.left;
        let topOffsetofPoint1withObject2 =
            LineEndingPoints.y - secondObject.top;
        let rightOffsetofPoint1withObject2 =
            secondObject.width - leftOffsetofPoint1withObject2;
        let bottomOffsetofPoint1withObject2 =
            secondObject.height - topOffsetofPoint1withObject2;

        if (currentPlyline) {
            //  const allObjLine = fabricCanvasRef.current.getObjects().filter(el =>el.id === state.object1.id+"-line" && el.elementType=="line");
            // console.log("Last Point ::::: ", state.activePolyline.points[state.activePolyline.points.length - 1]);
            // state.activePolyline.set({ points: polylinePoints });
            state.activePolyline.set({
                points: polylinePoints,
                rightOffset2: rightOffsetofPoint1withObject2,
                topOffset2: topOffsetofPoint1withObject2,
                bottomOffset2: bottomOffsetofPoint1withObject2,
            });
            // console.log("Last Point ::::: ", state.activePolyline.points[state.activePolyline.points.length - 1]);
            // console.log("---------------- :::: ");
            state.activePolyline.set({
                obj2PointerData: getPointer,
            });

            state.activePolyline.set({
                oldLeft: state.activePolyline.left,
                oldTop: state.activePolyline.top,
            });
            refreshCoordsForAll(state.activePolyline);
        } else {
            const newLineId = uuidv4();
            const activePolyline = new fabric.Polyline(polylinePoints, {
                stroke: "black",
                strokeWidth: 1,
                fill: "transparent",
                selectable: false,
                name: "connectionLine",
                id: newLineId,
                lineId: newLineId,
                isLine: true,
                isTransformerLine: false,
                elementType: "line",
                objectCaching: false,
                preserveObjectStacking: true,
                perPixelTargetFind: true,
                hasBorders: false,
                hasControls: false,
            });
            dispatch({
                type: "SET_CURRENT_LINE",
                payload: activePolyline,
            });

            fabricCanvasRef.current.add(activePolyline);

            //fabricCanvasRef.current.sendToBack(activePolyline);
            activePolyline.moveTo(0);
            fabricCanvasRef.current.requestRenderAll();
        }

        if (firstObject) {
            if (!Array.isArray(firstObject.connectingLine)) {
                firstObject.connectingLine = [];
            }
            firstObject.connectingLine.push(currentPlyline?.id);
        }

        if (secondObject) {
            if (!Array.isArray(secondObject.connectingLine)) {
                secondObject.connectingLine = [];
            }
            secondObject.connectingLine.push(currentPlyline?.id);
        }


        currentPlyline.set("fromObjectId", firstObject.id);
        currentPlyline.set("toObjectId", secondObject.id);

        const formData = {
            sFromBusName: firstObject?.canvasProperty?.[1]?.propertyValue || "",
            sToBusName: secondObject?.canvasProperty?.[1]?.propertyValue || "",
        };


        currentPlyline.set(
            "canvasProperty",
            updateProperties(state.activePolyline.canvasProperty, formData)
        );
        //currentPlyline.setCoords();
        refreshCoordsForAll(currentPlyline);
        fabricCanvasRef.current.renderAll();
    };

    const lastClickTimeRef = useRef(0);
    const clickTimeoutRef = useRef(null);
    useEffect(() => {
        let intermediaryPoints = [];
        let isVaild = false;
        const handleObjectAdded = (event) => {
            const addedObject = event.target;
            // if (addedObject.type === "polyline") {
            //   // console.log("A polyline was added with ID:", addedObject.id840);
            // }
            fabricCanvasRef.current.renderAll();
            // console.log("updateModifications calling 953");
            updateModifications(true);
        };
        fabricCanvasRef.current.on("object:added", handleObjectAdded);

        // useRef to persist values across renders without causing re-renders
        // Function for alternating x, y coordinates
        function getAlterXY(x1, y1, x2, y2) {
            const width = Math.abs(x2 - x1);
            const height = Math.abs(y2 - y1);
            let xx, yy;
            if (width > height) {
                yy = y1;
                xx = x2;
            } else {
                yy = y2;
                xx = x1;
            }
            return [xx, yy];
        }

        // Handle mouse:down event
        const handleMouseDown = (options) => {
            if (isLinkObjectRef.current) {
                // console.log("yes1 :::::::::::::::::::");

                fabricCanvasRef.current.getObjects().forEach((obj) => {
                    if (obj.elementCategory !== "Bus") {
                        obj.selectable = false;
                        obj.evented = false;
                    }
                });
            } else {
                // console.log("no1 :::::::::::::::::::");
                fabricCanvasRef.current.getObjects().forEach((obj) => {
                    if (obj.elementCategory !== "Bus") {
                        obj.selectable = true;
                        obj.evented = true;
                    }
                });

            }

            // fabricCanvasRef.current.getObjects().forEach((obj) => {
            //     console.log(obj.type, obj.elementCategory, obj.selectable, obj.evented);
            // });

            const target = fabricCanvasRef.current.findTarget(options.e, true);
            //  console.log("options.target==>target:",target);
            // console.log("options.target",options.target);
            if (options.target) {
                if (options.target.elementCategory == "Bus") {
                    options.target.hasControls = true;
                    options.target.setControlsVisibility({
                        bl: false,
                        br: false,
                        tl: false,
                        tr: false,
                        ml: false,
                        mr: false,
                        mt: false,
                        mb: true,
                        mtr: false,
                    });
                }
                const now = new Date().getTime();
                const timeSinceLastClick = now - lastClickTimeRef.current;

                if (timeSinceLastClick < 300) {
                    clearTimeout(clickTimeoutRef.current);
                    handleDoubleClick(options.target);
                    handleSingleClick(options.target);
                } else {
                    // if(state.isZoomEnabled){
                    // return false;
                    fabricCanvasRef.current.getObjects().forEach((obj) => {
                        // obj.selectable = !state.isZoomEnabled;
                        obj.evented = !state.isZoomEnabled; // optional: prevent hover/click events
                    });
                    // }
                    clickTimeoutRef.current = setTimeout(() => {
                        handleSingleClick(options.target);
                    }, 300);
                }

                lastClickTimeRef.current = now;
            } else {
                const now = new Date().getTime();
                const timeSinceLastClick = now - lastClickTimeRef.current;
                if (timeSinceLastClick < 300) {
                    handleDoubleClick("", options.e);
                }
                lastClickTimeRef.current = now;
            }

            const currentIsLinkObject = isLinkObjectRef.current;
            console.log('currentIsLinkObject :', currentIsLinkObject);

            if (currentIsLinkObject) {
                if (options.target && state.object1) {
                    const checkValid = validatedLink(
                        state.object1,
                        options.target
                    );
                    if (!checkValid) {
                        const allObjLine = fabricCanvasRef.current
                            .getObjects()
                            .filter(
                                (el) =>
                                    el.id === state.object1.id + "-line" &&
                                    el.elementType === "line"
                            );
                        allObjLine.forEach((line) =>
                            fabricCanvasRef.current.remove(line)
                        );
                        isVaild = true;
                    }
                }

                if (options.target && options.target.name !== "grid" && options.target.name !== "connectionLine") {
                    console.log("1 -------------------------------------");
                    if (!state.object1) {
                        if (state.isSelectedTransformer) {
                            getBusDataForTransformer(options.target);
                        }

                        intermediaryPoints = [];
                        dispatch({
                            type: "SET_OBJECT_1",
                            payload: options.target,
                        });
                        const firstObjectCenter =
                            options.target.getCenterPoint();
                        options.target.setCoords();

                        fabricCanvasRef.current.renderAll();
                        var objPointer = options.target.getLocalPointer();
                        console.log("options.target", objPointer);
                        const { x, y } = options.pointer;
                        var LineStartingPoints = objPointer
                            ? {
                                  x: firstObjectCenter.x,
                                  y: options.target.top + objPointer.y,
                              }
                            : firstObjectCenter;

                        console.log(
                            "LineStartingPoints :::: ",
                            LineStartingPoints
                        );
                        if ([90, -270, 270].includes(options.target.angle)) {
                            //****** need to update start point */
                            LineStartingPoints = objPointer
                                ? {
                                      // x: options.target.left + objPointer.x,
                                      x: x,
                                      y: firstObjectCenter.y,
                                  }
                                : firstObjectCenter;
                        }

                        console.log(
                            "LineStartingPoints1 :::: ",
                            LineStartingPoints
                        );
                        const selectedElement = state.elementsList.find(
                            (element) =>
                                ["Transmission Line"].includes(element.category)
                        );

                        const lineProperties =
                            addProperties(
                                selectedElement,
                                fabricCanvasRef.current.get(
                                    indexData[selectedElement.category]
                                )
                            ) || "";
                        const lineCategory = selectedElement?.category || "";

                        const lineId = uuidv4();
                        console.log("poly line start here :::: ");

                        let leftOffsetofPoint1withObject1 =
                            LineStartingPoints.x - options.target.left;
                        let topOffsetofPoint1withObject1 =
                            LineStartingPoints.y - options.target.top;
                        let rightOffsetofPoint1withObject1 =
                            options.target.width -
                            leftOffsetofPoint1withObject1;
                        let bottomOffsetofPoint1withObject1 =
                            options.target.height -
                            topOffsetofPoint1withObject1;

                        const newPolyline = new fabric.Polyline(
                            [
                                {
                                    x: LineStartingPoints.x,
                                    y: LineStartingPoints.y,
                                },
                            ],
                            {
                                stroke: "black",
                                strokeWidth: 1,
                                fill: "transparent",
                                name: "connectionLine",
                                id: uuidv4(), //options.target.id + "-line",
                                elementType: "line",
                                perPixelTargetFind: true,
                                isLine: true,
                                elementCategory: lineCategory,
                                canvasProperty: addProperties(
                                    selectedElement,
                                    fabricCanvasRef.current.get(
                                        indexData[lineCategory]
                                    )
                                ),
                                isTransformerLine: false,
                                rightOffset: rightOffsetofPoint1withObject1,
                                bottomOffset: bottomOffsetofPoint1withObject1,
                                topOffset: topOffsetofPoint1withObject1,
                                leftOffset: leftOffsetofPoint1withObject1,
                            }
                        );

                        fabricCanvasRef.current.set(
                            indexData[lineCategory],
                            fabricCanvasRef.current.get(
                                indexData[lineCategory]
                            ) + 1
                        );
                        newPolyline.on("moving", (event) =>
                            updateTextForLineObject(event)
                        );
                        newPolyline.on("scaling", (event) =>
                            updateTextForLineObject(event)
                        );
                        newPolyline.set("obj1PointerData", objPointer);
                        newPolyline.setCoords();

                        if (state.lineProperty) {
                            const lineProperties = addProperties(
                                state.lineProperty,
                                fabricCanvasRef.current.get(
                                    indexData[state.lineProperty.category]
                                )
                            );
                            newPolyline.set("canvasProperty", lineProperties);
                        }

                        fabricCanvasRef.current.add(newPolyline);
                        fabricCanvasRef.current.sendToBack(newPolyline); //arasu
                        newPolyline.setCoords();

                        fabricCanvasRef.current.renderAll();
                        if (newPolyline.group) {
                            console.error(
                                "Polyline is part of a group. Move the group instead."
                            );
                        }
                        dispatch({
                            type: "SET_CURRENT_LINE",
                            payload: newPolyline,
                        });
                        fabricCanvasRef.current.renderAll();
                    } else if (!state.object2) {
                        if (state.object1.id != options.target.id) {
                            const isEqual = comparePropertyValue(
                                options.target.canvasProperty,
                                state.object1.canvasProperty,
                                "fBuskV"
                            );
                            if (!isEqual && !state.isSelectedTransformer) {
                                console.log("nokol mal");

                                const elements =
                                    fabricCanvasRef.current.getObjects();
                                const getLineObject = elements.find(
                                    (data) => data.id == state.activePolyline.id
                                );
                                getLineObject?.set("testAttr", "hello");
                                fabricCanvasRef.current.forEachObject(function (
                                    obj
                                ) {
                                    if (obj.id == state.activePolyline.id) {
                                        fabricCanvasRef.current.remove(obj);
                                        fabricCanvasRef.current.requestRenderAll();
                                    }
                                });

                                fabricCanvasRef.current.setActiveObject(
                                    getLineObject
                                );
                                dispatch({
                                    type: "SET_OBJECT_1",
                                    payload: null,
                                });
                                dispatch({
                                    type: "SET_OBJECT_2",
                                    payload: null,
                                });
                                dispatch({
                                    type: "LINK_OBJECT",
                                    payload: false,
                                });
                                dispatch({
                                    type: "SET_CURRENT_LINE",
                                    payload: null,
                                });
                                fabricCanvasRef.current.discardActiveObject();
                                fabricCanvasRef.current.requestRenderAll();
                                setTimeout(() => {
                                    alert(
                                        "Failed! Two buses having different Voltage."
                                    );
                                }, 500);
                                return false;
                            } else {
                                console.log("asol mal");
                                options.target.setCoords();
                                fabricCanvasRef.current.renderAll();
                                var pointer = options.target.getLocalPointer();
                                const rect =
                                    canvasRef.current.getBoundingClientRect();

                                dispatch({
                                    type: "SET_OBJECT_2",
                                    payload: options.target,
                                });
                                dispatch({
                                    type: "LINK_OBJECT",
                                    payload: false,
                                });

                                createPolyline(
                                    state.object1,
                                    options.target,
                                    intermediaryPoints,
                                    state.object1.id + "-line",
                                    options
                                );
                                addTextForLineObject(
                                    state.activePolyline,
                                    state.activePolyline?.canvasProperty[1]
                                        .propertyValue
                                );

                                if (state.isSelectedTransformer) {
                                    //console.log("consoleLog Test 7--77 ===>",{"object1":state.object1,"activePolyline":state.activePolyline});
                                    const oldLine = state.activePolyline;
                                    const object1Data =
                                        state.activePolyline.obj1PointerData;
                                    deleteConnectionLine(state.activePolyline);
                                    //deleteObject();
                                    //  getBusDataForTransformer( state.object1);
                                    // getBusDataForTransformer(options.target);
                                    const getMidAndMiddlePoints =
                                        postionFunc.getMidAndMiddlePoints(
                                            state.activePolyline.points
                                        );
                                    const middleObjects =
                                        getMidAndMiddlePoints.midPoints; //postionFunc.getMiddleObjects(state.activePolyline.points);
                                    const splitArray = [
                                        getMidAndMiddlePoints.firstHalf,
                                        getMidAndMiddlePoints.secondHalf,
                                    ]; //postionFunc.splitArrayByMidpoint(state.activePolyline.points);
                                    const getAngleOfObjects =
                                        postionFunc.getAngle(
                                            middleObjects[0],
                                            middleObjects[1]
                                        );
                                    const checkOrientation =
                                        postionFunc.checkOrientation(
                                            middleObjects[0],
                                            middleObjects[1]
                                        );
                                    const midpoints =
                                        getMidAndMiddlePoints.middlePoint; //postionFunc.calculateMidpoint(middleObjects);
                                    console.log("midpoints", {
                                        midpoints,
                                        points: middleObjects,
                                    });
                                    createTransformer(
                                        midpoints,
                                        splitArray,
                                        getAngleOfObjects,
                                        checkOrientation,
                                        state.object1,
                                        object1Data,
                                        options.target,
                                        pointer,
                                        oldLine
                                    );
                                }
                                dispatch({
                                    type: "SET_CURRENT_LINE",
                                    payload: null,
                                });
                                console.log("updateModifications calling 1168");
                                updateModifications(true);
                                intermediaryPoints = [];
                            }
                        }
                    }
                } else if (state.object1) {
                    console.log("2-------------------------------------");

                    //!options.target &&
                    console.log("state.activePolyline", state.activePolyline);
                    state.activePolyline.set("selectable", false);
                    fabricCanvasRef.current.renderAll();
                    // Dynamically add points to the polyline
                    const { x, y } = options.pointer;
                    console.log("pointer :::: ", options.pointer);

                    const firstObjectCenter = state.object1.getCenterPoint();
                    ///================== Custom Point Calculation
                    console.log("state.object1", state.object1);
                    const objPointer = state.activePolyline?.obj1PointerData;
                    var LineStartingPoints = objPointer
                        ? {
                              x: firstObjectCenter.x,
                              y: state.object1.top + objPointer.y,
                          }
                        : firstObjectCenter;
                    if ([90, -270].includes(state.object1.angle)) {
                        LineStartingPoints = objPointer
                            ? {
                                  x: state.object1.left - objPointer.x,
                                  y: firstObjectCenter.y,
                              }
                            : firstObjectCenter;
                    }
                    if ([-90, 270].includes(state.object1.angle)) {
                        LineStartingPoints = objPointer
                            ? {
                                  x: state.object1.left + objPointer.x,
                                  y: firstObjectCenter.y,
                              }
                            : firstObjectCenter;
                    }
                    ///================== Custom Point Calculation
                    let [xx, yy] =
                        intermediaryPoints.length === 0
                            ? getAlterXY(
                                  LineStartingPoints.x,
                                  LineStartingPoints.y,
                                  x,
                                  y
                              )
                            : getAlterXY(
                                  intermediaryPoints[
                                      intermediaryPoints.length - 1
                                  ].x,
                                  intermediaryPoints[
                                      intermediaryPoints.length - 1
                                  ].y,
                                  x,
                                  y
                              );

                    intermediaryPoints.push({
                        x: xx,
                        y: yy,
                    });

                    const polylinePoints = [
                        {
                            x: firstObjectCenter.x,
                            y: LineStartingPoints.y,
                        },
                        // state.activePolyline ? state.activePolyline.points[0] : { x: firstObjectCenter.x, y: LineStartingPoints.y },
                        ...intermediaryPoints,
                    ];

                    if (state.activePolyline) {
                        // console.log("Last Point ::::: ", state.activePolyline.points[state.activePolyline.points.length - 1]);
                        state.activePolyline.set({
                            points: polylinePoints,
                        });
                        // console.log("Last Point ::::: ", state.activePolyline.points[state.activePolyline.points.length - 1]);
                        // console.log("----------------------- :::: ");
                    }
                    state.activePolyline.setCoords();
                    refreshCoordsForAll(state.activePolyline);
                    fabricCanvasRef.current.renderAll();
                }
            } else {
                fabricCanvasRef.current.selection = true;
            }
        };
        
        // Attach the mouse:down event only once when the component mounts
        fabricCanvasRef.current.on("mouse:down", handleMouseDown);
        return () => {
            fabricCanvasRef.current.off("object:added", handleObjectAdded);
            fabricCanvasRef.current.off("mouse:down", handleMouseDown);
            if (isVaild) {
                dispatch({
                    type: "SET_OBJECT_1",
                    payload: null,
                });
                dispatch({
                    type: "SET_OBJECT_2",
                    payload: null,
                });
                dispatch({
                    type: "LINK_OBJECT",
                    payload: false,
                });
                dispatch({
                    type: "SET_CURRENT_LINE",
                    payload: null,
                });
                isVaild = false;
            }
        };
    }, [
        state.isLinkObject,
        state.object1,
        state.object2,
        state.activePolyline,
    ]);

    useEffect(() => {
        if (!state.isLinkObject) {
            //console.log("called");
            dispatch({ type: "SET_OBJECT_1", payload: null });
            dispatch({ type: "SET_OBJECT_2", payload: null });
            dispatch({ type: "SET_CURRENT_LINE", payload: null });
            fabricCanvasRef.current.discardActiveObject();
        }
    }, [state.isLinkObject]);

    const handleSingleClick = (obj) => {
        // if (!isDrawing) {
        //     startDrawing(obj);
        // } else {
        //     finishDrawing(obj);
        // }
        // if (obj.hasOwnProperty('id')) {
        //     console.log("object have properties:","no")
        // }else{
        //     console.log("object have properties:","yes")
        // }

        //console.log("handleSingleClick-currentCanvas", fabricCanvasRef.current);
        // console.log("handleSingleClick", fabricCanvasRef.current.getObjects());
        //  console.log("handleSingleClick-scaleY",fabricCanvasRef.current.getActiveObject().scaleY);
        if (obj.hasOwnProperty("id")) {
            dispatch({
                type: "SET_ELEMENT_PROPERTY",
                payload: obj,
            });
        }
    };
    const handleDoubleClick_css = (obj, event) => {
        if (obj === "") {
            const container = document.querySelector(".main"); // Canvas container element

            if (!container || !fabricCanvasRef.current) return;
            // Maintain the zoom level
            let zoom = parseFloat(container.dataset.zoom || 1); // Default zoom to 1 if not set
            const rect = container.getBoundingClientRect();

            // Calculate the pointer position relative to the container
            const pointer = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
            };

            // Update the zoom level
            zoom += 0.5;
            if (zoom > 2) zoom = 1; // Reset zoom level if it exceeds 2x
            container.dataset.zoom = zoom; // Store the zoom level in a dataset attribute

            // Apply CSS zoom
            container.style.transformOrigin = `${pointer.x}px ${pointer.y}px`; // Set the zoom origin
            container.style.transform = `scale(${zoom})`;

            // Adjust scroll to keep the zoom origin visible
            const scrollLeft = pointer.x * zoom - container.clientWidth / 2;
            const scrollTop = pointer.y * zoom - container.clientHeight / 2;
            container.scrollTo({
                left: scrollLeft,
                top: scrollTop,
                behavior: "smooth",
            });
        } else if (obj.hasOwnProperty("id")) {
            if (obj.elementType === "svg" || obj.elementType === "line") {
                // Open the edit popup
                dispatch({
                    type: "SET_EDIT_POPUP",
                    payload: true,
                });
            }
        }
    };

    const [selectedObject, setSelectedObject] = useState(null);

    const handleDoubleClickOld = (obj, event) => {
        console.log('double clicked');
        if (isLinkObjectRef.current) {
            dispatch({ type: "SET_ZOOM_ENABLED", payload: false });
            const pointer = fabricCanvasRef.current.getPointer(event.e);
            const zoomPoint = { x: pointer.x, y: pointer.y };
            fabricCanvasRef.current.zoomToPoint(zoomPoint, 1);
            fabricCanvasRef.current.setViewportTransform([1, 0, 0, 1, 0, 0]);
            return false;
        }

        // zoom related case
        if (obj === "" || obj.type === "rect") {
            let zoom = fabricCanvasRef.current.getZoom();
            const pointer = fabricCanvasRef.current.getPointer(event.e);
            zoom += 0.5;
            if (zoom > 2) zoom = 1;

            const zoomPoint = { x: pointer.x, y: pointer.y };

            if (!fabricCanvasRef.current.originalWidth) {
                fabricCanvasRef.current.originalWidth =
                    fabricCanvasRef.current.width;
                fabricCanvasRef.current.originalHeight =
                    fabricCanvasRef.current.height;
            }

            fabricCanvasRef.current.setWidth(
                fabricCanvasRef.current.originalWidth * zoom
            );
            fabricCanvasRef.current.setHeight(
                fabricCanvasRef.current.originalHeight * zoom
            );

            fabricCanvasRef.current.zoomToPoint(zoomPoint, zoom);

            if (zoom === 1) {
                fabricCanvasRef.current.setViewportTransform([
                    1, 0, 0, 1, 0, 0,
                ]);
            }


            if (fabricCanvasRef.current.getZoom() > 1) {
                if (obj === "") {
                    var rectangle = new fabric.Rect({
                        left: 0,
                        top: 0,
                        width: fabricCanvasRef.current.width,
                        height: fabricCanvasRef.current.height,
                        selectable: false,
                        opacity: 0,
                        visible: true,
                        evented: true,
                        customOverlyElement: true,
                    });

                    fabricCanvasRef.current.add(rectangle);
                    dispatch({ type: "SET_ZOOM_ENABLED", payload: true });
                }
            } else {
                const elements = fabricCanvasRef.current.getObjects();
                const getRectObject = elements.find(
                    (data) => data.customOverlyElement === true
                );
                if (getRectObject) {
                    fabricCanvasRef.current.remove(getRectObject);
                    dispatch({ type: "SET_ZOOM_ENABLED", payload: false });
                }
            }
        }
        else if (obj?.id) {
            if (obj.elementType === "svg" || obj.elementType === "line") {
                setSelectedObject(obj); 
                dispatch({ type: "SET_EDIT_POPUP", payload: true });
            }
        }
    };

    const handleDoubleClick = (obj, event) => {
        const canvas = fabricCanvasRef.current;
        const pointer = canvas.getPointer(event?.e || event);

        if (!obj || obj.type === "rect") {
            let zoom = canvas.getZoom();
            zoom += 0.5;
            if (zoom > 2) zoom = 1;

            canvas.zoomToPoint(pointer, zoom);

            if (zoom !== 1) {
                canvas.forEachObject(object => {
                    object.selectable = false;
                    object.evented = false;
                });
            } else {
                canvas.forEachObject(object => {
                    object.selectable = true;
                    object.evented = true;
                });
                canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
            }

            canvas.requestRenderAll();
            setTimeout(() => updateMinimap(), 0);

        } else if (obj?.id) {
            if (obj.elementType === "svg" || obj.elementType === "line") {
                setSelectedObject(obj);
                dispatch({ type: "SET_EDIT_POPUP", payload: true });

                if (fabricCanvasRef.current) {
                    fabricCanvasRef.current.requestRenderAll();
                }
            }
        }
    };

    const formFields = [
        {
            name: "name",
            label: "Load Flow Name",
            type: "text",
            isEditable: true,
            value: fabricCanvasRef.current?.storedData
                ? fabricCanvasRef.current?.storedData.name
                : "",
            propertyType: "String",
        },
    ];
    //Save Canvas Form Field
    const saveAsFormFields = [
        {
            name: "name",
            label: "Load Flow Name",
            type: "text",
            isEditable: true,
            value: "",
            propertyType: "String",
        },
    ];
    //Save Font Settings Form Field
    const FontformFields = [
        {
            name: "size",
            label: "Font Size",
            type: "number",
            isEditable: true,
            value: state.fontSize,
            propertyType: "String",
        },
    ];

    //Save Engine URL Form Field
    const saveAsEngineFormFields = [
        {
            name: "url",
            label: "Engine input path",
            type: "text",
            isEditable: true,
            value: fabricCanvasRef.current?.engineInputURL || "",
            propertyType: "String",
        },
        {
            name: "folderName",
            label: "Case Name",
            type: "text",
            isEditable: false,
            value: fabricCanvasRef.current?.storedData
                ? fabricCanvasRef.current?.storedData.name
                : "",
            propertyType: "String",
        },
    ];

    //Save System Settings Form Field
    const SystemFormFields = systemConfigurationFormFields(
        fabricCanvasRef.current?.systemConfiguration
    );

    //Update Object Form Field
    const updateFormFields = selectedObject
        ? getDataAsFormFields(
              selectedObject,
              fabricCanvasRef.current?.getObjects() ?? []
          )
        : [];

    const saveCanvasData = (formData) => {
        var currentCanvas = fabricCanvasRef.current;
        var base64Data = currentCanvas.toDataURL();
        var objectJsonData = JSON.stringify(
            currentCanvas.toJSON(allproperties)
        );
        const responseData = storeCanvasAPI({
            name: formData.name,
            thumbnailImage: base64Data,
            canvasObject: objectJsonData,
        });

        responseData.then((data) => console.log("responseData:", data));
        responseData.then((data) =>
            console.log(
                "responseData:",
                fabricCanvasRef.current.set("storedData", {
                    id: data.id,
                    name: data.name,
                })
            )
        );
    };

    const updateCanvasData = (formData, id) => {
        console.log("id for update canvas :",id)
        console.log("form data for update canvas :", formData)
        var currentCanvas = fabricCanvasRef.current;
        var base64Data = currentCanvas.toDataURL();
        var objectJsonData = JSON.stringify(
            currentCanvas.toJSON(allproperties)
        );
        const responseData = storeCanvasAPI({
            id: id,
            name: formData.name,
            thumbnailImage: base64Data,
            canvasObject: objectJsonData,
        });
        responseData.then((data) =>
            console.log(
                "responseData:",
                fabricCanvasRef.current.set("storedData", {
                    id: data.id,
                    name: data.name,
                })
            )
        );
    };

    const handleFormSubmit = (formData) => {
        console.log("formData :", formData);
        var currentCanvas = fabricCanvasRef.current;
        if (formData) {
            if (currentCanvas.storedData) {
                updateCanvasData(formData, currentCanvas.storedData.id);
            } else {
                saveCanvasData(formData);
            }
        }
        dispatch({ type: "SET_POPUP", payload: false });
    };

    const handleSaveAsFormSubmit = (formData) => {
        var currentCanvas = fabricCanvasRef.current;
        if (formData) {
            saveCanvasData(formData);
        }
        dispatch({ type: "SET_SAVEAS_CANVAS", payload: false });
    };

    const handleSaveAsEngineFormSubmit = (formData) => {
        var currentCanvas = fabricCanvasRef.current;
        if (formData) {
            if (formData?.url) {
                fabricCanvasRef.current.engineInputURL = formData.url;
            }
            fabricCanvasRef.current.engineInputFolderName = fabricCanvasRef
                .current?.storedData
                ? fabricCanvasRef.current?.storedData.name
                : "";
        }
        dispatch({ type: "SET_ENGINE_URL", payload: false });
    };

    const handleObjectFormSubmit = (formData, dynamicFields) => {
        console.log("formData :", formData);
        console.log("dynamicFields :", dynamicFields);

        const currentCanvas = fabricCanvasRef.current;
        const getActiveObject = currentCanvas.getActiveObject();
        const storedData = currentCanvas.storedData;
        console.log("getActiveObject :",getActiveObject);
        if (!getActiveObject) return;

        let updatedProps = getActiveObject.canvasProperty.map((prop) => {
            const newValue = formData[prop.propertyName];
            if (newValue !== undefined) {
                return {
                    ...prop,
                    value: newValue,
                    propertyValue: newValue,
                };
            }
            return prop;
        });

        if (dynamicFields?.length > 0) {
            updatedProps = updateProperties(
                updatedProps,
                formData,
                dynamicFields
            );
        }

        console.log("updatedProps :", updatedProps);
        getActiveObject.set("canvasProperty", updatedProps);

        const allObjects = fabricCanvasRef.current.getObjects();
        const getText = allObjects.find(
            (data) => data.id == getActiveObject.textId
        );
        if (formData[getActiveObject.canvasProperty[1]?.propertyName]) {
            getText?.set(
            "text",
            formData[getActiveObject.canvasProperty[1].propertyName]
            );
            fabricCanvasRef.current.renderAll();
        }

        getActiveObject.setCoords();
        fabricCanvasRef.current.requestRenderAll();

        if (getActiveObject.elementCategory === "Bus") {
            const getObjectLists = getConnectedObjectToBus(
                getActiveObject,
                allObjects
            );
            const getShuntObject = allObjects.filter((data) =>
                getObjectLists.includes(data.id)
            );
            getShuntObject.forEach((obj) => {
                UpdatedBusName(getActiveObject, obj);
            });
        }

        dispatch({ type: "SET_EDIT_POPUP", payload: false });
        //update data
        handleFormSubmit(storedData.name);
    };


    //Update the font size Form Submit
    const handleFontFormSubmit = (formData) => {
        var currentCanvas = fabricCanvasRef.current;
        //console.log("formData size",formData.size);
        const allObjects = fabricCanvasRef.current.getObjects();
        const getFilteredData = filterObjectByType(allObjects, "text");
        if (getFilteredData.length > 0) {
            getFilteredData?.forEach((data) => {
                data.set("fontSize", formData.size);
            });
        }
        //console.log("getFilteredData:",getFilteredData);
        dispatch({ type: "UPDATE_FONT_SIZE", payload: formData.size });
        dispatch({ type: "IS_POPUP_OPEN", payload: false });
        fabricCanvasRef.current.renderAll();
    };

    //Update the font size Form Submit
    const handleSystemConfigFormSubmit = (formData) => {
        var getsystemConfiguration =
            fabricCanvasRef.current.systemConfiguration;
        if (getsystemConfiguration) {
            fabricCanvasRef.current.set(
                "systemConfiguration",
                updateProperties(getsystemConfiguration, formData)
            );
        }
        console.log(
            "handleSystemConfigFormSubmit",
            fabricCanvasRef.current.systemConfiguration
        );
        dispatch({ type: "OPEN_SYSTEM_POPUP", payload: false });
    };

    //Update the font size Form Submit
    const handleFileFormSubmit = (formData) => {
        if (formData) {
            Object.keys(formData).map((key) => {
                const getCurrentObject = fabricCanvasRef.current
                    .getObjects()
                    .find((data) => data.id == key);
                const idsName = getCurrentObject.canvasProperty[0].propertyName;
                const getNewObjectData = state.fileUploadData[
                    getCurrentObject.elementCategory.toLocaleUpperCase()
                ].find((data) => data[idsName] == formData[key]);
                if (getNewObjectData) {
                    getCurrentObject.set(
                        "canvasProperty",
                        updateProperties(
                            getCurrentObject.canvasProperty,
                            getNewObjectData
                        )
                    );
                }
            });
        }
        dispatch({ type: "IMPORT_DATA", payload: null });
        dispatch({ type: "IMPORT_FILE", payload: false });
    };

    const deleteConnectionLine = (getActiveObject) => {
        const elements = fabricCanvasRef.current.getObjects();
        const fromObject = elements.find(
            (data) => data.id == getActiveObject.fromObjectId
        );
        const fromObjectConnectedLines = fromObject?.connectingLine.filter(
            (id) => id !== getActiveObject.id
        );
        fromObject.set("connectingLine", fromObjectConnectedLines);
        const toObject = elements.find(
            (data) => data.id == getActiveObject.toObjectId
        );
        const toObjectConnectedLines = toObject?.connectingLine.filter(
            (id) => id !== getActiveObject.id
        );
        toObject.set("connectingLine", toObjectConnectedLines);
        fabricCanvasRef.current.remove(getActiveObject);
        const lineObjecttext = elements.find(
            (data) => data.id == getActiveObject.textId
        );
        fabricCanvasRef.current.remove(lineObjecttext);
        fabricCanvasRef.current.renderAll();
    };

    const deleteObject = () => {
    const canvas = fabricCanvasRef.current;
    const getActiveObject = canvas.getActiveObject();
 
    if (!getActiveObject) {
      alert("Element not selected. Please select the element");
      canvas.discardActiveObject();
      canvas.renderAll();
      dispatch({ type: "DELETE_OBJECT", payload: false });
      return;
    }
 
    console.log("Selected deleted object:", getActiveObject.elementCategory);
 
    let previousActiveConnection = true;
    if (getActiveObject?.elementCategory === "Bus") {
      previousActiveConnection = deleteBus(getActiveObject.id);
    }
 
    if (!deleteValidation(getActiveObject) || !previousActiveConnection) {
      alert(
        "Failed to delete the BUS, Please remove the connection from the BUS and try again"
      );
      canvas.discardActiveObject();
      canvas.renderAll();
      dispatch({ type: "DELETE_OBJECT", payload: false });
      return;
    }
 
    const elements = canvas.getObjects();
 
    if (
      getActiveObject.elementCategory === "Transformer" ||
      getActiveObject.elementType === "svg" ||
      getActiveObject.type === "group"
    ) {
      const elements = canvas.getObjects();
 
      if (getActiveObject.textId) {
        const transformerLabel = elements.find(
          (el) => el.id === getActiveObject.textId
        );
        if (transformerLabel) canvas.remove(transformerLabel);
      } else {
        const transformerLabel = elements.find(
          (el) =>
            el.type === "i-text" &&
            (el.elementId === getActiveObject.id ||
              el.parentId === getActiveObject.id)
        );
        if (transformerLabel) canvas.remove(transformerLabel);
      }
 
      const connectedLines = elements.filter(
        (el) =>
          el.elementType === "line" &&
          (el.fromObjectId === getActiveObject.id ||
            el.toObjectId === getActiveObject.id)
      );
 
      connectedLines.forEach((line) => {
        const connectedId =
          line.fromObjectId === getActiveObject.id
            ? line.toObjectId
            : line.fromObjectId;
        const connectedObj = elements.find((e) => e.id === connectedId);
 
        if (connectedObj) {
          connectedObj.set(
            "connectingLine",
            connectedObj.connectingLine?.filter((id) => id !== line.id) || []
          );
          connectedObj.set(
            "connectingElement",
            connectedObj.connectingElement?.filter(
              (id) => id !== getActiveObject.id
            ) || []
          );
        }
 
        if (line.textId) {
          const lineLabel = elements.find((e) => e.id === line.textId);
          if (lineLabel) canvas.remove(lineLabel);
        }
 
        const arrowHead = elements.find(
          (e) => e.type === "triangle" && e.id === `arrow-head-${line.id}`
        );
        if (arrowHead) canvas.remove(arrowHead);
 
        canvas.remove(line);
      });
 
      canvas.remove(getActiveObject);
    } else if (
      getActiveObject.type !== "group" &&
      getActiveObject.name === "connectionLine"
    ) {
      const fromObject = elements.find(
        (data) => data.id === getActiveObject.fromObjectId
      );
      if (fromObject) {
        fromObject.set(
          "connectingLine",
          fromObject.connectingLine?.filter(
            (id) => id !== getActiveObject.id
          ) || []
        );
      }
 
      const toObject = elements.find(
        (data) => data.id === getActiveObject.toObjectId
      );
      if (toObject) {
        toObject.set(
          "connectingLine",
          toObject.connectingLine?.filter((id) => id !== getActiveObject.id) ||
            []
        );
      }
 
      if (getActiveObject.textId) {
        const lineLabel = elements.find(
          (data) => data.id === getActiveObject.textId
        );
        if (lineLabel) canvas.remove(lineLabel);
      }
 
      const arrowHead = elements.find(
        (e) =>
          e.type === "triangle" && e.id === `arrow-head-${getActiveObject.id}`
      );
      if (arrowHead) canvas.remove(arrowHead);
 
      canvas.remove(getActiveObject);
    } else {
      canvas.remove(getActiveObject);
    }
 
    canvas.renderAll();
    console.log("updateModifications calling 1641");
    updateModifications(true);
    dispatch({ type: "DELETE_OBJECT", payload: false });
  };

    const deleteBus = (busId) => {
        let isDeleted = true; // Track deletion status
        // Iterate over all canvas instances
        Object.keys(canvasInstances).forEach((canvasId) => {
            if (canvasId === activeTab) return; // Skip the active canvas
            const storedCanvasState = localStorage.getItem(
                `canvasState_tab${canvasId}`
            );
            if (!storedCanvasState) return;

            const parsedState = JSON.parse(storedCanvasState); // Parse canvas state
            const allObjects = parsedState.objects; // Access all objects in the canvas state

            // Find the bus to delete
            const busToDelete = allObjects.find((obj) => obj.id === busId);

            if (busToDelete) {
                // Check if the bus passes delete validation
                if (deleteValidation(busToDelete)) {
                    // Find the text object linked to this specific SVG
                    const relatedData = getSpecificSvgRelatedData(
                        busId,
                        allObjects
                    );

                    // Find arrow elements associated with the bus
                    const relatedArrows = allObjects.filter(
                        (obj) =>
                            obj.type === "triangle" &&
                            obj.id === `arrow-head-${busId}`
                    );
                    // Combine related data and arrows to remove
                    const allRelatedToDelete = [
                        ...relatedData,
                        ...relatedArrows,
                    ];
                    // Remove the bus and related data
                    const updatedObjects = allObjects.filter(
                        (obj) =>
                            obj.id !== busId &&
                            !allRelatedToDelete.some(
                                (relatedObj) => relatedObj.id === obj.id
                            )
                    );

                    // Remove associated arrows, lines, or other linked elements
                    const updatedState = {
                        ...parsedState,
                        objects: updatedObjects,
                    };

                    // Save updated state back to localStorage
                    localStorage.setItem(
                        `canvasState_tab${canvasId}`,
                        JSON.stringify(updatedState)
                    );

                    console.log(
                        `Deleted bus with ID: ${busId} from canvas: ${canvasId}`
                    );
                    isDeleted = true; // Set deletion status to true
                } else {
                    console.log(
                        "Failed to delete the BUS, deleteValidation failed."
                    );
                    isDeleted = false;
                }
            }
        });

        return isDeleted; // Return deletion status
    };

    const groupTheObjects = () => {
        var activeObj = fabricCanvasRef.current.getActiveObject();
        if (activeObj) {
            if (activeObj?.type == "activeSelection") {
                var activegroup = activeObj.toGroup();
                activegroup.setControlsVisibility({
                    bl: false,
                    br: false,
                    tl: false,
                    tr: false,
                    ml: false,
                    mr: false,
                    mt: false,
                    mb: false,
                });
            } else {
                alert("Please select the multi element");
            }
        } else {
            alert("Element not selected. Please select the element");
        }
        dispatch({ type: "SET_GROUPING", payload: false });
    };

    const ungroupTheObjects = () => {
        var activeObject = fabricCanvasRef.current.getActiveObject();
        if (activeObject) {
            if (activeObject.type == "group") {
                var items = activeObject._objects;
                //alert(items);
                activeObject._restoreObjectsState();
                fabricCanvasRef.current.remove(activeObject);
                for (var i = 0; i < items.length; i++) {
                    fabricCanvasRef.current.add(items[i]);
                    fabricCanvasRef.current.item(
                        fabricCanvasRef.current.size() - 1
                    ).hasControls = true;
                    items[i].setControlsVisibility({
                        bl: false,
                        br: false,
                        tl: false,
                        tr: false,
                        ml: false,
                        mr: false,
                        mt: false,
                        mb: false,
                    });
                }

                fabricCanvasRef.current.renderAll();
            }
        } else {
            alert("Element not selected. Please select the element");
        }
        dispatch({ type: "SET_UNGROUPING", payload: false });
    };

    const getStoredCanvas = async () => {
        const getData = await getAllCanvasAPI();
        setData(getData);
        localStorage.setItem(
            "savedData",
            getData.map((data) => data.name)
        );
    };



    // Effect to handle updating the canvas when the selectedElement changes
    useEffect(() => {
        const rect = canvasRef.current.getBoundingClientRect();
        let leftSideElement = 0;
        let rightSideElement = 0;
        let connectingElement = "";
        let busTop = 0;
        let busLeft = 0;
        //console.log("canvas Element Position:",{"top":rect.top,"left":rect.left});
        // console.log();
        if (selectedElement?.category != "Two winding transformer") {
            if (
                selectedElement &&
                selectedElement.svgPath &&
                (state.clicked || state.dropped) &&
                validatedShuntElement(
                    {
                        elementCategory: selectedElement.category,
                    },
                    fabricCanvasRef.current.getActiveObject()
                )
            ) {
                var activeObject = fabricCanvasRef.current.getActiveObject();
                //console.log("activeObject",activeObject);
                // Load the SVG from the selected element and add it to the canvas
                fabric.loadSVGFromURL(
                    process.env.PUBLIC_URL +
                        selectedElement.svgPath.replace(
                            "/assets/svg/",
                            "/assets/svg/canva/"
                        ),
                    (objects, options) => {
                        const groupedObject = fabric.util.groupSVGElements(
                            objects,
                            options
                        );
                        // Set the object's position based on the current state
                        let currentObjectLeft = 10;
                        let currentObjectTop = 10;
                        if (state.clicked && !state.dropped) {
                            groupedObject.left = currentObjectLeft; // Example position when clicked
                            groupedObject.top = currentObjectTop;
                        } else if (state.dropped) {
                            currentObjectLeft =
                                state.position.x -
                                rect.x -
                                groupedObject.getScaledWidth() / 2;
                            currentObjectTop =
                                state.position.y -
                                rect.y -
                                groupedObject.getScaledHeight() / 2;
                            // groupedObject.left = currentObjectLeft; // Position based on global state
                            // groupedObject.top = currentObjectTop;
                        }
                        groupedObject.id = uuidv4();
                        groupedObject.canvasProperty = addProperties(
                            selectedElement,
                            fabricCanvasRef.current.get(
                                indexData[selectedElement.category]
                            )
                        );
                        if (
                            indexData[selectedElement.category] === "busIndex"
                        ) {
                            dispatch({
                                type: "SET_INDEX_VALUE_BUS",
                                payload:
                                    fabricCanvasRef.current.get(
                                        indexData[selectedElement.category]
                                    ) + 1,
                            });
                        } else if (
                            indexData[selectedElement.category] ===
                            "filterIndex"
                        ) {
                            dispatch({
                                type: "SET_INDEX_VALUE_FILTER",
                                payload:
                                    fabricCanvasRef.current.get(
                                        indexData[selectedElement.category]
                                    ) + 1,
                            });
                        } else if (
                            indexData[selectedElement.category] ===
                            "generatorIndex"
                        ) {
                            dispatch({
                                type: "SET_INDEX_VALUE_GENERATOR",
                                payload:
                                    fabricCanvasRef.current.get(
                                        indexData[selectedElement.category]
                                    ) + 1,
                            });
                        } else if (
                            indexData[selectedElement.category] ===
                            "inductionMotorIndex"
                        ) {
                            dispatch({
                                type: "SET_INDEX_VALUE_INDUCTION_MOTOR",
                                payload:
                                    fabricCanvasRef.current.get(
                                        indexData[selectedElement.category]
                                    ) + 1,
                            });
                        } else if (
                            indexData[selectedElement.category] === "loadIndex"
                        ) {
                            dispatch({
                                type: "SET_INDEX_VALUE_LOAD",
                                payload:
                                    fabricCanvasRef.current.get(
                                        indexData[selectedElement.category]
                                    ) + 1,
                            });
                        } else if (
                            indexData[selectedElement.category] === "shuntIndex"
                        ) {
                            dispatch({
                                type: "SET_INDEX_VALUE_SHUNT_DEVICE",
                                payload:
                                    fabricCanvasRef.current.get(
                                        indexData[selectedElement.category]
                                    ) + 1,
                            });
                        } else if (
                            indexData[selectedElement.category] === "lineIndex"
                        ) {
                            dispatch({
                                type: "SET_INDEX_VALUE_LINE",
                                payload:
                                    fabricCanvasRef.current.get(
                                        indexData[selectedElement.category]
                                    ) + 1,
                            });
                        } else if (
                            indexData[selectedElement.category] ===
                            "transformerIndex"
                        ) {
                            dispatch({
                                type: "SET_INDEX_VALUE_TRANSFORMER",
                                payload:
                                    fabricCanvasRef.current.get(
                                        indexData[selectedElement.category]
                                    ) + 1,
                            });
                        }

                        groupedObject.elementCategory =
                            selectedElement.category;
                        groupedObject.isLine = false;
                        groupedObject.elementType = "svg";
                        if (activeObject) {
                            connectingElement = activeObject.connectingElement;
                            leftSideElement = connectingElement?.filter(
                                (data) => data.side == "left"
                            ).length;
                            rightSideElement = connectingElement?.filter(
                                (data) => data.side == "right"
                            ).length;
                            const getActiveObjCoords = activeObject.oCoords;
                            if (groupedObject.elementCategory !== "Bus") {
                                // console.log("shunt element position updating *** ");

                                if (
                                    [0, 180, -180].includes(activeObject.angle)
                                ) {
                                    //console.log("currentObjectLeft",currentObjectLeft);
                                    //console.log("activeObject.left:",{"left":activeObject.left,"top":activeObject.top});
                                    //console.log("getActiveObjCoords.ml:",getActiveObjCoords);
                                    const activeObjScalaY = activeObject.scaleY;
                                    if (currentObjectLeft < activeObject.left) {
                                        //console.log("conditions check==>1");
                                        groupedObject.angle = 90;
                                        if (activeObject.angle != 180) {
                                            // groupedObject.top = activeObject.top + (leftSideElement == 0 ? 0 : 35 * (leftSideElement + 1) - 5);
                                            groupedObject.top =
                                                activeObject.top +
                                                groupedObject.height / 2 +
                                                (35 * leftSideElement - 5);
                                        } else {
                                            groupedObject.top =
                                                activeObject.top +
                                                activeObject.height -
                                                groupedObject.height / 2 -
                                                (35 * (leftSideElement + 2) +
                                                    5);
                                        }
                                        groupedObject.left =
                                            getActiveObjCoords.mr.x;
                                        // groupedObject.left = activeObject.left;
                                        leftSideElement = leftSideElement + 1;
                                        busTop = groupedObject.top;
                                        busLeft =
                                            activeObject.getCenterPoint().x;
                                    } else {
                                        // console.log("conditions check==>2");
                                        groupedObject.angle = 270;
                                        if (activeObject.angle != 180) {
                                            // groupedObject.top = activeObject.top + (leftSideElement == 0 ? 0 : 35 * (leftSideElement + 1) - 5);
                                            // groupedObject.top = activeObject.top + (rightSideElement == 0 ? 0 : 35 * (rightSideElement + 1) - 5);
                                            groupedObject.top =
                                                activeObject.top +
                                                (35 * (rightSideElement + 1) -
                                                    5);
                                        } else {
                                            // groupedObject.top = activeObject.top + (rightSideElement == 0 ? 35 : 50 * (rightSideElement + 1) - 5);
                                            groupedObject.top =
                                                activeObject.top +
                                                activeObject.height -
                                                (35 * (rightSideElement + 1) +
                                                    5);
                                        }

                                        groupedObject.left =
                                            getActiveObjCoords.mr.x + 5;
                                        // groupedObject.left = activeObject.left + activeObject.width;
                                        rightSideElement = rightSideElement + 1;

                                        busTop = groupedObject.top;
                                        busLeft =
                                            activeObject.getCenterPoint().x;
                                    }
                                    // } else if (activeObject.angle == 90) {
                                } else {
                                    const activeObjScalaY = activeObject.scaleY;
                                    if (currentObjectTop < activeObject.top) {
                                        console.log(
                                            "shunt element on top *** "
                                        );

                                        // console.log("conditions check==>3");
                                        const cal1 = getActiveObjCoords.tl.x;
                                        const cal2 = cal1;
                                        const cal3 = leftSideElement + 1;
                                        const cal4 = 35 * cal3;
                                        groupedObject.angle = 180;
                                        groupedObject.top =
                                            getActiveObjCoords.tl.y - 0;

                                        if (
                                            activeObject.angle == 270 ||
                                            activeObject.angle == -90
                                        ) {
                                            // groupedObject.top = activeObject.top + (leftSideElement == 0 ? 0 : 35 * (leftSideElement + 1) - 5);
                                            groupedObject.left =
                                                activeObject.left +
                                                groupedObject.width / 2 +
                                                (35 * (leftSideElement + 1) -
                                                    5);
                                            groupedObject.top =
                                                getActiveObjCoords.tr.y;
                                        } else {
                                            groupedObject.left =
                                                activeObject.left +
                                                activeObject.width +
                                                groupedObject.width / 2 -
                                                (35 * (leftSideElement + 1) +
                                                    5);
                                        }

                                        // groupedObject.left =
                                        //     cal2 - (leftSideElement == 0 ? 30 : cal4);

                                        leftSideElement = leftSideElement + 1;

                                        busTop =
                                            activeObject.getCenterPoint().y;
                                        busLeft = groupedObject.left;
                                    } else {
                                        console.log(
                                            "shunt element on bottom *** "
                                        );
                                        //  console.log("conditions check==>4");
                                        const cal1 = getActiveObjCoords.tr.x;
                                        const cal2 = cal1;
                                        const cal3 = rightSideElement + 1;
                                        const cal4 = 45 * cal3;
                                        groupedObject.angle = 0;
                                        // groupedObject.left = cal2 - (rightSideElement == 0 ? 30 : cal4);
                                        groupedObject.top =
                                            getActiveObjCoords.tr.y;

                                        if (
                                            activeObject.angle == 270 ||
                                            activeObject.angle == -90
                                        ) {
                                            groupedObject.left =
                                                activeObject.left +
                                                (35 * (rightSideElement + 1) -
                                                    5);
                                            // groupedObject.left = activeObject.left + activeObject.width + groupedObject.width / 2 + (35 * (rightSideElement) - 5);
                                            groupedObject.top =
                                                getActiveObjCoords.tl.y;
                                        } else {
                                            groupedObject.left =
                                                activeObject.left +
                                                activeObject.width -
                                                (35 * (rightSideElement + 1) +
                                                    5);
                                        }

                                        rightSideElement = rightSideElement + 1;

                                        busTop =
                                            activeObject.getCenterPoint().y;
                                        busLeft = groupedObject.left;
                                    }
                                }
                                // else {
                                //     if (currentObjectTop > activeObject.top) {
                                //         //  console.log("conditions check==>5");
                                //         const cal1 = getActiveObjCoords.tl.x;
                                //         const cal2 = cal1;
                                //         const cal3 = leftSideElement + 1;
                                //         const cal4 = 45 * cal3;
                                //         groupedObject.angle = 0;
                                //         groupedObject.left =
                                //             cal2 + (leftSideElement == 0 ? 30 : cal4);
                                //         groupedObject.top = getActiveObjCoords.tl.y - 2;
                                //         leftSideElement = leftSideElement + 1;

                                //         busTop = activeObject.getCenterPoint().y;
                                //         busLeft = groupedObject.left;
                                //     } else {
                                //         // console.log("conditions check==>6");
                                //         const cal1 = getActiveObjCoords.tr.x;
                                //         const cal2 = cal1;
                                //         const cal3 = rightSideElement + 1;
                                //         const cal4 = 45 * cal3;
                                //         groupedObject.angle = 180;
                                //         groupedObject.left =
                                //             cal2 + (rightSideElement == 0 ? 30 : cal4);
                                //         groupedObject.top = getActiveObjCoords.tr.y;
                                //         rightSideElement = rightSideElement + 1;

                                //         busTop = activeObject.getCenterPoint().y;
                                //         busLeft = groupedObject.left;
                                //     }
                                // }
                            } else {
                                groupedObject.top =
                                    activeObject.oCoords.tl.y + 2;
                                groupedObject.left = activeObject.oCoords.tl.x;
                                if (activeObject.angle == 0) {
                                    groupedObject.angle = 270;
                                } else if (activeObject.angle == 90) {
                                    groupedObject.angle = 0;
                                } else if (activeObject.angle == 180) {
                                    groupedObject.angle = 90;
                                    groupedObject.top =
                                        activeObject.oCoords.tl.y - 2;
                                } else {
                                    groupedObject.angle = 180;
                                }
                            }
                        } else {
                            groupedObject.top = currentObjectTop;
                            groupedObject.left = currentObjectLeft;
                            if (selectedElement.category === "Bus") {
                                groupedObject.fill =
                                    state.defaultvoltagebuscolor;
                                groupedObject.stroke =
                                    state.defaultvoltagebuscolor;
                            }
                            addTextAboveObject(
                                groupedObject,
                                groupedObject.canvasProperty[1].propertyValue,
                                {
                                    x: null,
                                    y: null,
                                    angle: 0,
                                }
                            );
                        }

                        groupedObject.setCoords();
                        if (selectedElement.category !== "Bus") {
                            //groupedObject.hasControls = false;
                            // groupedObject.hasBorders = false;
                            groupedObject.setControlsVisibility({
                                bl: false,
                                br: false,
                                tl: false,
                                tr: false,
                                ml: false,
                                mr: false,
                                mt: false,
                                mb: false,
                                mtr: false,
                            });
                        } else {
                            groupedObject.hasControls = true;
                            groupedObject.setControlsVisibility({
                                bl: false,
                                br: false,
                                tl: false,
                                tr: false,
                                ml: false,
                                mr: false,
                                mt: false,
                                mb: true,
                                mtr: false,
                            });
                            groupedObject.scaleX = 1.5;
                            groupedObject.connectingElement = [];
                            // groupedObject
                        }
                        groupedObject.fill = state.defaultvoltagebuscolor;
                        groupedObject.stroke = state.defaultvoltagebuscolor;

                        groupedObject.snapAngle = 90;
                        groupedObject.centeredRotation = true;
                        groupedObject.connectingLine = [];
                        groupedObject.connectingDrawLine = [];
                        fabricCanvasRef.current.add(groupedObject);

                        selectedElement.properties.find(
                            (item) => item.propertyName === "iColor"
                        );
                        const propertyItem = groupedObject.canvasProperty.find(
                            (item) => item.propertyName === "iColor"
                        );
                        if (propertyItem) {
                            propertyItem.propertyValue =
                                state.defaultvoltagebuscolor;
                        }

                        fabricCanvasRef.current.set(
                            indexData[selectedElement.category],
                            fabricCanvasRef.current.get(
                                indexData[selectedElement.category]
                            ) + 1
                        );
                        fabricCanvasRef.current.bringToFront(groupedObject);
                        // console.log("updateSPolyline 1576 --------------");
                        groupedObject.on("moving", (event) =>
                            updateSPolyline(event, "moving")
                        );
                        groupedObject.on("mouseup", (event) =>
                            updateSPolyline(event, "mouseup")
                        );
                        // console.log("groupedObject.left:",{"left":groupedObject.left,"top":groupedObject.top});
                        // console.log("groupedObject",groupedObject);
                        if (activeObject) {
                            if (activeObject.elementCategory == "Bus") {
                                //console.log("activeObject.left:",{"left":activeObject.left,"top":activeObject.top});
                                connectingElement =
                                    activeObject.connectingElement;
                                //console.log("connectingElement",connectingElement);
                                if (
                                    leftSideElement >
                                    connectingElement.filter(
                                        (data) => data.side == "left"
                                    ).length
                                ) {
                                    // console.log("leftSideElement",leftSideElement);
                                    activeObject.set("connectingElement", [
                                        ...connectingElement,
                                        {
                                            id: groupedObject.id,
                                            category:
                                                groupedObject.elementCategory,
                                            side: "left",
                                        },
                                    ]);
                                    activeObject.set(
                                        "scaleY",
                                        activeObject.scaleY + 1.5
                                    );
                                }
                                if (
                                    rightSideElement >
                                    connectingElement.filter(
                                        (data) => data.side == "right"
                                    ).length
                                ) {
                                    // console.log("rightSideElement",rightSideElement);
                                    activeObject.set("connectingElement", [
                                        ...connectingElement,
                                        {
                                            id: groupedObject.id,
                                            category:
                                                groupedObject.elementCategory,
                                            side: "right",
                                        },
                                    ]);
                                    activeObject.set(
                                        "scaleY",
                                        activeObject.scaleY + 1.5
                                    );
                                }
                            } else {
                                activeObject.set("busId", groupedObject.id);
                            }
                        }
                        if (activeObject) {
                            if ([0, 180, -180].includes(activeObject.angle)) {
                                if (currentObjectLeft < activeObject.left) {
                                    addTextAboveObject(
                                        groupedObject,
                                        groupedObject.canvasProperty[1]
                                            .propertyValue,
                                        {
                                            x: groupedObject.oCoords.bl.x - 150,
                                            y: groupedObject.oCoords.bl.y,
                                            angle: 0,
                                        }
                                    );
                                } else {
                                    addTextAboveObject(
                                        groupedObject,
                                        groupedObject.canvasProperty[1]
                                            .propertyValue,
                                        {
                                            x: groupedObject.oCoords.br.x + 10,
                                            y: groupedObject.oCoords.br.y,
                                            angle: 0,
                                        }
                                    );
                                }
                            } else if (activeObject.angle == 90) {
                                if (currentObjectTop < activeObject.top) {
                                    addTextAboveObject(
                                        groupedObject,
                                        groupedObject.canvasProperty[1]
                                            .propertyValue,
                                        {
                                            x: groupedObject.oCoords.br.x,
                                            y: groupedObject.oCoords.br.y - 10,
                                            angle: 270,
                                        }
                                    );
                                } else {
                                    addTextAboveObject(
                                        groupedObject,
                                        groupedObject.canvasProperty[1]
                                            .propertyValue,
                                        {
                                            x: groupedObject.oCoords.br.x,
                                            y: groupedObject.oCoords.br.y + 10,
                                            angle: 90,
                                        }
                                    );
                                }
                            } else {
                                if (currentObjectTop > activeObject.top) {
                                    addTextAboveObject(
                                        groupedObject,
                                        groupedObject.canvasProperty[1]
                                            .propertyValue,
                                        {
                                            x: groupedObject.oCoords.bl.x,
                                            y: groupedObject.oCoords.bl.y + 100,
                                            angle: 270,
                                        }
                                    );
                                } else {
                                    addTextAboveObject(
                                        groupedObject,
                                        groupedObject.canvasProperty[1]
                                            .propertyValue,
                                        {
                                            x: groupedObject.oCoords.br.x + 20,
                                            y: groupedObject.oCoords.br.y - 100,
                                            angle: 90,
                                        }
                                    );
                                }
                            }
                            groupedObject.forEachObject((element) => {
                                element.set({
                                    // fill: null,
                                    stroke: activeObject.stroke,
                                });
                            });

                            const canvasObjects =
                                fabricCanvasRef.current.getObjects();
                            canvasObjects.forEach((ele) => {
                                if (ele.id === groupedObject.textId) {
                                    ele.set({
                                        fill: activeObject.stroke,
                                    });
                                }
                            });

                            linkObject(activeObject, groupedObject);
                            UpdatedBusName(activeObject, groupedObject);
                        }

                        //console.log("get All object",fabricCanvasRef.current.getObjects());
                    }
                );
                // console.log("updateModifications calling 2075");
                // updateModifications(true);
                dispatch({
                    type: "SET_ELEMENT_PROPERTY",
                    payload: {},
                });
                dispatch({
                    type: "SET_DROPPED",
                    payload: false,
                });
            } else {
                dispatch({
                    type: "SET_DROPPED",
                    payload: false,
                });
                if (state.dropped) {
                    fabricCanvasRef.current.discardActiveObject();
                }
            }
        } else {
            alert("Please choose the shunt element");
            fabricCanvasRef.current.discardActiveObject();
        }
        fabricCanvasRef.current.renderAll();
        // console.log("dragPostion",dragdata);
    }, [selectedElement, state.clicked, state.dropped, state.position]);

    // useEffect(() => {
    //   fabricCanvasRef.current.on("mouse:down", createTransformer);
    //   return () => {
    //     fabricCanvasRef.current.off("mouse:down", createTransformer);
    //   };
    // }); // No change here

    const createTransformer = (
        midpoints,
        points,
        objectAngle,
        orientation,
        busObjects1,
        obj1pointer,
        busObjects2,
        obj2pointer,
        oldLine
    ) => {
        if (state.isSelectedTransformer && busObjects.busObj1 && busObjects2) {
            const selectedElement = state.elementsList.find((element) =>
                ["Two winding transformer"].includes(element.category)
            );
            if (selectedElement) {
                fabric.loadSVGFromURL(
                    process.env.PUBLIC_URL +
                        selectedElement.svgPath.replace(
                            "/assets/svg/",
                            "/assets/svg/canva/"
                        ),
                    (objects, options) => {
                        const groupedObject = fabric.util.groupSVGElements(
                            objects,
                            options
                        );
                        groupedObject.left =
                            midpoints.x + (orientation == "vertical" ? 10 : 0);
                        // groupedObject.top =midpoints.y - groupedObject.height/2;
                        groupedObject.top =
                            midpoints.y + (orientation != "vertical" ? -10 : 0);
                        groupedObject.id = uuidv4();
                        // if(orientation=="vertical"){
                        console.log("objectAngle", objectAngle);
                        // }else{
                        //if(orientation=="vertical"){
                        groupedObject.angle = objectAngle ? objectAngle : 0;
                        //}
                        //}
                        //groupedObject.angle =  postionFunc.checkOrientation(middleObjects[0],middleObjects[1]); ;
                        groupedObject.set("fill", "#ffffff");
                        groupedObject.centeredRotation = true;
                        groupedObject.connectingLine = [];
                        groupedObject.connectingDrawLine = [];
                        groupedObject.canvasProperty = addProperties(
                            selectedElement,
                            fabricCanvasRef.current.get(
                                indexData[selectedElement.category]
                            )
                        );
                        groupedObject.elementCategory =
                            selectedElement.category;
                        groupedObject.isLine = false;
                        groupedObject.elementType = "svg";
                        groupedObject.setCoords();
                        groupedObject.setControlsVisibility({
                            bl: false,
                            br: false,
                            tl: false,
                            tr: false,
                            ml: false,
                            mr: false,
                            mt: false,
                            mb: false,
                        });
                        addTextAboveObject(
                            groupedObject,
                            groupedObject.canvasProperty[1].propertyValue,
                            {
                                x: null,
                                y: null,
                                angle: 0,
                            }
                        );
                        const transObj =
                            fabricCanvasRef.current.add(groupedObject);
                        fabricCanvasRef.current.set(
                            indexData[selectedElement.category],
                            fabricCanvasRef.current.get(
                                indexData[selectedElement.category]
                            ) + 1
                        );
                        // console.log("oldLine :::: ",oldLine);

                        const line1 = linkObject(
                            groupedObject,
                            busObjects1,
                            obj1pointer,
                            "bus1",
                            [
                                ...points[0],
                                {
                                    x: groupedObject.oCoords.ml.x,
                                    y: groupedObject.oCoords.ml.y,
                                },
                            ],
                            oldLine
                        );
                        // Call linkObject for the second bus
                        const line2 = linkObject(
                            groupedObject,
                            busObjects2,
                            obj2pointer,
                            "bus2",
                            [
                                oldLine.points[oldLine.points.length - 1],
                                ...points[1],
                            ],
                            // [{x:groupedObject.oCoords.ml.x,y:groupedObject.oCoords.ml.y},...points[1]],
                            oldLine
                        );
                        // Get bus voltages
                        const bus1Voltage = busObjects1.canvasProperty.find(
                            (item) => item.propertyName === "fBuskV"
                        )?.propertyValue;
                        const bus2Voltage = busObjects2.canvasProperty.find(
                            (item) => item.propertyName === "fBuskV"
                        )?.propertyValue;

                        const identifyConnectedBuses = (polyline) => {
                            const allObjects =
                                fabricCanvasRef.current.getObjects();

                            // Find the bus objects using the polyline's properties
                            const fromBus = allObjects.find(
                                (obj) => obj.id === polyline.fromObjectId
                            );
                            const toBus = allObjects.find(
                                (obj) => obj.id === polyline.toObjectId
                            );

                            return {
                                fromBus,
                                toBus,
                            };
                        };

                        const connectedBuses1 = identifyConnectedBuses(line1);
                        const connectedBuses2 = identifyConnectedBuses(line2);
                        // console.log("From Bus:", connectedBuses.fromBus);
                        // console.log("To Bus:", connectedBuses.toBus);
                        // Ensure the color code has a valid format by prepending `#` if necessary
                        const addHashPrefix = (color) =>
                            color.startsWith("#") ? color : `#${color}`;

                        const bus1Color =
                            busObjects1.canvasProperty.find(
                                (item) => item.propertyName === "iColor"
                            )?.propertyValue || "black";
                        const bus2Color =
                            busObjects2.canvasProperty.find(
                                (item) => item.propertyName === "iColor"
                            )?.propertyValue || "black";

                        // Prepend `#` to make the color valid
                        const validatedBus1Color = addHashPrefix(bus1Color);
                        const validatedBus2Color = addHashPrefix(bus2Color);
                        busObjects1.set({
                            stroke: validatedBus1Color,
                        });
                        busObjects2.set({
                            stroke: validatedBus2Color,
                        });
                        // Set colors based on the voltage comparison

                        const ellipse1 = groupedObject._objects[0]; // First ellipse (assume left)
                        const ellipse2 = groupedObject._objects[1]; // Second ellipse (assume right)

                        if (true) {
                            if (connectedBuses1.toBus.id == busObjects1.id) {
                                line1.set({
                                    stroke: validatedBus1Color,
                                }); // Equal voltage
                                line2.set({
                                    stroke: validatedBus2Color,
                                });
                                ellipse1.set({
                                    stroke: validatedBus2Color,
                                }); // Lower voltage bus
                                ellipse2.set({
                                    stroke: validatedBus1Color,
                                });
                            } else {
                                line1.set({
                                    stroke: validatedBus2Color,
                                }); // Higher voltage bus 1
                                line2.set({
                                    stroke: validatedBus1Color,
                                }); // Lower voltage bus 2
                                busObjects1.set({
                                    stroke: validatedBus2Color,
                                });
                                busObjects2.set({
                                    stroke: validatedBus1Color,
                                });
                                ellipse1.set({
                                    stroke: validatedBus1Color,
                                }); // Higher voltage bus
                                ellipse2.set({
                                    stroke: validatedBus2Color,
                                });
                            }

                            // Render canvas to apply the changes
                            // canvas.renderAll();
                        }

                        // Check the position of busObj1
                        if (busObjects1.left < groupedObject.left) {
                            // Connect busObj1 to the left ellipse
                            ellipse1.connectedBus = busObjects1.id; // Store the connection
                        } else {
                            // Connect busObj1 to the right ellipse
                            ellipse2.connectedBus = busObjects1.id; // Store the connection
                        }

                        // Check the position of busObj2
                        if (busObjects2.left < groupedObject.left) {
                            // Connect busObj2 to the left ellipse
                            ellipse1.connectedBus = busObjects2.id; // Store the connection
                        } else {
                            // Connect busObj2 to the right ellipse
                            ellipse2.connectedBus = busObjects2.id; // Store the connection
                        }

                        // Set colors based on voltage comparison

                        // if (ellipse1.connectedBus === busObjects1.id) {
                        //   ellipse1.set({ stroke: validatedBus2Color }); // Lower voltage bus
                        //   ellipse2.set({ stroke: validatedBus1Color }); // Higher voltage bus
                        // } else {
                        //   ellipse1.set({ stroke: validatedBus1Color }); // Higher voltage bus
                        //   ellipse2.set({ stroke: validatedBus2Color }); // Lower voltage bus
                        // }

                        // else if (parseFloat(bus1Voltage) < parseFloat(bus2Voltage)) {
                        //   if (ellipse1.connectedBus === busObjects.busObj2.id) {
                        //     ellipse1.set({ stroke: "blue" }); // Lower voltage bus
                        //     ellipse2.set({ stroke: "red" }); // Higher voltage bus
                        //   } else {
                        //     ellipse1.set({ stroke: "red" }); // Higher voltage bus
                        //     ellipse2.set({ stroke: "blue" }); // Lower voltage bus
                        //   }
                        // } else {
                        //   ellipse1.set({ stroke: "black" }); // same voltage bus
                        //   ellipse2.set({ stroke: "black" }); // same voltage bus
                        // }

                        groupedObject.setCoords(); // Update coordinates
                        groupedObject.objectCaching = false; //////////////////
                        groupedObject.on("moving", updateSPolyline);
                        //groupedObject.on("rotating", updateSPolyline);
                    }
                );
                // console.log("usObjectsPointer",busObjectsPointer);
                // Reset state with useEffect dependency
                resetBusObjects();
                dispatch({
                    type: "handleTransformerElementClick",
                    payload: false,
                });
                dispatch({
                    type: "IS_TRANSFORMER_SELECTED",
                    payload: false,
                });
            }
        }
    };
    useEffect(() => {
        if (busObjects.busObj1 && busObjects.busObj2) {
            console.log(busObjects);
            if (busObjects.busObj1 != busObjects.busObj2) {
                //if(busObjects.busObj1.canvasProperty[4].propertyValue != busObjects.busObj2.canvasProperty[4].propertyValue){
                // createTransformer();
                // }else{
                //   fabricCanvasRef.current.discardActiveObject();
                //   fabricCanvasRef.current.renderAll();
                //   setTimeout(() => {
                //   alert("Both bus have same voltage. Please choose different bus");
                // }, 500);
                //   // Reset state with useEffect dependency
                // resetBusObjects();
                // dispatch({ type: "IS_TRANSFORMER_SELECTED", payload: false });
                // }
            } else {
                fabricCanvasRef.current.discardActiveObject();
                fabricCanvasRef.current.renderAll();
                setTimeout(() => {
                    alert("Please Choose different bus");
                }, 500);
                // Reset state with useEffect dependency
                resetBusObjects();
                dispatch({
                    type: "IS_TRANSFORMER_SELECTED",
                    payload: false,
                });
            }
        }
    }, [busObjects, busObjectsPointer]);

    const resetBusObjects = () => {
        setBusObjects({ busObj1: null, busObj2: null });
        setBusObjectsPointer({ busObj1: null, busObj2: null });
    };

    const getBusDataForTransformer = (object) => {
        if (object.elementCategory == "Bus") {
            const getLocalPointer = object.getLocalPointer();
            if (state.isSelectedTransformer) {
                setBusObjects((prev) => {
                    if (!prev.busObj1) {
                        return {
                            ...prev,
                            busObj1: object,
                        }; // Set busObj1 if not set
                    } else if (!prev.busObj2) {
                        return {
                            ...prev,
                            busObj2: object,
                        }; // Set busObj2 if not set
                    }
                    return prev; // Return unchanged state if both are set
                });
                setBusObjectsPointer((prev) => {
                    if (!prev.busObj1) {
                        return {
                            ...prev,
                            busObj1: getLocalPointer,
                        }; // Set busObj1 if not set
                    } else if (!prev.busObj2) {
                        return {
                            ...prev,
                            busObj2: getLocalPointer,
                        }; // Set busObj2 if not set
                    }
                    return prev; // Return unchanged state if both are set
                });
            }
        }
    };

    // Example of event listener
    // useEffect(() => {
    //   if (
    //     (!busObjects.busObj1 || !busObjects.busObj2) &&
    //     state.isSelectedTransformer
    //   ) {
    //     // dispatch({ type: "SET_OBJECT_1", payload: null });
    //     // dispatch({ type: "SET_OBJECT_2", payload: null });
    //     // dispatch({ type: "LINK_OBJECT", payload: false });
    //     // dispatch({ type: "SET_CURRENT_LINE", payload: null });

    //     const handleSelection = (e) => {
    //       const selectedObject = e.selected;
    //       if (selectedObject) {
    //         getBusDataForTransformer(selectedObject[0]);
    //       }
    //     };

    //     fabricCanvasRef.current.on("selection:created", handleSelection);
    //     fabricCanvasRef.current.on("selection:updated", handleSelection);

    //     return () => {
    //       fabricCanvasRef.current.off("selection:created", handleSelection);
    //       fabricCanvasRef.current.off("selection:updated", handleSelection);
    //     };
    //   }
    // }, [state.isSelectedTransformer, busObjects]);

    //Add Bus Connection Details ===========================================================
    const UpdatedBusName = (bus, element) => {
        var busName = bus.canvasProperty[1].propertyValue;
        let property = "";
        if (element.elementCategory == "Generator") {
            property = element.canvasProperty.find(
                (item) => item.propertyName === "sGenBusName"
            );
        } else if (element.elementCategory == "Load") {
            property = element.canvasProperty.find(
                (item) => item.propertyName === "sLoadBus"
            );
        } else if (element.elementCategory == "Shunt Device") {
            property = element.canvasProperty.find(
                (item) => item.propertyName === "sShuntBus"
            );
        } else if (element.elementCategory == "Filter") {
            property = element.canvasProperty.find(
                (item) => item.propertyName === "sFilterBus"
            );
        } else if (element.elementCategory == "Induction Motor") {
            property = element.canvasProperty.find(
                (item) => item.propertyName === "sIndMotBus"
            );
        }

        if (property) {
            property.propertyValue = busName;
        }
        fabricCanvasRef.current.renderAll();
    };

    // Text Changes =========================================================================
    const addTextAboveObject = (object, textContent, position) => {
        const text = new fabric.IText(textContent, {
            left: position.x == null ? object.left - 10 : position.x,
            top: position.y == null ? object.top - 30 : position.y, // Adjust the Y position to be above the object
            fontSize: state.fontSize || 12,
            fill: object.stroke || "black",
            elementType: "text",
            id: uuidv4(),
            textlinkedObjectId: object.id,
            angle: position.angle,
            //selectable: false,
            selectable: true,
            lockMovementX: true,
            lockMovementY: true,
            lockScalingX: true,
            lockScalingY: true,
            lockScalingFlip: true,
            hasBorders: true,
            hasControls: true,
        });
        object.set("textId", text.id);
        // Add the text to the canvas
        fabricCanvasRef.current.add(text);
        bringAllIntoView(60);
    };
    const updateTextAboveObject = (object, textId) => {
        const object1Text = fabricCanvasRef.current
            .getObjects()
            .filter((obj) => obj.id === textId)[0];

        if (!object1Text) {
            return;
        }

        const getObj = fabricCanvasRef.current
            .getObjects()
            .filter((obj) => obj.id === object1Text?.textlinkedObjectId)[0];
        const objectAngle = getObj?.angle;

        if (
            ["Two winding transformer", "Transmission Line", "Bus"].includes(
                object.elementCategory
            )
        ) {
            object1Text.set("left", object.left - 10);
            object1Text.set("top", object.top - 30);
            if (objectAngle == 90) {
                object1Text.set("left", object.left + 30);
                object1Text.set("top", object.top - 5);
            }
            if (objectAngle == 180) {
                object1Text.set("left", object.left - 10);
                object1Text.set("top", object.top + 30);
            }
            if (objectAngle == 270) {
                object1Text.set("left", object.left - (object1Text.width + 30));
                object1Text.set("top", object.top - 5);
            }
        }
        if (
            !["Transmission Line", "Two winding transformer", "Bus"].includes(
                object.elementCategory
            )
        ) {
            if (objectAngle == 270) {
                object1Text.set("left", object.oCoords.mr.x + 30);
                object1Text.set("top", object.top - 30);
            }
            if (objectAngle == 90) {
                object1Text.set(
                    "left",
                    object.oCoords.ml.x - (object1Text.width + 30)
                );
                object1Text.set("top", object.top);
            }
            if (objectAngle == 0) {
                object1Text.set("left", object.oCoords.mb.x + 5);
                object1Text.set(
                    "top",
                    object.oCoords.mb.y + (object1Text.height + 5)
                );
            }
            if (objectAngle == 180) {
                object1Text.set("left", object.oCoords.mb.x + 5);
                object1Text.set(
                    "top",
                    object.oCoords.mb.y - (object1Text.width + 5)
                );
            }
        }

        // console.log("updateTextAboveObject--getObj",getObj);
        // console.log("updateTextAboveObject",object1Text);

        // Add the text to the canvas
        //fabricCanvasRef.current.add(text);
        // bringAllIntoView(60)
    };

    const updateArrowWithObject = (object) => {
        const objectArrow = fabricCanvasRef.current
            .getObjects()
            .filter((obj) => `arrow-head-${object.id}` === obj.id)[0];
        if (!objectArrow) return;

        if (objectArrow.angle === 90) {
            if (["Bus"].includes(object.elementCategory)) {
                objectArrow.set("left", object.left + 30);
                objectArrow.set("top", object.top + 5);
            }
        } else if (objectArrow.angle === -90) {
            if (["Bus"].includes(object.elementCategory)) {
                objectArrow.set("left", object.left - 30);
                objectArrow.set("top", object.top + 25);
            }
        }
    };

    const getMiddleObject = (arr) => {
        if (!Array.isArray(arr) || arr.length === 0) {
            throw new Error("Input must be a non-empty array.");
        }
        // Calculate the middle index
        const middleIndex = Math.floor(arr.length / 2);
        // Return the middle object
        return arr[middleIndex];
    };

    const addTextForLineObject = (object, textContent) => {
        let leftPosition = object.getCenterPoint().x;
        let topPosition = object.getCenterPoint().y;

        if (object.points.length > 2) {
            const middleObject = getMiddleObject(object.points);
            leftPosition = middleObject.x;
            topPosition = middleObject.y;
        }

        const text = new fabric.IText(textContent, {
            left: leftPosition,
            top: topPosition - 25, // Adjust the Y position to be above the object
            fontSize: state.fontSize || 12,
            fill: "black",
            elementType: "text",
            id: uuidv4(),
            textlinkedObjectId: object.id,
            //selectable: false,
            selectable: true,
            lockMovementX: true,
            lockMovementY: true,
            lockScalingX: true,
            lockScalingY: true,
            lockScalingFlip: true,
            hasBorders: true,
            hasControls: true,
        });

        object.set("textId", text.id);
        // Add the text to the canvas
        fabricCanvasRef.current.add(text);
    };

    const updateTextForLineObject = (object) => {
        if (
            object?.elementCategory === "Transmission Line" &&
            object?.name === "connectionLine"
        ) {
            const object1Text = fabricCanvasRef.current
                .getObjects()
                .find((obj) => obj.id === object.textId);

            if (!object1Text) {
                console.warn("No text object found for line:", object.textId);
                return;
            }

            let leftPosition = object.getCenterPoint().x;
            let topPosition = object.getCenterPoint().y;

            if (object.points.length > 2) {
                const middleObject = getMiddleObject(object.points);
                leftPosition = middleObject.x;
                topPosition = middleObject.y;
            }

            console.log("leftPosition :", leftPosition);
            console.log("topPosition :", topPosition);

            object1Text.set({
                left: leftPosition,
                top: topPosition - 25,
            });

            fabricCanvasRef.current.renderAll();
        }
    };


    const addOutputText = (object, elementOutput) => {
        const text = new fabric.IText(elementOutput.name, {
            left: elementOutput.left,
            top: elementOutput.top, // Adjust the Y position to be above the object
            fontSize: state.fontSize || 12,
            fill: "black",
            elementType: "text",
            id: uuidv4(),
            textlinkedObjectId: object.id,
            angle: elementOutput.angle,
            //selectable: false,
            selectable: true,
            lockMovementX: true,
            lockMovementY: true,
            lockScalingX: true,
            lockScalingY: true,
            lockScalingFlip: true,
            hasBorders: true,
            hasControls: true,
            isOutputText: true,
        });
        object.set(elementOutput.id, text.id);
        // Add the text to the canvas
        fabricCanvasRef.current.add(text);
    };

    const getUniqueCategories = (elements) => {
        return [
            ...new Set(
                elements
                    .filter((element) => element.elementCategory) // Ignore elements without a category
                    .map((element) => element.elementCategory) // Extract category names
            ),
        ];
    };

    const categoryMapping = {
        "Transmission Line": "line",
        Bus: "bus",
        Generator: "generator",
        Load: "load",
        "Shunt Device": "shunt",
        Filter: "filter",
        "Induction Motor": "induction",
        "Two winding transformer": "transformer",
    };

    const generateOutputFromEngine = async () => {
        const getOutputData = await readBusOutputData(
            fabricCanvasRef.current.engineInputURL,
            fabricCanvasRef.current.engineInputFolderName
        );
        if (getOutputData) {
            const allObjects = fabricCanvasRef.current.getObjects();
            const uniqueCategories = getUniqueCategories(allObjects);
            console.log("uniqueCategories", {
                uniqueCategories,
                getOutputData,
            });

            let validOutput = true;

            const categoryCounts = uniqueCategories.reduce((acc, category) => {
                const key = categoryMapping[category]; // Get corresponding key in a2
                acc[category] = getOutputData[key]
                    ? getOutputData[key].length
                    : 0; // Count records in a2
                return acc;
            }, {});

            Object.entries(categoryCounts).forEach(([category, count]) => {
                if (count === 0) {
                    validOutput = false;
                    alert(`${category} output data is not found.`);
                }
            });

            if (validOutput) {
                const currentOutputObject = filterObjectWithOutput(allObjects);

                for (let i = 0; i < currentOutputObject.length; i++) {
                    fabricCanvasRef.current.remove(currentOutputObject[i]);
                }
                setEngineOutput(getOutputData);
                generateOutputText(getOutputData);
            }
        } else {
            alert("Output files not found");
        }
        console.log("generateOutput");
        dispatch({ type: "GENERATE_OUTPUT", payload: false });
    };

    const generateOutputText = (outputData) => {
        const allObjects = fabricCanvasRef.current.getObjects();
        // console.log("generateOutputText", allObjects);

        const processElement = (data, category, createOutputText) => {
            if (data.length === 0) return;
            console.log("processElement - data", data);
            data.forEach((objData) => {
                let filteredObjects = "";

                if (category == "Bus") {
                    filteredObjects = allObjects.filter(
                        (item) =>
                            item.elementCategory === category &&
                            item.canvasProperty[1]?.propertyValue.toLowerCase() ===
                                objData.name.toLowerCase()
                    );
                } else if (["Two winding transformer"].includes(category)) {
                    filteredObjects = allObjects.filter(
                        (item) =>
                            item.elementCategory === category &&
                            item.canvasProperty[2]?.propertyValue.toLowerCase() ===
                                objData.HVBus.toLowerCase() &&
                            item.canvasProperty[3]?.propertyValue.toLowerCase() ===
                                objData.LVBus.toLowerCase() &&
                            item.canvasProperty[4]?.propertyValue === objData.id
                    );
                } else if (["Transmission Line"].includes(category)) {
                    console.log("processElement - objData", objData);
                    filteredObjects = allObjects
                        .filter((item) => item.name === "connectionLine")
                        .filter(
                            (item) =>
                                item.elementCategory === category &&
                                item.canvasProperty[2]?.propertyValue.toLowerCase() ===
                                    objData.bus1.toLowerCase() &&
                                item.canvasProperty[3]?.propertyValue.toLowerCase() ===
                                    objData.bus2.toLowerCase() &&
                                item.canvasProperty[4]?.propertyValue ===
                                    objData?.id
                        );
                } else {
                    filteredObjects = allObjects.filter(
                        (item) =>
                            item.elementCategory === category &&
                            item.canvasProperty[2]?.propertyValue.toLowerCase() ===
                                objData.name.toLowerCase() &&
                            item.canvasProperty[3]?.propertyValue === objData.id
                    );
                }

                if (filteredObjects.length > 0) {
                    const elementObj = filteredObjects[0];
                    const outputTextArray = createOutputText(
                        elementObj,
                        objData
                    );

                    if (category == "Bus") {
                        outputTextArray.forEach((text) =>
                            addOutputText(elementObj, text)
                        );
                    }

                    const lineElement = allObjects.find(
                        (line) => line.id === elementObj?.connectingLine?.[0]
                    );
                    if (
                        lineElement &&
                        ![
                            "Bus",
                            "Two winding transformer",
                            "Transmission Line",
                        ].includes(category)
                    ) {
                        const [elementRecord, ...lineRecords] = outputTextArray;
                        addOutputText(elementObj, elementRecord);
                        lineRecords.forEach((text) =>
                            addOutputText(lineElement, text)
                        );
                        //outputTextArray.slice(3).forEach((text) => addOutputText(lineElement, text));
                    }
                    if (category == "Two winding transformer") {
                        const HVLineRecord = outputTextArray.slice(0, 2);
                        const LVLineRecord = outputTextArray.slice(2, 4);
                        const transformerRecord = outputTextArray.slice(4);

                        const HighlineElement = allObjects.find(
                            (line) =>
                                line.id === elementObj?.connectingLine?.[0]
                        );
                        const LowlineElement = allObjects.find(
                            (line) =>
                                line.id === elementObj?.connectingLine?.[1]
                        );

                        HVLineRecord.forEach((text) =>
                            addOutputText(HighlineElement, text)
                        );
                        LVLineRecord.forEach((text) =>
                            addOutputText(LowlineElement, text)
                        );
                        transformerRecord.forEach((text) =>
                            addOutputText(elementObj, text)
                        );
                    }
                    if (category == "Transmission Line") {
                        const HVLineRecord = outputTextArray.slice(0, 2);
                        const LVLineRecord = outputTextArray.slice(2, 4);
                        const transformerRecord = outputTextArray.slice(4);
                        console.log(
                            "Transmission Line - elementObj",
                            elementObj
                        );
                        const HighlineElement = allObjects.find(
                            (line) =>
                                line.id === elementObj?.connectingLine?.[0]
                        );
                        const LowlineElement = allObjects.find(
                            (line) =>
                                line.id === elementObj?.connectingLine?.[1]
                        );

                        HVLineRecord.forEach((text) =>
                            addOutputText(elementObj, text)
                        );
                        LVLineRecord.forEach((text) =>
                            addOutputText(elementObj, text)
                        );
                        transformerRecord.forEach((text) =>
                            addOutputText(elementObj, text)
                        );
                    }
                    updateGenerateOutputText(elementObj);
                }
            });
        };

        const createBusOutputText = (element, bus) => [
            {
                name: `${bus.value1} pu`,
                top: element.top - 50,
                left: element.left - 15,
                angle: 0,
                id: "output1TextId",
            },
            {
                name: `${bus.value2} kV`,
                top: element.top + element.height + 10,
                left: element.left - 15,
                angle: 0,
                id: "output2TextId",
            },
            {
                name: bus.value3 + "",
                top: element.top + element.height + 30,
                left: element.left - 15,
                angle: 0,
                id: "output3TextId",
            },
        ];

        const createGenericOutputText = (element, objData) => [
            {
                name: `${objData.value3} %`,
                top: element.getCenterPoint().y + 15,
                left: element.left - 90,
                angle: 0,
                id: "output1TextId",
            },
            {
                name: objData.value1 + "",
                top: element.top - 5,
                left: element.left + 5,
                angle: 0,
                id: "output2TextId",
            },
            {
                name: `(${objData.value2})`,
                top: element.top + 20,
                left: element.left + 5,
                angle: 0,
                id: "output3TextId",
            },
        ];

        const createTransformerOutputText = (element, objData) => [
            {
                name: `${objData.value1}` + "",
                top: element.top - 5,
                left: element.left + 5,
                angle: 0,
                id: "output2TextId",
            },
            {
                name: `(${objData.value2})`,
                top: element.top + 20,
                left: element.left + 5,
                angle: 0,
                id: "output3TextId",
            },
            {
                name: `${objData.value3}` + "",
                top: element.top - 5,
                left: element.left + 5,
                angle: 0,
                id: "output2TextId",
            },
            {
                name: `(${objData.value4})`,
                top: element.top + 20,
                left: element.left + 5,
                angle: 0,
                id: "output3TextId",
            },
            {
                name: `HV-tap: ${objData.value5}`,
                top: element.top + element.height + 10,
                left: element.left - 15,
                angle: 0,
                id: "output2TextId",
            },
            {
                name: `LV-tap: ${objData.value6}` + "",
                top: element.top + element.height + 30,
                left: element.left - 15,
                angle: 0,
                id: "output3TextId",
            },
            {
                name: `${objData.value7} %`,
                top: element.top - 50,
                left: element.left - 15,
                angle: 0,
                id: "output1TextId",
            },
        ];

        const createCustomLineOutputText = (element, objData) => [
            {
                name: objData.value1 + "",
                top: element.points[0].y - 12,
                left: element.points[0].x + 15,
                angle: 0,
                id: "output1TextId",
            },
            {
                name: `(${objData.value2})`,
                top: element.points[0].y + 7,
                left: element.points[0].x + 15,
                id: "output2TextId",
            },
            {
                name: objData.value3 + "",
                top: element.points[1].y - 12,
                left: element.points[element.points.length - 1].x - 50,
                angle: 0,
                id: "output3TextId",
            },
            {
                name: `(${objData.value4})`,
                top: element.points[1].y + 7,
                left: element.points[element.points.length - 1].x - 50,
                angle: 0,
                id: "output4TextId",
            },
            {
                name: `${objData.value5} %`,
                top: element.getCenterPoint().y - 7,
                left: element.getCenterPoint().x,
                angle: 0,
                id: "output5TextId",
            },
        ];

        processElement(outputData.bus, "Bus", createBusOutputText);
        processElement(
            outputData.generator,
            "Generator",
            createGenericOutputText
        );
        processElement(outputData.load, "Load", createGenericOutputText);
        processElement(outputData.filter, "Filter", createGenericOutputText);
        processElement(
            outputData.shunt,
            "Shunt Device",
            createGenericOutputText
        );
        processElement(outputData.induction, "Induction Motor", (el, data) => [
            ...createGenericOutputText(el, data),
            {
                name: `Slip: ${data.value3} pu`,
                top: el.getCenterPoint().y + 30,
                left: el.left - 90,
                angle: 0,
                id: "output4TextId",
            },
        ]);
        processElement(
            outputData.transformer,
            "Two winding transformer",
            createTransformerOutputText
        );
        processElement(
            outputData.line,
            "Transmission Line",
            createCustomLineOutputText
        );
    };
    // Function to calculate angle
    const calculateAngle = (x1, y1, x2, y2) =>
        (Math.atan2(y1 - y2, x1 - x2) * 180) / Math.PI;

    // Helper function to update object properties
    const updateObjectPositionAndAngle = (obj, left, top, angle) => {
        if (obj) {
            obj.set({ left, top, angle });
        }
    };

    // Update the generate output
    const updateGenerateOutputText = (object, additionalObject) => {
        const getObjs = fabricCanvasRef.current.getObjects();
        const getObjectById = (id) => getObjs.find((obj) => obj.id === id);
        // console.log("updateLineObjects",object);
        // console.log("getObjectById",getObjectById);
        const updateLineObjects = () => {
            const { points, output2TextId, output3TextId } = object;
            const midX = (points[0].x + points[1].x) / 2; //points[1].x+20;//
            const midY = points[1].y + 20; //(points[0].y + points[1].y) / 2;
            const angle = calculateAngle(
                points[0].x,
                points[0].y,
                points[1].x,
                points[1].y
            );

            const object2Text = getObjectById(output2TextId);
            const object3Text = getObjectById(output3TextId);

            const updatedAngle =
                additionalObject?.angle === 0
                    ? -90
                    : additionalObject?.angle - 90; //additionalObject.angle === 90 ? angle : angle;

            updateObjectPositionAndAngle(
                object2Text,
                midX,
                midY - 40,
                updatedAngle
            );
            updateObjectPositionAndAngle(
                object3Text,
                midX,
                midY - 5,
                updatedAngle
            );
        };

        const updateCategoryObjects = () => {
            const object1Text = getObjectById(object.output1TextId);
            let text1Left = object.left - 90;
            let text1Top = object.getCenterPoint().y + 15;
            let angle = 0;

            switch (object.angle) {
                case 270:
                    text1Left = object.left + 42;
                    break;
                case 180:
                    text1Left = object.getCenterPoint().x - 15;
                    text1Top = object.top - 90;
                    angle = 90;
                    break;
                case 0:
                    text1Left = object.getCenterPoint().x - 15;
                    text1Top = object.top + 48;
                    angle = 90;
                    break;
            }

            updateObjectPositionAndAngle(
                object1Text,
                text1Left,
                text1Top,
                angle
            );
        };

        const updateBusObjects = () => {
            const scaleY = object.scaleY;
            const calHeight = object.height * scaleY;
            const [object1Text, object2Text, object3Text] = [
                object.output1TextId,
                object.output2TextId,
                object.output3TextId,
            ].map(getObjectById);

            const positions = {
                0: {
                    text1: [object.left + 15, object.top - 50],
                    text2: [object.left + 15, object.top + calHeight + 10],
                    text3: [object.left + 15, object.top + calHeight + 30],
                    angle: 0,
                },
                90: {
                    text1: [object.left + 50, object.top - 5],
                    text2: [object.left - calHeight - 15, object.top - 5],
                    text3: [object.left - calHeight - 30, object.top - 5],
                    angle: 90,
                },
                180: {
                    text1: [object.left - 15, object.top + 50],
                    text2: [object.left - 15, object.top - calHeight - 10],
                    text3: [object.left - 15, object.top - calHeight - 30],
                    angle: 180,
                },
                270: {
                    text1: [object.left - 50, object.top],
                    text2: [object.left + calHeight + 15, object.top],
                    text3: [object.left + calHeight + 30, object.top],
                    angle: 270,
                },
            };

            const { text1, text2, text3, angle } =
                positions[object.angle] || positions[270];

            updateObjectPositionAndAngle(
                object1Text,
                text1[0],
                text1[1],
                angle
            );
            updateObjectPositionAndAngle(
                object2Text,
                text2[0],
                text2[1],
                angle
            );
            updateObjectPositionAndAngle(
                object3Text,
                text3[0],
                text3[1],
                angle
            );
        };

        const updateCustomLineObjects = () => {
            const scaleY = object.scaleY;
            const calHeight = object.height * scaleY;
            const [
                object1Text,
                object2Text,
                object3Text,
                object4Text,
                object5Text,
            ] = [
                object.output1TextId,
                object.output2TextId,
                object.output3TextId,
                object.output4TextId,
                object.output5TextId,
            ].map(getObjectById);

            const positions = {
                0: {
                    text1: [object.points[0].x + 15, object.points[0].y - 12],
                    text2: [object.points[0].x + 15, object.points[0].y + 7],
                    text3: [
                        object.points[object.points.length - 1].x - 35,
                        object.points[1].y - 12,
                    ],
                    text4: [
                        object.points[object.points.length - 1].x - 35,
                        object.points[1].y + 7,
                    ],
                    text5: [
                        object.getCenterPoint().x,
                        object.getCenterPoint().y + 7,
                    ],
                    angle: 0,
                },
            };

            const { text1, text2, text3, text4, text5, angle } =
                positions[object.angle] || positions[270];

            updateObjectPositionAndAngle(
                object1Text,
                text1[0],
                text1[1],
                angle
            );
            updateObjectPositionAndAngle(
                object2Text,
                text2[0],
                text2[1],
                angle
            );
            updateObjectPositionAndAngle(
                object3Text,
                text3[0],
                text3[1],
                angle
            );
            updateObjectPositionAndAngle(
                object4Text,
                text4[0],
                text4[1],
                angle
            );
            updateObjectPositionAndAngle(
                object5Text,
                text5[0],
                text5[1],
                angle
            );
        };

        const updateTransformerObjects = () => {
            const scaleY = object.scaleY;
            const calHeight = object.height * scaleY;
            const [object1Text, object2Text, object3Text] = [
                object.output1TextId,
                object.output2TextId,
                object.output3TextId,
            ].map(getObjectById); //object1Text1, object2Text1, object1Text2,object2Text2,

            const positions = {
                0: {
                    text1: [object.left + 15, object.top - 50],
                    text2: [object.left + 15, object.top + calHeight + 10],
                    text3: [object.left + 15, object.top + calHeight + 30],
                    angle: 0,
                },
                90: {
                    text1: [object.left + 50, object.top - 5],
                    text2: [object.left - calHeight - 15, object.top - 5],
                    text3: [object.left - calHeight - 30, object.top - 5],
                    angle: 90,
                },
                180: {
                    text1: [object.left - 15, object.top + 50],
                    text2: [object.left - 15, object.top - calHeight - 10],
                    text3: [object.left - 15, object.top - calHeight - 30],
                    angle: 180,
                },
                270: {
                    text1: [object.left - 50, object.top],
                    text2: [object.left + calHeight + 15, object.top],
                    text3: [object.left + calHeight + 30, object.top],
                    angle: 270,
                },
            };

            const { text1, text2, text3, angle } =
                positions[object.angle] || positions[270];

            updateObjectPositionAndAngle(
                object1Text,
                text1[0],
                text1[1],
                angle
            );
            updateObjectPositionAndAngle(
                object2Text,
                text2[0],
                text2[1],
                angle
            );
            updateObjectPositionAndAngle(
                object3Text,
                text3[0],
                text3[1],
                angle
            );
        };

        if (object.elementType === "line") updateLineObjects();
        if (
            [
                "Generator",
                "Load",
                "Filter",
                "Induction Motor",
                "Shunt Device",
            ].includes(object.elementCategory)
        ) {
            updateCategoryObjects();
        }
        if (object.elementCategory === "Bus") {
            updateBusObjects();
        }
        if (object.elementCategory === "Two winding transformer") {
            updateTransformerObjects();
        }
        if (object.elementCategory === "Transmission Line") {
            updateCustomLineObjects();
        }
    };

    // Line Changes =========================================================================
    const updateSPolyline = (e, eventType) => {
        const target = e.transform?.target;
        // console.log("updatepoyline is calling whenmoving the bus...",fabricCanvasRef.current.getObjects());

        // updateTextAboveObject(target, target?.textlinkedObjectId);
        updateTextAboveObject(target, target?.textId);
        updateArrowWithObject(target);
        updateGenerateOutputText(target);
        // if(target.connectingLine > 0){
        const allObjects = fabricCanvasRef.current.getObjects();
        const filteredObjects = allObjects.filter((obj) =>
            target.connectingLine.includes(obj["id"])
        );
        // console.log("filteredObjects - allObjects",allObjects);
        // console.log("filteredObjects - filteredObjects",allObjects);

        filteredObjects.forEach((data) => {
            //console.log("filteredObjects - data",data);
            if (eventType == "moving") {
                data.set("selectable", true);
            }

            updateTextForLineObject(data);
            // data.set("left",data.oldLeft);
            // data.set("top",data.oldTop);
            // data.set("angle",0);
            if (data.isLine == true && data.angle != 0) {
                //rotation ********
            } else {
                data.set("angle", 0);
            }
            data.setCoords();

            //updateTextForLineObject(data);
            // console.log("data",data);
            updatedlinkObject(data.fromObjectId, data.toObjectId, data);
        });

        // }else{
        //     const object1Text = fabricCanvasRef.current.getObjects().filter(obj =>obj.textlinkedObjectId ===target.id )[0];
        //     updateTextAboveObject(target,object1Text);
        // }
    };

    const updatePoints = (data, angle) => {
        //arasu
        console.log("angle :::: ", angle);

        const oldPoints = data.oldPoints;
        const oldLeft = data.oldLeft;
        const oldTop = data.oldTop;
        const leftOffset = data.left - oldLeft;
        const topOffset = oldTop - data.top;
        data.left = oldLeft;
        data.top = oldTop;

        oldPoints[0].x += topOffset;
        // oldPoints[0].y += leftOffset;
        // console.clear();
        const bound = data.getBoundingRect();
        let transformedPoints = [oldPoints[0]];
        for (let i = 1; i < oldPoints.length - 1; i++) {
            let xDiff = oldPoints[i].x - oldPoints[0].x + 8;
            let yDiff = oldPoints[i].y - oldPoints[0].y;
            if (angle == 180) {
                let placeH = xDiff;
                // xDiff *= -1;
                // yDiff *= -1;
                xDiff = yDiff;
                yDiff = -placeH;
            }
            transformedPoints.push({
                x: oldPoints[0].x - yDiff + 0,
                y: oldPoints[0].y + xDiff + bound.width + 0,
            });
        }
        transformedPoints.push(oldPoints[oldPoints.length - 1]);
        transformedPoints[0].x -= topOffset;
        // data.left = oldLeft;
        // data.top = oldTop;
        data.points = transformedPoints;
    };

    const updatedlinkObject = (object1Id, object2Id, line) => {
        const object1 = fabricCanvasRef.current
            .getObjects()
            .filter((obj) => obj.id === object1Id)[0];
        const object2 = fabricCanvasRef.current
            .getObjects()
            .filter((obj) => obj.id === object2Id)[0];

        const checkObjects = checkObjectCategories(object1, object2);

        // console.log("checkObjects", {checkObjects,line});
        object1.setCoords();
        object2.setCoords();

        let points = postionFunc.getCoordBtwObjects(object1, object2, line);
        if (checkObjects !== false) {
            points = postionFunc.getCoordBtwObjectsAndBus(
                checkObjects.obj1,
                checkObjects.obj2,
                line
            );
            if ([0, 180].includes(checkObjects.obj1.angle)) {
                if (checkObjects.obj1.left < checkObjects.obj2.left) {
                    checkObjects.obj2.angle = 270;
                } else {
                    checkObjects.obj2.angle = 90;
                }
            }
            if ([90, 270, -90, -270].includes(checkObjects.obj1.angle)) {
                if (checkObjects.obj1.top < checkObjects.obj2.top) {
                    checkObjects.obj2.angle = 0;
                } else {
                    checkObjects.obj2.angle = 180;
                }
            }

            checkObjects.obj2.setCoords();
            updateTextAboveObject(checkObjects.obj2, checkObjects.obj2?.textId);
        }

        if (object1.elementCategory == "Two winding transformer") {
            points = postionFunc.getCoordBtwTransformer(object1, object2, line);
            if (!line.isBusTwo) {
                points = swapFirstAndLastCoordinates(points);
            }
        }
        if (line) {
            updateGenerateOutputText(line, object2);
        }
        if (line.angle == 90) {
            line.set("angle", 0);
            line.oldPoints = line.points;
            console.log(" points :::: ", line.points[0]);

            line.set({ points: points });
            // console.log(" points :::: ", line.points[0]);
            // console.log("----------- :::: ");
            line.objectCaching = false;
            line.setCoords();
            // console.log("rotation calling ::::: ");
            // setTimeout(()=>updatePoints(line),1500)
            updatePoints(line, object1.angle);
            line.oldPoints = line.points;
        } else {
            // if(!line.isBusTwo)points[0].y = object1.top + line.topOffset;
            // if(line.isBusTwo){
            //   console.log("line aa :::: ", line);
            // }
            if (line.isBusTwo)
                points[points.length - 1].y = object2.top + line.topOffset2;
            // console.log("line.isBusTwo :::: ", line.isBusTwo);
            // line.set({ points: points });
            if (object1.elementCategory == "Two winding transformer") {
                line.set({ points: points });
            } else {
                line.set({
                    points:
                        line.points.length > 0
                            ? [line.points[0], ...points.slice(1)]
                            : points,
                });
            }

            // console.log(" points :::: ", line.points[0]);
            // console.log("----------- :::: ");
        }
        line.objectCaching = false;
        line.setCoords();
        if (line.name == "connectingLine") {
            refreshCoordsForAll(line);
        }
        refreshCoordsForAll(line);
        fabricCanvasRef.current.renderAll();

        updateMinimap();
    };

    const swapFirstAndLastCoordinates = (coordinates) => {
        // Return original array if it has less than 2 items
        if (coordinates.length < 2) {
            return coordinates;
        }

        // Create a copy of the array to avoid modifying the original
        const newCoordinates = [...coordinates];

        // Store the first and last items
        const firstItem = newCoordinates[0];
        const lastItem = newCoordinates[newCoordinates.length - 1];

        // Swap the items
        newCoordinates[0] = lastItem;
        newCoordinates[newCoordinates.length - 1] = firstItem;

        return newCoordinates;
    };

    const linkObject = (
        object1,
        object2,
        coordinate,
        getBus,
        transformedPoints,
        oldLine = null
    ) => {
        fabricCanvasRef.current.requestRenderAll();
        object1.setCoords();
        object2.setCoords();
        const checkVaild = validatedLink(object1, object2);
        
        if (checkVaild) {
            let points = postionFunc.getCoordBtwObjectsAndBus(object1, object2);
            
            if (object1.elementCategory == "Two winding transformer") {
                points = transformedPoints;
            
                var busName = object2.canvasProperty[1].propertyValue;
                let property = object1.canvasProperty.find(
                    (item) => item.propertyName === "sHVBusName"
                );
                if (getBus == "bus2") {
                    property = object1.canvasProperty.find(
                        (item) => item.propertyName === "sLVBusName"
                    );
                }
                property.propertyValue = busName;
                console.log("busName :",busName)
            }
            if (object2.elementCategory == "Two winding transformer") {
                points = transformedPoints;
            }
            // console.log("points", { points, getBus });
            const obj1ConnectingLine = object1.connectingLine || [];
            const obj2ConnectingLine = object2.connectingLine || [];

            console.log('obj1ConnectingLine :', obj1ConnectingLine);
            console.log("obj2ConnectingLine :", obj2ConnectingLine);
            // console.log("oldLine :::: ", oldLine);

            // Create the polyline
            var lineId = uuidv4();
            if (getBus == "bus2") {
                points[points.length - 1] =
                    oldLine.points[oldLine.points.length - 1];
                console.log("points :::: ", points);
                console.log("oldLine.points :::: ", oldLine.points);
            } else if (getBus == "bus1") {
                points[0] = oldLine.points[0];
            } else {
                // points[0].y = object2.top + object2.height / 2;
            }
            let busObj = object1.elementCategory == "Bus" ? object1 : object2;
            let leftOffsetofPoint1withObject1 = points[0].x - busObj.left;
            let topOffsetofPoint1withObject1 = points[0].y - busObj.top;
            let rightOffsetofPoint1withObject1 =
                busObj.width - leftOffsetofPoint1withObject1;
            let bottomOffsetofPoint1withObject1 =
                busObj.height - topOffsetofPoint1withObject1;

            const polyline = new fabric.Polyline(points, {
                stroke: object1?.fill || "black",
                strokeWidth: 1,
                fill: "transparent",
                selectable: false,
                name: "line",
                id: lineId,
                lineId: lineId,
                isLine: true,
                elementType: "line",
                fromObjectId: object1.id,
                toObjectId: object2.id,
                isTransformerLine:
                    object1.elementCategory == "Two winding transformer"
                        ? true
                        : false,
                isBusTwo:
                    object1.elementCategory == "Two winding transformer"
                        ? getBus == "bus2"
                            ? true
                            : false
                        : false,
                // selectable: true,
                // lockMovementX: true,
                // lockMovementY: true,
                // width:0,
                // height:0
                hasBorders: false,
                hasControls: false,
                evented: false,
                leftOffset: leftOffsetofPoint1withObject1,
                topOffset: topOffsetofPoint1withObject1,
                rightOffset: oldLine
                    ? oldLine.rightOffset
                    : rightOffsetofPoint1withObject1,
                bottomOffset: oldLine
                    ? oldLine.bottomOffset
                    : bottomOffsetofPoint1withObject1,
                rightOffset2: oldLine ? oldLine.rightOffset2 : 0,
                topOffset2: oldLine ? oldLine.topOffset2 : 0,
                bottomOffset2: oldLine ? oldLine.bottomOffset2 : 0,
            });
            if (getBus == "bus2") {
                console.log("bus2", polyline);
            }

            polyline.objectCaching = false;
            polyline.setCoords();

            if (object1.elementCategory == "Two winding transformer") {
                polyline.set("busPointerData", coordinate);
                polyline.set("connectedBusId", object2.id);
            }

            if (object1.elementCategory != "Two winding transformer") {
                const startingPoint = {
                    x: polyline.points[0].x - object2.left,
                    y: polyline.points[0].y - object1.top,
                };

                object2.set("elementBusId", object1.id);
                polyline.set("lineStartingPoint", startingPoint);
                // const otpoint = {
                //   x0:polyline.points[0],
                //   left:object1.left,
                //   top:object1.top,
                //   cat:object2.elementCategory,
                //   startingPoint:startingPoint
                // }
                //   console.log("polyline-points",otpoint);
            }
            // Add the polyline to the canvas
            fabricCanvasRef.current.add(polyline);

            // fabricCanvasRef.current.sendToBack(polyline);
            polyline.moveTo(0);
            fabricCanvasRef.current.requestRenderAll();
            polyline.set({
                oldLeft: polyline.left,
                oldTop: polyline.top,
            });

            // addTextAboveObject(polyline,polyline.name);
            // set metadata first
            object1.set("connectingLine", [...obj1ConnectingLine, polyline.lineId]);
            object2.set("connectingLine", [...obj2ConnectingLine, polyline.lineId]);

            // then add the line
            fabricCanvasRef.current.add(polyline);
            polyline.moveTo(0);
            fabricCanvasRef.current.requestRenderAll();

            console.log("Final connections >>>", {
                obj1: object1.id,
                obj1Lines: object1.connectingLine,
                obj2: object2.id,
                obj2Lines: object2.connectingLine,
                polyline: polyline.lineId
            });

            updatedlinkObject(object1.id,object2.id, polyline );

            return polyline;

            //===============================================================
        }
        // so that the line is behind the connected shapes
        // line.sendToBack();
        //getCoords.length=0;
        // dispatch({ type: 'LINK_OBJECT', payload: false });
        // dispatch({ type: 'SET_OBJECT_1', payload: null });
        // dispatch({ type: 'SET_OBJECT_2', payload: null });
    };

    const validatedLink = (object1, object2) => {
        let getlines = [];
        let getObjectIds = [];
        let getConnectedObjects = [];
        let newObject = {};
        let busId = {};
        let isAvailable = 0;
        const allObjects = fabricCanvasRef.current.getObjects();
        if (
            object1.elementCategory !== "Bus" &&
            object2.elementCategory !== "Bus"
        ) {
            alert(
                `Please ensure at least one of the objects has the category 'bus'.`
            );
            fabricCanvasRef.current.discardActiveObject();
            return false;
        }
        // if (object1.elementCategory == "Bus" && object2.elementCategory == "Bus") {
        //   const isEqual = comparePropertyValue(
        //     object1.canvasProperty,
        //     object2.canvasProperty,
        //     "fBuskV"
        //   );
        //   if (!isEqual) {
        //     alert(`Failed! Two buses having different Voltage.`);
        //     fabricCanvasRef.current.discardActiveObject();
        //     return false;
        //   }
        // }
        if (
            object1.elementCategory == "Two winding transformer" ||
            object2.elementCategory == "Two winding transformer" ||
            object1.elementCategory == "Transmission Line" ||
            object2.elementCategory == "Transmission Line"
        ) {
            return true;
        }
        if (object1.elementCategory == "Bus") {
            getlines = allObjects.filter((obj) =>
                object1.connectingLine.includes(obj["lineId"])
            );
            newObject = object2;
            busId = object1.id;
        } else {
            getlines = allObjects.filter((obj) =>
                object2.connectingLine.includes(obj["lineId"])
            );
            newObject = object1;
            busId = object2.id;
        }
        if (getlines.length > 0) {
            getlines.forEach((data) => {
                if (data.fromObjectId !== busId) {
                    getObjectIds.push(data.fromObjectId);
                }
                if (data.toObjectId !== busId) {
                    getObjectIds.push(data.toObjectId);
                }
            });
            getConnectedObjects = allObjects.filter((obj) =>
                getObjectIds.includes(obj["id"])
            );
            // isAvailable = getConnectedObjects.filter(
            //   (obj) => obj.elementCategory == newObject.elementCategory
            // ).length;
        }
        if (isAvailable > 0) {
            alert(
                `Only one element of the same type can be connected to a bus. Please remove the extra element.`
            );
            fabricCanvasRef.current.discardActiveObject();
            return false;
        }
        // console.log("updateModifications calling 3144");
        updateModifications(true);
        return true;
    };

    // Function to handle object selection based on the flow
    const handleObjectSelection = (selectedObject) => {
        //console.log('handleObjectSelection');
        //console.log("isLinkObject22 :::: ", state.isLinkObject);
        // if (state.isLinkObject) {
        //   if (!state.object1) {
        //     //console.log('Event start: select the first object');
        //     dispatch({ type: 'SET_OBJECT_1', payload: selectedObject });
        //     //console.log('Please choose second element object');
        //   } else if (!state.object2) {
        //     dispatch({ type: 'SET_OBJECT_2', payload: selectedObject });
        //     //console.log('Second object selected');
        //     // linkObject(state.object1,selectedObject);
        //   }
        // }
    };
    // Example of fabric.js event listener for object selection
    const addSelectionListener = () => {
        if (!state.object1 || !state.object2) {
            fabricCanvasRef.current.on("selection:created", (e) => {
                // console.log("here 2307");
                var canvas = fabricCanvasRef.current; //arasu
                const getSelectedObject = canvas.getActiveObject();
                if (
                    getSelectedObject &&
                    getSelectedObject.type === "activeSelection"
                ) {
                    if (!canvas.selectionPos) canvas.selectionPos = {};
                    canvas.selectionPos.left = getSelectedObject.left;
                    canvas.selectionPos.top = getSelectedObject.top;
                }
                const selectedObject = e.selected;
                if (selectedObject) {
                    handleObjectSelection(selectedObject[0]);
                }
            });
            fabricCanvasRef.current.on("selection:cleared", (e) => {
                console.log("here 2333");
                var canvas = fabricCanvasRef.current;
                const getSelectedObject = e.deselected;
                // const getSelectedObject = canvas.getActiveObject();
                if (getSelectedObject && getSelectedObject.length > 1) {
                    //arasu
                    if (!canvas.selectionPos) canvas.selectionPos = {};
                    // canvas.selectionPos.left = getSelectedObject.left;
                    // canvas.selectionPos.top = getSelectedObject.top;
                    let transformedPoints = [];
                    getSelectedObject.forEach((object) => {
                        if (
                            canvas?.selectionPos?.leftOffset &&
                            canvas.selectionPos?.leftOffset > 0
                        ) {
                            if (object.elementCategory == "Transmission Line") {
                                object.oldPoints = object.points;
                                let oldPoints = object.points;
                                // console.clear();

                                console.log(oldPoints);

                                for (let i = 0; i < object.points.length; i++) {
                                    let xDiff =
                                        oldPoints[i].x +
                                            canvas.selectionPos.leftOffset || 0;
                                    let yDiff =
                                        oldPoints[i].y +
                                            canvas.selectionPos.topOffset || 0;
                                    transformedPoints.push({
                                        x: xDiff,
                                        y: yDiff,
                                    });
                                }
                                object.points = transformedPoints;
                                object.oldPoints = transformedPoints;
                                // object.left = 0;
                                // object.top = 0;
                                console.log(oldPoints);
                                refreshCoordsForAll(object);
                            }
                        }
                    });
                    canvas.selectionPos.leftOffset = 0;
                    canvas.selectionPos.topOffset = 0;
                }
            });
            fabricCanvasRef.current.on("selection:updated", (e) => {
                const selectedObject = e.selected;
                if (selectedObject) {
                    handleObjectSelection(selectedObject[0]);
                }
            });
        }
    };

    const updatePolylinePointsAfterRotation = (polyline) => {
        const matrix = polyline.calcTransformMatrix();

        // Transform each point using the matrix
        const newPoints = polyline.points.map((point) => {
            const transformedPoint = fabric.util.transformPoint(
                { x: point.x, y: point.y },
                matrix
            );
            return { x: transformedPoint.x, y: transformedPoint.y };
        });
        console.log("newPoints", newPoints);
        // // Update polyline points and render canvas
        // polyline.set({ points: newPoints });
        // polyline.set({ angle: 0 }); // Reset rotation angle if needed
        // polyline.setCoords(); // Update coordinates
        // polyline.canvas.renderAll();
    };

    const rotatingObject = () => {
        var obj = fabricCanvasRef.current.getActiveObject();
        const currentCanvas = fabricCanvasRef.current;
        if (obj?.hasOwnProperty("id")) {
            if (obj.elementCategory == "Bus") {
                const nextAngle = getNextAngle(obj.angle);
                const allObjects = currentCanvas.getObjects();
                var getAllobject = getConnectedObject(obj.id, allObjects);
                if (getAllobject.length > 2) return false;
                console.log("getAllobject :::: ", getAllobject);

                var selectedObject = new fabric.ActiveSelection(getAllobject, {
                    canvas: currentCanvas,
                    originX: "center", // Set rotation origin to center horizontally
                    originY: "center", // Set rotation origin to center vertically
                });
                currentCanvas.setActiveObject(selectedObject);
                currentCanvas._activeObject.angle += 90;

                // handleObjectMoving();
                // Render changes
                selectedObject.setCoords(); // Update coordinates
                selectedObject.objectCaching = false; // Disable caching

                currentCanvas.discardActiveObject();
            }
        }
        currentCanvas.renderAll();
        if (obj?.hasOwnProperty("id")) {
            if (obj.elementCategory == "Bus") {
                if (selectedObject?.oCoords.tl.y < 0) {
                    var selectedObject = new fabric.ActiveSelection(
                        getAllobject,
                        {
                            canvas: currentCanvas,
                            originX: "center", // Set rotation origin to center horizontally
                            originY: "center", // Set rotation origin to center vertically
                        }
                    );

                    currentCanvas.setActiveObject(selectedObject);
                    currentCanvas._activeObject.top =
                        selectedObject.top +
                        Math.abs(selectedObject?.oCoords.tl.y);
                    currentCanvas.discardActiveObject();
                }
            }

            currentCanvas.renderAll();
        }
        console.log("updateModifications calling 3280");
        updateModifications(true);
        dispatch({ type: "SET_ROTATING", payload: false });
    };

    //   // Initialize Fabric.js canvas
    useEffect(() => {
        addSelectionListener();
        //console.log('addSelectionListener');
        //console.log("addSelectionListener",addSelectionListener);
        // Clean up the event listener on component unmount
        return () => {
            fabricCanvasRef.current.off("selection:created");
            fabricCanvasRef.current.off("selection:updated");
        };
    }, [state.object1, state.object2]);
    // }, [state.isLinkObject, state.object1, state.object2]);

    useEffect(() => {
        if (state.isPopupOpen) {
            getStoredCanvas();
        }
        if (state.isSaveAsCanvas) {
            getStoredCanvas();
        }
        if (state.isLoadCanvas == true) {
            getStoredCanvas();
        }
        if (state.groupObject) {
            groupTheObjects();
        }
        if (state.ungroupObject) {
            ungroupTheObjects();
        }
        if (state.isDeleteObject) {
            deleteObject();
        }
        if (state.isLinkObject) {
            // linkObject();
        }
        if (state.rotating) {
            rotatingObject();
        }
        if (state.isPrintWithResult) {
            printWithText();
        }
        if (state.isPrintWithoutResult) {
            printWithoutText();
        }
        if (state.generateInput) {
            handleGenerateOutput("output");
        }
        if (state.isExportData) {
            handleGenerateOutput("excel");
        }
        if (state.isCopied) {
            handleCopyObject();
        }
        if (state.isPasted) {
            //console.log("paste",fabricCanvasRef.current.getActiveObject());
            handlePasteObject();
        }
        if (state.isCopiedObjectProps) {
            handleCopyObjectProperties();
        }
        if (state.isPastedObjectProps) {
            handlePasteObjectProperties();
        }
        if (state.reset) {
            resetCanvas();
        }
        if (state.isEditPopupOpen) {
            saveDataInLoad();
        }
        if (state.executedEngine) {
            executeEngine();
        }
        if (state.generateOutput) {
            console.log("here 123");

            generateOutputFromEngine();
        }
        if (state.isMinMapEnabled) {
            updateMinimap();
        }
    }, [
        state.isLoadCanvas,
        state.groupObject,
        state.ungroupObject,
        state.isDeleteObject,
        state.rotating,
        state.isPrintWithoutResult,
        state.isPrintWithResult,
        state.generateInput,
        state.executedEngine,
        state.generateOutput,
        state.isExportData,
        state.isCopied,
        state.isPasted,
        state.reset,
        state.isPopupOpen,
        state.isSaveAsCanvas,
        state.isEditPopupOpen,
        state.isCopiedObjectProps,
        state.isPastedObjectProps,
        state.isMinMapEnabled,
    ]);

    const executeEngine = async () => {
        // console.log('Engine Execute started:',process.env.REACT_APP_ENGINE_SERVER_URL);
        // console.log('Engine Execute started1:',process.env.REACT_APP_API_BASE_URL);
        let error_message = "";
        let isVaild = true;
        const getObjects = fabricCanvasRef.current.getObjects();

        if (fabricCanvasRef.current.storedData == "") {
            error_message = "Please save the canvas data";
            isVaild = false;
        }

        if (
            fabricCanvasRef.current.engineInputURL == "" &&
            fabricCanvasRef.current.engineInputFolderName == ""
        ) {
            error_message =
                "Engine Input URL & Folder is not set. Please set the input url & folder";
            isVaild = false;
        }
        // if(fabricCanvasRef.current.systemConfiguration[0].propertyValue == ""){
        //   error_message ="Please set the SLACK BUSBAR value in system parameter before generate the input";
        //   isVaild =false;
        // }
        // if(getObjects.length >0){
        //   const getBusData = getObjects.filter(data=>data.elementCategory=="Bus").find(data=>data.canvasProperty[1].propertyValue==fabricCanvasRef.current.systemConfiguration[0].propertyValue);
        //   console.log("getBusData",getBusData);
        //   if(!getBusData){
        //     error_message ="Please set the SLACK BUSBAR value not match with current bus element";
        //     isVaild =false;
        //   }
        // }
        if (getObjects.length == 0) {
            error_message =
                "No element found. Please add element before generate the input";
            isVaild = false;
        }
        if (!isVaild) {
            alert(error_message);
        }

        if (isVaild) {
            try {
                // Send the file to the backend API
                const response = await axios.get(
                    `${process.env.REACT_APP_ENGINE_SERVER_URL}/executeEngine`
                );
                console.log("Engine Execute successfully:", response.data);
            } catch (error) {
                if (error.code == "ERR_NETWORK") {
                    alert("engine server is not connected");
                }
            }
        }

        dispatch({ type: "EXECUTE_ENGINE", payload: false });
    };

    const saveDataInLoad = () => {
        const elementsName = fabricCanvasRef.current
            .getObjects()
            .filter((data) => data.canvasProperty)
            .map((data) => ({
                propertyName: data.canvasProperty[1].propertyName,
                propertyValue: data.canvasProperty[1].propertyValue,
            }));
        localStorage.setItem("elementsData", JSON.stringify(elementsName));
    };

    const resetCanvas = () => {
        var currentCanvas = fabricCanvasRef.current;
        //Set Index
        for (const [key, value] of Object.entries(indexData)) {
            fabricCanvasRef.current.set(value, 1); // change to parent
        }

        fabricCanvasRef.current.storedData = "";

        currentCanvas.clear();
        currentCanvas.renderAll();
        dispatch({ type: "SET_RESET", payload: false });
    };

    const printWithoutText = () => {
        var currentCanvas = fabricCanvasRef.current;
        const allObjects = currentCanvas.getObjects();
        const getFilteredData = filterObjectWithOutput(allObjects);
        getFilteredData.forEach((data) => {
            data.set("opacity", 0);
        });
        currentCanvas.renderAll();
        var base64Data = currentCanvas.toDataURL("image/png");
        const pdf = new jsPDF();
        pdf.addImage(base64Data, "PNG", 0, 0);
        const timestamp = Date.now();
        const downloaded = pdf.save(`downloaded-${timestamp}.pdf`);
        if (downloaded) {
            getFilteredData.forEach((data) => {
                data.set("opacity", 1);
            });
            currentCanvas.renderAll();
            dispatch({
                type: "SET_PRINT_WITHOUT_TEXT",
                payload: false,
            });
        }
    };

    const printWithText = () => {
        var currentCanvas = fabricCanvasRef.current;
        var base64Data = currentCanvas.toDataURL("image/png");
        const svgData = currentCanvas.toSVG();
        const pdf = new jsPDF();
        // pdf.addImage(base64Data, "PNG", 0, 0);
        const imgProps = pdf.getImageProperties(base64Data);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(base64Data, "PNG", 0, 0, pdfWidth, pdfHeight);
        const timestamp = Date.now();
        const downloaded = pdf.save(`downloaded-${timestamp}.pdf`);
        if (downloaded) {
            dispatch({
                type: "SET_PRINT_WITH_TEXT",
                payload: false,
            });
        }
    };

    const handleGenerateOutput = (type) => {
        var currentCanvas = fabricCanvasRef.current;
        const allObjects = currentCanvas.getObjects();
        const getFilteredData = filterObjectByType(allObjects, "svg");
        const getLineData = filterObjectByType(allObjects, "line")?.filter(
            (data) => (data.name = "connectingLine")
        );
        const objs = [...getFilteredData, ...getLineData];
        if (objs.length > 0) {
            if (type == "output") {
                setDataToOutput(objs); // Pass the data to the child component
            } else {
                setDataToExcel(objs); // Pass the data to the child component
            }
        } else {
            alert(
                "No element found. Please add element before generate the output"
            );
            dispatch({ type: "GENERATE_INPUT", payload: false });
            dispatch({ type: "EXPORT_EXCEL", payload: false });
        }
    };

    const handleCopyObject = () => {
        if (copiedSelectedObject) return;
        const getSelectedObject = fabricCanvasRef.current.getActiveObject();
        if (getSelectedObject) {
            if (
                getSelectedObject &&
                getSelectedObject.type === "activeSelection"
            ) {
                // Clone all objects in the selection
                console.log("getSelectedObject.left", getSelectedObject.left);
                const copiedObjects = [];
                const allObjects = fabricCanvasRef.current.getObjects();
                const getcopiedwithconnectedObject =
                    getRemainingConnectedObjects(
                        allObjects,
                        getSelectedObject.getObjects()
                    );
                console.log(
                    "getcopiedwithconnectedObject",
                    getcopiedwithconnectedObject
                );

                fabricCanvasRef.current.discardActiveObject();
                fabricCanvasRef.current.renderAll();
                var selectedObject = new fabric.ActiveSelection(
                    getcopiedwithconnectedObject,
                    {
                        canvas: fabricCanvasRef.current,
                        originX: "center", // Set rotation origin to center horizontally
                        originY: "center", // Set rotation origin to center vertically
                    }
                );
                fabricCanvasRef.current.setActiveObject(selectedObject);
                selectedObject.set("active", true);

                getcopiedwithconnectedObject.forEach((obj) => {
                    //const serializedObj = obj.toObject(["id","elementType"]);
                    //console.log("serializedObj",serializedObj);
                    obj.clone((cloned) => {
                        //cloned.elementType = obj.elementType;
                        //Object.assign(cloned, serializedObj);
                        objectProps.forEach((key) => {
                            cloned[key] = obj[key];
                        });
                        copiedObjects.push(cloned);
                    });
                });
                console.log("Objects copied:", copiedObjects);
                setCopiedSelectedObject(copiedObjects);
                setCopiedObjectProps({
                    width: getSelectedObject.width,
                    height: getSelectedObject.height,
                    left: getSelectedObject.left,
                    top: getSelectedObject.top,
                });
            } else {
                setCopiedSelectedObject(getSelectedObject);
            }
            fabricCanvasRef.current.discardActiveObject();
            fabricCanvasRef.current.renderAll();
        }
    };

    const handlePasteObject = () => {
        const activeObject = fabricCanvasRef.current.getActiveObject();
        if (!copiedSelectedObject) {
            alert("Element not selected. Please select the element");
        } else {
            if (activeObject) {
                if (activeObject.type != "activeSelection") {
                    replacedObjectProperty(activeObject, copiedSelectedObject);
                }
            } else {
                clonedTheNewObjects(copiedSelectedObject);
                fabricCanvasRef.current.requestRenderAll();
            }
        }
        //console.log("copiedSelectedObject", copiedSelectedObject);
        setCopiedSelectedObject(null);
        dispatch({ type: "COPY_OBJECT", payload: false });
        dispatch({ type: "PASTE_OBJECT", payload: false });
    };
    const handlePasteObjectForNewGUI = (activeObject1) => {
        const activeObject = fabricCanvasRef.current.getActiveObject();
        if (!activeObject1) {
            alert("Element not selected. Please select the element");
        } else {
            if (activeObject) {
                if (activeObject.type != "activeSelection") {
                    replacedObjectProperty(activeObject, activeObject1);
                }
            } else {
                // fabricCanvasRef.current.set(
                //   indexData[activeObject1.elementCategory],
                //   fabricCanvasRef.current.get(
                //     indexData[activeObject1.elementCategory]
                //   ) - 1
                // );
                activeObject1.set({
                    left: 50, // Adjust the position as needed for the new canvas
                    top: 200,
                    evented: true, // Enable event handling
                });
                clonedTheBusInNewGUI(activeObject1);
                fabricCanvasRef.current.requestRenderAll();
            }
        }
        //console.log("copiedSelectedObject", copiedSelectedObject);
        setCopiedSelectedObject(null);
        dispatch({ type: "COPY_OBJECT", payload: false });
        dispatch({ type: "PASTE_OBJECT", payload: false });
    };

    const clonedTheNewObjects = (copiedSelectedObject) => {
        //.filter(data=>data.elementType!="text")
        //console.log("copiedSelectedObject",copiedSelectedObject);

        let clonedObject = [];
        if (Array.isArray(copiedSelectedObject)) {
            copiedSelectedObject.forEach((clonedObj) => {
                clonedObj.clone((clone) => {
                    const cloneLeft =
                        parseInt(clone.left) +
                        copiedObjectProps.left +
                        copiedObjectProps.width;
                    const cloneTop =
                        parseInt(clone.top) +
                        copiedObjectProps.top +
                        copiedObjectProps.height;
                    //clone.elementType = clonedObj.elementType;
                    objectProps.forEach((key) => {
                        clone[key] = clonedObj[key];
                    });
                    clone.set({
                        left: cloneLeft + 15, // Offset to differentiate from original
                        top: cloneTop + 15, // Offset to differentiate from original
                        evented: true, // Make the cloned object interactive
                    });
                    //clone.set("left", data.left + 5);
                    clone.set("oldId", clone.id);
                    clone.set("id", uuidv4());
                    if (clone?.canvasProperty) {
                        const propIdKey = clone?.canvasProperty[0].propertyName;
                        const propIdValue = fabricCanvasRef.current.get(
                            indexData[clone.elementCategory]
                        );
                        const propNameKey =
                            clone.canvasProperty[1].propertyName;
                        const propNameValue = NameGenerateString(
                            clone.canvasProperty[1].defaultValue,
                            fabricCanvasRef.current.get(
                                indexData[clone.elementCategory]
                            )
                        );
                        const newData = {
                            [propIdKey]: propIdValue,
                            [propNameKey]: propNameValue,
                        };
                        console.log("newData", newData);
                        clone.set(
                            "canvasProperty",
                            updateProperties(clone.canvasProperty, newData)
                        );
                        fabricCanvasRef.current.set(
                            indexData[clone.elementCategory],
                            fabricCanvasRef.current.get(
                                indexData[clone.elementCategory]
                            ) + 1
                        );
                    }
                    const addElement = fabricCanvasRef.current.add(clone);
                    clonedObject.push(clone);
                });
            });

            clonedObject.forEach((data) => {
                if (data.elementType == "text") {
                    const newObjs = clonedObject.find(
                        (obj) => obj.oldId == data.textlinkedObjectId
                    );
                    data.set("textlinkedObjectId", newObjs?.id);
                    newObjs.set("textId", data.id);

                    if (newObjs.canvasProperty[1]?.propertyName) {
                        data?.set(
                            "text",
                            newObjs?.canvasProperty[1].propertyValue
                        );
                        fabricCanvasRef.current.renderAll();
                    }
                }

                if (data.elementType == "svg") {
                    const elementconnectingLine = data.connectingLine?.map(
                        (lineId) => {
                            return clonedObject.find(
                                (newObj) => newObj.oldId == lineId
                            )?.id;
                        }
                    );
                    data.set("connectingLine", elementconnectingLine);
                    const connectingElement = data.connectingElement?.forEach(
                        (item) => {
                            item.id = clonedObject.find(
                                (newObj) => newObj.oldId == item.id
                            )?.id;
                        }
                    );
                    data.set("connectingElement", connectingElement);
                }
                if (data.elementType == "line") {
                    data.set(
                        "fromObjectId",
                        clonedObject.find(
                            (newObj) => newObj.oldId == data.fromObjectId
                        )?.id
                    );
                    data.set(
                        "toObjectId",
                        clonedObject.find(
                            (newObj) => newObj.oldId == data.toObjectId
                        )?.id
                    );
                }
            });
        } else {
            if (copiedSelectedObject.elementCategory == "Bus") {
                var object = fabric.util.object.clone(copiedSelectedObject);
                fabricCanvasRef.current.discardActiveObject();
                object.set({
                    left: object.left + 10,
                    top: object.top + 5,
                    evented: true,
                });
                object.set("id", uuidv4());
                const propIdKey = object.canvasProperty[0].propertyName;
                const propIdValue = fabricCanvasRef.current.get(
                    indexData[object.elementCategory]
                );
                const propNameKey = object.canvasProperty[1].propertyName;
                const propNameValue = NameGenerateString(
                    object.canvasProperty[1].defaultValue,
                    fabricCanvasRef.current.get(
                        indexData[object.elementCategory]
                    )
                );
                const newData = {
                    [propIdKey]: propIdValue,
                    [propNameKey]: propNameValue,
                };
                object.set(
                    "canvasProperty",
                    updateProperties(object.canvasProperty, newData)
                );
                if (indexData[object.elementCategory] === "busIndex") {
                    dispatch({
                        type: "SET_INDEX_VALUE_BUS",
                        payload:
                            fabricCanvasRef.current.get(
                                indexData[object.elementCategory]
                            ) + 1,
                    });
                } else if (
                    indexData[object.elementCategory] === "filterIndex"
                ) {
                    dispatch({
                        type: "SET_INDEX_VALUE_FILTER",
                        payload:
                            fabricCanvasRef.current.get(
                                indexData[object.elementCategory]
                            ) + 1,
                    });
                } else if (
                    indexData[object.elementCategory] === "generatorIndex"
                ) {
                    dispatch({
                        type: "SET_INDEX_VALUE_GENERATOR",
                        payload:
                            fabricCanvasRef.current.get(
                                indexData[object.elementCategory]
                            ) + 1,
                    });
                } else if (
                    indexData[object.elementCategory] === "inductionMotorIndex"
                ) {
                    dispatch({
                        type: "SET_INDEX_VALUE_INDUCTION_MOTOR",
                        payload:
                            fabricCanvasRef.current.get(
                                indexData[object.elementCategory]
                            ) + 1,
                    });
                } else if (indexData[object.elementCategory] === "loadIndex") {
                    dispatch({
                        type: "SET_INDEX_VALUE_LOAD",
                        payload:
                            fabricCanvasRef.current.get(
                                indexData[object.elementCategory]
                            ) + 1,
                    });
                } else if (indexData[object.elementCategory] === "shuntIndex") {
                    dispatch({
                        type: "SET_INDEX_VALUE_SHUNT_DEVICE",
                        payload:
                            fabricCanvasRef.current.get(
                                indexData[object.elementCategory]
                            ) + 1,
                    });
                } else if (indexData[object.elementCategory] === "lineIndex") {
                    dispatch({
                        type: "SET_INDEX_VALUE_LINE",
                        payload:
                            fabricCanvasRef.current.get(
                                indexData[object.elementCategory]
                            ) + 1,
                    });
                } else if (
                    indexData[object.elementCategory] === "transformerIndex"
                ) {
                    dispatch({
                        type: "SET_INDEX_VALUE_TRANSFORMER",
                        payload:
                            fabricCanvasRef.current.get(
                                indexData[object.elementCategory]
                            ) + 1,
                    });
                }
                fabricCanvasRef.current.set(
                    indexData[object.elementCategory],
                    fabricCanvasRef.current.get(
                        indexData[object.elementCategory]
                    ) + 1
                );

                if (object.elementCategory != "Bus") {
                    object.set("angle", object.angle - 90);
                    const getObjs = fabricCanvasRef.current.getObjects();
                    const getLine = getObjs.find(
                        (data) => object.connectingLine[0] == data.id
                    );
                    const getBus = getObjs.find(
                        (data) => getLine.fromObjectId == data.id
                    );
                    linkObject(getBus, object);
                    object.setCoords();
                    fabricCanvasRef.current.requestRenderAll();
                } else {
                    object.set("connectingElement", []);
                    object.set("connectingLine", []);
                }

                addTextAboveObject(
                    object,
                    object.canvasProperty[1].propertyValue,
                    {
                        x: null,
                        y: null,
                        angle: 0,
                    }
                );
                fabricCanvasRef.current.add(object);
            }
        }
    };
    const clonedTheBusInNewGUI = (copiedSelectedObject) => {
        let clonedObject = [];
        if (Array.isArray(copiedSelectedObject)) {
            copiedSelectedObject.forEach((clonedObj) => {
                clonedObj.clone((clone) => {
                    const cloneLeft =
                        parseInt(clone.left) +
                        copiedObjectProps.left +
                        copiedObjectProps.width;
                    const cloneTop =
                        parseInt(clone.top) +
                        copiedObjectProps.top +
                        copiedObjectProps.height;
                    //clone.elementType = clonedObj.elementType;
                    objectProps.forEach((key) => {
                        clone[key] = clonedObj[key];
                    });
                    clone.set({
                        left: cloneLeft + 15, // Offset to differentiate from original
                        top: cloneTop + 15, // Offset to differentiate from original
                        evented: true, // Make the cloned object interactive
                    });
                    //clone.set("left", data.left + 5);
                    clone.set("oldId", clone.id);
                    clone.set("id", uuidv4());
                    if (clone?.canvasProperty) {
                        const propIdKey = clone?.canvasProperty[0].propertyName;
                        const propIdValue = fabricCanvasRef.current.get(
                            indexData[clone.elementCategory]
                        );
                        const propNameKey =
                            clone.canvasProperty[1].propertyName;
                        const propNameValue = NameGenerateString(
                            clone.canvasProperty[1].defaultValue,
                            fabricCanvasRef.current.get(
                                indexData[clone.elementCategory]
                            )
                        );
                        const newData = {
                            [propIdKey]: propIdValue,
                            [propNameKey]: propNameValue,
                        };
                        console.log("newData", newData);
                        clone.set(
                            "canvasProperty",
                            updateProperties(clone.canvasProperty, newData)
                        );
                        fabricCanvasRef.current.set(
                            indexData[clone.elementCategory],
                            fabricCanvasRef.current.get(
                                indexData[clone.elementCategory]
                            ) + 1
                        );
                    }

                    const addElement = fabricCanvasRef.current.add(clone);

                    clonedObject.push(clone);
                });
            });

            clonedObject.forEach((data) => {
                if (data.elementType == "text") {
                    const newObjs = clonedObject.find(
                        (obj) => obj.oldId == data.textlinkedObjectId
                    );
                    data.set("textlinkedObjectId", newObjs.id);
                    newObjs.set("textId", data.id);

                    if (newObjs.canvasProperty[1]?.propertyName) {
                        data?.set(
                            "text",
                            newObjs.canvasProperty[1].propertyValue
                        );
                        fabricCanvasRef.current.renderAll();
                    }
                }

                if (data.elementType == "svg") {
                    const elementconnectingLine = data.connectingLine?.map(
                        (lineId) => {
                            return clonedObject.find(
                                (newObj) => newObj.oldId == lineId
                            )?.id;
                        }
                    );
                    data.set("connectingLine", elementconnectingLine);
                    const connectingElement = data.connectingElement?.forEach(
                        (item) => {
                            item.id = clonedObject.find(
                                (newObj) => newObj.oldId == item.id
                            )?.id;
                        }
                    );
                    data.set("connectingElement", connectingElement);
                }
                if (data.elementType == "line") {
                    data.set(
                        "fromObjectId",
                        clonedObject.find(
                            (newObj) => newObj.oldId == data.fromObjectId
                        )?.id
                    );
                    data.set(
                        "toObjectId",
                        clonedObject.find(
                            (newObj) => newObj.oldId == data.toObjectId
                        )?.id
                    );
                }
            });
        } else {
            if (copiedSelectedObject.elementCategory == "Bus") {
                var object = fabric.util.object.clone(copiedSelectedObject);
                fabricCanvasRef.current.discardActiveObject();
                object.set({
                    left: object.left + 10,
                    top: object.top + 5,
                    evented: true,
                });
                object.set("id", copiedSelectedObject.id);
                const propIdKey = object.canvasProperty[0].propertyName;
                const propIdValue = fabricCanvasRef.current.get(
                    indexData[object.elementCategory]
                );
                const propNameKey = object.canvasProperty[1].propertyValue;
                // const propNameValue = NameGenerateString(
                //   object.canvasProperty[1].defaultValue,
                //   fabricCanvasRef.current.get(indexData[object.elementCategory])
                // );
                const propNameValue = object.canvasProperty[1].propertyValue;
                const newData = {
                    [propIdKey]: propIdValue,
                    [propNameKey]: propNameValue,
                };
                object.set(
                    "canvasProperty",
                    updateProperties(object.canvasProperty, newData)
                );
                // fabricCanvasRef.current.set(
                //   indexData[object.elementCategory],
                //   fabricCanvasRef.current.get(indexData[object.elementCategory]) + 1
                // );
                if (object.elementCategory != "Bus") {
                    object.set("angle", object.angle - 90);
                    const getObjs = fabricCanvasRef.current.getObjects();
                    const getLine = getObjs.find(
                        (data) => object.connectingLine[0] == data.id
                    );
                    const getBus = getObjs.find(
                        (data) => getLine.fromObjectId == data.id
                    );
                    linkObject(getBus, object);
                    object.setCoords();
                    fabricCanvasRef.current.requestRenderAll();
                } else {
                    object.set("connectingElement", []);
                    object.set("connectingLine", []);
                }

                addTextAboveObject(
                    object,
                    object.canvasProperty[1].propertyValue,
                    {
                        x: null,
                        y: null,
                        angle: 0,
                    }
                );
                // if (object.arrowIds) {
                //   object.set("arrowId", [object.arrowIds]);
                // }
                fabricCanvasRef.current.add(object);
            }
        }
    };
    const replacedObjectProperty = (
        getSelectedObject,
        copiedSelectedObject
    ) => {
        const activeObj = getSelectedObject.canvasProperty;
        const copiedObj = copiedSelectedObject?.canvasProperty;
        const excludedFields = [
            "iBusID",
            "sBusName",
            "iGenID",
            "sGenName",
            "sGenBusName",
            "iXFRID",
            "sXFRName",
            "sHVBusName",
            "sLVBusNames",
            "iLineID",
            "sLineName",
            "sFromBusName",
            "sToBusName",
            "iShuntID",
            "sShuntName",
            "sShuntBus",
            "iIndMotID",
            "sIndMotName",
            "sIndMotBus",
            "iLoadID",
            "sLoadName",
            "sLoadBus",
            "iFilterID",
            "sFilterName",
            "sFilterBus",
        ];
        console.log("activeObj", activeObj);
        console.log("copiedObj", copiedObj);
        let newData = {};
        activeObj.forEach((obj1) => {
            const match = copiedObj.find(
                (obj2) => obj2.propertyName === obj1.propertyName
            );
            if (!excludedFields.includes(match.propertyName)) {
                if (match) {
                    // match.propertyValue = obj1.propertyValue;
                    const propertyNameKey = match.propertyName;
                    const propertyValue = match.propertyValue;
                    newData[propertyNameKey] = propertyValue;
                }
            }
        });
        getSelectedObject.set(
            "canvasProperty",
            updateProperties(getSelectedObject.canvasProperty, newData)
        );
        if (
            getSelectedObject.elementCategory == "Filter" &&
            copiedSelectedObject.elementCategory == "Filter"
        ) {
            const canvasProperty = getSelectedObject.get("canvasProperty");
            if (Array.isArray(canvasProperty) && canvasProperty.length >= 9) {
                canvasProperty[9] =
                    copiedSelectedObject.get("canvasProperty")[
                        copiedSelectedObject.get("canvasProperty")?.length - 1
                    ];
                console.log(
                    "Updated 9th Object:",
                    copiedSelectedObject.get("canvasProperty")[9]
                );
                console.log("dynamicFields-canvasProperty", canvasProperty[9]);
                let newCanvasProperty = canvasProperty;
                if (canvasProperty.length > 9) {
                    newCanvasProperty = canvasProperty[9]?.id
                        ? canvasProperty.slice(0, 9)
                        : canvasProperty.slice(0, 10);
                    console.log("newCanvasProperty", newCanvasProperty);
                }
                getSelectedObject.set("canvasProperty", newCanvasProperty);
            }

            //newData[propertyNameKey] = propertyValue;
        }
    };

    const handleCopyObjectProperties = () => {
        dispatch({ type: "SET_EDIT_POPUP", payload: false });
        dispatch({ type: "COPY_OBJECT", payload: true });

        dispatch({ type: "COPY_OBJECT_PROPERTY", payload: false });
        // const getSelectedObject = fabricCanvasRef.current.getActiveObject();
        // if(getSelectedObject){
        //   dispatch({ type: 'COPY_OBJECT_PROPERTY', payload: getSelectedObject });
        //   fabricCanvasRef.current.discardActiveObject();
        //   fabricCanvasRef.current.requestRenderAll();
        // }
    };

    const handlePasteObjectProperties = () => {
        // const getSelectedObject = fabricCanvasRef.current.getActiveObject();
        // if(getSelectedObject && state.isCopiedObjectProps){
        //   const activeObj = getSelectedObject.canvasProperty;
        //   const copiedObj = state.isCopiedObjectProps?.canvasProperty;
        //   console.log("copiedObj",copiedObj);
        //   console.log("activeObj",activeObj);
        //   const excludedFields = [
        //     "iBusID",
        //     "sBusName",
        //     "iGenID",
        //     "sGenName",
        //     "sGenBusName",
        //     "iXFRID",
        //     "sXFRName",
        //     "sHVBusName",
        //     "sLVBusNames",
        //     "iLineID",
        //     "sLineName",
        //     "sFromBusName",
        //     "sToBusName",
        //     "iShuntID",
        //     "sShuntName",
        //     "sShuntBus",
        //     "iIndMotID",
        //     "sIndMotName",
        //     "sIndMotBus",
        //     "iLoadID",
        //     "sLoadName",
        //     "sLoadBus",
        //     "iFilterID",
        //     "sFilterName",
        //     "sFilterBus",
        //   ];
        //   let newData = {};
        //   activeObj.forEach((obj1) => {
        //     const match = copiedObj.find(
        //       (obj2) => obj2.propertyName === obj1.propertyName
        //     );
        //     if (!excludedFields.includes(match.propertyName)) {
        //       if (match) {
        //         // match.propertyValue = obj1.propertyValue;
        //         const propertyNameKey = match.propertyName;
        //         const propertyValue = match.propertyValue;
        //         newData[propertyNameKey] = propertyValue;
        //       }
        //     }
        //   });
        //   getSelectedObject.set(
        //     "canvasProperty",
        //     updateProperties(getSelectedObject.canvasProperty, newData)
        //   );
        // }

        dispatch({ type: "PASTE_OBJECT", payload: true });
        dispatch({ type: "SET_EDIT_POPUP", payload: false });
        dispatch({ type: "PASTE_OBJECT_PROPERTY", payload: false });
        setTimeout(() => {
            dispatch({ type: "SET_EDIT_POPUP", payload: true });
        }, 300);
    };

    useEffect(() => {
        if (dataToOutput) {
            const result = generateFiles(
                dataToOutput,
                fabricCanvasRef.current.systemConfiguration,
                fabricCanvasRef.current.engineInputURL,
                fabricCanvasRef.current.engineInputFolderName
            ); 
            dispatch({ type: "GENERATE_INPUT", payload: false });
            setDataToOutput(null);
            if (result && !state.executedEngine) {
                dispatch({
                    type: "EXECUTE_ENGINE",
                    payload: true,
                });
            }
        }
        if (dataToExcel) {
            generateExcelFile(dataToExcel);
            dispatch({ type: "EXPORT_EXCEL", payload: false });
            setDataToExcel(null);
        }
    }, [dataToOutput, dataToExcel]);

    useEffect(() => {
        const canvasWrapper = document.getElementById("canvasWrapper");
        if (canvasWrapper) {
            canvasWrapper.scrollLeft = 0;
        }
    }, []);



        useEffect(() => {
            const canvasWidth = selectedCanvas?.canvas_object?.width;
            const windowWidth = window.innerWidth;

            if (typeof canvasWidth === "number" && !isNaN(canvasWidth)) {
                const targetWidth = canvasWidth + 200;
                let newWidth = 1500;

                if (targetWidth < 1500) {
                    newWidth = 1500;
                } else if (windowWidth >= targetWidth) {
                    newWidth = targetWidth;
                } else {
                    newWidth = windowWidth;
                }

                setCanvasContainerWidth(newWidth);
            } else {
                setCanvasContainerWidth(1500);
            }
        }, [selectedCanvas]); 


        // console.log("canvasContainerWidth :",canvasContainerWidth);

    return (
        <>
            <div id="canvas-wrapper">
                <canvas
                    ref={canvasRef}
                    className="rrrr"
                    id="mainCanvas"
                    width={canvasContainerWidth}
                    height={canvasContainerHeight}
                />

                {selectedCanvas && (
                    <CanvasLoader
                    canvasRef={fabricCanvasRef}
                    canvasData={selectedCanvas.canvas_object}
                    data={selectedCanvas}
                    dispatch={dispatch}
                    onLoad={() => updateMinimap()}
                    secondOnLoad={onCanvasLoaded}
                    />
                )}
                <div
                    id="right"
                    style={{
                        display: state.isMinMapEnabled ? "block" : "none",
                    }}
                >
                    <canvas
                    ref={minimapRef}
                    id="minimap"
                    width="300"
                    height="300"
                    />

                </div>
            </div>  


            <Popup
                isOpen={state.isPopupOpen}
                onClose={() =>
                    dispatch({
                        type: "SET_POPUP",
                        payload: false,
                    })
                }
                title="Save the Load Flow"
                object={null}
                editPopup={false}
            >
                <DynamicForm
                    fields={formFields}
                    onSubmit={handleFormSubmit}
                    canvasInstance={canvasObjects}
                />
            </Popup>

            <Popup
                isOpen={state.isSaveAsCanvas}
                onClose={() =>
                    dispatch({
                        type: "SET_SAVEAS_CANVAS",
                        payload: false,
                    })
                }
                title="Save As the Load Flow"
                object={null}
                editPopup={false}
            >
                <DynamicForm
                    fields={saveAsFormFields}
                    onSubmit={handleSaveAsFormSubmit}
                    canvasInstance={canvasObjects}
                />
            </Popup>

            <Popup
                isOpen={state.isEditPopupOpen}
                onClose={() => {
                    dispatch({ type: "SET_EDIT_POPUP", payload: false });
                    setSelectedObject(null);
                }}
                title={
                    selectedObject
                        ? "Edit " + selectedObject.elementCategory + " Data"
                        : "Edit Data"
                }
                object={selectedObject}
                editPopup={true}
            >
                {selectedObject ? (
                    <DynamicForm
                        fields={updateFormFields}
                        onSubmit={handleObjectFormSubmit}
                        canvasInstance={canvasObjects}
                    />
                ) : (
                    <p className="p-4 text-gray-500">⚠️ No object selected</p>
                )}
            </Popup>

            <Popup
                isOpen={state.isFontPopupOpen}
                onClose={() =>
                    dispatch({
                        type: "IS_POPUP_OPEN",
                        payload: false,
                    })
                }
                title="Font Settings"
                object={null}
                editPopup={false}
            >
                <DynamicForm
                    fields={FontformFields}
                    onSubmit={handleFontFormSubmit}
                    canvasInstance={canvasObjects}
                />
            </Popup>

            <Popup
                isOpen={state.isSystemPopupOpen}
                onClose={() =>
                    dispatch({
                        type: "OPEN_SYSTEM_POPUP",
                        payload: false,
                    })
                }
                title="Setup System Properties"
                object={null}
                editPopup={false}
            >
                <DynamicForm
                    fields={SystemFormFields}
                    onSubmit={handleSystemConfigFormSubmit}
                    canvasInstance={canvasObjects}
                />
            </Popup>

            <Popup
                isOpen={state.isFileUploadPopup}
                onClose={() =>
                    dispatch({
                        type: "IMPORT_FILE",
                        payload: false,
                    })
                }
                title="Import the data"
                object={null}
                editPopup={false}
            >
                <FileUploadForm
                    objects={
                        fabricCanvasRef.current
                            ? fabricCanvasRef.current.getObjects()
                            : ""
                    }
                    onSubmit={handleFileFormSubmit}
                />
            </Popup>
            <Popup
                isOpen={state.engineURLPopup}
                onClose={() =>
                    dispatch({
                        type: "SET_ENGINE_URL",
                        payload: false,
                    })
                }
                title="Save the Engine input path"
                object={null}
                editPopup={false}
            >
                <DirectoryForm
                    fields={saveAsEngineFormFields}
                    onSubmit={handleSaveAsEngineFormSubmit}
                />
            </Popup>

            <Popup
                isOpen={state.isLoadCanvas}
                onClose={() =>
                    dispatch({
                        type: "SET_LOAD_CANVAS",
                        payload: false,
                    })
                }
                title="ALL Canvas"
                object={null}
                editPopup={false}
            >
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Image</th>
                            <th>Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {data ? (
                            data.map((list, index) => (
                                <tr key={list.id || index}>
                                    <td>{list.name}</td>
                                    <td>
                                        <img
                                            src={list.thumbnail_image}
                                            width="150"
                                            alt={list.name}
                                        />
                                    </td>
                                    <td>
                                        <button onClick={() => setSelectedCanvas(list)}>
                                            Load
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td>No Record Found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Popup>
        </>
    );
}

export default FabricCanvas;
