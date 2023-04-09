import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { getAddressInfo, validate } from "bitcoin-address-validation"
import DateTimePicker from 'react-datetime-picker';
import Select from "react-tailwindcss-select";

import * as actions from "../../store/actions";
import * as selectors from "../../store/selectors";

import { ADMIN_ADDRESS, ALERT_ERROR, ALERT_SUCCESS, ALERT_WARN, BECH32_EXAMPLE, FILE_MAXSIZE, MAX_FEE_RATE, MESSAGE_LOGIN, MIN_FEE_RATE, OUTPUT_UTXO, SERVICE_FEE, SUCCESS } from "../../utils/constants";
import { axiosPost, getDisplayString, getEstimationTime, getInscriberId } from "../../utils/utils";
import "./inscribe.css";
import 'react-datetime-picker/dist/DateTimePicker.css';
import 'react-calendar/dist/Calendar.css';
import 'react-clock/dist/Clock.css';

const Inscribe = () => {

    const dispatch = useDispatch();
    const history = useHistory();
    // const [inscriberId, setInscriberId] = useState("");
    // const inscriberId = useSelector(selectors.getInscriberId);
    const user = useSelector(selectors.getUserState);
    const recipient = user.address;
    const signInfo = useSelector(selectors.getSignInfo);
    const [feeRate, setFeeRate] = useState(0);
    // const [recipient, setRecipient] = useState("");
    const [error, setError] = useState({ feeRate: "", recipient: "" })
    const [estimatedFeeSats, setEstimatedFeeSats] = useState(0);

    const [files, setFiles] = useState([]);
    const [urls, setUrls] = useState([]);

    const [pendingInscribe, setPendingInscribe] = useState(false);
    const [pendingEstimate, setPendingEstimate] = useState(false);

    const [reload, setReload] = useState(true);
    const [auctionPendingList, setAuctionPendingList] = useState([]);

    const [time, setTime] = useState(new Date());
    // const options = [
    //     { value: "fox", label: "🦊 Fox" },
    //     { value: "Butterfly", label: "🦋 Butterfly" },
    //     { value: "Honeybee", label: "🐝 Honeybee" }
    // ];
    const [curInscriptionID, setCurInscriptionID] = useState(-1);
    const [auctionItemIndex, setAuctionItemIndex] = useState(-1);

    //////////// Only Admin
    useEffect(() => {
        console.log("recipient=", user)
        console.log("ADMIN_ADDRESS=", ADMIN_ADDRESS, user.address != ADMIN_ADDRESS);
        if(user.address == "" || user.address != ADMIN_ADDRESS) {
            history.push("/");
        }
    }, [user]);

    useEffect(() => {
        const fetchAuctionData = async () => {
            try {
                const params = {};
                const res = await axiosPost("/auction/getEnableItems", params);
                if(res.success && res.data.status === SUCCESS) {
                    console.log(">>> getAuctionList <<< result=", res.data.result);
                    const _auctionList = res.data.result;
                    const _options = [];
                    for(let i = 0;i<_auctionList.length;i++) {
                        _options.push({
                            value: _auctionList[i].inscriptionID,
                            label: _auctionList[i].inscriptionID,
                            imageUrl: _auctionList[i].imageUrl,
                            link: _auctionList[i].link
                        })
                    }
                    setAuctionPendingList(_options);
                }
            } catch(err) {
                console.log(">>> fetchAuctionData: err=", err);
            }
        }
        fetchAuctionData();
    }, [reload])

    const checkAllValidation = () => {
        let errCnt = 0;

        if (!checkValidation("feeRate", feeRate)) errCnt++;
        if (!checkValidation("recipient", recipient)) errCnt++;

        if (errCnt > 0) return false;
        return true;
    }

    const checkValidation = (input, value) => {
        let terror = 0;
        let message = "";
        var reg;
        switch (input) {
            case "feeRate":
                value = parseFloat(value);
                reg = new RegExp(/^[+-]?\d+(\.\d+)?$/);
                if (
                    !reg.test(value) ||
                    parseFloat(value) < MIN_FEE_RATE ||
                    parseFloat(value) > MAX_FEE_RATE
                ) {
                    terror += 1;
                    message = "Please Enter Valid FeeRate!";
                } else {
                    message = "";
                }
                break;

            case "recipient":
                if (value < 0 || !validate(value) || !getAddressInfo(value).bech32) {
                    terror += 1;
                    message = "Please Input Ord-compatible wallet address!";
                } else {
                    message = "";
                }
                break;

            default:
                terror += 0;
                break;
        }

        if (terror > 0) {
            setError({ ...error, [input]: message });
            return false;
        } else {
            setError({ ...error, [input]: "" });
            return true;
        }
    };

    const handleChangeInput = (e) => {
        e.preventDefault();
        checkValidation(e.target.name, e.target.value);
        if (e.target.name == "feeRate")
            setFeeRate(e.target.value);
        setEstimatedFeeSats(0);
    }

    const handleFileSelect = (e) => {
        console.log("handleFileSelect:", e.target.files)
        const selectedFiles = Array.from(e.target.files);
        const filteredFiles = selectedFiles.filter(item => item && item.size <= FILE_MAXSIZE);
        if (selectedFiles.length != filteredFiles.length) {
            console.log(`File size should not exceed the ${FILE_MAXSIZE / 1000}KB.`);
            dispatch(actions.setAlertMessage({
                type: ALERT_WARN,
                message: `File size should not exceed the ${FILE_MAXSIZE / 1000}KB.`
            }))
        }
        const _urls = [];
        for (let i = 0; i < filteredFiles.length; i++) {
            _urls[i] = URL.createObjectURL(filteredFiles[i]);
        }
        // console.log("withUrls=", urlFiles)
        setFiles(filteredFiles);
        setUrls(_urls);
        setEstimatedFeeSats(0);
    }

    const onRemoveFileFromList = (index) => {
        const _files = files;
        const _urls = urls;
        _files.splice(index, 1);
        _urls.splice(index, 1);
        console.log('newFiles=', _files);
        setFiles(_files);
        setUrls(_urls);
    }

    const handleEstimateInscribe = async (e) => {
        e.preventDefault();
        if (pendingInscribe || pendingEstimate) {
            dispatch(actions.setAlertMessage({
                type: ALERT_WARN,
                message: `Pending... Please wait a few seconds!`
            }));
            return;
        }
        
        console.log(`>>> handleEstimateInscribe checkAllValidation=${checkAllValidation()} recipient=${user.address}`)
        if (checkAllValidation() && files) {
            console.log(">>> handleEstimateInscribe pending")
            setPendingEstimate(true);
            const formData = new FormData();
            formData.append('file', files[0]);
            formData.append("feeRate", feeRate);
            formData.append(
                "ordWallet", user.address // BECH32_EXAMPLE // "UserDepoistAddress : BECH32_EXAMPLE"
            );
            // console.log("handleEstimateInscribe:", formData);
            try {
                console.log(">>> /api/auction/estimate: formData=", formData);
                const res = await axiosPost("/auction/estimate", formData);
                console.log(">>>-----------handleEstimateInscribe: res=", res);
                if (res.success && res.data.status === SUCCESS) {
                    /////////////// ################
                    setEstimatedFeeSats(res.data.result);
                } else {
                    dispatch(actions.setAlertMessage({
                        type: ALERT_ERROR,
                        message: "Estimate failed. Please try again."
                    }));
                }
            } catch (err) {
                console.error("handleEstimateInscribe", err)
                dispatch(actions.setAlertMessage({
                    type: ALERT_ERROR,
                    message: `Something went wrong! errCode: ${err}`
                }));
            }
            setPendingEstimate(false);
        } else {
            if (!checkAllValidation()) {
                dispatch(actions.setAlertMessage({
                    type: ALERT_WARN,
                    message: "Please fill the input data correctly!"
                }))
            } else if (files.length == 0) {
                dispatch(actions.setAlertMessage({
                    type: ALERT_WARN,
                    message: "Please select your artifacts."
                }))
            }
        }
    }

    const handleInscribeNow = async (e) => {
        e.preventDefault();
        if (pendingInscribe || pendingEstimate) {
            dispatch(actions.setAlertMessage({
                type: ALERT_WARN,
                message: `Pending... Please wait a few seconds!`
            }));
            return;
        }

        if (checkAllValidation() && files && recipient) {
            setPendingInscribe(true);
            const formDataEstimate = new FormData();
            formDataEstimate.append('file', files[0]);
            formDataEstimate.append("feeRate", feeRate);
            formDataEstimate.append("ordWallet", user.address); // unused in backend
            try {
                console.log(">>> /api/auction/estimate: formDataEstimate=", formDataEstimate);
                const res = await axiosPost("/auction/estimate", formDataEstimate);
                if (res.success && res.data.status === SUCCESS) {
                    const _estimatedFeeSats = parseInt(res.data.result);
                    console.log(">>> [Result] <<< estimatedFeeSats =", _estimatedFeeSats);
                    setEstimatedFeeSats(_estimatedFeeSats);
                    const formData = new FormData();
                    const actionDate = Date.now();
                    formData.append("ordWallet", user.address);
                    formData.append("file", files[0]);
                    formData.append("feeRate", feeRate);
                    formData.append("actionDate", actionDate);
                    formData.append("plainText", MESSAGE_LOGIN);
                    formData.append("publicKey", user.publicKey);
                    formData.append("signData", signInfo.signedMessage);

                    console.log(">>> /api/auction/createAcution");
                    const inscribeRes = await axiosPost("/auction/createAuction", formData);
                    console.log(">>> [Result] <<< inscribeRes =", inscribeRes);
                    if (inscribeRes.success && inscribeRes.data.status === SUCCESS) {
                        dispatch(actions.setAlertMessage({
                            type: ALERT_SUCCESS,
                            message: `Inscribe Success! Your Inscription will appear in ${getEstimationTime(feeRate)} `
                        }));
                    } else {
                        dispatch(actions.setAlertMessage({
                            type: ALERT_ERROR,
                            // message: "Inscribe failed. Please try again."
                            message: inscribeRes.data.message
                        }))
                    }
                } else {
                    dispatch(actions.setAlertMessage({
                        type: ALERT_ERROR,
                        message: "Estimate failed. Please try again."
                    }));
                }
            } catch (err) {
                console.error("handleInscribeNow:", err);
                dispatch(actions.setAlertMessage({
                    type: ALERT_ERROR,
                    message: `Something went wrong! errCode: ${err}`
                }));
            }
            setPendingInscribe(false);
        } else {
            if (files.length === 0) {
                dispatch(actions.setAlertMessage({
                    type: ALERT_WARN,
                    message: "Please select your artifacts."
                }));
            } else if (!recipient) {
                dispatch(actions.setAlertMessage({
                    type: ALERT_WARN,
                    message: "Please sign up to inscribe your digital artifact."
                }));
            }
        }
    }

    const handleClickReload = () => {
        setReload((reload) => { return !reload });
        setAuctionItemIndex(-1);
        setAuctionPendingList([]);
    }

    const handleAuctionItemChanged = async (item) => {
        setCurInscriptionID(item);
        for(let i = 0;i<auctionPendingList.length;i++) {
            if(auctionPendingList[i].value === item.value){
                setAuctionItemIndex(i);
                break;
            }
        }
        console.log("isShow", auctionPendingList.length > 0 && auctionItemIndex != -1)
    }

    const handleStartAuction = async (e) => {
        e.preventDefault();
        try {
            
        } catch(err) {
            console.log(">>> handleStartAuction error=", err);
        }
    }

    return (
        <div className="Inscribe pb-4">
            <div className="py-6 container text-center">
                <h1 className="text-white text-3xl m-0 page-header">
                    Inscribe your own digital artifact on bitcoin network
                </h1>
            </div>
            <div className="grid md:grid-cols-3 gap-4 container mx-auto">
                <div className="md:col-span-2 w-full">
                    <form>
                        <div className="w-full bg-[#d0efff] rounded-lg p-4 text-[#125170]">
                            <div className="mb-2 label"> Upload your artifact</div>
                            <div className="flex justify-center relative itesm-center min-h-[150px] border-[#4da6d3] border-1 rounded-md p-4 ">
                                <div className="flex flex-col justify-center items-center pointer-events-none py-4">
                                    <div className="icon-md rounded-[50%] bg-[#4da6d3] w-12 h-12 inline-flex items-center justify-center text-center text-xl"> <i className="fa fa-upload" /> </div>
                                    <p className="m-0 pt-3 text-sm text-[#125170]"> Drop file or click to select.</p>
                                    <p className="m-0 pt-3 text-sm text-[#125170]"> {"Must be <400kb each of type"}</p>
                                    <p className="m-0 pt-3 text-sm text-[#125170]"> Supported type: apng gif glb jpg png stl svg webp.</p>
                                </div>
                                <input
                                    className="absolute top-0 right-0 left-0 bottom-0 opacity-0 cursor-pointer"
                                    type="file"
                                    name="upload"
                                    accept=".apng,.gif,.glb,.jpg,.png,.stl,.svg,.webp"
                                    disabled={
                                        pendingInscribe || pendingEstimate
                                    }
                                    onChange={handleFileSelect}
                                />
                            </div>
                            <div className="mt-6"></div>
                            <div className="mb-2">Fee Rate</div>
                            <div className="flex flex-col">
                                <input
                                    type="number"
                                    name="feeRate"
                                    min={MIN_FEE_RATE}
                                    max={MAX_FEE_RATE}
                                    className="bg-transparent border rounded-sm p-2 !border-[#4da6d3] input-fee-rate"
                                    placeholder="Enter fee rate"
                                    disabled={
                                        pendingInscribe || pendingEstimate
                                    }
                                    onChange={handleChangeInput}
                                />
                                <div>
                                    {error['feeRate']}
                                </div>
                                <div className="text-[#125170] text-sm pt-2">
                                    {`Range: ${MIN_FEE_RATE}~${MAX_FEE_RATE} sats/vB. Suggested: 15~25 sats/vB. Default: 15 sats/vB `}<br />
                                    {`Time Estimate: ${getEstimationTime(feeRate)}`}
                                </div>
                            </div>
                            {/* <div className="mt-6"></div>
                            <div className="mt-2 mb-2">Currency *</div>
                            <div className="flex flex-col">
                                <select className="text-[#125170] text-sm pt-2 bg-transparent border rounded-sm p-2 border-[#ccc]">
                                    <option>Select</option>
                                    <option>oBTC</option>
                                    <option>ETH</option>
                                    <option>USDT</option>
                                </select>
                                <div className="mt-2 text-xs text-[#f25767]">
                                    Please Select Currency!
                                </div>
                            </div> */}
                            <div className="mt-6"></div>
                            <div className="flex flex-row justify-center gap-10 px-8">
                                <button
                                    className="text-[#fff] bg-[#5ec1f3] hover:bg-[#75c6ef] hover:text-[#10435c] p-3 rounded-md w-full active:bg-[#3bb4f1]"
                                    onClick={(e) => handleEstimateInscribe(e)}
                                    disabled={
                                        pendingInscribe || pendingEstimate
                                    }
                                > {pendingEstimate ? `Estimating Inscribe Price...` : `Estimate Inscribe Price`} </button>
                                <button
                                    className="text-[#fff] bg-[#5ec1f3] hover:bg-[#518199] p-3 rounded-md w-full active:bg-[#3bb4f1]"
                                    disabled={
                                        pendingInscribe || pendingEstimate
                                    }
                                    onClick={(e) => handleInscribeNow(e)}
                                > {pendingInscribe ? `Inscribing Now...` : `Inscribe Now`} </button>
                            </div>
                            <div className="mt-6"></div>
                        </div>
                    </form>
                </div>
                <div className="flex flex-col gap-4">
                    <div className="bg-[#d0efff] p-3 rounded-xl relative min-h-[280px] flex flex-col">
                        <div className="product-card-media rounded-none flex flex-col gap-4 justify-center items-center">
                            {files && files.length === 1 && files.map((file, index) => (
                                <div className="bg-[#fff2] rounded-lg p-2 relative" key={index}>
                                    {/* <div
                                        className="absolute right-[-5px] top-[-5px] text-black hover:text-[#ccc] bg-[#ffffff55] rounded-full w-[24px] h-[24px] flex justify-center items-center font-semibold"
                                        onClick={() => onRemoveFileFromList(index)}
                                    >
                                        <i className="fa fa-close"></i>
                                    </div> */}
                                    <img src={urls[index]}
                                        alt={file.name}
                                        width="256px"
                                        title="" />
                                </div>
                            ))}
                        </div>
                    </div>
                    {<div className="bg-[#d0efff] p-3 rounded-xl relative text-sm flex flex-col gap-2 text-[#125170]">
                        <div className="flex flex-row justify-between">
                            <div>Inscribe Fee:</div>
                            <div><b>{estimatedFeeSats}</b> sats</div>
                        </div>
                        {/* <div className="flex flex-row justify-between">
                            <div>Output UTXO:</div>
                            <div>{OUTPUT_UTXO * files.length} sats</div>
                        </div>
                        <div className="flex flex-row justify-between">
                            <div>Service Fee:</div>
                            <div>{SERVICE_FEE} sats</div>
                        </div>
                        <div className="flex flex-row justify-between">
                            <div>Total as Sats:</div>
                            <div>{estimatedFeeSats + OUTPUT_UTXO * files.length + SERVICE_FEE} sats</div>
                        </div> */}
                    </div>}
                </div>
                <div className="md:col-span-2 w-full">
                    <form>
                        <div className="w-full bg-[#d0efff] rounded-lg p-4">
                            <div className="mb-2 text-[#125170] flex flex-row justify-between">
                                <span>Select Incription for auction</span>
                                <div className="cursor-pointer underline" onClick={() => handleClickReload()}>Reload</div>
                            </div>
                            <div className="flex flex-col">
                                <Select
                                    value={curInscriptionID}
                                    onChange={(value) => handleAuctionItemChanged(value)}
                                    options={auctionPendingList}
                                />
                                <div className="mt-2 text-xs text-[#f25767]">
                                    Please Select Inscription.
                                </div>
                            </div>
                            <div className="mt-6"></div>
                            <div className="mb-2 text-[#125170]">Set Auction Duration</div>
                            <div className="flex flex-col">
                                <div>
                                    <DateTimePicker className="text-black" onChange={setTime} value={time} />
                                </div>
                                {error['AuctionDuration']}
                            </div>
                            <div className="text-[#125170] text-sm pt-2">
                                {`Range: ${MIN_FEE_RATE}~${MAX_FEE_RATE} sats/vB. Suggested: 15~25 sats/vB. Default: 15 sats/vB `}<br />
                                {`Time Estimate: ${getEstimationTime(feeRate)}`}
                            </div>
                            <div className="mt-6"></div>
                            <div className="flex flex-row justify-center gap-10 px-8">
                                <button
                                    className="text-[#fff] bg-[#5ec1f3] hover:bg-[#75c6ef] hover:text-[#10435c] active:bg-[#3bb4f1] p-3 rounded-md w-full"
                                    // className="text-[#dadbdd] bg-[#741ff5] hover:bg-[#e348ff] p-5 rounded-md w-full"
                                    disabled={ auctionItemIndex == -1 }
                                    onClick={handleStartAuction}
                                > Start Auction </button>
                            </div>
                            <div className="mt-6"></div>
                        </div>
                    </form>
                </div>
                <div className="flex flex-col gap-4">
                    {/* Start Auction */}
                    <div className="bg-[#d0efff] p-3 rounded-xl relative min-h-[280px] flex flex-col">
                        <div className="product-card-media rounded-none flex flex-col gap-4 justify-center items-center">
                            { (auctionPendingList.length > 0 && auctionItemIndex != -1) && <div className="bg-[#fff2] rounded-lg p-2 relative">
                                    {/* <div
                                        className="absolute right-[-5px] top-[-5px] text-black hover:text-[#ccc] bg-[#ffffff55] rounded-full w-[24px] h-[24px] flex justify-center items-center font-semibold"
                                        onClick={() => onRemoveFileFromList(index)}
                                    >
                                        <i className="fa fa-close"></i>
                                    </div> */}
                                    <img
                                        src={auctionPendingList[auctionItemIndex].imageUrl}
                                        alt={auctionPendingList[auctionItemIndex].inscriptionID}
                                        width="256px"
                                    />
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Inscribe;