import { createConnection } from "typeorm";
import { connection } from "../../../src/config/database";
import Business, { BusinessAttributes } from "../../../src/models/business";

test("Create business", async () => {
    const testDB = await createConnection({
        name: "Test",
        ...connection,
    });

    const businessAttr: BusinessAttributes = {
        name: "Oakville Windows and Doors",
        address: "1380 Speers Rd",
        city: "Oakville",
        province: "ON",
        country: "CA",
        postal_code: "L6H 1X1",
    };

    let business = testDB.manager.create(Business, businessAttr);
    business = await testDB.manager.save(business);

    expect(business.id).toBeGreaterThan(0);

    for (const key of Object.keys(businessAttr)) {
        expect(business[key as keyof BusinessAttributes]).toBe(
            businessAttr[key as keyof BusinessAttributes]
        );
    }
    await testDB.close();
});
