import axios from 'axios';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export const getElementsWithProperties = () => {
    return axios.get(`${API_BASE_URL}/api/elements-with-properties`);
};
