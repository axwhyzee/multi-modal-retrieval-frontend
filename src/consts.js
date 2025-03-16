export const SUFFIXES = {
    IMG_SUFFIXES: [".png", ".jpg", "jpeg"],
    VID_SUFFIXES: [".mp4", ".mov"],
    TXT_SUFFIXES: [".txt"],
    PDF_SUFFIXES: [".pdf"],
    PY_SUFFIXES: [".py"],
    MD_SUFFIXES: [".md"],
}


export const TEXT_BASED_SUFFIXES = SUFFIXES.TXT_SUFFIXES.concat(
    SUFFIXES.MD_SUFFIXES, 
    SUFFIXES.PY_SUFFIXES
  );


export const ELEMENT = {
    TEXT: "TEXT",
    IMAGE: "IMAGE",
    PLOT: "PLOT",
    CODE: "CODE",
}


export const API_URL = "http://localhost:5004" // process.env.REACT_APP_API_URL;
export const USER = process.env.REACT_APP_USER;
export const TOP_N = 10;


