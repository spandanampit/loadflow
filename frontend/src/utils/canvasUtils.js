export function updateMinimap(mainCanvas, minimapCanvas, container) {
    if (!mainCanvas || !minimapCanvas || !container) return;

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

    minimapCanvas.getObjects().forEach(obj => minimapCanvas.remove(obj));

    mainCanvas.getObjects().forEach(obj => {
        obj.clone(clonedObj => {
            clonedObj.scaleX = obj.scaleX * scaleFactor;
            clonedObj.scaleY = obj.scaleY * scaleFactor;
            clonedObj.left = obj.left * scaleFactor;
            clonedObj.top = obj.top * scaleFactor;
            clonedObj.selectable = false;
            clonedObj.evented = false;
            minimapCanvas.add(clonedObj);
            minimapCanvas.renderAll();
        });
    });

    const viewport = new fabric.Rect({
        left: -mainCanvas.viewportTransform[4] * scaleFactor,
        top: -mainCanvas.viewportTransform[5] * scaleFactor,
        width: containerWidth * scaleFactor,
        height: containerHeight * scaleFactor,
        fill: "rgba(0, 0, 255, 0.2)",
        stroke: "blue",
        selectable: false,
        evented: false,
        name: "viewport",
    });

    minimapCanvas.add(viewport);
    minimapCanvas.renderAll();
}
