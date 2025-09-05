export const getCoordBtwObjects = (object1, object2, line) => {

    const obj1Ml = object1.oCoords.ml.x;
    const obj2Ml = object2.oCoords.ml.x;
    const obj1Mr = object1.oCoords.mr.x;
    const obj2Mr = object2.oCoords.mr.x;

    const obj1CenterX1 = (object1.oCoords.ml.x + object1.oCoords.mr.x) / 2;
    const connectingElement = object1.connectingElement;
    const leftSideElement = connectingElement?.filter(
        (data) => data.side == "left"
    ).length;
    const rightSideElement = connectingElement?.filter(
        (data) => data.side == "right"
    ).length;

    let obj1CenterY1 = object1.oCoords.mr.y;//(object1.oCoords.mt.y+object1.oCoords.mb.y)/2;

    const obj2CenterX2 = (object2.oCoords.ml.x + object2.oCoords.mr.x) / 2;
    let obj2CenterY2 = object2.oCoords.ml.y;//(object2.oCoords.mt.y+object2.oCoords.mb.y)/2;

    const obj1Pointer = line?.obj1PointerData;
    const obj2Pointer = line?.obj2PointerData;

    let startPoint = { x: 0, y: 0 };
    let endPoint = { x: 0, y: 0 };

    const firstObjectCenter = object1.getCenterPoint();
    const secondObjectCenter = object2.getCenterPoint();

    let LineStartingPoints = obj1Pointer ?
        {
            x: firstObjectCenter.x,
            y: object1.top + obj1Pointer.y,
        } : firstObjectCenter;


    let LineEndingPoints = obj2Pointer ?
        {
            x: secondObjectCenter.x,
            y: object2.top + obj2Pointer.y,
        } : secondObjectCenter;

        if(!line.topOffset){
            line.topOffset = line.points[0].y - object1.top;
        }
    if(((object1.angle < 10 && object1.angle > -10) || (object1.angle < 365 && object1.angle > 355)) && line && line.topOffset){
        let obj1Top = object1.top;
        let lineY = obj1Top + line.topOffset;
        LineStartingPoints.y = lineY;
    }

    if (object1.angle > 80 && object1.angle < 100) {
        if(!line.rightOffset){
            line.rightOffset = object1.left + object1.width - line.points[0].x;
        }
        let obj1right = object1.left+object1.width;
        // let linex = line ? obj1right - line.rightOffset : object1.left - (line?.lineStartingPoint?.y || 0);
        let linex = line ? obj1right - line.rightOffset : object1.left - (line?.lineStartingPoint?.y || 0);
        // startPoint = { x: linex, y: object1.getCenterPoint().y };
        LineStartingPoints = obj1Pointer ?
            {
                x: linex,
                y: object1.getCenterPoint().y,
            } : firstObjectCenter;
            LineStartingPoints.x = linex;
    }

    if (object1.angle > 170 && object1.angle < 190) {
        LineStartingPoints = obj1Pointer ?
            {
                x: firstObjectCenter.x,
                y: object1.top - obj1Pointer.y,
            } : firstObjectCenter;
        let obj1Top = object1.top;
        let lineY = obj1Top + line.topOffset;
        LineStartingPoints.y = lineY;
    }

    if ((object1.angle > 260 && object1.angle < 280) || (object1.angle < -80 && object1.angle > -100)) {
        let obj1right = object1.left+object1.width;
        let linex = line ? obj1right - line.rightOffset : object1.left - (line?.lineStartingPoint?.y || 0);
        // startPoint = { x: linex, y: object1.getCenterPoint().y };
        LineStartingPoints = obj1Pointer ?
            {
                x: linex,
                y: object1.getCenterPoint().y,
            } : firstObjectCenter;
    }

    if (((object2.angle > -10 && object2.angle < 10) || (object2.angle < 365 && object2.angle > 355)) && line && line.topOffset) {
        // let obj2right = object2.left+object2.width;
        // if(!line.rightOffset2){
        //     line.rightOffset2 = object2.left + object2.width - line.points[line.points.length - 1].x;
        // }
        // let linex2 = line ? obj2right - line.rightOffset2 : object2.left - (line?.LineEndingPoints?.y || 0);
        // // startPoint = { x: linex, y: object1.getCenterPoint().y };

        // LineEndingPoints = obj2Pointer ?
        //     {
        //         x: linex2,
        //         y: object2.getCenterPoint().y,
        //     } : secondObjectCenter;
        // LineEndingPoints.y = object2.top + line.topOffset + Math.abs(line.points[0].y - line.points[line.points.length - 1].y);
    }

    if (object2.angle > 80 && object2.angle < 100) {
        let obj2right = object2.left+object2.width;
        if(!line.rightOffset2){
            line.rightOffset2 = object2.left + object2.width - line.points[line.points.length - 1].x;
        }
        let linex2 = line ? obj2right - line.rightOffset2 : object2.left - (line?.LineEndingPoints?.y || 0);
        // startPoint = { x: linex, y: object1.getCenterPoint().y };

        LineEndingPoints = obj2Pointer ?
            {
                x: linex2,
                y: object2.getCenterPoint().y,
            } : secondObjectCenter;
    }

    if (object2.angle > 170 && object2.angle < 190) {
        LineEndingPoints = obj2Pointer ?
            {
                x: secondObjectCenter.x,
                y: object2.top - obj2Pointer.y,
            } : secondObjectCenter;

    }

    if ((object2.angle > 260 && object2.angle < 280) || (object2.angle < -80 && object2.angle > -100)) {
        let obj2right = object2.left+object2.width;
        let linex2 = line ? obj2right - line.rightOffset2 : object2.left - (line?.LineEndingPoints?.y || 0);
        LineEndingPoints = obj2Pointer ?
            {
                x: linex2,
                y: object2.getCenterPoint().y,
            } : secondObjectCenter;
    }




    startPoint = { x: LineStartingPoints.x, y: LineStartingPoints.y };
    endPoint = { x: LineEndingPoints.x, y: LineEndingPoints.y };


    // First turn point (90 degrees from the start)
    const firstTurnPoint = {
        x: (startPoint.x + endPoint.x) / 2,
        y: startPoint.y, // Middle Y point between start and end
    };

    const secondTurnPoint = {
        x: firstTurnPoint.x,
        y: endPoint.y, // Same Y coordinate as the first turn
    };

    let points = line.points;

    // Replace the first point
    points[0] = { x: startPoint.x, y: startPoint.y };
    // points[0] = points[0] ? points[0] : { x: startPoint.x, y: startPoint.y };

    // Replace the last point
    points[points.length - 1] = { x: endPoint.x, y: endPoint.y };

    // // Define the points of the polyline
    // const points = [
    //     { x: startPoint.x, y: startPoint.y }, // Start point
    //     // { x: firstTurnPoint.x, y: firstTurnPoint.y }, // First turn (vertical 90 degrees)
    //     // { x: secondTurnPoint.x, y: secondTurnPoint.y }, // Second turn (horizontal 90 degrees)
    //     { x: endPoint.x, y: endPoint.y }, // End point
    // ];

    return points;
}

