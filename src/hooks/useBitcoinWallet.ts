import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { UNISAT_NETWORK_NAME } from "../utils/constants";

import * as actions from "../store/actions";
import * as selectors from "../store/selectors";

export const appDetails = {
    name: 'Ord Auction',
    icon: `https://ordauction.org/favicon.ico`,
}

const useBitcoinWallet = () => {

    const unisat = (window as any).unisat;
    const dispatch = useDispatch();

    const user = useSelector(selectors.getUserState);
    const connected = useSelector(selectors.getWalletConnected);

    // const [publicKey, setPublicKey] = useState("");
    // const [address, setAddress] = useState("");
    // const [connected, setConnected] = useState(false);

    const signMessage = useCallback(async (message: string) => {
        console.log(`>>>signMessage<<< singing message=${message}, address=${user.address}, publicKey=${user.publicKey}`);
        const signedMessage_ = await (window as any).unisat.signMessage(message, user.address);
        console.log(`>>>>> signed result=${signedMessage_} <<<<<`);
        return { signedMessage: signedMessage_, publicKey: user.publicKey }
    }, [])

    const selfRef = useRef<{ accounts: string[], network: string }>({
        accounts: [],
        network: ""
    });
    const self = selfRef.current;

    if(unisat) {
        unisat.on('accountsChanged', (_accounts: Array<string>) => {
            // console.log(">>> accountsChanged:", _accounts);
            dispatch(actions.setWalletConnected(false));
            dispatch(actions.setUserInfo({
                address: "",
                publicKey: ""
            }))
            // setConnected(false);
            // setAddress("");
            // setPublicKey("");
            self.accounts = [];
        });
    }
    
    const handleAccountsChanged = useCallback(async (data: string[] | any) => {
        console.log('>>> handleAccountsChanged: ', data)
        const _accounts = data as string[]
        // if (self.accounts[0] === _accounts[0]) {
        //     // prevent from triggering twice
        //     return;
        // }
        self.accounts = _accounts;
        if (_accounts.length > 0) {
            // setAddress(_accounts[0]);

            // const [address] = await unisat.getAccounts();
            // setAddress(address);
            // dispatch(actions.setUserInfo(_accounts[0]));

            const publicKey = await unisat.getPublicKey();
            // setPublicKey(publicKey);
            dispatch(actions.setUserInfo({
                address: _accounts[0],
                publicKey: publicKey
            }))
            dispatch(actions.setWalletConnected(true));
            console.log(`>>> wallet connected=${true} address=${_accounts[0]} publicKey=${publicKey}`);
            // setConnected(true);
        } else {
            dispatch(actions.setWalletConnected(false));
            // setConnected(false);
        }
    }, [self, unisat]);

    const handleNetworkChanged = useCallback(async() => {
        try {
            let res = await unisat.switchNetwork(UNISAT_NETWORK_NAME);
            console.log(">>> handleNetworkChanged:", res);
        } catch(err) {
            console.log("handleNetworkChanged error:", err);
        }
    }, [self, unisat])

    const disconnect = useCallback(async () => {
        console.log('disconnect')
        dispatch(actions.setWalletConnected(false));
        // setConnected(false);
        // setAddress("");
        // setPublicKey("");
        dispatch(actions.setUserInfo({
            address: "",
            publicKey: ""
        }));
        dispatch(actions.setSignedMessage({signed: false, signedMessage: ""}));
        self.accounts=[];
    }, [unisat, handleAccountsChanged]);

    const connect = useCallback(async () => {
        if(unisat === undefined) {
            alert("Please install the unisat wallet!");
            return;
        }

        try {
            let _network = await unisat.getNetwork();
            // console.log(">>> network:", _network, "UNISAT_NETWORK_NAME=", UNISAT_NETWORK_NAME);
            if(_network !== UNISAT_NETWORK_NAME) {
                handleNetworkChanged();
                return;
            }
            const _accounts = await unisat.requestAccounts();
            handleAccountsChanged(_accounts);
            // setConnected(true);
            dispatch(actions.setWalletConnected(true));
        } catch(err) {
            console.log(">>>>>>>>> connect failed error=", err);
        }
        
    }, [unisat, handleAccountsChanged]);

    return { 
        // connected,
        // account: { address: user.address, publicKey: user.publicKey },
        signMessage,
        connect,
        disconnect
    }
};

export default useBitcoinWallet;
