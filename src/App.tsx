import { useEffect, useCallback, useState } from 'react';
import { ChainId, useEthers } from '@usedapp/core';
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom';
// @ts-nocheck
import { ToastContainer, toast } from "react-toastify";
import { useDispatch, useSelector } from 'react-redux';

import { useAppDispatch, useAppSelector } from './hooks';
import { setActiveAccount } from './state/slices/account';
import { setAlertModal } from './state/slices/application';
import classes from './App.module.css';
import '../src/css/globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import "react-toastify/dist/ReactToastify.css";

import AlertModal from './components/Modal';
import NavBar from './components/NavBar';
import NetworkAlert from './components/NetworkAlert';
import Footer from './components/Footer';
import AuctionPage from './pages/Auction';
import GovernancePage from './pages/Governance';
import CreateProposalPage from './pages/CreateProposal';
import VotePage from './pages/Vote';
import NoundersPage from './pages/Nounders';
import ExplorePage from './pages/Explore';
import NotFoundPage from './pages/NotFound';
import Playground from './pages/Playground';
import { CHAIN_ID } from './config';
import relativeTime from 'dayjs/plugin/relativeTime';
import { AvatarProvider } from '@davatar/react';
import dayjs from 'dayjs';
import DelegatePage from './pages/DelegatePage';
import Inscribe from './pages/Inscribe';
import * as actions from "./store/actions";
import * as selectors from "./store/selectors";
import { ALERT_DELAY, ALERT_EMPTY, ALERT_ERROR, ALERT_POSITION, ALERT_REFETCH, ALERT_SUCCESS, ALERT_WARN, MESSAGE_LOGIN, SUCCESS } from "./utils/constants";
import useBitcoinWallet from './hooks/useBitcoinWallet';
import { axiosPost } from './utils/utils';

