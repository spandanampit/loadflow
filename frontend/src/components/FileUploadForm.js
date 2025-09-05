import React, { useState, useEffect } from "react";
import * as XLSX from 'xlsx';
import { useAppState } from '../StateContext';

const FileUploadForm = ({objects, onSubmit}) => {
  let obj =objects?.filter(data=>data.canvasProperty).sort((a, b) => {
    if (a.elementCategory < b.elementCategory) {
      return -1
    } else if (a.elementCategory > b.elementCategory) {
      return 1
    } else {
      return 0
    }
});
  const [formData, setFormData] = useState({});
  const [objData, setObjData] = useState(obj);  
  const { state, dispatch } = useAppState(); 

  

  // Initial unit type based on `scktParaType`
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const workbook = XLSX.read(event.target.result, { type: 'binary' });
      const allSheetsData = {};
      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const sheetData = XLSX.utils.sheet_to_json(sheet);
        allSheetsData[sheetName] = sheetData; // Save data by sheet name
      });

    //console.log("All Sheets Data:-", allSheetsData["BUS"]);
    //setData(allSheetsData); // Set combined data
    dispatch({ type: 'IMPORT_DATA', payload: allSheetsData });
    };
    console.log("objects",objects);
    reader.readAsBinaryString(file);
  };

  const handleSubmit = (e) => {
    console.log("handleSubmit",formData);
    console.log("handleSubmit-e",e);
    let valid=false;
    const fData = Object.keys(formData).filter(data=>formData[data] == ''); //console.log('data-formData',formData[data]);console.log('data',data); return data;

    e.preventDefault();
    if(fData.length==0){
       onSubmit(formData, state.fileUploadData);
    }
  };

  useEffect(() => {
    // Initialize form data and dynamic fields
    const initialFormData = objData.reduce((acc, field) => {
      acc[field.id] =  "";
      return acc;
    }, {});
    setFormData(initialFormData);
  }, [objData]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log("handleChange",{formData,name,value});
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

  };


  return (
    <div className="form-container">
       <input type="file" onChange={handleFileUpload} />
      {state.fileUploadData && (
        <div>
          <h2>Map the Elements:</h2>
          <div className="form-container">
      <form
        onSubmit={handleSubmit}
      >
          <table>
          {objData.map(element=>(
            <tr ID={element.id}>
            <td>{element?.canvasProperty[1].propertyValue}</td>
            <td>
              <select id={element.elementCategory.replace(/\s+/g, "_")}  onChange={handleChange} name={element.id}>
                  {/* Placeholder option */}
                  <option value="">
                    Select {element.elementCategory}
                  </option>
                  {/* Map through each item in the category */}
                  {state.fileUploadData[element.elementCategory.toLocaleUpperCase()].map((item, index) => {
                    const keys = Object.keys(item);
                    if (keys.length >= 2) {
                      return (
                        <option key={index} value={item[keys[0]]}>
                          {item[keys[1]]}
                        </option>
                      );
                    }
                    return null; // Skip if there are fewer than 2 keys
                  })}
                </select>
          </td>
            </tr>
          ))}

</table>    <div className="button-field">
      <button type="submit" className="form-submit">
        Submit
      </button>
    </div> </form> </div></div>
          )}
    </div>
  );
};

export default FileUploadForm;
