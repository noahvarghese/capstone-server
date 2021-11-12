import AppServer from "@test/server/helpers";
import BaseWorld from "@test/support/base_world";
import { getRedirectInfo } from "@test/util/request";
import { client, server } from "@util/permalink";

test("navigating to root unknown route redirects to client", async () => {
    // before
    await AppServer.setup(false);
    const baseWorld = new BaseWorld();

    // When I navigate to the root of the backend
    const response = await getRedirectInfo(server());

    baseWorld.setCustomProp<number>("status", response.status);
    baseWorld.setCustomProp<string>("location", response.location);

    // Then I should be redirected to the frontend
    const status = baseWorld.getCustomProp<number>("status");
    const location = baseWorld.getCustomProp<string>("location");
    expect(location).toContain(client());
    expect(status).toEqual(302);

    await AppServer.teardown();
});
