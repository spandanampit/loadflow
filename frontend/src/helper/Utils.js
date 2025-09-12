import { faQuoteRightAlt } from "@fortawesome/free-solid-svg-icons";
import * as bcrypt from "bcryptjs";
import { data } from "jquery";

export const Encrypt = {
    cryptPassword: (password) =>
        bcrypt
            .genSalt(10)
            .then((salt) => bcrypt.hash(password, salt))
            .then((hash) => hash),

    comparePassword: (password, hashPassword) =>
        bcrypt.compare(password, hashPassword).then((resp) => resp),
};

export const NameGenerateString = (prefix, number) => {
    const safePrefix = prefix ?? "Name";
    const safeNumber = Number.isFinite(number) ? number : 0;
    const paddedNumber = safeNumber.toString().padStart(8, "0");
    return `${safePrefix}-${paddedNumber}`;
};


export const addProperties = (data, index) => {
    const properties = data.properties;
    var updatedData = properties
    ?.sort((a, b) => a.orderProperties - b.orderProperties)
    ?.map((property) => {
        let currentValue;
        if (property.isIncremental) {
            if (property.propertyType.toLowerCase() === "integer") {
                currentValue = index;
                } else if (property.propertyType.toLowerCase() === "string") {
                    if (
                        [
                            "sBusName",
                            "sGenName",
                            "sXFRName",
                            "sLineName",
                            "sShuntName",
                            "sIndMotName",
                            "sLoadName",
                            "sFilterName",
                        ].includes(property.propertyName)
                    ) {
                        currentValue = NameGenerateString(
                            property.defaultValue,
                            index
                        );
                    } else {
                        currentValue = property.defaultValue + "-" + index;
                    }
                }
            } else if (property.propertyName == "iUnitNo") {
                currentValue = index;
            } else {
                currentValue = property.defaultValue;
            }
            return {
                ...property,
                propertyValue: currentValue,
            };
        });

    return updatedData;
};

export const updateProperties = (oldArray, newObject, dynamicFields) => {
    // Update `oldArray` based on `newObject`
    const updatedArray = oldArray.map((oldItem) => {
        if (newObject.hasOwnProperty(oldItem.propertyName)) {
            return {
                ...oldItem,
                propertyValue: newObject[oldItem.propertyName],
            };
        }
        return oldItem;
    });

    // Update `dynamicFields` based on `newObject`
    const updatedDynamicFields = dynamicFields?.map((field) => {
        if (
            newObject.hasOwnProperty(field.propertyName) &&
            field.id in newObject
        ) {
            return {
                ...field,
                propertyValue: newObject[field.propertyName],
            };
        }
        return field;
    });

    // Check if `dynamicFields` already exists in `updatedArray`
    const existingDynamicFieldsIndex = updatedArray.findIndex(
        (item) => item.dynamicField
    );

    // If `dynamicFields` already exists, remove it
    if (existingDynamicFieldsIndex !== -1) {
        updatedArray.splice(existingDynamicFieldsIndex, 1);
    }

    // Add the latest `dynamicFields` at the end of `updatedArray`
    updatedArray.push({ dynamicFields: updatedDynamicFields });

    return updatedArray;
};

// Function to update old data based on new data
// export const updateProperties = (oldArray, newObject) => {
//     return oldArray.map(oldItem => {
//         // Check if propertyName exists in newObject
//         if (newObject.hasOwnProperty(oldItem.propertyName)) {
//             // Update currentValue from newObject based on propertyName
//             return {
//                 ...oldItem,
//                 propertyValue: newObject[oldItem.propertyName]
//             };
//         }
//         return oldItem;
//     });
// }

