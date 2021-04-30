import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "chai";
import BaseWorld from "../support/base_world";
import { Connection } from "typeorm";
import Business, { BusinessAttributes } from "../../src/models/business";

Given(
    "the new business {string}",
    async function (this: BaseWorld, name: string) {
        const businessAttr: BusinessAttributes = {
            name,
            address: "1380 Speers Rd",
            city: "Oakville",
            province: "ON",
            country: "CA",
            postal_code: "L6H 1X1",
        };

        this.setCustomProp<BusinessAttributes>("attributes", businessAttr);
    }
);

When("the business details are entered", async function (this: BaseWorld) {
    const connection = this.getCustomProp<Connection>("connection");
    const businessAttr = this.getCustomProp<BusinessAttributes>("attributes");

    let business = connection.manager.create(Business, businessAttr);
    business = await connection.manager.save(business);

    this.setCustomProp<Business>("model", business);
});

Then("a new business should be registered", async function (this: BaseWorld) {
    const businessAttr = this.getCustomProp<BusinessAttributes>("attributes");
    const business = this.getCustomProp<Business>("model");

    expect(business.id).to.be.greaterThan(0);

    for (const key of Object.keys(businessAttr)) {
        expect(business[key as keyof BusinessAttributes]).to.be.equal(
            businessAttr[key as keyof BusinessAttributes]
        );
    }
});
