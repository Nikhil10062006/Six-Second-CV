import { useContext } from "react";
import { OutReachContext } from "../context/outReachContext.jsx";

export const useOutReach = () => useContext(OutReachContext);
