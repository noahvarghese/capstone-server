import { PermissionKeys } from "@models/permission";
import Routes from "./routes.json";

test("Routes have valid permissions", () => {
    Routes.forEach((r) =>
        r.permissions.forEach((p) =>
            expect(PermissionKeys.find((k) => k === p)).not.toBe(undefined)
        )
    );
});
