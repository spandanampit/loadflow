const formatValue = (value, type) => {
    const propType = type.toLowerCase();
    if (propType === "string") {
        return value.toLocaleUpperCase(); // Ensure value is uppercase
    } else if (propType === "integer") {
        return Number(value).toFixed(0); // Ensure integer with no decimals
    } else if (propType === "double" || propType === "decimal") {
        return parseFloat(value).toFixed(10); // Default formatting for doubles
    }
    return value; // Fallback for unsupported types
};

export const FormatInputValue = (currentValue, type, formatType) => {
    const value = formatValue(currentValue, type);

    switch (formatType) {
        case "A1":
            return value.toString().padEnd(1, " ");
        case "A12":
            return value.toString().padEnd(12, " "); // Pad to 12 characters
        case "A3":
            return value.toString().padEnd(3, " "); // Pad to 12 characters
        case "A2":
            return value.toString().padEnd(2, " "); // Pad to 12 characters
        case "I2":
            return value.toString().padStart(2, " "); // Pad to 2 characters, right-aligned
        case "I1":
            return value.toString(); // Single digit integer
        default:
            if (formatType.startsWith("F")) {
                // Handle F-type formats dynamically
                const totalLength = parseInt(formatType.slice(1), 10); // Extract number after 'F'
                let formatted = parseFloat(value).toFixed(10); // Ensure 6 decimal places
                if (formatted.length > totalLength) {
                    formatted = formatted.slice(0, totalLength); // Trim excess characters
                }
                return formatted.padStart(totalLength, " "); // Right-aligned within totalLength
            }
            return value; // Fallback for unsupported formats
    }
};

/**
 * Formats bus data into a structured output string.
 * 
 * @param {Array} properties - An array of objects representing bus properties.
 *                            Each object should have `propertyName`, `propertyValue`, and `propertyType`.
 * @returns {string} - A formatted string representing the bus details.
 */
export const busFormat = (properties) => {
    // Initialize the formatted output string.
    // Start with 'A' (representing a bus record) and pad it to 2 characters.
    let formattedString = "A".padStart(2, " ");  

    // Iterate through the list of properties to determine how each property should be formatted and appended.
    properties.forEach((property) => {
        switch (property.propertyName) {
            // Bus name, formatted as a 12-character string.
            case "sBusName":
                formattedString += " " + FormatInputValue(property.propertyValue, property.propertyType, "A12");
                break;

            // Area number, formatted as a 2-digit integer.
            case "iAreaNo":
                formattedString += " " + FormatInputValue(property.propertyValue, property.propertyType, "I2");
                break;

            // Bus status, formatted as a 1-digit integer.
            case "iStatus":
                formattedString += " " + FormatInputValue(property.propertyValue, property.propertyType, "I1");
                break;

            // Bus voltage in kV, formatted as a 6-character floating-point value.
            case "fBuskV":
                formattedString += " " + FormatInputValue(property.propertyValue, property.propertyType, "F6");
                break;

            // Voltage magnitude in per-unit (PU), formatted as an 8-character floating-point value.
            case "fVmagPU":
                formattedString += " " + FormatInputValue(property.propertyValue, property.propertyType, "F8");
                break;

            // Voltage angle in degrees, formatted as an 8-character floating-point value.
            case "fVangDeg":
                formattedString += " " + FormatInputValue(property.propertyValue, property.propertyType, "F8");
                break;

            // If the property does not match any known field, ignore it.
            default:
                break;
        }
    });

    // Trim any extra spaces at the end and return the formatted string.
    return formattedString.trimEnd();
};



/**
 * Formats load data into a structured output string.
 * 
 * @param {Array} properties - An array of objects representing load properties.
 *                            Each object should have `propertyName`, `propertyValue`, and `propertyType`.
 * @returns {string} - A formatted string representing the load details.
 */
