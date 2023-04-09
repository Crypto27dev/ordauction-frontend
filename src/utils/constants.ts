export const AVERAGE_BLOCK_TIME_IN_SECS = 12;
export const STORAGE_KEY_INSCRIBER_ID = "INSCRIBER_ID"
export const IS_DEVELOPMENT = true;


export const MIN_FEE_RATE = 1;
export const MAX_FEE_RATE = 1000;

export const DEV_FILE_MAXSIZE = 20000; // 20KB - testnet
export const PRO_FILE_MAXSIZE = 400000; // 400KB - mainnet

export const FILE_MAXSIZE = DEV_FILE_MAXSIZE;

export const UNISAT_NETWORK_NAME = IS_DEVELOPMENT ? "testnet" : "livenet"

export const DEV_API_PATH = "http://localhost:3306/api";
export const PROD_API_PATH = "https://ordinalart.backend.hariwhitedream.com/api";

export const API_PATH = IS_DEVELOPMENT ? DEV_API_PATH : PROD_API_PATH;

export const ADMIN_ADDRESS = IS_DEVELOPMENT ? "tb1q8zcn0ackfwq0jd7fjrxgc0k07x2sv3cf0lh4s6" : "";

export const ALERT_EMPTY = "";
export const ALERT_SUCCESS = "success";
export const ALERT_WARN = "warning";
export const ALERT_ERROR = "error";

export const ALERT_REFETCH = 10000;

export const ALERT_DELAY = 3000;
export const ALERT_POSITION = "top-right";

export const SUCCESS = "SUCCESS";
export const FAIL = "FAIL";

export const SERVICE_FEE = 40000;
export const OUTPUT_UTXO = 10000;

export const BECH32_EXAMPLE = "bc1pgrc6jtuaqajm347356xgsk7aeapnh6pnkac2mxa4dm3vq04ezc3qt6g8xs";

////// Signing Messages
export const MESSAGE_LOGIN = "Sign in to the website!";