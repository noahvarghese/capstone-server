import AppServer from "@test/server/helpers";

const setup = async (): Promise<void> => {
    await AppServer.setup(false);
};

export default setup;