export const getCoordBtwTransformer = (object1, object2, line) => {


    const obj1Ml = object1.oCoords.ml.x;
    const obj2Ml = object2.oCoords.ml.x;
    const obj1Mr = object1.oCoords.mr.x;
    const obj2Mr = object2.oCoords.mr.x;

    const obj1CenterX1 = (object1.oCoords.ml.x + object1.oCoords.mr.x) / 2;
    const connectingElement = object1.connectingElement;
    const leftSideElement = connectingElement?.filter(
        (data) => data.side == "left"
    ).length;
    const rightSideElement = connectingElement?.filter(
        (data) => data.side == "right"
    ).length;

    let obj1CenterY1 = object1.oCoords.mr.y;//(object1.oCoords.mt.y+object1.oCoords.mb.y)/2;

    const obj2CenterX2 = (object2.oCoords.ml.x + object2.oCoords.mr.x) / 2;
    let obj2CenterY2 = object2.oCoords.ml.y;//(object2.oCoords.mt.y+object2.oCoords.mb.y)/2;

    const obj1Pointer = line?.obj1PointerData;
    const obj2Pointer = line?.obj2PointerData;

    let startPoint = { x: 0, y: 0 };
    let endPoint = { x: 0, y: 0 };

    let firstObjectCenter = object1.oCoords.ml;
    const secondObjectCenter = object2.getCenterPoint();
    if (line.isBusTwo) {
        firstObjectCenter = object1.oCoords.mr;
    }

    let LineStartingPoints = obj1Pointer ?
        {
            x: firstObjectCenter.x + line.isBusTwo ? -2 : 1,
            y: firstObjectCenter.y,
        } : firstObjectCenter;


    let LineEndingPoints = obj2Pointer ?
        {
            x: secondObjectCenter.x + line.isBusTwo ? -2 : 1,
            y: object2.top + obj2Pointer.y,
        } : secondObjectCenter;

        // line.isBusTwo ? secondObjectCenter.x += 100 : secondObjectCenter.x -= 100; for check

    if (object1.angle > 80 && object1.angle < 100) {
        let obj2right = object2.left+object2.width;
        let linex2 = line ? obj2right - line.rightOffset2 : object2.left - (line?.LineEndingPoints?.y || 0);
        LineStartingPoints = obj1Pointer ?
            {
                x: linex2,
                // x: firstObjectCenter.x + line.isBusTwo ? -2 : 1,
                y: firstObjectCenter.y,
            } : firstObjectCenter;

    }

    if (object1.angle > 170 && object1.angle < 190) {
        LineStartingPoints = obj1Pointer ?
            {
                x: firstObjectCenter.x + line.isBusTwo ? -2 : 1,
                y: firstObjectCenter.y,
            } : firstObjectCenter;

    }

    if ((object1.angle > 260 && object1.angle < 280) || (object1.angle < -80 && object1.angle > -100)) {
        LineStartingPoints = obj1Pointer ?
            {
                x: firstObjectCenter.x + line.isBusTwo ? -2 : 1,
                y: firstObjectCenter.y,
            } : firstObjectCenter;
    }

    if (object2.angle > -10 && object2.angle < 10) {

        let obj2right = object2.left+object2.width;
        if(!line.rightOffset2){
            line.rightOffset2 = object2.left + object2.width - line.points[line.points.length - 1].x;
        }
        let linex2 = line ? obj2right - line.rightOffset2 : object2.left - (line?.LineEndingPoints?.y || 0);
        // startPoint = { x: linex, y: object1.getCenterPoint().y };

        LineEndingPoints = obj2Pointer ?
            {
                x: linex2,
                y: object2.top + line.topOffset,
            } : secondObjectCenter;
        LineEndingPoints.y = object2.top + line.topOffset;
    }

    if (object2.angle > 80 && object2.angle < 100) {
        console.log("objs :::: ", object1, object2);
        
        let obj2right = object2.left+object2.width;
        let linex2 = line ? obj2right - line.rightOffset2 : object2.left - (line?.LineEndingPoints?.y || 0);
        LineEndingPoints = obj2Pointer ?
            {
                // x: linex2,
                x: secondObjectCenter.x,
                y: object2.getCenterPoint().y,
            } : secondObjectCenter;
        LineEndingPoints.x = linex2;
    }

    if ((object2.angle > 170 && object2.angle < 190)) {
        LineEndingPoints = obj2Pointer ?
            {
                x: secondObjectCenter.x,
                y: object2.top - obj2Pointer.y,
            } : secondObjectCenter;
    }

    if ((object2.angle > 260 && object2.angle < 280) || (object2.angle < -80 && object2.angle > -100)) {
        LineEndingPoints = obj2Pointer ?
            {
                x: secondObjectCenter.x,
                y: object2.getCenterPoint().y,
            } : secondObjectCenter;
    }




    startPoint = { x: LineStartingPoints.x, y: LineStartingPoints.y };
    endPoint = { x: LineEndingPoints.x, y: LineEndingPoints.y };


    // First turn point (90 degrees from the start)
    const firstTurnPoint = {
        x: (startPoint.x + endPoint.x) / 2,
        y: startPoint.y, // Middle Y point between start and end
    };

    const secondTurnPoint = {
        x: firstTurnPoint.x,
        y: endPoint.y, // Same Y coordinate as the first turn
    };

    let points = line.points;

    // Replace the first point
    points[0] = { x: startPoint.x, y: startPoint.y };

    // Replace the last point
    points[points.length - 1] = { x: endPoint.x, y: endPoint.y };

    // // Define the points of the polyline
    // const points = [
    //     { x: startPoint.x, y: startPoint.y }, // Start point
    //     // { x: firstTurnPoint.x, y: firstTurnPoint.y }, // First turn (vertical 90 degrees)
    //     // { x: secondTurnPoint.x, y: secondTurnPoint.y }, // Second turn (horizontal 90 degrees)
    //     { x: endPoint.x, y: endPoint.y }, // End point
    // ];


    return points;
}


