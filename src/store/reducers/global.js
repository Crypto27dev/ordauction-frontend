import { getType } from "typesafe-actions";
import { ALERT_EMPTY } from "../../utils/constants";
import * as actions from "../actions"

export const initialState = {
    alertMessage: {
        type: ALERT_EMPTY,
        message: ""
    },
    notifications: null,
    collections: [],
    updateCollectionFlag: false,
    inscriberId: "",
};

const states = (state = initialState, action) => {
    switch(action.type) {
        case getType(actions.setAlertMessage):
            return {...state, alertMessage: action.payload};
        case getType(actions.setNotifications):
            return {...state, notifications: action.payload};
        case getType(actions.setClearNotifications):
            return {...state, notifications: null}
        case getType(actions.setCollections):
            return {...state, collections: action.payload};
        case getType(actions.setInscriberId):
            return {...state, inscriberId: action.payload};
        case getType(actions.setUpdateCollectionFlag):
            return {...state, updateCollection: action.payload};
        default:
            return state;
    }
}

export default states;