import { getType } from "typesafe-actions";
import * as actions from "../actions"

export const initialState = {
    user: ""
};

const states = (state = initialState, action) => {
    switch(action.type) {
        case getType(actions.setUserInfo):
            return {...state, user: action.payload};
        default:
            return state;        
    }
}

export default states;