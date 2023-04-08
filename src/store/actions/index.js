import { createAction as action } from "typesafe-actions"

// User Info
export const setUserInfo = action("user/SET_USER_INFO")();

// Global
export const setAlertMessage = action("global/SET_ALERT_MESSAGE")();
export const setNotifications = action("global/SET_NOTIFICATIONS")();
export const setClearNotifications = action("global/CLEAR_NOTIFICATIONS")();

export const setCollections = action("global/SET_COLLETIONS")();
export const setUpdateCollectionFlag = action("global/SET_UPDATE_COLLECTION_FLAG")();

export const setInscriberId = action("global/SET_INSCRIBER_ID")();