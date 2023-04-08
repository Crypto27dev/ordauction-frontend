import { v4 as uuidv4, validate } from "uuid";
import { useMediaQuery } from 'react-responsive';
import { API_PATH, STORAGE_KEY_INSCRIBER_ID } from "./constants";
import axios from "axios";

export function IsSmMobile() {
    return useMediaQuery({ maxWidth: '639px' });
}
  
export function IsMobile() {
    return useMediaQuery({ maxWidth: '767px' });
}
  
export function IsMdScreen() {
    return useMediaQuery({ maxWidth: '1199px' });
}

export const getBTCfromSats = (amount) => {
    return parseFloat(amount) / 100000000;
}

export const getDisplayString = (str, subLength1, subLength2) => {
    return `${str.toString().substr(0, subLength1)}...${str
      .toString()
      .substr(str.length - subLength2, str.length)}`;
  };

export const getEstimationTime = (feeRate) => {
    const feeRateValue = parseFloat(feeRate);
    if (feeRateValue < 8) {
        return ">1 hour";
    } else if(feeRateValue < 10) {
        return "~1 hour";
    } else if(feeRateValue >= 10) {
        return "~15 minutes";
    }
    return "Can't estimate";
}

export const getNewInscriberId = () => {
    const uniqueId = uuidv4();
    return uniqueId;
}

export const validateUID = (uniqueId) => {
    return validate(uniqueId);
}

export const getInscriberId = () => {
    const _id = window.localStorage.getItem(STORAGE_KEY_INSCRIBER_ID);
    if(!(_id === null || _id === undefined))
        return _id;
    const _newId = getNewInscriberId();
    setInscriberId(_newId);
    return _newId;
}

export const setInscriberId = (newId) => {
    return window.localStorage.setItem(STORAGE_KEY_INSCRIBER_ID, newId);
}

export const axiosPost = async (url, params, config = {}) => {
    try {
        const res = await axios.post(`${API_PATH}${url}`, params, config);
        return {
            success: true,
            data: res.data
        }
    } catch (err) {
        return {
            success: false,
            data: err
        }
    }
}

export const axiosGet = async (url) => {
    try {
        const res = await axios.get(`${API_PATH}${url}`);
        return {
            success: true,
            data: res.data
        }
    } catch (err) {
        return {
            success: false,
            data: err
        }
    }
}

