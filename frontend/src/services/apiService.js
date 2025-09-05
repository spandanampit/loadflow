import axios from 'axios';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const ENGINE_SERVER_URL = process.env.REACT_APP_ENGINE_SERVER_URL;

export const storeCanvasAPI = async (data) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/saveCanvas`, data);
      return response.data;
    } catch (error) {
      console.error('POST request error:', error);
      throw error;
    }
};

export const getAllCanvasAPI = async (data) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/getAllCanvas`);
      return response.data;
    } catch (error) {
      console.error('GET request error:', error);
      throw error;
    }
};

export const 
readBusOutputData = async (engineInputURL,folderName) => {
  try {
    const response = await axios.get(`${ENGINE_SERVER_URL}/get-engine-output`, {
      params: {
        engineInputURL, // First additional parameter
        folderName, // Second additional parameter
      },
    });
    if(response.data.length ==0){
      alert("Ouput file not found");
    }
    return response.data;
  } catch (error) {
    // if(error.code == "ERR_NETWORK"){
    //   alert("engine server is not connected")
    // }
   
  }
};


export const readElementOutputData = async (data) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/getElementsOutput`);
    return response.data;
  } catch (error) {
    console.error('GET request error:', error);
    throw error;
  }
};