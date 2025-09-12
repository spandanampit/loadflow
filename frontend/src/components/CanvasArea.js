import React, { useState, useRef, useEffect } from "react";
import { fabric } from "fabric";
import FabricCanvas from "./FabricCanvas";
import { useAppState } from "../StateContext";

function CanvasArea({ selectedElement }) {
        const [canvases, setCanvases] = useState(() => {
            Object.keys(localStorage).forEach((key) => {
                if (key.startsWith("canvasState_tab")) {
                        localStorage.removeItem(key);
                }
            });

            return [{ id: "canvas-1", name: "GUI 1", data: null }];
        });

        const [activeTab, setActiveTab] = useState("canvas-1");
        const { state, dispatch } = useAppState();
        const canvasInstances = useRef({});
        const [copiedSelectedObject, setCopiedSelectedObject] = useState(null);

        const containerRef = useRef(null);

        const [containerHeight, setContainerHeight] = useState("auto"); 
        const handleCanvasLoaded = () => {
            console.log('called');
            setContainerHeight(window.innerHeight - 80);
        };

        const createArrowInPreviouscanvas = (activeObject) => {
                const arrow = new fabric.Triangle({
                        width: 15,
                        height: 15,
                        fill: "grey",
                        left: activeObject.left + 30,
                        top: activeObject.top + 5,
                        angle: 90, // Point right
                        selectable: true, // Make the arrow unselectable
                        evented: true, // Disable event handling for the arrow
                        id: `arrow-head-${activeObject.id}`,
                });
                // Store arrow IDs on the bus object
                activeObject.arrowId = arrow.id;
                // Add the group to the canvas
                canvasInstances.current[activeTab].add(arrow);
        };

        const handleAddCanvas = () => {
                const currentCanvas = canvasInstances.current[activeTab];
                if (currentCanvas) {
                        const activeObject = currentCanvas.getActiveObject();
                        if (activeObject?.elementCategory !== "Bus") {
                                alert(
                                        "Please select a Bus element on the current canvas before adding a new GUI."
                                );
                                return;
                        }
                        createArrowInPreviouscanvas(activeObject);
                        activeObject.clone((cloned) => {
                                setCopiedSelectedObject(activeObject);
                                dispatch({
                                        type: "SET_GUI_ADDED",
                                        payload: true,
                                });

                                setCanvases((prevCanvases) => {
                                        const newCanvas = {
                                                id: `canvas-${
                                                        prevCanvases.length + 1
                                                }`,
                                                name: `GUI ${
                                                        prevCanvases.length + 1
                                                }`,
                                                data: null,
                                        };
                                        const newCanvases = [
                                                ...prevCanvases,
                                                newCanvas,
                                        ];
                                        setActiveTab(newCanvas.id);
                                        return newCanvases;
                                });
                        });
                }
        };

        const saveCanvasState = (canvasId, data) => {
            setCanvases((prev) =>
                prev.map((canvas) =>
                    canvas.id === canvasId
                        ? { ...canvas, data }
                        : canvas
                )
            );
        };

        const registerCanvas = (canvasId, canvasInstance) => {
                canvasInstances.current[canvasId] = canvasInstance;
        };

        return (
                <div className="canvas-area">
                        <div className="tabs">
                                {canvases.map((canvas) => (
                                        <div
                                                key={canvas.id}
                                                className={`tab ${
                                                        activeTab === canvas.id
                                                                ? "selected"
                                                                : ""
                                                }`}
                                                onClick={() =>
                                                        setActiveTab(canvas.id)
                                                }
                                                style={{
                                                        backgroundColor:
                                                                activeTab ===
                                                                canvas.id
                                                                        ? "blue"
                                                                        : "transparent",
                                                        color:
                                                                activeTab ===
                                                                canvas.id
                                                                        ? "white"
                                                                        : "black",
                                                }}
                                        >
                                                {canvas.name}
                                        </div>
                                ))}
                                <button onClick={handleAddCanvas}>
                                        Add GUI
                                </button>
                        </div>
                                
                        <div className="canvas-content" ref={containerRef}  style={{
                                width: '100%',
                                height: `${containerHeight}px`,
                                overflow: 'auto'
                            }}>
                                {canvases.map((canvas) =>
                                        activeTab === canvas.id ? (
                                                <FabricCanvas
                                                        refdata={containerRef}
                                                        key={canvas.id}
                                                        canvasId={canvas.id}
                                                        selectedElement={selectedElement}
                                                        savedData={canvas.data}
                                                        onSave={(data) =>saveCanvasState(canvas.id,data)}
                                                        onCanvasLoaded={handleCanvasLoaded}
                                                        onRegister={(canvasInstance) =>registerCanvas(canvas.id,canvasInstance)}
                                                        handleCopy={() =>canvasInstances.current[activeTab].copy()}
                                                        handlePaste={() => {
                                                                if (
                                                                        copiedSelectedObject
                                                                ) {
                                                                        const canvasInstance =
                                                                                canvasInstances
                                                                                        .current[
                                                                                        canvas
                                                                                                .id
                                                                                ];
                                                                        canvasInstance.add(
                                                                                copiedSelectedObject.clone()
                                                                        );
                                                                        canvasInstance.renderAll();
                                                                }
                                                        }}
                                                        activeObject={copiedSelectedObject}
                                                        canvasInstances={canvasInstances.current}
                                                        activeTab={activeTab}
                                                />
                                        ) : null
                                )}
                        </div>
                </div>
        );
}

export default CanvasArea;