export const loadFormat = (properties) => {
    // Initialize the formatted output string.
    // Start with 'A' (representing a load record) and pad it to 2 characters.
    let formattedString = "A".padStart(2, " ");  

    // Iterate through the list of properties to determine how each property should be formatted and appended.
    properties.forEach((property) => {
        switch (property.propertyName) {
            // Load bus name, formatted as a 12-character string.
            case "sLoadBus":
                formattedString += " " + FormatInputValue(property.propertyValue, property.propertyType, "A12");
                break;

            // Unit number, formatted as a 2-digit integer.
            case "iUnitNo":
                formattedString += " " + FormatInputValue(property.propertyValue, property.propertyType, "I2");
                break;

            // Status of the load, formatted as a 1-digit integer.
            case "iStatus":
                formattedString += " " + FormatInputValue(property.propertyValue, property.propertyType, "I1");
                break;

            // Active power load in MW, formatted as an 8-character floating-point value.
            case "fPloadMW":
                formattedString += " " + FormatInputValue(property.propertyValue, property.propertyType, "F8");
                break;

            // Reactive power load in MVAr, formatted as an 8-character floating-point value.
            case "fQloadMVAr":
                formattedString += " " + FormatInputValue(property.propertyValue, property.propertyType, "F8");
                break;

            // If the property does not match any known field, ignore it.
            default:
                break;
        }
    });

    // Trim any extra spaces at the end and return the formatted string.
    return formattedString.trimEnd();
};

/**
 * Formats shunt device data into a structured output string.
 * 
 * @param {Array} properties - An array of objects representing shunt device properties.
 *                            Each object should have `propertyName`, `propertyValue`, and `propertyType`.
 * @returns {string} - A formatted string representing the shunt device details.
 */
export const shuntDeviceFormat = (properties) => {
    // Initialize the formatted output string.
    // Start with 'A' (representing a shunt device record) and pad it to 2 characters.
    let formattedString = "A".padStart(2, " "); 

    // Iterate through the list of properties to determine how each property should be formatted and appended.
    properties.forEach((property) => {
        switch (property.propertyName) {
            // Shunt bus name, formatted as a 12-character string.
            case "sShuntBus":
                formattedString += " " + FormatInputValue(property.propertyValue, property.propertyType, "A12");
                break;

            // Unit number, formatted as a 2-digit integer.
            case "iUnitNo":
                formattedString += " " + FormatInputValue(property.propertyValue, property.propertyType, "I2");
                break;

            // Status of the shunt device, formatted as a 1-digit integer.
            case "iStatus":
                formattedString += " " + FormatInputValue(property.propertyValue, property.propertyType, "I1");
                break;

            // Resistance value, formatted as a 7-character floating-point value.
            case "fR":
                formattedString += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;

            // Reactance value, formatted as a 7-character floating-point value.
            case "fX":
                formattedString += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;

            // Susceptance value, formatted as a 7-character floating-point value.
            case "fB":
                formattedString += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;

            // If the property does not match any known field, ignore it.
            default:
                break;
        }
    });

    // Trim any extra spaces at the end and return the formatted string.
    return formattedString.trimEnd();
};


/**
 * Formats generator data into multiple lines of structured output.
 * 
 * @param {Array} properties - An array of objects representing generator properties.
 *                            Each object should have `propertyName`, `propertyValue`, and `propertyType`.
 * @returns {string} - A formatted string with multiple lines representing generator details.
 */
