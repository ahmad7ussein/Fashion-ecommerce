"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
const regions = {
    US: {
        code: "US",
        name: "United States",
        currency: "USD",
        currencySymbol: "$",
        exchangeRate: 1.0,
        flag: "🇺🇸",
    },
    SA: {
        code: "SA",
        name: "Saudi Arabia",
        currency: "SAR",
        currencySymbol: "ر.س",
        exchangeRate: 3.75,
        flag: "🇸🇦",
    },
    AE: {
        code: "AE",
        name: "United Arab Emirates",
        currency: "AED",
        currencySymbol: "د.إ",
        exchangeRate: 3.67,
        flag: "🇦🇪",
    },
    EG: {
        code: "EG",
        name: "Egypt",
        currency: "EGP",
        currencySymbol: "ج.م",
        exchangeRate: 30.9,
        flag: "🇪🇬",
    },
    GB: {
        code: "GB",
        name: "United Kingdom",
        currency: "GBP",
        currencySymbol: "£",
        exchangeRate: 0.79,
        flag: "🇬🇧",
    },
    EU: {
        code: "EU",
        name: "Europe",
        currency: "EUR",
        currencySymbol: "€",
        exchangeRate: 0.92,
        flag: "🇪🇺",
    },
    PS: {
        code: "PS",
        name: "Palestine",
        currency: "ILS",
        currencySymbol: "₪",
        exchangeRate: 3.65,
        flag: "🇵🇸",
    },
};
const RegionContext = createContext(null);
export function RegionProvider({ children }) {
    const [region, setRegionState] = useState("US");
    const [isDetecting, setIsDetecting] = useState(false);
    const detectRegion = useCallback(async () => {
        setIsDetecting(true);
        try {
            const response = await fetch("https://ipapi.co/json/");
            const data = await response.json();
            const countryCode = data.country_code;
            let detectedRegion = "US";
            switch (countryCode) {
                case "SA":
                    detectedRegion = "SA";
                    break;
                case "AE":
                    detectedRegion = "AE";
                    break;
                case "EG":
                    detectedRegion = "EG";
                    break;
                case "GB":
                    detectedRegion = "GB";
                    break;
                case "PS":
                    detectedRegion = "PS";
                    break;
                case "AT":
                case "BE":
                case "BG":
                case "HR":
                case "CY":
                case "CZ":
                case "DK":
                case "EE":
                case "FI":
                case "FR":
                case "DE":
                case "GR":
                case "HU":
                case "IE":
                case "IT":
                case "LV":
                case "LT":
                case "LU":
                case "MT":
                case "NL":
                case "PL":
                case "PT":
                case "RO":
                case "SK":
                case "SI":
                case "ES":
                case "SE":
                    detectedRegion = "EU";
                    break;
                default:
                    detectedRegion = "US";
            }
            setRegionState(detectedRegion);
            localStorage.setItem("region", detectedRegion);
        }
        catch (error) {
            console.error("Failed to detect region:", error);
            setRegionState("US");
            localStorage.setItem("region", "US");
        }
        finally {
            setIsDetecting(false);
        }
    }, []);
    useEffect(() => {
        const saved = localStorage.getItem("region");
        if (saved && regions[saved]) {
            setRegionState(saved);
        }
        else {
            detectRegion();
        }
    }, [detectRegion]);
    const setRegion = (newRegion) => {
        setRegionState(newRegion);
        localStorage.setItem("region", newRegion);
    };
    const convertPrice = (usdPrice) => {
        const regionInfo = regions[region];
        return usdPrice * regionInfo.exchangeRate;
    };
    const formatPrice = (usdPrice) => {
        const regionInfo = regions[region];
        const convertedPrice = convertPrice(usdPrice);
        return `${regionInfo.currencySymbol}${convertedPrice.toFixed(2)}`;
    };
    const regionInfo = regions[region];
    return (<RegionContext.Provider value={{
            region,
            regionInfo,
            setRegion,
            convertPrice,
            formatPrice,
            detectRegion,
        }}>
      {children}
    </RegionContext.Provider>);
}
export function useRegion() {
    const context = useContext(RegionContext);
    if (!context)
        throw new Error("useRegion must be used within RegionProvider");
    return context;
}
