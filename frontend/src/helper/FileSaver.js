import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import * as FormatInputValue from './FormatInput';
import axios from 'axios';


// Function to split objects by category
const splitByCategory = (data) => {
  return data.reduce((acc, obj) => {
    const { elementCategory } = obj;
    if (!acc[elementCategory]) {
      acc[elementCategory] = [];
    }
    acc[elementCategory].push(obj.canvasProperty);
    return acc;
  }, {});
};

// Function to format the object data into a table-like string
const formatAsTable = (objects,category) => {
  if (!objects.length) return "";
  // Extract unique property names dynamically from the first object in the group
 // const headers = objects[0].map(item => item.propertyName).join('\t');
  const excludeColumns= {
    Bus: ["iBusID"],
    Generator: ["sGenName"],
    "Transmission Line": ["sLineName","fB0","fB2"],
    Load: ["sLoadName"],
    "Shunt Device": ["sShuntName","fMVArating","scktBase"],
    Filter: ["sFilterName"],
    "Induction Motor":["sIndMotName"],
    "Two winding transformer": ["sXFRName"],
  };
  console.log("objects",objects);
 // console.log("excludeColumns",excludeColumns[category]);
  //.filter(data=>!excludeColumns[category].includes(data.propertyName))
  // Generate rows dynamically based on each object's propertyValue
const rows = objects.map(item =>{ 
  const items = item?.filter(data=>!excludeColumns[category].includes(data.propertyName));
  if(category=="Bus"){
    return FormatInputValue.busFormat(items);
  }
  if(category=="Generator"){
    return FormatInputValue.generatorFormat(items);
  }
  if(category=="Load"){
    return FormatInputValue.loadFormat(items);
  }
  if(category=="Shunt Device"){
    return FormatInputValue.shuntDeviceFormat(items);
  }
  if(category=="Induction Motor"){
    return FormatInputValue.InductionFormat(items);
  }
  if(category=="Two winding transformer"){
    return FormatInputValue.transformerFormat(items);
  }
  if(category=="Transmission Line"){
    return FormatInputValue.lineFormat(items);
  }
  if(category=="Filter"){
    return FormatInputValue.filterFormat(items);
  }
  // items.map(pro => {
  //   // Make sure the propertyType is properly checked using toLowerCase()
  //   const propType = pro.propertyType.toLowerCase(); // Convert to lowercase once for comparison

  //   if (propType === 'string') {
  //     return `${pro.propertyValue.toLocaleUpperCase()}`; // Wrap string values in quotes
  //   } else if (propType === 'integer') {
  //     // If it's an integer, format it as an integer (without decimal points)
  //     return Number(pro.propertyValue).toFixed(0); // Ensure it's treated as a number and convert to fixed 0 decimals
  //   } else if (propType === 'double' || propType === 'decimal') {
  //     // If it's a decimal or double, format it to 2 decimal places
  //     return Number(pro.propertyValue).toFixed(2);
  //   }
  //   return pro.propertyValue; // Default case (in case propertyType is something unexpected)
  // })// Join each `pro.propertyValue` with a space

}).join('\n'); // Join each row with a newline

  // Combine headers and rows
  //return `${headers}\n${rows}`;
  return `${rows}`;
};

// Main function to generate and save text files by category
export const generateFiles = async(data,systemProperties,engineInputURL,folderName) => {
  const fileName = {
                          Bus: "BUS",
                          Generator: "GENR",
                          "Transmission Line": "LIND",
                          Load: "LOAD",
                          "Shunt Device": "SHUN",
                          Filter: "FILT",
                          "Induction Motor": "INDM",
                          "Two winding transformer": "XFR2",
                        };

  const groupedData = splitByCategory(data);
  const categories = Object.keys(groupedData);

  for (const category of categories) {
    if(category!="undefined"){
      const tableContent = formatAsTable(groupedData[category],category);
      const blob = new Blob([tableContent], { type: 'text/plain;charset=utf-8' });
          //saveAs(blob, `${fileName[category]}.DAT`); // Save the text file for each category
      // Prepare file for sending via API
      const formData = new FormData();
      formData.append('file', blob, `${fileName[category]}.DAT`);
      // Append additional string data
      formData.append('engineInputURL', engineInputURL);
       formData.append('folderName',folderName);
      try {
        // Send the file to the backend API
        const response = await axios.post(`${process.env.REACT_APP_ENGINE_SERVER_URL}/upload?p=122`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        console.log('File uploaded successfully:', response.data);
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
  }

  if(systemProperties){
    const tableContent1 = FormatInputValue.systemFormat(systemProperties);
    const blob = new Blob([tableContent1], { type: 'text/plain;charset=utf-8' });
    //saveAs(blob, `SYSP.DAT`); // Save the text file for each category
    //socket.emit('fileGenerated', { fileName: `SYSP.DAT`, data: tableContent1 });
    const formData = new FormData();
    formData.append('file', blob, `SYSP.DAT`);
    formData.append('engineInputURL', engineInputURL);
    formData.append('folderName',folderName);
    try {
      // Send the file to the backend API
      const response = await axios.post(`${process.env.REACT_APP_ENGINE_SERVER_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('File uploaded successfully:', response.data);
      return true;
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  }



    // const tableContent2 = FormatInputValue.serverFile();
    // const blob1 = new Blob([tableContent2], { type: 'text/plain;charset=utf-8' });
    // saveAs(blob1, `server.js`); // Save the text file for each category


    // const tableContent3 = FormatInputValue.createSetupFile();
    // const blob2 = new Blob([tableContent3], { type: 'text/plain;charset=utf-8' });
    // saveAs(blob2, `setup_and_run.bat`); // Save the text file for each category
   
};


const formatGroupForExcel = (objects) => {
    if (!objects.length) return "";
    const headers = objects[0]?.map(item => item.propertyName)
    // Generate rows dynamically based on each object's propertyValue
    const rows = objects?.map(item => item?.map(pro => pro.propertyValue));
    // Combine into a 2D array (Excel-friendly format)
    const tableData = [headers,  ...rows];
    return tableData;
    // console.log("formatGroupForExcel",objects);
    // return [];
  };
  
  export const generateExcelFile = (data) => {
    const workbook = XLSX.utils.book_new(); // Create a new workbook
    const groupedData = splitByCategory(data);
    console.log("generateExcelFile",groupedData);
    Object.keys(groupedData).forEach(category => {
      // Format the data for each group
      const sheetData = formatGroupForExcel(groupedData[category]);      
      // Create a new sheet from the formatted data
      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);      
      // Add the sheet to the workbook with a custom name
      XLSX.utils.book_append_sheet(workbook, worksheet, `${category.toLocaleUpperCase()}`);
    });
    
    // Create Excel file as a Blob
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    // Save the Excel file
    saveAs(blob, 'grouped_data.xlsx');
  };