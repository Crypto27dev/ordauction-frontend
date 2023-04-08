import { combineReducers } from "redux";
import global from "./global";
import user from "./user";

export const rootReducer = combineReducers({
    global: global,
    userInfo: user
})

const reducers = (state, action) => rootReducer(state, action);

export default reducers;