export const getCoordBtwObjectsAndBus = (object1, object2, line) => {

    let obj1Ml = object1.oCoords.ml.x;
    let obj2Ml = object2.oCoords.mt.x;
    let obj1Mr = object1.oCoords.mr.x;
    let obj2Mr = object2.oCoords.mt.x;

    let obj1CenterX1 = (object1.oCoords.ml.x + object1.oCoords.mr.x) / 2;
    let obj1CenterY1 = object2.getCenterPoint().y;//(object1.oCoords.mt.y+object1.oCoords.mb.y)/2;
    const obj2CenterX2 = (object2.oCoords.mt.x + object2.oCoords.mt.x) / 2;
    const obj2CenterY2 = object2.oCoords.mt.y;//(object2.oCoords.mt.y+object2.oCoords.mb.y)/2;

    if (line) {
        obj1Ml = object1.left + line.lineStartingPoint.x;
        obj1Mr = object1.left + line.lineStartingPoint.x;
        obj1CenterX1 = object1.left + line.lineStartingPoint.x;
        obj1CenterY1 = object1.top + line.lineStartingPoint.y;
    }

    let startPoint = { x: 0, y: 0 };
    let endPoint = { x: 0, y: 0 };

    if (object1.left === object2.left && line) {
        let obj1right = object1.left + object1.width;
        let linex = line ? obj1right - line.rightOffset : obj1CenterX1;
        startPoint = { x: linex, y: object1.getCenterPoint().y };
        // startPoint = { x: obj1CenterX1, y: obj1CenterY1 };
        endPoint = { x: obj2CenterX2, y: obj2CenterY2 };
    } else {
        // Determine which object is on the left and which is on the right
        if (object1.left < object2.left) {
            startPoint = { x: object1.getCenterPoint().x, y: obj1CenterY1 };
            let obj1right = object1.left + object1.width;
            let linex = line ? obj1right - line.rightOffset : object1.left - (line?.lineStartingPoint?.y || 0);
            if (object1.angle > 80 && object1.angle < 100) {
                startPoint = { x: linex, y: object1.getCenterPoint().y };
                // startPoint.x = object1.getCenterPoint().x;
            }
            if (object1.angle > 170 && object1.angle < 190) {
                startPoint = { x: object1.getCenterPoint().x, y: object2.getCenterPoint().y };
            }
            if ((object1.angle > 260 && object1.angle < 280) || (object1.angle < -80 && object1.angle > -100)) {
                startPoint = { x: object2.getCenterPoint().x, y: object1.getCenterPoint().y };
            }
            endPoint = { x: obj2Ml, y: obj2CenterY2 };

        } else {
            startPoint = { x: obj1Ml, y: obj1CenterY1 };
            let obj1right = object1.left + object1.width;
            let linex = line ? obj1right - line.rightOffset : object2.getCenterPoint().x;
            if (object1.angle > 80 && object1.angle < 100) {
                startPoint = { x: linex, y: object1.getCenterPoint().y };
            }
            if (object1.angle > 170 && object1.angle < 190) {
                startPoint = { x: object1.getCenterPoint().x, y: object2.getCenterPoint().y };
            }
            if ((object1.angle > 260 && object1.angle < 280) || (object1.angle < -80 && object1.angle > -100)) {
                startPoint = { x: linex, y: object1.getCenterPoint().y };
            }
            endPoint = { x: obj2Mr, y: obj2CenterY2 };
        }
    }


    // First turn point (90 degrees from the start)
    const firstTurnPoint = {
        x: (startPoint.x + endPoint.x) / 2,
        y: startPoint.y, // Middle Y point between start and end
    };

    const secondTurnPoint = {
        x: firstTurnPoint.x,
        y: endPoint.y, // Same Y coordinate as the first turn
    };

    // Define the points of the polyline
    const points = [
        { x: startPoint.x, y: startPoint.y }, // Start point
        //{ x: firstTurnPoint.x, y: firstTurnPoint.y }, // First turn (vertical 90 degrees)
        //{ x: secondTurnPoint.x, y: secondTurnPoint.y }, // Second turn (horizontal 90 degrees)
        { x: endPoint.x, y: endPoint.y }, // End point
    ];

    return points;
}