// export const getDataAsFormFields = (data,elements) => {
//   const getElementCategory =data?.elementCategory;
//     //console.log("getDataAsFormFields",data);
//     if(getElementCategory=="Bus"){
//       const getConnectionLine = data.connectingLine;
//       const getTransformerData = elements.filter(element=>getConnectionLine.includes(element.id) && element.isTransformerLine);
//       return data?data.canvasProperty?.map(item=>({
//           "name": item.propertyName,
//           "label": item.propertyLabelName,
//           "type": 'text',
//           "isEditable": item.propertyName=="fBuskV"?getTransformerData.length>0?false:true:item.editable,
//           "value": item.propertyValue
//       })):[];
//     }else{
//       return data?data.canvasProperty?.map(item=>({
//         "name": item.propertyName,
//         "label": item.propertyLabelName,
//         "type": 'text',
//         "isEditable": item.editable,
//         "value": item.propertyValue
//     })):[];
//     }

// }

export const getDataAsFormFields = (data, elements) => {
    const formFields = [];
    let lastDynamicField = [];

    if (data && data.canvasProperty && Array.isArray(data.canvasProperty)) {
        const getElementCategory = data?.elementCategory;
        //console.log("getDataAsFormFields",data);
        if (getElementCategory == "Bus") {
            const getConnectionLine = data.connectingLine;
            const getTransformerData = elements.filter(
                (element) =>
                    getConnectionLine.includes(element.id) &&
                    (element.isTransformerLine ||
                        element.name == "connectionLine")
            );
            data.canvasProperty.forEach((item) => {
                // Push the main item fields
                if (item.propertyName && item.propertyLabelName) {
                    formFields.push({
                        name: item.propertyName,
                        label: item.propertyLabelName,
                        type: "text",
                        isEditable:
                            item.propertyName == "fBuskV"
                                ? getTransformerData.length > 0
                                    ? false
                                    : true
                                : item.editable,
                        value: item.propertyValue || "",
                        propertyType: item.propertyType,
                        minValue: item.minValue,
                        maxValue: item.maxValue,
                    });
                }
                if (Array.isArray(item.dynamicFields)) {
                    lastDynamicField = [...item.dynamicFields];
                }
            });
        } else {
            data.canvasProperty.forEach((item) => {
                // Push the main item fields
                if (item.propertyName && item.propertyLabelName) {
                    formFields.push({
                        name: item.propertyName,
                        label: item.propertyLabelName,
                        type: "text",
                        isEditable: item.editable || false,
                        value: item.propertyValue || "",
                        propertyType: item.propertyType,
                        minValue: item.minValue,
                        maxValue: item.maxValue,
                    });
                }
                if (Array.isArray(item.dynamicFields)) {
                    lastDynamicField = [...item.dynamicFields];
                }
            });
        }

        if (lastDynamicField.length > 0) {
            formFields.push({
                dynamicField: lastDynamicField,
            });
        }
    } else {
        //console.warn("Invalid or missing canvasProperty array in data:", data);
    }

    return formFields;
};

    export const comparePropertyValue = (obj1, obj2, propertyName) => {
        if (!Array.isArray(obj1) || !Array.isArray(obj2)) {
            console.warn("comparePropertyValue: one of the objects is not an array", { obj1, obj2 });
            return false;
        }

        const prop1 = obj1.find((prop) => prop.propertyName === propertyName);
        const prop2 = obj2.find((prop) => prop.propertyName === propertyName);

        if (prop1 && prop2) {
            if (propertyName === "fBuskV") {
                return parseFloat(prop1.propertyValue) === parseFloat(prop2.propertyValue);
            }
            return prop1.propertyValue === prop2.propertyValue;
        }

        return false;
    };


export const filterObjectByType = (objects, type) => {
    const data = objects.filter((el) => el.elementType === type);
    return data;
};
export const filterObjectWithOutput = (objects) => {
    const data = objects.filter(
        (el) => el.elementType === "text" && el.isOutputText == true
    );
    return data;
};

