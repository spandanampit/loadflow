import React, { useState, useEffect } from "react";
import { useAppState } from "../StateContext";

const DynamicForm = ({ fields, onSubmit, canvasInstance }) => {
    const [fieldErrors, setFieldErrors] = useState({});
    const [changecolor, setColorChange] = useState(false);
    const [changecolorforvoltage, setChangeColorforVoltage] = useState(false);

    const setFieldError = (fieldName, errorMessage) => {
        setFieldErrors((prevErrors) => ({
            ...prevErrors,
            [fieldName]: errorMessage,
        }));
    };

    const [formData, setFormData] = useState(
        fields.reduce((acc, field) => {
            //     console.log(`acc-${acc},filed-${field}`);
            if (!field.dynamicField) {
                acc[field.name] = field.value || "";
            } else {
                const dynamicField = field.dynamicField;
                dynamicField.forEach((dField) => {
                    const id = dField.id;
                    Object.keys(dField).map((key) => {
                        if (key != "id") {
                            let name = `${key}-${id}`;
                            const value = dField[key];
                            acc[name] = value || "";
                        }
                    });
                });
            }
            return acc;
        }, {})
    );
    const [dynamicFields, setDynamicFields] = useState(
        fields
            .filter(
                (field) =>
                    Array.isArray(field.dynamicField) &&
                    field.dynamicField.length > 0
            )
            .flatMap((field) => field.dynamicField)
            .map((field, index) => ({ ...field, id: index + 1 }))
    );
    const [isSingleField, setIsSingleField] = useState(fields.length === 1);
    const [formChanged, setFormChanged] = useState(false);
    const [uniqueValidate, setUniqueValidate] = useState(false);
    const { state, dispatch } = useAppState();

    // Initial unit type based on `scktParaType`
    const initialUnitType =
        fields.find((field) => field.name === "scktParaType")?.value ||
        "Per Unit";
    const [unitType, setUnitType] = useState(initialUnitType);
    let isAlertRaise = false;

    // Validation function to check all fields
    const validateFields = () => {
        const errors = {};
        const fieldshashMap = {};

        fields.forEach((field) => {
            let value;
            if (!field.dynamicField) {
                fieldshashMap[field.name] = field;
                value = formData[field.name];
                const propertyType = field.propertyType?.toLowerCase();
                validateField(field, value, propertyType);
            }
        });

        dynamicFields.forEach((dField) => {
            const id = dField.id;
            Object.keys(dField).map((key) => {
                if (key != "id") {
                    console.log(`Key: ${key}, Value: ${dField[key]}`);
                    let field = structuredClone(fieldshashMap[key]); // Deep copy
                    // let field = fieldshashMap[key];
                    field.name = `${key}-${id}`;
                    const propertyType = field.propertyType?.toLowerCase();
                    // const value = dField[key];
                    const value = formData[`${key}-${id}`];
                    validateField(field, value, propertyType);
                }
            });
        });

        function validateField(field, value, propertyType) {
            if (propertyType === "integer") {
                const intValue = parseInt(value, 10);
                if (
                    value === "" &&
                    !(field.minValue === 0 && field.maxValue === 100000)
                ) {
                    errors[field.name] = `${field.label} cannot be empty`;
                } else if (isNaN(intValue)) {
                    errors[field.name] = `Please enter a valid integer`;
                } else {
                    if (
                        field.minValue !== undefined &&
                        field.maxValue !== undefined
                    ) {
                        if (
                            intValue < field.minValue ||
                            intValue > field.maxValue
                        ) {
                            errors[
                                field.name
                            ] = `1Please enter a value between ${field.minValue} and ${field.maxValue}`;
                        }
                    }
                }
            } else if (
                propertyType === "double" ||
                propertyType === "decimal"
            ) {
                const floatValue = parseFloat(value);
                if (
                    value === "" &&
                    field.minValue === 0 &&
                    field.maxValue === 0
                ) {
                } else if (field.minValue === 0 && field.maxValue === 0) {
                } else if (
                    value === "" &&
                    !(field.minValue === 0 && field.maxValue === 100000)
                ) {
                    errors[field.name] = `${field.label} cannot be empty`;
                } else if (isNaN(floatValue)) {
                    errors[field.name] = `Please enter a valid number`;
                } else {
                    // Custom conditions for double/decimal type ranges
                    if (
                        field.minValue === 0.0001 &&
                        field.maxValue === 100000
                    ) {
                        if (hasFilterFields) {
                            let fC;
                            let fL;
                            let fR;
                            if (field.name !== "fC") {
                                fC = formData.fC;
                            }
                            if (field.name !== "fR") {
                                fR = formData.fR;
                            }
                            if (field.name !== "fL") {
                                fL = formData.fL;
                            }
                            if (fC == undefined) {
                                fC = floatValue;
                            }
                            if (fR == undefined) {
                                fR = floatValue;
                            }
                            if (fL == undefined) {
                                fL = floatValue;
                            }
                            const result = checkValues(fC, fR, fL);
                            if (!result && isAlertRaise == false) {
                                alert(
                                    "The total of R(ohm), L(H) and C(uF) value should be greater than 0. \n You can't set ALL 3 Values to 0"
                                ); // Raise alert if the result is false
                                isAlertRaise = true;
                            }
                            if (!result) {
                                errors[field.name] =
                                    "The total of R(ohm), L(H) and C(uF) value should be greater than 0. \n You can't set ALL 3 Values to 0";
                            }
                        } else if (floatValue <= field.minValue) {
                            errors[
                                field.name
                            ] = `Please enter a value greater than 0`;
                        }
                    } else if (
                        field.minValue === 0 &&
                        field.maxValue === 100000
                    ) {
                        if (floatValue < 0) {
                            errors[
                                field.name
                            ] = `Please enter a value greater than ${field.minValue}`;
                        }
                    } else if (field.minValue === 0 && field.maxValue === 0) {
                        // No limits, so no errors
                    } else if (
                        field.minValue !== undefined &&
                        field.maxValue !== undefined
                    ) {
                        // Handle custom min and max for non-zero values
                        if (
                            floatValue < field.minValue ||
                            floatValue > field.maxValue
                        ) {
                            if (field.minValue == 0.0001) {
                                errors[
                                    field.name
                                ] = `2Please enter a value between greater than 0 upto ${field.maxValue}`;
                            } else {
                                errors[
                                    field.name
                                ] = `3Please enter a value between ${field.minValue} and ${field.maxValue}`;
                            }
                        }
                    }
                }
            } else if (propertyType === "string") {
                if (field.label?.toLowerCase() === "color") {
                    // if (value === "") {
                    //   errors[field.name] = `${field.label} must have at least ${field.minValue} characters`;
                    // }
                } else {
                    if (value === "" && field.name != "sSlackBusName") {
                        errors[field.name] = `${field.label} cannot be empty`;
                    } else if (value.length > field.maxValue) {
                        errors[
                            field.name
                        ] = `Maximum allowed characters is ${field.maxValue}`;
                    } else if (
                        field.minValue !== undefined &&
                        value.length < field.minValue
                    ) {
                        errors[
                            field.name
                        ] = `${field.label} must have at least ${field.minValue} characters`;
                    }
                }
            }
        }

        setFieldErrors(errors);
        console.log(errors);
        return Object.keys(errors).length === 0; // Return true if no errors
    };

    const checkValues = (a, b, c) => {
        // Check if any value is negative
        if (a < 0 || b < 0 || c < 0) {
            return false;
        }

        // Check if all values are zero
        if (a === 0 && b === 0 && c === 0) {
            return false;
        }

        // Check if at least one value is greater than zero
        if (a > 0 || b > 0 || c > 0) {
            return true;
        }

        // Default return (should not reach here)
        return false;
    };

    // useEffect(() => {
    //   // Initialize form data and dynamic fields
    //   const initialFormData = fields.reduce((acc, field) => {
    //     acc[field.name] = field.value || "";
    //     return acc;
    //   }, {});
    //   setFormData(initialFormData);

    //   setIsSingleField(fields.length === 1);

    //   const dynamicFieldsArray = fields
    //     .filter(
    //       (field) =>
    //         Array.isArray(field.dynamicField) && field.dynamicField.length > 0
    //     )
    //     .flatMap((field) => field.dynamicField)
    //     .map((field, index) => ({ ...field, id: index + 1 }));
    //   setDynamicFields(dynamicFieldsArray);
    // }, [fields]);

    const handleDynamicFieldChange = (e, key, id) => {
        fields.map((field) => {
            if (field.name == key) {
                console.log(`in the map ${field}`);
                handleInputChange(e, field, id);
            }
        });
    };

    const addDynamicFieldSet = () => {
        const newFieldSet = {
            id: dynamicFields.length + 1,
            iFromNode: "",
            iToNode: "",
            fR: "",
            fL: "",
            fC: "",
        };
        setDynamicFields((prevFields) => [...prevFields, newFieldSet]);
        setFormChanged(true);
    };

    const deleteDynamicFieldSet = (id) => {
        setDynamicFields((prevFields) =>
            prevFields.filter((field) => field.id !== id)
        );
        setFormChanged(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateFields()) {
            // Proceed with form submission if all validations pass
            let voltageOfColor = parseFloat(formData.fBuskV);

            if (formData.iColor !== "black") {
                let colorOfBusIfPresentPreviously =
                    state.voltageColors[voltageOfColor];
                if (colorOfBusIfPresentPreviously && !changecolor) {
                    dispatch({
                        type: "SET_VOLTAGE_COLOR",
                        payload: {
                            voltage: voltageOfColor,
                            color: colorOfBusIfPresentPreviously,
                        },
                    });
                    setColorChange(false);
                } else if (
                    !colorOfBusIfPresentPreviously &&
                    !changecolorforvoltage &&
                    !changecolor
                ) {
                    dispatch({
                        type: "SET_VOLTAGE_COLOR",
                        payload: {
                            voltage: voltageOfColor,
                            color: "0f0000",
                        },
                    });
                    setColorChange(false);
                } else {
                    dispatch({
                        type: "SET_VOLTAGE_COLOR",
                        payload: {
                            voltage: voltageOfColor,
                            color: formData.iColor,
                        },
                    });
                }
            }
            onSubmit(formData, dynamicFields);
        }
    };

    const labelMapping = {
        iToNode: "From Node",
        iFromNode: "To Node",
        fR: "R (ohm)",
        fL: "L (H)",
        fC: "C (uF)",
    };

    const selectOptions = {
        iStatus: [
            { value: "1", label: "In service" },
            { value: "0", label: "Out of service" },
        ],
        sOpMode: [
            { value: "P", label: "POWER" },
            { value: "S", label: "SLIP" },
        ],
        scktBase: [
            { value: "COMMON", label: "COMMON" },
            { value: "OWN", label: "OWN" },
        ],
        sHVCC: [
            { value: "Y-G", label: "Y-G" },
            { value: "Y", label: "Y" },
            { value: "D", label: "D" },
        ],
        sLVCC: [
            { value: "Y-G", label: "Y-G" },
            { value: "Y", label: "Y" },
            { value: "D", label: "D" },
        ],
        sOLTClocation: [
            { value: "HV", label: "HV" },
            { value: "LV", label: "LV" },
            { value: "NONE", label: "NONE" },
        ],
        sCTRLlocation: [
            { value: "HV", label: "HV" },
            { value: "LV", label: "LV" },
            { value: "NONE", label: "NONE" },
        ],
        scktParaType: [
            { value: "Per Unit", label: "Per Unit" },
            { value: "Actual", label: "Actual" },
        ],
        sGenHM: [
            { value: "A", label: "A" },
            { value: "B", label: "B" },
            { value: "C", label: "C" },
        ],
        sTfrHM: [
            { value: "A", label: "A" },
            { value: "B", label: "B" },
            { value: "C", label: "C" },
        ],
        sLoadHM: [
            { value: "A", label: "A" },
            { value: "B", label: "B" },
            { value: "C", label: "C" },
        ],
        sLineHM: [
            { value: "A", label: "A" },
            { value: "B", label: "B" },
            { value: "C", label: "C" },
        ],
    };

    const hasFilterFields = ["iFromNode", "iToNode", "fR", "fL", "fC"].every(
        (field) => fields.some((f) => f.name === field)
    );

    const handleChange = (e, field, isDynamicField = false) => {
        const { name, value } = e.target;

        let newValue = value;
        let errorMessage = "";

        // Handle uniqueness validation for popups
        if (state.isPopupOpen || state.isSaveAsCanvas) {
            const names =
                localStorage
                    .getItem("savedData")
                    ?.split(",")
                    .map((name) => name.toLowerCase()) || [];

            if (
                fields[0]?.value !== value &&
                names.includes(value.toLowerCase())
            ) {
                setUniqueValidate(true);
            } else {
                setUniqueValidate(false);
            }
        } else {
            setUniqueValidate(false);
        }

        if (state.isEditPopupOpen) {
            const names = localStorage.getItem("elementsData");
            const elementData = names ? JSON.parse(names) : [];

            if (value !== fields[1]?.value) {
                const isDuplicate = elementData.some(
                    (data) =>
                        data.propertyName === name &&
                        data.propertyValue?.toLowerCase() ===
                            value.toLowerCase()
                );
                setUniqueValidate(isDuplicate);
            } else {
                setUniqueValidate(false);
            }
        }

        if (field) {
            const propertyType = field.propertyType?.toLowerCase();

            if (propertyType === "integer") {
                // Integer validation
                newValue = newValue.replace(/[^0-9]/g, "");

                if (newValue === "") {
                    errorMessage = `${field.label} cannot be empty`;
                } else if (
                    newValue === "" &&
                    !(field.minValue === 0 && field.maxValue === 100000)
                ) {
                    errorMessage = `${field.label} cannot be empty`;
                } else if (
                    field.minValue !== undefined &&
                    field.maxValue !== undefined
                ) {
                    const intValue = parseInt(newValue, 10);
                    if (
                        isNaN(intValue) ||
                        intValue < field.minValue ||
                        intValue > field.maxValue
                    ) {
                        errorMessage = `4Please enter a value between ${field.minValue} and ${field.maxValue}`;
                    }
                }
            } else if (["double", "decimal"].includes(propertyType)) {
                // Double/Decimal validation
                newValue = newValue.replace(/[^0-9.-]/g, "");
                if (newValue.indexOf("-") > 0)
                    newValue = newValue.replace("-", ""); // Allow "-" only at the start
                if (newValue.split(".").length > 2)
                    newValue = newValue.substring(0, newValue.lastIndexOf("."));

                if (
                    newValue === "" &&
                    field.minValue === 0 &&
                    field.maxValue === 0
                ) {
                } else if (field.minValue === 0 && field.maxValue === 0) {
                } else if (
                    newValue === "" &&
                    !(field.minValue === 0 && field.maxValue === 100000)
                ) {
                    errorMessage = `${field.label} cannot be empty`;
                } else {
                    const floatValue = parseFloat(newValue);

                    if (isNaN(floatValue) && newValue !== "") {
                        errorMessage = `Please enter a valid number`;
                    } else if (
                        field.minValue === 0 &&
                        field.maxValue === 100000 &&
                        floatValue < 0
                    ) {
                        if (floatValue < 0) {
                            errorMessage = `Please enter a value greater than 0`;
                        }
                    } else if (
                        field.minValue === 0.0001 &&
                        field.maxValue === 100000
                    ) {
                        if (floatValue < 0.0001) {
                            errorMessage = `Please enter a ${field.name} greater than or equal to 0.0001`;
                        }
                    } else if (
                        floatValue > field.minValue ||
                        floatValue > field.maxValue
                    ) {
                        if (field.minValue == 0.0001) {
                            errorMessage = `5Please enter a value between greater than 0 upto ${field.maxValue}`;
                        } else {
                            errorMessage = `6Please enter a value between ${field.minValue} and ${field.maxValue}`;
                        }
                    }
                }
            } else if (propertyType === "string") {
                // String validation
                if (field.label?.toLowerCase() === "color") {
                    // newValue = field.defaultValue || "Black"; // Default color
                } else {
                    if (
                        field.maxValue !== undefined &&
                        newValue.length > field.maxValue
                    ) {
                        errorMessage = `Maximum allowed characters is ${field.maxValue}`;
                        newValue = newValue.slice(0, field.maxValue); // Trim excess characters
                    } else if (
                        field.minValue !== undefined &&
                        newValue.trim().length < field.minValue
                    ) {
                        errorMessage = `Field cannot be empty or less than ${field.minValue} characters`;
                    }
                }
            }
        }
        // }

        if (isDynamicField) {
            const updatedFields = dynamicFields.map((fieldSet) =>
                fieldSet.id === isDynamicField
                    ? { ...fieldSet, [field.name]: value }
                    : fieldSet
            );
            setFormData((prevData) => ({
                ...prevData,
                [name]: newValue,
            }));
            setFieldError(name, errorMessage);
            setDynamicFields(updatedFields);
            setFormChanged(true);
        } else {
            // Update form data and errors
            setFormData((prevData) => ({
                ...prevData,
                [name]: newValue,
            }));
            setFieldError(name, errorMessage);
            setFormChanged(true);
        }
        // Additional logic
        if (name === "scktParaType") setUnitType(value);
    };

    const handleInputChange = (e, field, isDynamicField = false) => {
        const { name, value } = e.target;
        let newValue = value;
        let errorMessage = "";

        if (field.propertyType?.toLowerCase() === "integer") {
            // Only allow numeric input
            newValue = newValue.replace(/[^0-9]/g, "");

            if (newValue === "") {
                errorMessage = `${field.label} cannot be empty`;
            } else {
                const intValue = parseInt(newValue, 10);
                if (intValue < field.minValue || intValue > field.maxValue) {
                    errorMessage = `7Please enter a value between ${field.minValue} and ${field.maxValue}`;
                }
            }
        } else if (
            ["double", "decimal"].includes(field.propertyType?.toLowerCase())
        ) {
            // Double/Decimal validation
            newValue = newValue.replace(/[^0-9.-]/g, "");
            if (newValue.indexOf("-") > 0) newValue = newValue.replace("-", ""); // Allow "-" only at the start
            if (newValue.split(".").length > 2)
                newValue = newValue.substring(0, newValue.lastIndexOf("."));
            if (
                newValue === "" &&
                field.minValue === 0 &&
                field.maxValue === 0
            ) {
            } else if (field.minValue === 0 && field.maxValue === 0) {
            } else if (
                newValue === "" &&
                !(field.minValue === 0 && field.maxValue === 100000)
            ) {
                errorMessage = `${field.label} cannot be empty`;
            } else if (
                field.minValue !== undefined &&
                field.maxValue !== undefined
            ) {
                const floatValue = parseFloat(newValue);
                if (isNaN(floatValue) && newValue !== "") {
                    errorMessage = "Please enter a valid number";
                } else if (field.minValue === 0 && field.maxValue === 100000) {
                    if (floatValue < 0) {
                        errorMessage = `Please enter a value greater than 0`;
                    }
                } else if (
                    field.minValue === 0.0001 &&
                    field.maxValue === 100000
                ) {
                    if (hasFilterFields) {
                        let fC;
                        let fL;
                        let fR;
                        if (name !== "fC") {
                            fC = formData.fC;
                        }
                        if (name !== "fR") {
                            fR = formData.fR;
                        }
                        if (name !== "fL") {
                            fL = formData.fL;
                        }
                        if (fC == undefined) {
                            fC = value;
                        }
                        if (fR == undefined) {
                            fR = value;
                        }
                        if (fL == undefined) {
                            fL = value;
                        }
                        const result = checkValues(fC, fR, fL);
                        if (!result) {
                            alert(
                                "The total of R(ohm), L(H) and C(uF) value should be greater than 0. \n You can't set ALL 3 Values to 0"
                            ); // Raise alert if the result is false
                        }
                    } else if (floatValue < 0.0001) {
                        errorMessage = `Please enter a value greater than 0`;
                    }
                } else if (
                    floatValue < field.minValue ||
                    floatValue > field.maxValue
                ) {
                    if (field.minValue == 0.0001) {
                        errorMessage = `8Please enter a value between greater 0 upto ${field.maxValue}`;
                    } else {
                        errorMessage = `9Please enter a value between ${field.minValue} and ${field.maxValue}`;
                    }
                }
            }
        } else if (field.propertyType?.toLowerCase() === "string") {
            // String validation
            newValue = newValue.replace(/[^a-zA-Z0-9-\s]/g, "");
            const objects = canvasInstance;
            let anotherBusWithSameVoltagePresent = false;
            let currentVoltageOfbus = formData.fBuskV;

            for (let i = 0; i < objects.length; i++) {
                const Obj = objects[i];
                if (Obj.elementCategory === "Bus") {
                    const voltageProperty = Obj.canvasProperty?.find(
                        (prop) => prop.propertyName === "fBuskV"
                    );
                    const busname = Obj.canvasProperty?.find(
                        (prop) => prop.propertyName === "sBusName"
                    );
                    if (formData.sBusName !== busname?.propertyValue) {
                        let voltage = parseFloat(
                            voltageProperty?.propertyValue
                        );
                        currentVoltageOfbus = parseFloat(currentVoltageOfbus);
                        if (voltage === currentVoltageOfbus) {
                            anotherBusWithSameVoltagePresent = true;
                            break; // Exit the loop early
                        }
                    }
                }
            }

            currentVoltageOfbus = parseFloat(currentVoltageOfbus);
            if (state.voltageColors[currentVoltageOfbus]) {
                if (anotherBusWithSameVoltagePresent) {
                    //anotherBusWithSameVoltagePresent then dont show the confirm box but set the dispatch value
                    const confirmed = window.confirm(
                        "Color for this voltage is already set.Are you sure you want to change the color?"
                    );
                    setColorChange(confirmed);

                    if (confirmed) {
                        dispatch({
                            type: "SET_VOLTAGE_COLOR",
                            payload: {
                                voltage: parseFloat(formData.fBuskV),
                                color: newValue,
                            },
                        });
                    }
                    if (!confirmed) {
                        // If not confirmed, revert the value to the previous color
                        e.target.value = formData[name];
                        return;
                    }
                } else {
                    dispatch({
                        type: "SET_VOLTAGE_COLOR",
                        payload: {
                            voltage: parseFloat(formData.fBuskV),
                            color: newValue,
                        },
                    });
                }
            } else if (!state.voltageColors[currentVoltageOfbus]) {
                setChangeColorforVoltage(true);
            } else if (newValue === "") {
                errorMessage = `${field.label} cannot be empty`;
            } else if (field.maxValue && newValue.length > field.maxValue) {
                errorMessage = `Maximum allowed characters is ${field.maxValue}`;
            } else if (field.minValue && newValue.length < field.minValue) {
                errorMessage = `${field.label} must have at least ${field.minValue} characters`;
            }
        }

        if (isDynamicField) {
            handleChange(
                { target: { name, value: newValue } },
                field,
                isDynamicField
            );
            setFieldError(name, errorMessage);
        } else {
            // Trigger the onChange handler with updated value
            handleChange({ target: { name, value: newValue } }, field);
            // Set validation error
            setFieldError(name, errorMessage);
        }
    };

    return (
        <div className="form-container">
            <form
                onSubmit={handleSubmit}
                className={`dynamic-form ${
                    isSingleField ? "single-field" : ""
                }`}
            >
                {fields.map(
                    (field) =>
                        !field.dynamicField && (
                            <div
                                key={field.name}
                                className="field"
                                style={{
                                    gap: "1px",
                                }}
                            >
                                <label htmlFor={field.name}>
                                    {field.label}
                                    {[
                                        "fR1",
                                        "fX1",
                                        "fB1",
                                        "fR0",
                                        "fX0",
                                        "fB0",
                                        "fR2",
                                        "fX2",
                                        "fB2",
                                    ].includes(field.name) && (
                                        <span className="unit">
                                            {unitType === "Per Unit"
                                                ? "(p.u.)"
                                                : field.name.includes("B")
                                                ? "(mho/km)"
                                                : "(ohm/km)"}
                                        </span>
                                    )}
                                    :
                                </label>
                                {field.label?.toLowerCase() === "color" ? (
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                        }}
                                    >
                                        {/* Color picker input */}
                                        <input
                                            type="color"
                                            name={field.name}
                                            value={
                                                formData[field.name] ||
                                                "#000000"
                                            } // Default to black
                                            onChange={(e) => {
                                                handleInputChange(e, field); // Updates the form data
                                            }}
                                            disabled={!field.isEditable}
                                        />
                                        {/* Display the color code */}
                                        <span
                                            style={{
                                                fontSize: "14px",
                                                fontFamily: "monospace",
                                            }}
                                        >
                                            {formData[field.name] || "#000000"}
                                        </span>
                                    </div>
                                ) : selectOptions[field.name] ? (
                                    <select
                                        name={field.name}
                                        defaultValue={field.value}
                                        onChange={handleChange}
                                        disabled={!field.isEditable}
                                    >
                                        {selectOptions[field.name].map(
                                            (option) => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </option>
                                            )
                                        )}
                                    </select>
                                ) : (
                                    <>
                                        <input
                                            type={field.type}
                                            name={field.name}
                                            // defaultValue={
                                            //         field.name !==
                                            //         "canvas name"
                                            //                 ? field.propertyType?.toLowerCase() ===
                                            //                   "integer"
                                            //                         ? parseInt(
                                            //                                   field.value,
                                            //                                   10
                                            //                           ) ||
                                            //                           ""
                                            //                         : field.value
                                            //                 : ""
                                            // }
                                            // value={field.name !== "canvas name" ? field?.propertyType?.toLowerCase() == "integer" ? parseInt(formData[field.name], 10) : formData[field.name] : ""}
                                            value={
                                                field.name !== "canvas name"
                                                    ? field?.propertyType?.toLowerCase() ===
                                                      "integer"
                                                        ? formData[
                                                              field.name
                                                          ] === ""
                                                            ? ""
                                                            : parseInt(
                                                                  formData[
                                                                      field.name
                                                                  ],
                                                                  10
                                                              )
                                                        : formData[field.name]
                                                    : ""
                                            }
                                            //value={field.value}
                                            readOnly={!field.isEditable}
                                            onChange={(e) =>
                                                handleInputChange(e, field)
                                            }
                                        />

                                        {fieldErrors[field.name] && (
                                            <span
                                                className="inputError"
                                                style={{
                                                    color: "red",
                                                    fontSize: "12px",
                                                }}
                                            >
                                                {fieldErrors[field.name]}
                                            </span>
                                        )}

                                        {state.isEditPopupOpen ? (
                                            JSON.parse(
                                                localStorage.getItem(
                                                    "elementsData"
                                                )
                                            )?.some(
                                                (data) =>
                                                    data.propertyName ===
                                                    field.name
                                            ) && uniqueValidate ? (
                                                <span className="inputError">
                                                    This name already exists.
                                                </span>
                                            ) : null
                                        ) : uniqueValidate ? (
                                            <span className="inputError">
                                                This name already exists.
                                            </span>
                                        ) : null}
                                    </>
                                )}
                            </div>
                        )
                )}
                {dynamicFields.length > 0 && (
                    <div className="dynamic-section">
                        {dynamicFields.map((fieldSet) => (
                            <div key={fieldSet.id} className="single-field-set">
                                <div
                                    style={{
                                        margin: "10px",
                                    }}
                                >
                                    <label
                                        style={{
                                            fontWeight: "bold",
                                        }}
                                    >
                                        Additional Fields Set {fieldSet.id}:
                                    </label>
                                </div>
                                <div className="dynamic-form">
                                    {Object.keys(fieldSet).map(
                                        (key) =>
                                            key !== "id" && (
                                                <div
                                                    key={key}
                                                    className="field"
                                                >
                                                    <label>
                                                        {labelMapping[key] ||
                                                            key}
                                                        :
                                                    </label>
                                                    <>
                                                        <input
                                                            type="text"
                                                            name={`${key}-${fieldSet.id}`}
                                                            value={
                                                                fieldSet[key] ||
                                                                ""
                                                            }
                                                            onChange={(e) =>
                                                                handleDynamicFieldChange(
                                                                    e,
                                                                    key,
                                                                    fieldSet.id
                                                                )
                                                            }
                                                        />
                                                        {fieldErrors[
                                                            `${key}-${fieldSet.id}`
                                                        ] && (
                                                            <span
                                                                className="inputError"
                                                                style={{
                                                                    color: "red",
                                                                    fontSize:
                                                                        "12px",
                                                                }}
                                                            >
                                                                {
                                                                    fieldErrors[
                                                                        `${key}-${fieldSet.id}`
                                                                    ]
                                                                }
                                                            </span>
                                                        )}
                                                        {state.isEditPopupOpen ? (
                                                            JSON.parse(
                                                                localStorage.getItem(
                                                                    "elementsData"
                                                                )
                                                            )?.some(
                                                                (data) =>
                                                                    data.propertyName ===
                                                                    `${key}-${fieldSet.id}`
                                                            ) &&
                                                            uniqueValidate ? (
                                                                <span className="inputError">
                                                                    This name
                                                                    already
                                                                    exists.
                                                                </span>
                                                            ) : null
                                                        ) : uniqueValidate ? (
                                                            <span className="inputError">
                                                                This name
                                                                already exists.
                                                            </span>
                                                        ) : null}
                                                    </>
                                                </div>
                                            )
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        deleteDynamicFieldSet(fieldSet.id)
                                    }
                                    style={{
                                        marginTop: "10px",
                                        color: "white",
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {hasFilterFields && (
                    <div className="button-group">
                        <button type="button" onClick={addDynamicFieldSet}>
                            Add Fields
                        </button>
                        {dynamicFields.length > 0 && (
                            <button
                                type="button"
                                onClick={() =>
                                    setDynamicFields(dynamicFields.slice(0, -1))
                                }
                            >
                                Remove Fields
                            </button>
                        )}
                    </div>
                )}

                {uniqueValidate ? null : (
                    <div className="button-field">
                        <button type="submit" className="form-submit">
                            Submit
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default DynamicForm;