export const generatorFormat = (properties) => {
    // Initialize the formatted output lines.
    // Line 1 starts with 'A' (representing a generator record) and is right-padded to 2 characters.
    let line1 = "A".padStart(2, " "); 

    // Initialize empty lines for additional generator parameters.
    let line2 = "  "; 
    let line3 = "  "; 
    let line4 = "  "; 

    // Iterate through the list of properties to determine how each property should be formatted and appended.
    properties.forEach((property) => {
        switch (property.propertyName) {
            // Bus name of the generator, formatted as a 12-character string.
            case "sGenBusName":
                line1 += " " + FormatInputValue(property.propertyValue, property.propertyType, "A12");
                break;

            // Generator unit number, formatted as a 2-digit integer.
            case "iUnitNo":
                line1 += " " + FormatInputValue(property.propertyValue, property.propertyType, "I2");
                break;

            // Status of the generator, formatted as a 1-digit integer.
            case "iStatus":
                line1 += " " + FormatInputValue(property.propertyValue, property.propertyType, "I1");
                break;

            // Generated power in MW, formatted as a 9-character floating-point value.
            case "fPgenMW":
                line1 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F9");
                break;

            // Reactive power generated in MVAr, formatted as a 9-character floating-point value.
            case "fQgenMVAr":
                line1 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F9");
                break;

            // Minimum reactive power, formatted as a 7-character floating-point value.
            case "fQminMVAr":
                line1 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;

            // Maximum reactive power, formatted as a 7-character floating-point value.
            case "fQmaxMVAr":
                line1 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;

            // Generator rating, formatted as a 7-character floating-point value.
            case "fRate1":
                line1 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;

            // Generator resistance in per unit, formatted as a 7-character floating-point value.
            case "fR1pu":
                line2 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;

            // Generator synchronous reactance in per unit, formatted as a 7-character floating-point value.
            case "fXsyncpu":
                line2 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;

            // Generator transient reactance in per unit, formatted as a 7-character floating-point value.
            case "fXtranpu":
                line2 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;

            // Generator subtransient reactance in per unit, formatted as a 7-character floating-point value.
            case "fXsubtranpu":
                line2 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;

            // Zero-sequence resistance in per unit, formatted as a 7-character floating-point value.
            case "fR0pu":
                line3 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;

            // Zero-sequence reactance in per unit, formatted as a 7-character floating-point value.
            case "fX0pu":
                line3 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;

            // Negative-sequence resistance in per unit, formatted as a 7-character floating-point value.
            case "fR2pu":
                line3 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;

            // Negative-sequence reactance in per unit, formatted as a 7-character floating-point value.
            case "fX2pu":
                line3 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;

            // Maximum real power output in MW, formatted as a 7-character floating-point value.
            case "fPmaxMW":
                line4 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;

            // If the property does not match any known field, ignore it.
            default:
                break;
        }
    });

    // Return the formatted string with each line trimmed of trailing spaces and separated by new lines.
    return `${line1.trimEnd()}\n${line2.trimEnd()}\n${line3.trimEnd()}\n${line4.trimEnd()}`;
};


/**
 * Formats filter data into structured lines of text.
 * @param {Array} properties - List of objects containing filter properties.
 * @returns {string} - Formatted string representation of the filter data.
 */
export const filterFormat = (properties) => {
    // Initialize the first line with "A" (2 spaces padded to the left)
    let line1 = "A".padStart(2, " "); 
    
    // Initialize the second line with 9 spaces for alignment
    let line2 = "  ".padStart(9, " "); 
    
    // Extract additional fields from the 9th element (index 8) if available, otherwise set to empty array
    const additionalFields = properties[8] ? properties[8].dynamicFields : [];
    
    // Iterate over each property and append formatted values to line1 or line2 based on property name
    properties.forEach((property) => {
        switch (property.propertyName) {
            case "sFilterBus":
                line1 += " " + FormatInputValue(property.propertyValue, property.propertyType, "A12");
                break;
            case "iStatus":
                line1 += " " + FormatInputValue(property.propertyValue, property.propertyType, "I1");
                break;
            case "iFromNode":
                line2 += " " + FormatInputValue(property.propertyValue, property.propertyType, "I2");
                break;
            case "iToNode":
                line2 += " " + FormatInputValue(property.propertyValue, property.propertyType, "I2");
                break;
            case "fR":
                line2 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F10");
                break;
            case "fL":
                line2 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F9");
                break;
            case "fC":
                line2 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F9");
                break;
            default:
                break;
        }
    });
    
    // Initialize an empty string for additional lines
    let additionalLine = "";
    
    // Process additional fields and append formatted values
    additionalFields.map(data => {
        additionalLine += "  ".padStart(9, " ") + " " +
            FormatInputValue(data.iFromNode, "integer", "I2") + " " +
            FormatInputValue(data.iToNode, "integer", "I2") + " " +
            FormatInputValue(data.fR, "decimal", "F10") + " " +
            FormatInputValue(data.fL, "decimal", "F9") + " " +
            FormatInputValue(data.fC, "decimal", "F9") + '\n';
    });
    
    // Return the formatted text with trimmed endings
    return `${line1.trimEnd()}\n${line2.trimEnd()}\n${additionalLine.trimEnd()}\n`;
};