export const getConnectedObject = (svgId, elements, result = []) => {
    // Find the SVG object by its ID
    const svgObject = elements.find(
        (el) => el.id === svgId && el.elementType === "svg"
    );

    if (!svgObject) {
        return result; // Return current result if no SVG found
    }

    // Add the SVG object to the result array if not already added
    if (!result.find((el) => el.id === svgObject.id)) {
        result.push(svgObject);
    }

    // Find the text object linked to this SVG and add to the result array
    const textObject = elements.find(
        (el) => el.textlinkedObjectId === svgId && el.elementType === "text"
    );

    if (textObject && !result.find((el) => el.id === textObject.id)) {
        result.push(textObject);
    }

    // Process each connecting line ID in the SVG object
    svgObject.connectingLine.forEach((lineId) => {
        const lineObject = elements.find((el) => el.isLine && el.id === lineId);

        if (lineObject && !result.find((el) => el.id === lineObject.id)) {
            result.push(lineObject);

            // Recursively get the flat array for the connected SVG objects via the line
            getConnectedObject(lineObject.fromObjectId, elements, result);
            getConnectedObject(lineObject.toObjectId, elements, result);
        }
    });

    return result;
};

// Function to get flat array for a specific SVG object with related text and lines
export const getSpecificSvgRelatedData = (svgId, elements) => {
    const result = [];

    // Find the specific SVG object by its ID
    const svgObject = elements.find(
        (el) => el.id === svgId && el.elementType === "svg"
    );

    if (!svgObject) {
        return result; // Return empty if no SVG found
    }

    // Find the text object linked to this specific SVG
    const textObject = elements.find(
        (el) => el.textlinkedObjectId === svgId && el.elementType === "text"
    );

    // Add the SVG object to the result
    result.push(svgObject);

    // If a related text object is found, add it to the result
    if (textObject) {
        if (!result.includes(textObject)) {
            result.push(textObject); // Add text object with null link
        }
    }

    // Process each connecting line ID in the SVG object
    svgObject.connectingLine.forEach((lineId) => {
        const lineObject = elements.find((el) => el.isLine && el.id === lineId);

        if (!result.includes(lineObject)) {
            result.push(lineObject); // Add properties with line link
        }
    });

    return result;
};

export const getNextAngle = (currentAngle) => {
    return (currentAngle + 90) % 360;
};

export const validatedShuntElement = (currentObject, activeObj) => {
    if (!activeObj) {
        if (
            currentObject.elementCategory !== "Bus" ||
            currentObject.elementCategory !== "Bus"
        ) {
            alert(
                "Shunt element cannot be directly placed without a Bus. Please choose the Bus first."
            );
            return false;
        }
    }
    if (activeObj) {
        if (
            currentObject.elementCategory !== "Bus" &&
            activeObj.elementCategory !== "Bus"
        ) {
            alert(
                `Please ensure at least one of the objects has the category 'bus'.`
            );
            return false;
        }
        if (
            currentObject.elementCategory == "Bus" &&
            activeObj.elementCategory == "Bus"
        ) {
            alert(
                `Please ensure at least one of the objects has the category 'shut element'.`
            );
            return false;
        }

        // if(activeObj.connectingElement?.filter(item => item.category === currentObject.elementCategory).length > 0){
        //   alert(`Only one element of the same type can be connected to a bus.`);
        //   return false;
        // }
    }
    return true;
};

export const checkObjectCategories = (obj1, obj2) => {
    const category1 = obj1?.elementCategory;
    const category2 = obj2?.elementCategory;

    // If both objects have category "bus", return false
    if (category1 === "Bus" && category2 === "Bus") {
        return false;
    }

    // If any object has category "transformer", return false
    if (
        category1 === "Two winding transformer" ||
        category2 === "Two winding transformer"
    ) {
        return false;
    }

    // Return the object that has the category "bus"
    if (category1 === "Bus") {
        return { obj1, obj2 };
    } else if (category2 === "Bus") {
        return { obj2, obj1 };
    }

    // If neither object is a "bus", return false
    return false;
};

export const getConnectedObjectToBus = (busObj, elements) => {
    const result = [];

    busObj.connectingLine.forEach((lineId) => {
        const lineObject = elements.find((el) => el.isLine && el.id === lineId);
        if (lineObject) {
            if (lineObject.fromObjectId != busObj.id) {
                result.push(lineObject.fromObjectId);
            }
            if (lineObject.toObjectId != busObj.id) {
                result.push(lineObject.toObjectId);
            }
        }
    });
    return result;
};

