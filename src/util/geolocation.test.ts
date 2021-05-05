import {
    getLocationData,
    getLocation,
    getLocationList,
    LocationParams,
} from "./geolocation";

const locationOptions: LocationParams = {
    street: "1245 Sixth Line",
    city: "Oakville",
    postal_code: "L6H1X1",
    province: "ON",
    country: "CA",
};

test("Location data should be returned", async () => {
    const data = await getLocationData(locationOptions);
    expect(data).toBeTruthy();
});

test("One location should be returned", async () => {
    const location = await getLocation(locationOptions);
    expect(location).toBeTruthy();
});

test("Should retrieve a list of locations", async () => {
    const locations = await getLocationList(locationOptions);
    expect(locations.length).toBeGreaterThan(0);
});
