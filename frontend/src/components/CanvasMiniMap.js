import React, { useEffect, useRef } from "react";
import { fabric } from "fabric";

export default function MiniMap({ mainCanvasRef, isEnabled = true }) {
  const minimapRef = useRef(null);
  const minimapFabricRef = useRef(null);

  // Initialize minimap Fabric canvas
  useEffect(() => {
    if (minimapRef.current && !minimapFabricRef.current) {
      minimapFabricRef.current = new fabric.Canvas(minimapRef.current, {
        selection: false,
        interactive: true,
      });
    }
  }, []);

  const updateMinimap = () => {
    const mainCanvas = mainCanvasRef.current;
    const minimapCanvas = minimapFabricRef.current;

    if (!mainCanvas || !minimapCanvas) return;

    minimapCanvas.clear();

    const container = document.querySelector(".canvas-content");
    if (!container) return;

    const containerWidth = container.getBoundingClientRect().width;
    const containerHeight = container.getBoundingClientRect().height;

    const mainWidth = mainCanvas.getWidth();
    const mainHeight = mainCanvas.getHeight();

    const aspectRatio = mainWidth / mainHeight;
    let minimapWidth, minimapHeight;

    if (aspectRatio > 1) {
      minimapWidth = Math.min(300, mainWidth);
      minimapHeight = minimapWidth / aspectRatio;
    } else {
      minimapHeight = Math.min(300, mainHeight);
      minimapWidth = minimapHeight * aspectRatio;
    }

    minimapCanvas.setWidth(minimapWidth);
    minimapCanvas.setHeight(minimapHeight);

    const scaleFactor = minimapWidth / mainWidth;

    // Draw main canvas snapshot as image
    fabric.Image.fromURL(
      mainCanvas.toDataURL({ format: "png", quality: 0.5 }),
      (img) => {
        img.scaleToWidth(minimapWidth);
        img.set({ selectable: false, evented: false });
        minimapCanvas.add(img);

        // Draw viewport rectangle
        const viewport = new fabric.Rect({
          left: -mainCanvas.viewportTransform[4] * scaleFactor,
          top: -mainCanvas.viewportTransform[5] * scaleFactor,
          width: containerWidth * scaleFactor,
          height: containerHeight * scaleFactor,
          fill: "rgba(0, 0, 255, 0.2)",
          stroke: "blue",
          hasControls: false,
          hasBorders: false,
          selectable: false,
          evented: false,
        });

        minimapCanvas.add(viewport);
        minimapCanvas.renderAll();
      }
    );
  };

  // Update minimap whenever enabled
  useEffect(() => {
    if (isEnabled) {
      updateMinimap();
    }
  }, [isEnabled, mainCanvasRef]);

  if (!isEnabled) return null;

  return (
    <div>
      <canvas
        ref={minimapRef}
        id="minimap"
        width={300}
        height={300}
        style={{ border: "1px solid black" }}
      />
    </div>
  );
}
