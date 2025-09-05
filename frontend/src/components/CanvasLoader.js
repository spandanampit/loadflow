import { useEffect, useCallback, useState } from "react";
import { fabric } from "fabric";

function CanvasLoader({ canvasRef, canvasData, data, dispatch,onLoad,secondOnLoad }) {
    const [progress, setProgress] = useState(0);

    const loadCanvas = useCallback(
        
        (canvasData, data) => {
            secondOnLoad?.();
            const currentCanvas = canvasRef.current;
            console.log("currentCanvas width", currentCanvas.width);
            if (!currentCanvas || !data) return;

            currentCanvas.clear();

            const MAX_CANVAS_WIDTH = 50000;
            const MAX_CANVAS_HEIGHT = 50000;

            const parsedData =
                typeof canvasData === "string"
                    ? JSON.parse(canvasData)
                    : canvasData;

            const objectsJson = parsedData.objects || [];
            const totalObjects = objectsJson.length;

            console.log("Loading canvas:", data, "objects:", totalObjects);
            console.time("loadFromJSON");

            currentCanvas.set("storedData", { id: data.id, name: data.name });
            dispatch?.({ type: "SET_LOAD_CANVAS", payload: false });

            let minX = Infinity,
                minY = Infinity,
                maxX = -Infinity,
                maxY = -Infinity;

            const updateBounds = (obj) => {
                const rect = obj.getBoundingRect();
                minX = Math.min(minX, rect.left);
                minY = Math.min(minY, rect.top);
                maxX = Math.max(maxX, rect.left + rect.width);
                maxY = Math.max(maxY, rect.top + rect.height);
            };

            let renderTimer;
            function scheduleRender() {
                if (renderTimer) return;
                renderTimer = requestAnimationFrame(() => {
                    currentCanvas.renderAll();
                    renderTimer = null;
                });
            }

            function finalizeCanvas() {
                if (totalObjects === 0) {
                    currentCanvas.setWidth(800);
                    currentCanvas.setHeight(600);
                    currentCanvas.renderAll();
                    return;
                }

                const padding = 30;
                let boundingRect = currentCanvas.getObjects().reduce(
                    (bounds, obj) => {
                        const objBounds = obj.getBoundingRect();
                        bounds.minX = Math.min(bounds.minX, objBounds.left);
                        bounds.minY = Math.min(bounds.minY, objBounds.top);
                        bounds.maxX = Math.max(bounds.maxX, objBounds.left + objBounds.width);
                        bounds.maxY = Math.max(bounds.maxY, objBounds.top + objBounds.height);
                        return bounds;
                    },
                    {
                        minX: 0,
                        minY: 0,
                        maxX: currentCanvas.width,
                        maxY: currentCanvas.height,
                    }
                );

                const contentWidth = Math.max(boundingRect.maxX , currentCanvas.width);
                const contentHeight = Math.max(boundingRect.maxY , currentCanvas.height);

                console.log("contentHeight :", contentHeight);
                console.log("boundingRect.maxY :", boundingRect.maxY);
                console.log("currentCanvas.width",currentCanvas.width );
                console.log("contentWidth :", contentWidth);
                console.log("boundingRect.maxX :", boundingRect.maxX);

                
                currentCanvas.setWidth(contentWidth);
                currentCanvas.setHeight(contentHeight);

                currentCanvas.set("contentBounds", {
                    width: contentWidth,
                    height: contentHeight,
                });

                currentCanvas.renderAll();
                onLoad?.();
                console.timeEnd("loadFromJSON");
            }

            currentCanvas.loadFromJSON(
                { ...parsedData, objects: [] },
                () => {
                    let index = 0;
                    const chunkSize = totalObjects > 2000 ? 10 : 30;

                    function processBatch() {
                        const batch = objectsJson.slice(index, index + chunkSize);

                        fabric.util.enlivenObjects(batch, (enlivened) => {
                            enlivened.forEach((obj) => {
                                if (obj?.type === "image") {
                                    obj.crossOrigin = "anonymous";
                                }
                                currentCanvas.add(obj);
                                updateBounds(obj);
                            });

                            index += chunkSize;
                            setProgress(Math.round((index / totalObjects) * 100));
                            scheduleRender();

                            if (index < totalObjects) {
                                (window.requestIdleCallback || requestAnimationFrame)(
                                    processBatch
                                );
                            } else {
                                finalizeCanvas();
                                setProgress(100);
                            }
                        });
                    }
                    processBatch();
                }
            );
        },
        [canvasRef, dispatch]
    );
    

    useEffect(() => {
        if (canvasData && data && canvasRef.current) {
            loadCanvas(canvasData, data);
        }
    }, [canvasData, data, loadCanvas]);

    return progress < 100 ? (
        <div
            style={{
                position: "absolute",
                top: 10,
                left: 10,
                background: "rgba(0,0,0,0.5)",
                color: "#fff",
                padding: "5px 10px",
                borderRadius: 4,
                zIndex: 1000,
            }}
        >
            Loading... {progress}%
        </div>
    ) : null;

}

export default CanvasLoader;
