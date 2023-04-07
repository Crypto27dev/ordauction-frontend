import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ReactNode } from 'react';
import { grey } from '../../utils/nounBgColors';

export interface AlertModal {
  show: boolean;
  title?: ReactNode;
  message?: ReactNode;
}

interface ApplicationState {
  stateBackgroundColor: string;
  isCoolBackground: boolean;
  alertModal: AlertModal;
}

const initialState: ApplicationState = {
  stateBackgroundColor: grey,
  isCoolBackground: true,
  alertModal: {
    show: false,
  },
};

export const applicationSlice = createSlice({
  name: 'application',
  initialState,
  reducers: {
    setStateBackgroundColor: (state, action: PayloadAction<string>) => {
      state.stateBackgroundColor = grey;
      state.isCoolBackground = /* action.payload === grey */true;
    },
    setAlertModal: (state, action: PayloadAction<AlertModal>) => {
      state.alertModal = action.payload;
    },
  },
});

export const { setStateBackgroundColor, setAlertModal } = applicationSlice.actions;

export default applicationSlice.reducer;
