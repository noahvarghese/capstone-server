![Continuous Deployment](https://github.com/noahvarghese/capstone-server/actions/workflows/cd.yaml/badge.svg)
<br />
![Continuous Integration](https://github.com/noahvarghese/capstone-server/actions/workflows/ci.yaml/badge.svg)
<br />
![Statements](https://img.shields.io/badge/statements-77.76%25-red.svg?style=flat)
<br />
![Lines](https://img.shields.io/badge/lines-76.04%25-red.svg?style=flat)
<br />
![Functions](https://img.shields.io/badge/functions-94.73%25-brightgreen.svg?style=flat)
<br />
![Branches](https://img.shields.io/badge/branches-51.82%25-red.svg?style=flat)

# OnBoard - Backend

## Development

After cloning the repository it is important to run `npm run init` in order to setup the hooks directory.

## Notes - For Me

For breaking down the routes
Routes are the structure of the resources.
Controllers have a function signature to fit in as the route callback, it should take all arguments out of the request to pass directly to the handler, may have multiple handlers to complete the request.
Handlers accept strictly the arguments to get the job done and may throw an error or return the value expected

-   server
    -   middleware: need a route config file to map which middleware should be called when
    -   routes: call controllers
    -   controllers: call handlers
    -   handlers: use database/typeorm to interface with the models
    -   models: provides ways to modify/adjust certain fields

## About

This is my capstone project for college.
I have seperated it out into 3 repositories so as to prevent a clutter of files.

[capstone-client, capstone-server, capstone-test]

The client and server are the frontend and backend respectively,
and each may hold some unit tests and integration tests specific to either the frontend or the backend.

Any end to end tests will be located in the tests repo.

## Documentation

See ./api_spec.json using <a href="https://editor.swagger.io">Swagger Editor</a>.
Mockups, ERD, class diagrams are currently in my private DropBox.
They may be moved into their own repo at the end of this to showcase all parts of this project.

## Database

Can change the database being used by the server and the tests.

Can either pass in argv[2] the extension to be added to the database name, this is just a wrapper that sets the DB_ENV environment variable.
Or set the DB_ENV environement variable to pass the extension.

## Tests

Tests are broken up into

-   database
-   unit
-   integration
-   e2e

Each of these can be targeted as their own test suite.

Uses different jest configurations and a test script to run each set of tests against their own database.

### Automated Testing

-   Pre commit hook runs unit tests.
-   CI job should run any tests that have source files changed specifically (currently just outputs if any tests were affected for all sebsections, but only tests unit tests)

### NPM Test Scripts

Passes preset jest command line arguments that I have arranged into useful snippets

### Bash Test Script

1. Creates temporary database for testing
2. Passes JEST command line args to test runner
3. Tears down database if clean run

### Jest Testing

Seperate configuration files for the breakdowns of the test types.
Also contains seperate setup and teardown instructions.

## Environment Variables

-   Env variables must be loaded into the Elastic Beanstalk as well as the job runner for CI/CD
-   copy .env_blank to .env and provide your own values

| name                  | type                       | description                                                                                                                      |
| --------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| DB                    | string                     | the name of the SQL database to be connected to                                                                                  |
| DB_PORT               | number                     | the port to connect on                                                                                                           |
| DB_PWD                | string                     | the password to connect to the SQL database                                                                                      |
| DB_TYPE               | "mysql" \| "postgres"      | the type of SQL database to be connected to                                                                                      |
| DB_URL                | string                     | the FQDN or IP address of the SQL database                                                                                       |
| DB_USER               | string                     | the user to connect as                                                                                                           |
| ENABLE_MULTITHREADING | boolean                    | whether to run on multiple cores                                                                                                 |
| ENV_LOCAL_CLIENT      | string                     | the url or ip address of the frontend in local development eg. protocol://path:port                                              |
| ENV_DEV_CLIENT        | string                     | the url or ip address of the frontend in qa eg. protocol://path:port                                                             |
| ENV_PROD_CLIENT       | string                     | the url or ip address of the frontend in production eg. protocol://path:port                                                     |
| ENV_LOCAL_SERVER      | string                     | the url or ip address of the backend in local development eg. protocol://path:port                                               |
| ENV_DEV_SERVER        | string                     | the url or ip address of the backend in qa eg. protocol://path:port                                                              |
| ENV_PROD_SERVER       | string                     | the url or ip address of the backend in production eg. protocol://path:port                                                      |
| TARGET_ENV            | "LOCAL" \| "DEV" \| "PROD" | which environment is being targeted                                                                                              |
| MAIL_USER             | string                     | the email address of the gmail account to be used to send emails                                                                 |
| MAIL_PWD              | string                     | the password or key for the gmail account (see <a href="https://www.npmjs.com/package/nodemailer">nodemailers</a> documentation) |
| SESSION_ID            | string                     | id to use for session cookie                                                                                                     |
| SESSION_SECRET        | string                     | secret to (encrypt or sign?) the cookie with                                                                                     |
| LOG_LEVEL             | number                     | view ./src/util/logs/logs.ts for log levels, this is what level of messages to output                                            |
| SECONDARY_TEST_EMAIL  | string                     | secondary email to use for regular user tests                                                                                    |

## Development

### Models

My models are all initially developed in an sql script and have triggers applied, the tests run are to ensure the triggers execute correctly, and relationships are as expected.

#### Creating a testable model

How to create a new model for the application for use with my model testing framework found in \_\_test\_\_/model.

This allows usage of the ModelTest/ModelActions/ModelTestFail/ModelTestRelations utilities.

1. Create typeorm model
2. Create interface for model attributes
3. Create factory to generate default attributes
4. Add function that creates testable versions of the attributes that returns the interface created in step 2.
5. Add name to union type in \_\_test\_\_/model/index.ts
6. Add entry to \_\_test\_\_/model/dependencies.ts using the same name used in the previous step as the key, and the value is an array of dependencies from the same type ordered by dependant -> independant
7. Add entry to \_\_test\_\_/model/types.ts using the same name from previous for the key, and the value should be the type of the model created in step 1

#### Creating a test

All database tests are run using jest and the ./jest.config.database.ts file, see package.json #/scripts/database:test.

Create a [name].db.test.ts file, see files in \_\_test\_\_/models for utilities available.

### Adding new api tests

1. Create file in \_\_test\_\_/api/actions
2. Create file in \_\_test\_\_/api/attributes
3. Add entry to \_\_test\_\_/api/dependencies/setup.ts
4. Create file in \_\_test\_\_/api/keys
5. Add entry to \_\_test\_\_/api/urls.ts

### Flow

-   Pre commit hook is triggered to run any changed tests
-   Once pushed to GitHub, CI job runs same tests
-   Once branch is complete and pull request created, CI jobs run again with anything that has changed compared to the base branch

#### Notes

-   Test script generates a new database name each run using the branch name and timestamp, this allows concurrent tests to run on different machines
-   Since we are testing the whole server instead of just the routes, small changes result in lots of tests (may need to rewrite the \_\_test\_\_/server logic)

### Description

'api' contains API specific helpers
'model' contains model/database/sql specific helpers
'server' contains helpers to start/stop the server and configure which database it connects to for testing
'support' Contains helpful files that are used with each test run.
'util' Has test specific utilities

### Sample Data

Is contained within each helper folder

### Models

Here the model types, test attributes for each type, and any dependencies are stored in individual objects.
All of these share the same keys so we can collect all the metadata for a specific test.

### Api

Here we have a few more bits of information. We have test attributes, dependencies for creation, dependencies for teardown, and urls.
The dependencies to setup for the specific test are done as api calls instead of operating directly on the database as in the models. Also the setup needs to follow how a genuine user would use the site.
The dependencies to teardown are done by modifying the database directly and skipping the api as not all teardown will be implemented in api calls, and it is faster.
The urls are either a string or a function that returns a string if url parameters are required

The template for the tests is necessary data is stored in an attribute "body" saved in the BaseWorld state, then an action 'submitForm' is performed that takes the data stored and submits it to the given url.

### About

Now using jest for all tests as it allows filtering of recently changed tests via the <a href="https://jestjs.io/docs/cli#--onlychanged">-o</a> and <a href="https://jestjs.io/docs/cli#--changedsince">--changedSince</a> options.

### Process

-   Run tests during development prior to commit.
-   Generate badges prior to commit.
-   Commit changes.
-   Pre-commit hook runs only changed files.
-   On success
    -   Workflow runs any tests changed between the current and previous commit

#### Stages

1. Setup (Perform any user actions needed before the test can execute)
2. Run:
    - Background (Any given steps that are common to all tests in a feature)
    - Given (May either: alter a model or two, perform an api call, or save data to the global store)
    - When (Perform an action, in this case an api call, may save results to check in then step)
    - Then (Compares results saved to expected)
3. Teardown (Database cleanup)

## Areas of Focus

-   Node / Express
-   TypeScript
-   CI/CD
-   AWS (Elastic Beanstalk, CodeDeploy, CodeBuild, CodePipeline, EC2, ACM)
-   Automated Testing

## Notes to self

-   use sanitize-markdown before storing handbooks/quizes in database
-   this way we can just use react-markdown to display in document
-   using markdown means the content will just be rendered directly

since it is possible that a user may have multiple roles

-   make sure to check for the most authorized permission if applicable
-   make sure to check what parent the resource being requested belongs to, and then retrieve the corresponding most authorized permission applicable

re removing users from roles / departments

-   must have at least 1 user in the role/department Admin/Admin

## User management

### Registration

Only businesses can register, registers the admin user at the same time
business register parameters: name, address
admin user register parameters: name, email, [phone]

Checks that the user ahs not been created as each business has their own email and the primary user should be registering the business email as their own

### Adding employees

Add name email [phone]
Email is sent to user asking to "Accept Invitation"

If user has registered previously they are asked to login if the browser doesn't have a cookie, then areadded as a member of the business and sent to the dashboard
Else they are sent to set a password and on success redirected to the dashboard

### Login

When a user logs in check if a member of any business
if not an error is shown asking to reach out tho their manager
if yes they are redirected to the dashboard
the dashboard will let them choose which business they want to view

## Business Rules

Triggers are added to the database to enforce business rules that do not affect development (ie if items should only be updated by users of a specific business, the triggers will enforce that, but if the item should not be deleted but deactivated instead of deleted then there is no trigger as development tests run cleanup after)

### Items enforced

-   Checks that the user accessing a resource is a part of the business that the resource is under
-   Checks that the user has appropriate permissions to modify/view resources (see permissions table)
-   Checks if resources are locked before processinga change
-   Checks that mandatory fields are filled in

## CI/CD

Utilizing GitHub actions for CI currently, can be found in ./github/workflows
