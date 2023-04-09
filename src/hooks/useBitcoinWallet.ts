import { useCallback, useEffect, useRef, useState } from "react";
import { UNISAT_NETWORK_NAME } from "../utils/constants";

export const appDetails = {
    name: 'Ord Auction',
    icon: `https://ordauction.org/favicon.ico`,
}

const useBitcoinWallet = () => {

    const unisat = (window as any).unisat;    

    const [publicKey, setPublicKey] = useState("");
    const [address, setAddress] = useState("");
    const [connected, setConnected] = useState(false);

    const signMessage = useCallback(async (message: string) => {
        const signedMessage_ = await (window as any).unisat.signMessage(message)
        return { signedMessage: signedMessage_, publicKey: '' }
    }, [])

    const selfRef = useRef<{ accounts: string[], network: string }>({
        accounts: [],
        network: ""
    });
    const self = selfRef.current;

    if(unisat) {
        unisat.on('accountsChanged', (_accounts: Array<string>) => {
            // console.log(">>> accountsChanged:", _accounts);
            setConnected(false);
            setAddress("");
            setPublicKey("");
            self.accounts = [];
        });
    }
    
    const handleAccountsChanged = useCallback(async (data: string[] | any) => {
        console.log('>>> handleAccountsChanged: ', data)
        const _accounts = data as string[]
        if (self.accounts[0] === _accounts[0]) {
            // prevent from triggering twice
            return;
        }
        self.accounts = _accounts;
        if (_accounts.length > 0) {
            setAddress(_accounts[0]);

            const [address] = await unisat.getAccounts();
            setAddress(address);

            const publicKey = await unisat.getPublicKey();
            setPublicKey(publicKey);
            setConnected(true);
        } else {
            setConnected(false);
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
        setConnected(false);
        setAddress("");
        setPublicKey("");
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
            setConnected(true);
        } catch(err) {
            console.log(">>>>>>>>> connect failed error=", err);
        }
        
    }, [unisat, handleAccountsChanged]);

    return { connected, account: { address: address, publicKey: publicKey }, signMessage, connect, disconnect }
};

export default useBitcoinWallet;