/**
 * Formats induction motor properties into a structured multiline string.
 *
 * @param {Array} properties - Array of property objects containing:
 *   - propertyName: Name of the property.
 *   - propertyValue: Value of the property.
 *   - propertyType: Data type of the property.
 * @returns {string} - Formatted multiline string with induction motor details.
 */
export const InductionFormat = (properties) => {
    // Initialize formatted lines with predefined spacing
    let line1 = "A".padStart(2, " "); // Line 1 starts with 'A' padded to two spaces
    let line2 = "   "; // Line 2 starts with three spaces
    let line3 = "   "; // Line 3 starts with three spaces

    // Iterate through properties to format values and append to respective lines
    properties.forEach((property) => {
        switch (property.propertyName) {
            case "sIndMotBus":
                // Append bus name formatted as a 12-character string to line 1
                line1 += " " + FormatInputValue(property.propertyValue, property.propertyType, "A12");
                break;
            case "iUnitNo":
                // Append unit number formatted as a 2-character integer to line 1
                line1 += " " + FormatInputValue(property.propertyValue, property.propertyType, "I2");
                break;
            case "iStatus":
                // Append status formatted as a 1-character integer to line 1
                line1 += " " + FormatInputValue(property.propertyValue, property.propertyType, "I1");
                break;
            case "fPmechMW":
                // Append mechanical power formatted as a 7-character float to line 1
                line1 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;
            case "fSlip":
                // Append slip formatted as a 9-character float to line 1
                line1 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F9");
                break;
            case "fRating1":
                // Append rating formatted as a 7-character float to line 1
                line1 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;
            case "fRs":
                // Append stator resistance formatted as a 7-character float to line 2
                line2 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;
            case "fXs":
                // Append stator reactance formatted as a 7-character float to line 2
                line2 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;
            case "fXm":
                // Append magnetizing reactance formatted as a 7-character float to line 2
                line2 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break; 
            case "fRisc":
                // Append rotor resistance in short circuit formatted as a 7-character float to line 3
                line3 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;
            case "fXisc":
                // Append rotor reactance in short circuit formatted as a 7-character float to line 3
                line3 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;
            case "fRosc":
                // Append rotor resistance in open circuit formatted as a 7-character float to line 3
                line3 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;
            case "fXosc":
                // Append rotor reactance in open circuit formatted as a 7-character float to line 3
                line3 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;
            case "fXsubTrans":
                // Append sub-transient reactance formatted as a 7-character float to line 3
                line3 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;         
            default:
                // Ignore unrecognized properties
                break;
        }
    });

    // Trim trailing spaces from lines and return the formatted string
    return `${line1.trimEnd()}\n${line2.trimEnd()}\n${line3.trimEnd()}`;
};



/**
 * Formats line data based on provided properties.
 * 
 * This function constructs three formatted lines (line1, line2, line3) based on specific property names
 * and their values. The formatting rules depend on predefined formats like A12, I2, F7, etc.
 *
 * @param {Array} properties - Array of property objects, each containing:
 *   @property {string} propertyName - Name of the property.
 *   @property {any} propertyValue - Value of the property.
 *   @property {string} propertyType - Type of the property (e.g., A12, I2, F7).
 * 
 * @returns {string} - A formatted string with three lines, separated by newlines.
 */
