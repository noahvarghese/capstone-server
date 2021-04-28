interface HereApiParams {
    app_id: string;
    app_code: string;
    locationId?: string;
    searchtext?: string;
}

interface LocationParams {
    street: string;
    city: string;
    postal_code: string;
    province: string;
    country: string;
}

const getLocationData = async (options: LocationParams): Promise<any> => {
    const params: HereApiParams = {
        app_id: process.env.HERE_APP_ID ?? "",
        app_code: process.env.HERE_ACCESS_KEY_ID ?? "",
        searchtext: `${options.street} ${options.city} ${options.province} ${options.postal_code} ${options.country}`,
    };

    const res = await fetch("https://geocoder.api.here.com/6.2/geocode.json", {
        body: JSON.stringify({ params }),
    });

    const data = await res.json();
    const view = data.Response.View;
    return view;
};

// https://developer.here.com/blog/street-address-validation-with-reactjs-and-here-geocoder-autocomplete
export const getFirstLocation = async (
    options: LocationParams
): Promise<any> => {
    const view = await getLocationData(options);
    if (view.length > 0 && view[0].Result.length > 0) {
        const location = view[0].Result[0].Location;
        return location.Address;
    }
    return undefined;
};

// Need to test this out to check how the locations are sent back
// export const getLocationList = async (options: LocationParams): Promise<void> => {
// const view = await getLocationData(options);
// };
