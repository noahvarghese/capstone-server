import ModelTest from "@test/model";
import modelDependencies from "@test/model/dependencies";

/**
 * Each array is ordered by what needs to be implemented first to last
 * The final one to implement is the key used to index this object
 */
const dependencies: { [i in ModelTest]: ModelTest[] } = {
    ...modelDependencies,
    userRole: [
        "business",
        "user",
        "membership",
        "membershipRequest",
        "department",
        "permission",
        "role",
        "event",
    ],
};

export default dependencies;