export const lineFormat = (properties) => {
     // Initialize line1 with 'A' padded to 2 characters
    let line1 = "A".padStart(2, " "); // Start with "PRE" as 'A'

    // Initialize line2 and line3 with two spaces
    let line2 = " ".padStart(2, " ");
    let line3 = " ".padStart(2, " ");
// Iterate over each property in the properties array
    properties.forEach((property) => {
        //console.log("property.propertyName",property.propertyName);
        switch (property.propertyName) {
            case "sFromBusName": // Format and append length, summer rating, and winter rating to line1
                line1 += " " + FormatInputValue(property.propertyValue, property.propertyType, "A12");
                break;
            case "sToBusName": // Format and append length, summer rating, and winter rating to line1
                line1 += " " + FormatInputValue(property.propertyValue, property.propertyType, "A12");
                break;  
            case "iUnitNo": // Format and append length, summer rating, and winter rating to line1
                line1 += " " + FormatInputValue(property.propertyValue, property.propertyType, "I2");
                break;      
            case "iStatus": // Format and append length, summer rating, and winter rating to line1
                line1 += " " + FormatInputValue(property.propertyValue, property.propertyType, "I1")+" 0";
                break;
            case "fLength": // Format and append length, summer rating, and winter rating to line1
                line1 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;
            case "fSummerMVArating": // Format and append length, summer rating, and winter rating to line1
                line1 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;
            case "fWinterMVArating": // Format and append length, summer rating, and winter rating to line1
                line1 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;
            case "fR1": // Format and append resistance, reactance, and susceptance values to line2
                line2 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;
            case "fX1": // Format and append resistance, reactance, and susceptance values to line2
                line2 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;
            case "fB1": // Format and append resistance, reactance, and susceptance values to line2
                line2 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;
            case "fR0":// Format and append resistance, reactance, and susceptance values to line3
                line3 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;
            case "fX0":// Format and append resistance, reactance, and susceptance values to line3
                line3 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;
            case "fR2":// Format and append resistance, reactance, and susceptance values to line3
                line3 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;
            case "fX2":// Format and append resistance, reactance, and susceptance values to line3
                line3 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;
            case "fB2": // Format and append resistance, reactance, and susceptance values to line3
                line3 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;
            default:
                // Trim trailing spaces from each line and return as a single formatted string
                break;
        }
    });

    return `${line1.trimEnd()}\n${line2.trimEnd()}\n${line3.trimEnd()}`;
};

/**
 * Formats transformer data into three structured lines based on predefined property rules.
 *
 * @param {Array} properties - Array of property objects containing propertyName, propertyValue, and propertyType.
 * @returns {string} - A formatted string consisting of three structured lines.
 */
export const transformerFormat = (properties) => {
    // Initialize the first line with "A" padded to two spaces, serving as a prefix.
    let line1 = "A".padStart(2, " "); 
    
    // Initialize second and third lines with spaces to maintain alignment.
    let line2 = " ".padStart(2, " ");
    let line3 = " ".padStart(2, " ");

    // Iterate through the provided property list
    properties.forEach((property) => {
        switch (property.propertyName) {
            /** 
             * Line 1 Properties: Basic Transformer Details 
             * HV (High Voltage) and LV (Low Voltage) Bus Names, Status, Control Codes, Ratings, etc.
             */
            case "sHVBusName":  // High Voltage Bus Name (12-character alphanumeric)
                line1 += " " + FormatInputValue(property.propertyValue, property.propertyType, "A12");
                break;
            case "sLVBusName":  // Low Voltage Bus Name (12-character alphanumeric)
                line1 += " " + FormatInputValue(property.propertyValue, property.propertyType, "A12");
                break;
            case "iUnitNo":  // Unit Number (2-digit integer)
                line1 += " " + FormatInputValue(property.propertyValue, property.propertyType, "I2");
                break;
            case "iStatus":  // Transformer Status (1-digit integer)
                line1 += " " + FormatInputValue(property.propertyValue, property.propertyType, "I1");
                break;
            case "sHVCC":  // HV Control Code (3-character alphanumeric)
                line1 += " " + FormatInputValue(property.propertyValue, property.propertyType, "A3");
                break;
            case "sLVCC":  // LV Control Code (3-character alphanumeric)
                line1 += " " + FormatInputValue(property.propertyValue, property.propertyType, "A3");
                break;
            case "sOLTClocation":  // On-Load Tap Changer Location (2-character alphanumeric)
                line1 += " " + FormatInputValue(property.propertyValue, property.propertyType, "A2");
                break;
            case "sCTRLlocation":  // Control Location (2-character alphanumeric)
                line1 += " " + FormatInputValue(property.propertyValue, property.propertyType, "A2");
                break;
            case "fMVArating":  // Transformer MVA Rating (7-digit floating point)
                line1 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;
            case "fBaseRate1":  // Base MVA Rating (7-digit floating point)
                line1 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;

            /** 
             * Line 2 Properties: Transformer Impedance Values 
             * Resistance (R) and Reactance (X) values in per unit (pu).
             */
            case "fR1pu":  // Positive-sequence Resistance (7-digit floating point)
                line2 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;
            case "fX1pu":  // Positive-sequence Reactance (7-digit floating point)
                line2 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;
            case "fR0pu":  // Zero-sequence Resistance (7-digit floating point)
                line2 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;
            case "fX0pu":  // Zero-sequence Reactance (7-digit floating point)
                line2 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;
            case "fR2pu":  // Negative-sequence Resistance (7-digit floating point)
                line2 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;
            case "fX2pu":  // Negative-sequence Reactance (7-digit floating point)
                line2 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;

            /** 
             * Line 3 Properties: Tap Changer Settings 
             * Parameters related to voltage regulation using tap changers.
             */
            case "fTap":  // Tap Ratio (7-digit floating point)
                line3 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;
            case "fTapmin":  // Minimum Tap Position (7-digit floating point)
                line3 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;
            case "fTapmax":  // Maximum Tap Position (7-digit floating point)
                line3 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;
            case "fTapstep":  // Tap Step Size (7-digit floating point)
                line3 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;
            case "fTappos":  // Current Tap Position (7-digit floating point) with an additional fixed value of 0.00000
                line3 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7") + " 0.00000";
                break;
            case "fVspPU":  // Voltage Set Point in per unit (7-digit floating point)
                line3 += " " + FormatInputValue(property.propertyValue, property.propertyType, "F7");
                break;

            default:
                break;
        }
    });

    // Return the formatted transformer data as three lines, removing trailing spaces
    return `${line1.trimEnd()}\n${line2.trimEnd()}\n${line3.trimEnd()}`;
};