export const deleteValidation = (currentObject) => {
    if (currentObject.elementCategory == "Bus") {
        if (currentObject.connectingLine.length > 0) {
            return false;
        }
    }

    return true;
};

function isObjectEmpty(obj) {
    if (obj == null || typeof obj !== "object") {
        return true; // Treat undefined, null, or non-objects as "empty"
    }
    return Object.keys(obj).length === 0;
}

export const systemConfigurationProperties = () => {
    return [
        {
            id: 1,
            propertyName: "sSlackBusName",
            propertyLabelName: "SLACK BUSBAR",
            propertyValue: "",
            propertyType: "String",
            defaultValue: "",
        },
        {
            id: 2,
            propertyName: "fSbase",
            propertyLabelName: "BASE POWER (MVA)",
            propertyValue: "100",
            propertyType: "Integer",
            defaultValue: "100",
        },
        {
            id: 3,
            propertyName: "fFbase",
            propertyLabelName: "BASE FREQUENCY (Hz)",
            propertyValue: "50",
            propertyType: "Integer",
            defaultValue: "50",
        },
        {
            id: 4,
            propertyName: "sGenHM",
            propertyLabelName: "GENERATOR HARMONIC MODEL",
            propertyValue: "B",
            propertyType: "String",
            defaultValue: "B",
        },
        {
            id: 5,
            propertyName: "sTfrHM",
            propertyLabelName: "TRANSFORMER HARMONIC MODEL",
            propertyValue: "B",
            propertyType: "String",
            defaultValue: "B",
        },
        {
            id: 6,
            propertyName: "sLoadHM",
            propertyLabelName: "LOAD HARMONIC MODEL",
            propertyValue: "B",
            propertyType: "String",
            defaultValue: "B",
        },
        {
            id: 7,
            propertyName: "sLineHM",
            propertyLabelName: "TRANSMI_LINE HARMONIC MODEL",
            propertyValue: "B",
            propertyType: "String",
            defaultValue: "B",
        },
    ];
};

export const systemConfigurationFormFields = (currentData) => {
    const defaultData = systemConfigurationProperties();
    const data = currentData ? currentData : defaultData;

    return [
        {
            name: "sSlackBusName",
            label: "SLACK BUSBAR",
            type: "text",
            isEditable: true,
            value: !isObjectEmpty(data) ? data[0].propertyValue : "",
            propertyType: "String",
        },
        {
            name: "fSbase",
            label: "BASE POWER (MVA)",
            type: "text",
            isEditable: true,
            value: !isObjectEmpty(data) ? data[1].propertyValue : "100",
            propertyType: "Integer",
        },
        {
            name: "fFbase",
            label: "BASE FREQUENCY (Hz)",
            type: "text",
            isEditable: true,
            value: !isObjectEmpty(data) ? data[2].propertyValue : "50",
            propertyType: "Integer",
        },
        {
            name: "sGenHM",
            label: "GENERATOR HARMONIC MODEL",
            type: "text",
            isEditable: true,
            value: !isObjectEmpty(data) ? data[3].propertyValue : "B",
            propertyType: "String",
        },
        {
            name: "sTfrHM",
            label: "TRANSFORMER HARMONIC MODEL",
            type: "text",
            isEditable: true,
            value: !isObjectEmpty(data) ? data[4].propertyValue : "B",
            propertyType: "String",
        },
        {
            name: "sLoadHM",
            label: "LOAD HARMONIC MODEL",
            type: "text",
            isEditable: true,
            value: !isObjectEmpty(data) ? data[5].propertyValue : "B",
            propertyType: "String",
        },
        {
            name: "sLineHM",
            label: "TRANSMI_LINE HARMONIC MODEL",
            type: "text",
            isEditable: true,
            value: !isObjectEmpty(data) ? data[6].propertyValue : "B",
            propertyType: "String",
        },
    ];
};