export const getCoordBtwObjectsAndTransformer_ = (object1, object2, coordinate) => {
    // Update coordinates for both objects
    object1.setCoords();
    object2.setCoords();

    let startPoint, endPoint;

    // Step 1: Check angle and set points based on left/right position
    if (object1.angle > 80 && object1.angle < 100) {
        // Angle is around 90 degrees
        if (object1.top < object2.top) {
            startPoint = { x: object1.oCoords.mr.x + 2, y: object1.oCoords.mr.y };
            endPoint = { x: object2.left - coordinate.y, y: object2.getCenterPoint().y };
        } else {
            startPoint = { x: object1.oCoords.ml.x + 2, y: object1.oCoords.ml.y };
            endPoint = { x: object2.left - coordinate.y, y: object2.getCenterPoint().y };
        }
    } else if (object1.angle > 170 && object1.angle < 190) {
        // Angle is around 180 degrees
        if (object1.left < object2.left) {
            startPoint = { x: object1.oCoords.ml.x - 2, y: object1.oCoords.ml.y };
            endPoint = { x: object2.left - 2, y: object2.top - coordinate.y };
        } else {
            startPoint = { x: object1.oCoords.mr.x + 2, y: object1.oCoords.mr.y };
            endPoint = { x: object2.left - 2, y: object2.top - coordinate.y };
        }
    } else if ((object1.angle > 260 && object1.angle < 280) || (object1.angle < -80 && object1.angle > -100)) {
        // Angle is around 270 degrees
        if (object1.top < object2.top) {
            startPoint = { x: object1.oCoords.ml.x, y: object1.oCoords.ml.y };
            endPoint = { x: object2.left + coordinate.y, y: object2.getCenterPoint().y };
        } else {
            startPoint = { x: object1.oCoords.mr.x, y: object1.oCoords.mr.y };
            endPoint = { x: object2.left + coordinate.y, y: object2.getCenterPoint().y };
        }
    } else {
        // Default angle case
        if (object1.left < object2.left) {
            startPoint = { x: object1.oCoords.mr.x - 2, y: object1.getCenterPoint().y };
            endPoint = { x: object2.getCenterPoint().x, y: object2.top + coordinate.y };
        } else {
            startPoint = { x: object1.oCoords.ml.x + 2, y: object1.getCenterPoint().y };
            endPoint = { x: object2.getCenterPoint().x, y: object2.top + coordinate.y };
        }
    }

    // Define the points of the polyline
    const points = [
        { x: startPoint.x, y: startPoint.y }, // Start point
        { x: endPoint.x, y: endPoint.y } // End point
    ];

    return points;
};
export const getCoordBtwObjectsAndTransformer = (object1, object2, coordinate) => {
    object1.setCoords();
    object2.setCoords();

    let startPoint, endPoint;
    let defaultValue = 0;

    const obj1Bound = object1.getBoundingRect();
    const obj2Bound = object2.getBoundingRect();

    if (object1.angle > 80 && object1.angle < 100) {
        // Angle is around 90 degrees
        if (object1.top < object2.top) {
            startPoint = { x: object1.oCoords.mr.x + 2, y: object1.oCoords.mr.y };
            endPoint = { x: object2.left - coordinate.y, y: object2.getCenterPoint().y };
        } else {
            startPoint = { x: object1.oCoords.ml.x + 2, y: object1.oCoords.ml.y };
            endPoint = { x: object2.left - coordinate.y, y: object2.getCenterPoint().y };
        }
    } else if (object1.angle > 170 && object1.angle < 190) {
        // Angle is around 180 degrees
        if (object1.left < object2.left) {
            startPoint = { x: object1.oCoords.ml.x - 2, y: object1.oCoords.ml.y };
            endPoint = { x: object2.left - 2, y: object2.top - coordinate.y };
        } else {
            startPoint = { x: object1.oCoords.mr.x + 2, y: object1.oCoords.mr.y };
            endPoint = { x: object2.left - 2, y: object2.top - coordinate.y };
        }
    } else if ((object1.angle > 260 && object1.angle < 280) || (object1.angle < -80 && object1.angle > -100)) {
        // Angle is around 270 degrees
        if (object1.top < object2.top) {
            startPoint = { x: object1.oCoords.ml.x, y: object1.oCoords.ml.y };
            endPoint = { x: object2.left + coordinate.y, y: object2.getCenterPoint().y };
        } else {
            startPoint = { x: object1.oCoords.mr.x, y: object1.oCoords.mr.y };
            endPoint = { x: object2.left + coordinate.y, y: object2.getCenterPoint().y };
        }
    } else {
        let defaultEndpointObject2 = object2.top + coordinate.y;
        if (object2.angle == 90) {
            defaultEndpointObject2 = object2.getCenterPoint().y;
        } else if (object2.angle == 180) {
            defaultEndpointObject2 = object2.top - coordinate.y;
        } else if (object2.angle == 270 || object2.angle == -90) {
            defaultEndpointObject2 = object2.left + coordinate.y;
        }

        // Default angle case
        if (object1.left < object2.left) {
            startPoint = { x: object1.oCoords.mr.x - 2, y: object1.getCenterPoint().y };
            endPoint = { x: object2.getCenterPoint().x, y: defaultEndpointObject2 };
        } else {
            startPoint = { x: object1.oCoords.ml.x + 2, y: object1.getCenterPoint().y };
            endPoint = { x: object2.getCenterPoint().x, y: defaultEndpointObject2 };
        }
        defaultValue = 1;
    }

    // startPoint = { x: obj1Bound.left + obj1Bound.width/2, y: obj1Bound.top + obj1Bound.height/2 };
    if (defaultValue == 0) {
        console.log("defaultValue==0");
        endPoint = { x: obj2Bound.left + obj2Bound.width / 2, y: obj2Bound.top + obj2Bound.height / 2 };
    }

    const points = [
        { x: startPoint.x, y: startPoint.y }, // Start point
        { x: endPoint.x, y: endPoint.y } // End point
    ];

    return points;
}

