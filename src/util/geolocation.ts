/* eslint-disable @typescript-eslint/no-explicit-any */
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

interface HereApiParams {
    app_id: string;
    app_code: string;
    locationId?: string;
    searchtext?: string;
}

export interface LocationParams {
    street: string;
    city: string;
    postal_code: string;
    province: string;
    country: string;
}

export const getLocationData = async (
    options: LocationParams
): Promise<any> => {
    // Postal code messes up the query
    // The returned values are only the first 3 digits
    // So not optimal to search by
    const params: HereApiParams = {
        app_id: process.env.HERE_APP_ID ?? "",
        app_code: process.env.HERE_ACCESS_KEY_ID ?? "",
        searchtext: `${options.street} ${options.city} ${options.province} ${options.country}`,
    };

    const url = `https://autocomplete.geocoder.ls.hereapi.com/6.2/suggest.json?apiKey=${
        process.env.HERE_API_KEY ?? ""
    }&query=${encodeURIComponent(params.searchtext ?? "")}`;

    const res = await fetch(url);

    const data = await res.json();

    return data.suggestions;
};

// https://developer.here.com/blog/street-address-validation-with-reactjs-and-here-geocoder-autocomplete
export const getLocation = async (options: LocationParams): Promise<any> => {
    const locations = await getLocationData(options);

    if (locations.length > 1) {
        const loc = locations.find(
            (location: any) => location.matchLevel === "houseNumber"
        );

        return loc.address;
    } else if (locations.length > 0) {
        return locations[0].address;
    }

    return undefined;
};

// Need to test this out to check how the locations are sent back
export const getLocationList = async (
    options: LocationParams
): Promise<any[]> => {
    const locations: any[] = await getLocationData(options);
    const addresses = locations.map((loc: any) => loc.address);
    return addresses;
};
