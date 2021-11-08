import BaseWorld from "@test/support/base_world";
import DBConnection from "@test/support/db_connection";
import Helpers from "@test/helpers";
import actions from "@test/helpers/api/actions";

let baseWorld: BaseWorld;

beforeAll(async () => {
    await DBConnection.init();
    await Helpers.AppServer.setup(false);
});
afterAll(async () => {
    await Helpers.AppServer.teardown();
    await DBConnection.close();
});

beforeEach(async () => {
    baseWorld = new BaseWorld(await DBConnection.get());
    await Helpers.Api.setup.call(baseWorld, "@setup_invite_user");
});

afterEach(async () => {
    await Helpers.Api.teardown.call(baseWorld, "@cleanup_user_role");
});

describe("Global admin authorized", () => {
    beforeEach(async () => {
        // Given I am logged in as an admin
        await actions.login.call(baseWorld);
    });

    test.todo(
        "Global admin can create membership"

        // , async () => {
        // // When I create a membership

        // await actions.createMembership.call(baseWorld);

        // // Then a new membership exists
        // Request.success.call(baseWorld);
        // }
    );

    test.todo("Global admin can delete membership");
    // Scenario: Global Admin Can Delete Membership
    //     Given I am logged in as an admin
    //     When I delete a membership
    //     Then a membership is deleted
});

describe("User who lacks CRUD rights", () => {
    test.todo(
        "User who lacks CRUD membership rights cannot create memberships"
    );
    // Given I am logged in as a user
    // When I create a membership
    // Then I get an error
    test.todo("User who lacks CRUD rights cannot delete membership");
    // Scenario: User who lacks CRUD membership rights cannot delete memberships
    //     Given I am logged in as a user
    //     When I delete a membership
    //     Then I get an error
});