// Function to find remaining connected objects of a polyline
export function getRemainingConnectedObjects_old(allObjects, limitedObjects) {
    // Extract the SVG and polyline from the limited objects
    const svgObject = limitedObjects.find((obj) => obj.elementType === "svg");
    const connectedPolyline = limitedObjects.find(
        (obj) => obj.elementType === "line"
    );

    if (!svgObject || !connectedPolyline) {
        console.error("Both an SVG object and a polyline object are required.");
        return [];
    }

    // Extract the IDs of the connecting lines for the SVG
    const connectingLineIds = svgObject.connectingLine || [];

    // Filter the polyline objects related to the given SVG
    const relatedPolylines = allObjects.filter(
        (obj) =>
            obj.elementType === "line" && connectingLineIds.includes(obj.id)
    );
    // console.log("relatedPolylines",relatedPolylines);

    // Collect the IDs of the connected SVG objects
    const connectedSvgIds = new Set();
    relatedPolylines.forEach((polyline) => {
        if (polyline.fromObjectId && polyline.fromObjectId !== svgObject.id) {
            connectedSvgIds.add(polyline.fromObjectId);
        }
        if (polyline.toObjectId && polyline.toObjectId !== svgObject.id) {
            connectedSvgIds.add(polyline.toObjectId);
        }
    });

    console.log("relatedPolylines-1", relatedPolylines);
    // Remove the SVG object connected via the specified polyline
    if (
        connectedPolyline.fromObjectId &&
        connectedPolyline.fromObjectId === svgObject.id
    ) {
        connectedSvgIds.delete(connectedPolyline.fromObjectId);
    }
    if (
        connectedPolyline.toObjectId &&
        connectedPolyline.toObjectId === svgObject.id
    ) {
        connectedSvgIds.delete(connectedPolyline.toObjectId);
    }

    // Get the remaining connected SVG objects
    const remainingConnectedObjects = allObjects.filter(
        (obj) => obj.elementType === "svg" && connectedSvgIds.has(obj.id)
    );

    let result = limitedObjects;
    // Filter the remaining connected objects
    if (remainingConnectedObjects.length > 0) {
        const allTextObjects = allObjects.filter(
            (obj) =>
                obj.elementType === "text" && obj.textlinkedObjectId == obj.id
        );
        const CombinedObjects = [
            ...limitedObjects,
            ...remainingConnectedObjects,
        ];
        result = allObjects.filter((obj) =>
            CombinedObjects.find(
                (data) => data.id == obj.id || obj.textlinkedObjectId == data.id
            )
        );
    }

    console.log("limitedObjects", limitedObjects);
    console.log("remainingConnectedObjects", remainingConnectedObjects);
    // console.log("remainingConnectedObjects--1",result);

    return result;
}

