import ReactGA from "react-ga4";

// Reemplaza con tu ID de medición de Google Analytics
const GA_MEASUREMENT_ID = "G-M37SMVCR2B";

export const initGA = () => {
  ReactGA.initialize(GA_MEASUREMENT_ID);
};

export const logPageView = () => {
  ReactGA.send("pageview");
};