function App() {
  const alertMessage = useSelector(selectors.getAlertMessage);

  const {chainId, library } = useEthers();
  const dispatch = useAppDispatch();
  dayjs.extend(relativeTime);

  // useEffect(() => {
  //   // Local account array updated
  //   dispatch(setActiveAccount(account));
  // }, [account, dispatch]);

  const alertModal = useAppSelector(state => state.application.alertModal);
  // const { signMessage } = useBitcoinWallet();
  // const connected = useSelector(selectors.getWalletConnected);
  const user = useSelector(selectors.getUserState);
  const signInfo = useSelector(selectors.getSignInfo);

  const [refetch, setRefetch] = useState(true);

  useEffect(() => {
    const timerID = setInterval(() => {
      setRefetch((prevRefetch) => {
        return !prevRefetch;
      })
    }, ALERT_REFETCH);
    return () => {
      clearInterval(timerID);
    }
  }, [])

  useEffect(() => {
    console.log(">>>>>> fetchUserInfo signInfo=", signInfo)
    const fetchUserInfo = async () => {
      try {
        const params = {
          ordWallet: user.address,
          actionDate: Date.now(),
          plainText: MESSAGE_LOGIN,
          publicKey: user.publicKey,
          signData: signInfo.signedMessage
        }
        console.log(">>>>>>>>> api/users/setUserInfo params=", params);
        const res = await axiosPost("/users/setUserInfo", params);
        console.log(">>>[result]<<< res=", res);
        if(res.success && res.data.status === SUCCESS) {
        //   result: {
        //     ordWallet: ordWallet,
        //     btcAccount: fetchItem.btcAccount,
        //     btcBalance: balance
        // }, status: SUCCESS, message: "Create Success"
          const _userProfile = res.data.result;
          console.log(">>> userProfile =", _userProfile);
          dispatch(actions.setUserProfile({
            btcAccount: _userProfile.btcAccount,
            btcBalance: _userProfile.btcBalance,
          }))
          
        } else {
          dispatch(actions.setAlertMessage({
            type: ALERT_WARN,
            message: "Load user info failed"
          }));
        }
      } catch(err) {
        console.log(">>> fetchUserInfo error=", err);
        dispatch(actions.setAlertMessage({
          type: ALERT_ERROR,
          message: `Something went wrong! errCode: ${err}`
      }));
      }
    }
    if(signInfo.signed) {
      fetchUserInfo();
    }
  }, [signInfo]);

  // useEffect(() => {
  //   const sign = async () => {
  //     try {
  //       const res = await signMessage(MESSAGE_LOGIN);
  //       console.log(">>> signed message res=", res);
  //       // res.signedMessage, res.publicKey

  //     } catch(err) {
  //       console.log(">>> signMessage err=", err);
  //       if(err.code === 4001) {
  //         dispatch(actions.setAlertMessage({type: ALERT_ERROR, message: err.message}));
  //         dispatch(actions.setUserInfo({address: "", publicKey: ""}));
  //         dispatch(actions.setWalletConnected(false));
  //       }
  //     }
  //   }
  //   if(connected)
  //     sign();
  // }, [connected]);

  const handleClose = useCallback(() => {
    dispatch(actions.setAlertMessage({ type: ALERT_EMPTY, message: ""}));
  }, [dispatch])

  const notifySuccess = useCallback(() => {
    toast.success(alertMessage.message, {
      position: ALERT_POSITION,
      delay: ALERT_DELAY,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      onClose: handleClose,
      className: "alert-message-success",
    });
  }, [alertMessage.message, handleClose]);

  const notifyError = useCallback(() => {
    toast.error(alertMessage.message, {
      position: ALERT_POSITION,
      delay: ALERT_DELAY,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      onClose: handleClose,
      className: "alert-message-error",
    })
  }, [alertMessage.message, handleClose]);

  const notifyWarn = useCallback(() => {
    toast.warn(alertMessage.message, {
      position: ALERT_POSITION,
      delay: ALERT_DELAY,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      onClose: handleClose,
      className: "alert-message-warn",
    })
  }, [alertMessage.message, handleClose]);

  useEffect(() => {
    switch(alertMessage.type) {
      case ALERT_ERROR:
        notifyError();
        return;
      case ALERT_SUCCESS:
        notifySuccess();
        return;
      case ALERT_WARN:
        notifyWarn();
        return;
      case ALERT_EMPTY:
        return;
      default:
        handleClose();
        return;
    }
  }, [alertMessage, notifyError, notifySuccess, notifyWarn, handleClose]);

  return (
    <div className={`${classes.wrapper}`}>
      {Number(CHAIN_ID) !== chainId && <NetworkAlert />}
      {alertModal.show && (
        <AlertModal
          title={alertModal.title}
          content={<p>{alertModal.message}</p>}
          onDismiss={() => dispatch(setAlertModal({ ...alertModal, show: false }))}
        />
      )}
      <ToastContainer />
      <BrowserRouter>
        <AvatarProvider
          provider={chainId === ChainId.Mainnet ? library : undefined}
          batchLookups={true}
        >
          <NavBar />
          <Switch>
            <Route exact path="/" component={AuctionPage} />
            <Redirect from="/auction/:id" to="/noun/:id" />
            <Route
              exact
              path="/noun/:id"
              render={props => <AuctionPage initialAuctionId={Number(props.match.params.id)} />}
            />
            <Route exact path="/nounders" component={NoundersPage} />
            <Route exact path="/create-proposal" component={CreateProposalPage} />
            <Route exact path="/vote" component={GovernancePage} />
            <Route exact path="/vote/:id" component={VotePage} />
            <Route exact path="/playground" component={Playground} />
            <Route exact path="/delegate" component={DelegatePage} />
            <Route exact path="/explore" component={ExplorePage} />
            <Route exact path="/admin" component={Inscribe} />
            <Route component={NotFoundPage} />
          </Switch>
          <Footer />
        </AvatarProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