// Function to find remaining connected objects of multiple SVGs and polylines
export function getRemainingConnectedObjects(allObjects, limitedObjects) {
    // Extract all SVG and polyline objects from the limited objects
    const svgObjects = limitedObjects.filter(
        (obj) => obj.elementType === "svg"
    );
    const connectedPolylines = limitedObjects.filter(
        (obj) => obj.elementType === "line"
    );

    if (svgObjects.length === 0 || connectedPolylines.length === 0) {
        console.error(
            "At least one SVG object and one polyline object are required."
        );
        return [];
    }

    // Collect IDs of connecting lines for all SVG objects
    const connectingLineIds = svgObjects.flatMap(
        (svg) => svg.connectingLine || []
    );
    console.log("connectingLineIds", connectingLineIds);

    // Filter the polyline objects related to the given SVGs
    const relatedPolylines = allObjects.filter(
        (obj) =>
            obj.elementType === "line" && connectingLineIds.includes(obj.id)
    );

    // Collect the IDs of the connected SVG objects
    const connectedSvgIds = new Set();
    relatedPolylines.forEach((polyline) => {
        svgObjects.forEach((svgObject) => {
            if (
                polyline.fromObjectId &&
                polyline.fromObjectId !== svgObject.id
            ) {
                connectedSvgIds.add(polyline.fromObjectId);
            }
            if (polyline.toObjectId && polyline.toObjectId !== svgObject.id) {
                connectedSvgIds.add(polyline.toObjectId);
            }
        });
    });

    // Remove the SVG objects connected via the specified polylines
    connectedPolylines.forEach((connectedPolyline) => {
        svgObjects.forEach((svgObject) => {
            if (
                connectedPolyline.fromObjectId &&
                connectedPolyline.fromObjectId === svgObject.id
            ) {
                connectedSvgIds.delete(connectedPolyline.fromObjectId);
            }
            if (
                connectedPolyline.toObjectId &&
                connectedPolyline.toObjectId === svgObject.id
            ) {
                connectedSvgIds.delete(connectedPolyline.toObjectId);
            }
        });
    });

    // Get the remaining connected SVG objects
    const remainingConnectedObjects = allObjects.filter(
        (obj) => obj.elementType === "svg" && connectedSvgIds.has(obj.id)
    );

    console.log("remainingConnectedObjects", remainingConnectedObjects);
    const remainingTransfomerObjects = remainingConnectedObjects.filter(
        (obj) => obj.elementCategory === "Two winding transformer"
    );

    console.log("remainingTransfomerObjects", remainingTransfomerObjects);
    let excludedObjects = [];
    let result = limitedObjects;
    if (remainingTransfomerObjects.length > 0) {
        remainingTransfomerObjects.map((obj) => {
            console.log("remainingTransfomerObjects==>", obj);
            var get2Line = obj.connectingLine.filter(
                (num) => !connectingLineIds.includes(num)
            );
            const get2LineObject = allObjects.find(
                (obj) => obj.id === get2Line[0]
            );
            const get2busObject = allObjects.find(
                (obj) => obj.id === get2LineObject.toObjectId
            );
            remainingConnectedObjects.push(get2LineObject);
            remainingConnectedObjects.push(get2busObject);
            //console.log("output==>",{get2Line,get2LineObject,get2busObject});

            // excludedObjects.push(obj);
            // excludedObjects.push(limitedObjects.find((data) => data.elementType=="line" &&  obj.connectingLine.includes(data.id)));
        });
        result = limitedObjects.filter(
            (obj) => !excludedObjects.find((data) => data.id == obj.id)
        );
    }
    console.log("excludedObjects", excludedObjects);
    const finalConnectedObjects = remainingConnectedObjects.filter(
        (obj) => !excludedObjects.find((data) => data.id == obj.id)
    );
    // Filter the remaining connected objects along with their linked text objects

    if (finalConnectedObjects.length > 0) {
        const allTextObjects = allObjects.filter(
            (obj) =>
                obj.elementType === "text" &&
                finalConnectedObjects.some(
                    (svg) => svg.id === obj.textlinkedObjectId
                )
        );
        const combinedObjects = [...limitedObjects, ...finalConnectedObjects];
        result = allObjects.filter((obj) =>
            combinedObjects.some(
                (data) =>
                    data.id === obj.id || obj.textlinkedObjectId === data.id
            )
        );
    } else if (remainingConnectedObjects.length > 0) {
        const allTextObjects = allObjects.filter(
            (obj) =>
                obj.elementType === "text" &&
                remainingConnectedObjects.some(
                    (svg) => svg.id === obj.textlinkedObjectId
                )
        );
        const combinedObjects = [
            ...limitedObjects,
            ...remainingConnectedObjects,
        ];
        result = allObjects.filter((obj) =>
            combinedObjects.some(
                (data) =>
                    data.id === obj.id || obj.textlinkedObjectId === data.id
            )
        );
    }

    // Debugging logs
    console.log("limitedObjects", limitedObjects);
    console.log("remainingConnectedObjects", finalConnectedObjects);

    return result;
}
