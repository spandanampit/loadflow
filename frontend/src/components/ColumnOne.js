import React, { useState, useEffect, useCallback } from "react";
import { getElementsWithProperties } from "../services/elementService";
import { FaChevronDown, FaChevronUp } from "react-icons/fa6";
import { useAppState } from "../StateContext";

function ColumnOne({ onElementSelect }) {
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [openSections, setOpenSections] = useState({
    1: true, // Initially open all sections if needed
    2: true,
    3: true,
  });

  const labelMapping = {
    iToNode: "From Node",
    iFromNode: "To Node",
    fR: "R (ohm)",
    fL: "L (H)",
    fC: "C (uF)",
  };

  const { state, dispatch } = useAppState();

  const handleDragStart = useCallback(
    (e, element) => {
      dispatch({ type: "SET_CLICKED", payload: false });
      dispatch({ type: "SET_DRAGGING", payload: true });
      setSelectedElement(element);
      onElementSelect(element);
      if (element.category == "Bus") {
        dispatch({ type: "SET_DEACTIVED_ELEMENT", payload: true });
      }
    },
    [onElementSelect]
  );

  const handleDrag = useCallback(
    (e, element) => {
      if (!state.dragging) return;
      dispatch({ type: "SET_DRAGGING", payload: true });

      setSelectedElement(element);
      onElementSelect(element);
      //console.log("handleDragAfter",state.position);
    },
    [onElementSelect]
  );

  const handleDragEnd = useCallback(
    (e, element) => {
      dispatch({
        type: "SET_POSITION",
        payload: { x: e.clientX, y: e.clientY },
      });

      dispatch({ type: "SET_DROPPED", payload: true });
      setSelectedElement(element);
      onElementSelect(element);
    },
    [onElementSelect]
  );

  const toggleAccordion = (section) => {
    setOpenSections({
      ...openSections,
      [section]: !openSections[section], // Only toggle the clicked section
    });
  };

  useEffect(() => {
    async function fetchElements() {
      try {
        const response = await getElementsWithProperties();
        setElements(response.data);
        dispatch({ type: "SET_ELEMENT", payload: response.data });
      } catch (error) {
        console.error("Error fetching elements and properties:", error);
      }
    }

    fetchElements();
  }, []);

  // Using useCallback to avoid unnecessary re-renders of handleElementSelect
  const handleElementSelect = useCallback(
    (element) => {
      dispatch({ type: "SET_CLICKED", payload: true });
      setSelectedElement(element);
      onElementSelect(element);

      dispatch({ type: "SET_ELEMENT", payload: element });
    },
    [onElementSelect]
  );

  useEffect(() => {
    if (selectedElement) {
      //console.log('Selected element:', selectedElement);
    }
  }, [selectedElement]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.target.tagName === "INPUT") {
        return;
      }
      if (event.ctrlKey && event.key === "o") {
        event.preventDefault();
        dispatch({ type: "SET_LOAD_CANVAS", payload: true });
      } else if (event.ctrlKey && event.key === "s") {
        event.preventDefault();
        dispatch({ type: "SET_POPUP", payload: true });
      } else if (
        event.key === "Delete" ||
        event.keyCode === 46 ||
        event.key === "Backspace"
      ) {
        //|| event.key === 'Backspace'
        if (state.isEditPopupOpen != true) {
          event.preventDefault();
          dispatch({ type: "DELETE_OBJECT", payload: true });
        }
      }
    };

    // Add event listener for keydown
    window.addEventListener("keydown", handleKeyPress);
    // Cleanup the event listener
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  return (
    <div className="column accordion">
      <div className="elements">
        <h3 className="accordion-header">
          Shunt Elements
          <button onClick={() => toggleAccordion(1)} className="toggle-btn">
            {openSections[1] ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </h3>
        {openSections[1] && (
          <div className="elementsWrap">
            {elements
              .filter(
                (element) =>
                  !["Transmission Line", "Two winding transformer"].includes(
                    element.category
                  )
              )
              .map((element) => (
                //Zoom Related Changes - Replace the below div tag
                <div
                  key={element.id}
                  className="element-icon"
                  {...(!state.isZoomEnabled ? {
                    onDragStart: (e) => handleDragStart(e, element),
                    onDragEnd: (e) => handleDragEnd(e, element)
                  } : {})}
                >
                  <img
                    src={`${process.env.PUBLIC_URL}${element.svgPath}`}
                    alt={element.category}
                    title={element.category}
                  />
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="elements">
        <h3 className="accordion-header">
          Series Elements
          <button onClick={() => toggleAccordion(2)} className="toggle-btn">
            {openSections[2] ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </h3>
        {openSections[2] && (
          <div className="elementsWrap">
            {elements
              .filter((element) =>
                ["Transmission Line"].includes(element.category)
              )
              .map((element) => (
                
                // Zoom Related Changes - Replace the below div tag
                <div
                  key={element.id}
                  className="element-icon"
                  {...(!state.isZoomEnabled ? {
                    onClick: (e) => dispatch({ type: "LINK_OBJECT", payload: true })
                  } : {})}
                >
                  
                  <img
                    src={`${process.env.PUBLIC_URL}${element.svgPath}`}
                    alt={element.category}
                    title={element.category}
                  />
                </div>
              ))}
            {elements
              .filter((element) =>
                ["Two winding transformer"].includes(element.category)
              )
              .map((element) => (
                <div
                  key={element.id}
                  className="element-icon"
                  onClick={() =>{
                    if (!state.isZoomEnabled) {
                      dispatch({ type: "LINK_OBJECT", payload: true }); //IS_TRANSFORMER_SELECTED
                      dispatch({ type: "IS_TRANSFORMER_SELECTED", payload: true });
                    }
                  }
                  }
                  // onDragStart={(e) => handleDragStart(e, element)}
                  // onDrag={(e) => handleDrag(e, element)}
                  // onDragEnd={(e) => handleDragEnd(e, element)}
                >
                  <img
                    src={`${process.env.PUBLIC_URL}${element.svgPath}`}
                    alt={element.category}
                    title={element.category}
                  />
                </div>
              ))}
          </div>
        )}
      </div>

      {Object.keys(state.elementPropertyData).length === 0 &&
        selectedElement && (
          <div className="properties-panel">
            <h3 className="accordion-header">
              Properties
              <button onClick={() => toggleAccordion(3)} className="toggle-btn">
                {openSections[3] ? <FaChevronUp /> : <FaChevronDown />}
              </button>
            </h3>
            {openSections[3] && (
              <table>
                <tbody>
                  {selectedElement?.properties
                    ?.sort((a, b) => a.orderProperties - b.orderProperties)
                    ?.map((data, i) => (
                      <tr key={i}>
                        <td>{data.propertyLabelName}</td>
                        <td> : </td>
                        <td>{data.propertyValue}</td>
                      </tr>
                    ))}
                  {/* <tr><td>ID</td><td> : </td><td>{selectedElement.id}</td></tr>
                            <tr><td>Name</td><td> : </td><td>{selectedElement.name}</td></tr> */}
                  <tr>
                    <td>Category</td>
                    <td> : </td>
                    <td>{selectedElement.category}</td>
                  </tr>
                  {/* <tr><td>Area Number</td><td> : </td><td>{selectedElement?.properties[0]?.iAreaNo}</td></tr>
                            <tr><td>Status</td><td> : </td><td>{selectedElement?.properties[0]?.iStatus}</td></tr>
                            <tr><td>Nominal Voltage (kV)</td><td> : </td><td>{selectedElement?.properties[0]?.fBuskV}</td></tr>
                            <tr><td>Voltage magnitude (p.u.)</td><td> : </td><td>{selectedElement?.properties[0]?.fVmagPU}</td></tr>
                            <tr><td>Voltage angle (deg.)</td><td> : </td><td>{selectedElement?.properties[0]?.fVangDeg}</td></tr> */}
                </tbody>
              </table>
            )}
          </div>
        )}

      {Object.keys(state.elementPropertyData).length > 0 && selectedElement && (
        <div className="properties-panel">
          <h3 className="accordion-header">
            Properties 1
            <button onClick={() => toggleAccordion(3)} className="toggle-btn">
              {openSections[3] ? <FaChevronUp /> : <FaChevronDown />}
            </button>
          </h3>
          {openSections[3] && (
            <table>
              <tbody>
                {state.elementPropertyData?.canvasProperty?.map((data, i) => (
                  <tr key={i}>
                    <td>{data.propertyLabelName}</td>
                    <td> : </td>
                    <td>{data.propertyValue}</td>
                  </tr>
                ))}

                <tr>
                  <td>Category</td>
                  <td> : </td>
                  <td>{state.elementPropertyData.elementCategory}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      )}

      {Object.keys(state.elementPropertyData).length > 0 && selectedElement && (
        <div className="properties-panel">
          {openSections[3] && (
            <table>
              <tbody>
                {/* Filter duplicates and display only the last dynamicFields */}
                {[
                  ...new Map(
                    state.elementPropertyData?.canvasProperty?.map((item) => [
                      item.propertyName,
                      item,
                    ])
                  ).values(),
                ].map((item, i) => (
                  <div key={i}>
                    {item.dynamicFields?.map((dynamicField, j) => (
                      <table key={j}>
                        <tbody>
                          <p>Additional Field: {j + 1}</p>
                          {Object.entries(dynamicField).map(([key, value]) => (
                            <tr key={key}>
                              <td>{labelMapping[key] || key} </td> <td> : </td>
                              <td>{value} </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ))}
                  </div>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default React.memo(ColumnOne);