/**
 * Formats system configuration details into a structured string.
 * 
 * @param {Array} properties - An array of objects containing system properties.
 * Each object should have:
 *   - propertyName {string}: The name of the property.
 *   - propertyValue {any}: The value of the property.
 *   - propertyType {string}: The type of the property.
 * 
 * @returns {string} - A formatted string representing the system configuration.
 */
export const systemFormat = (properties) => {
    let formattedString = "";

    // Adding header information
    formattedString += " LFH Assignment 2023" + "\n";
    formattedString += " New and Improved SI Power System" + "\n";
    formattedString += " " + "\n"; // Adding a blank line for readability

    // Iterating through each property to format its corresponding value
    properties.forEach((property) => {
        switch (property.propertyName) {
            case "sSlackBusName":
                // Formatting the Slack Busbar name
                formattedString += " SLACK BUSBAR =  " + FormatInputValue(property.propertyValue, property.propertyType, "A12") + "\n";
                break;
            case "fSbase":
                // Formatting the Base Power in MVA
                formattedString += " BASE POWER (MVA) =    " + FormatInputValue(property.propertyValue, property.propertyType, "F9") + "\n";
                break;
            case "fFbase":
                // Formatting the Base Frequency in Hz
                formattedString += " BASE FREQUENCY (Hz) = " + FormatInputValue(property.propertyValue, property.propertyType, "F9") + "\n";
                break;
            case "sGenHM":
                // Formatting the Generator Harmonic Model
                formattedString += " GENERATOR HARMONIC MODEL   = " + FormatInputValue(property.propertyValue, property.propertyType, "A1") + "\n";
                break;
            case "sTfrHM":
                // Formatting the Transformer Harmonic Model
                formattedString += " TRANSFORMER HARMONIC MODEL = " + FormatInputValue(property.propertyValue, property.propertyType, "A1") + "\n";
                break;
            case "sLoadHM":
                // Formatting the Load Harmonic Model
                formattedString += " LOAD HARMONIC MODEL        = " + FormatInputValue(property.propertyValue, property.propertyType, "A1") + "\n";
                break;
            case "sLineHM":
                // Formatting the Transmission Line Harmonic Model
                formattedString += " TRANSMI_LINE HARMONIC MODEL= " + FormatInputValue(property.propertyValue, property.propertyType, "A1") + "\n";
                break;
            default:
                // Ignoring unknown properties
                break;
        }
    });

    // Trim any trailing spaces or new lines before returning the final formatted string
    return formattedString.trimEnd();
};