export const calculateMidpoint = (points) => {
    let totalLength = 0;
    let cumulativeLength = 0;

    // Calculate total length of polyline
    for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i - 1].x;
        const dy = points[i].y - points[i - 1].y;
        totalLength += Math.sqrt(dx * dx + dy * dy);
    }

    const targetLength = totalLength / 2;

    // Find the segment containing the midpoint
    for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i - 1].x;
        const dy = points[i].y - points[i - 1].y;
        const segmentLength = Math.sqrt(dx * dx + dy * dy);

        if (cumulativeLength + segmentLength >= targetLength) {
            const remainingLength = targetLength - cumulativeLength;
            const ratio = remainingLength / segmentLength;

            return {
                segmentIndex: i,
                x: points[i - 1].x + ratio * dx,
                y: points[i - 1].y + ratio * dy,
            };
        }

        cumulativeLength += segmentLength;
    }

    return { segmentIndex: 1, ...points[0] };
}

const getDistance = (point1, point2) => {
    return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
}

export const getAngle = (point1, point2) => {
    const dy = point2.y - point1.y;
    const dx = point2.x - point1.x;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI); // Convert to degrees
    return angle < 0 ? angle + 360 : angle; // Ensure the angle is in the range [0, 360]
}

export const getMidAndMiddlePoints = (points) => {
    const length = points.length;
    let midPoints = [];
    let middlePoint = null;
    let firstHalf = [];
    let secondHalf = [];

    if (length % 2 === 0) {
        // Even count: Take the middle two points and calculate their midpoint
        const midIndex1 = length / 2 - 1;
        const midIndex2 = length / 2;

        midPoints.push(points[midIndex1], points[midIndex2]);

        middlePoint = {
            x: (points[midIndex1].x + points[midIndex2].x) / 2,
            y: (points[midIndex1].y + points[midIndex2].y) / 2
        };

        // Splitting the array into two halves
        firstHalf = points.slice(0, midIndex2);
        secondHalf = points.slice(midIndex2);
    } else {
        // // Odd count: Take the first and last point as midpoints
        // midPoints.push(points[0], points[length - 1]);

        // // Middle point is the exact center point
        // const midIndex = Math.floor(length / 2);
        // middlePoint = points[midIndex];

        // // Splitting the array into two halves
        // firstHalf = points.slice(0, midIndex);
        // secondHalf = points.slice(midIndex + 1);
        // Odd count: Find the index of the highest distance between consecutive points
        let maxDistance = 0;
        let splitIndex = Math.floor(length / 2); // Default split at the middle index

        for (let i = 0; i < length - 1; i++) {
            let distance = getDistance(points[i], points[i + 1]);
            if (distance > maxDistance) {
                maxDistance = distance;
                splitIndex = i + 1; // Split after the larger distance
            }
        }

        // midPoints.push(points[0], points[length - 1]);
        // midPoints.push(points[splitIndex - 1], points[splitIndex]);

        // Middle point is the exact center point
        //middlePoint = points[splitIndex];

        // Splitting dynamically based on the highest distance
        firstHalf = points.slice(0, splitIndex);
        secondHalf = points.slice(splitIndex);
        if(getAngle(firstHalf[firstHalf.length - 1], secondHalf[0]) > 45){
            let adj = 8;
            firstHalf[firstHalf.length - 1].x += adj;
            secondHalf[0].x += adj;
        }
        midPoints.push(firstHalf[firstHalf.length - 1], secondHalf[0]);

        // Middle point is the midpoint of last point in firstHalf and first point in secondHalf
        middlePoint = {
            x: (firstHalf[firstHalf.length - 1].x + secondHalf[0].x) / 2,
            y: (firstHalf[firstHalf.length - 1].y + secondHalf[0].y) / 2
        };
    }

    return { midPoints, middlePoint, firstHalf, secondHalf };
}

export const getMiddleObjects = (arr) => {
    if (!arr || arr.length === 0) return [];

    const midIndex = Math.floor((arr.length - 1) / 2);

    if (arr.length % 2 === 0) {
        // Even number of items - return two middle objects
        return [arr[midIndex], arr[midIndex + 1]];
    } else {
        // Odd number of items - return single middle object
        return [arr[midIndex]];
    }
}

export const splitArrayByMidpoint = (arr) => {
    if (!arr || arr.length < 2) return [arr, []];

    const midIndex = Math.floor(arr.length / 2);
    const firstHalf = arr.slice(0, midIndex);
    const secondHalf = arr.slice(midIndex);

    return [firstHalf, secondHalf];
}

export const checkOrientation = (point1, point2, threshold = 1) => {
    const xDiff = Math.abs(point1.x - point2.x);
    const yDiff = Math.abs(point1.y - point2.y);

    if (point1 == point2) return 'horizontal';
    if (xDiff <= threshold) return 'vertical';
    if (yDiff <= threshold) return 'horizontal';
    return 'horizontal';
}

