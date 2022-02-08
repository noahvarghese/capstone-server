import DBConnection from "@test/support/db_connection";
import { unitTeardown } from "@test/unit/teardown";

test.todo("db connection failed");

describe("requires db connection", () => {
    beforeAll(DBConnection.init);
    afterAll(DBConnection.close);

    describe("requires admin user", () => {
        beforeAll(async () => {
            return;
        });
        afterAll(async () => unitTeardown(await DBConnection.get()));
        describe("requires secondary user", () => {
            describe("permissions", () => {
                test.todo("admin");
                test.todo("department");
                test.todo("none");
            });

            describe("pagination", () => {
                test.todo("limit");
                test.todo("page");
            });

            describe("filter", () => {
                return;
            });

            describe("search", () => {
                return;
            });

            describe("sort", () => {
                return;
            });
        });
    });
});
