import SettingsKeys from "../keys/settings";

type NavProps = undefined;
export type SettingsTypes = Record<SettingsKeys, () => NavProps>;

const getNav = (): NavProps => undefined;

const attributes: SettingsTypes = {
    getNav,
};

export default attributes;
