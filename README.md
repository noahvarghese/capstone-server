![Continuous Deployment](https://github.com/noahvarghese/capstone-server/actions/workflows/cd.yaml/badge.svg)
<br />
![Continuous Integration](https://github.com/noahvarghese/capstone-server/actions/workflows/ci.yaml/badge.svg)
<br />
![Statements](https://img.shields.io/badge/statements-89.73%25-yellow.svg?style=flat)
<br />
![Lines](https://img.shields.io/badge/lines-89.04%25-yellow.svg?style=flat)
<br />
![Functions](https://img.shields.io/badge/functions-90.78%25-brightgreen.svg?style=flat)
<br />
![Branches](https://img.shields.io/badge/branches-72.68%25-red.svg?style=flat)

# OnBoard - Backend

## Development

After cloning the repository it is important to run `npm run init` in order to setup the hooks directory.

## About

This is my capstone project for college.
I have seperated it out into 3 repositories so as to prevent a clutter of files.

[capstone-client, capstone-server, capstone-test]

The client and server are the frontend and backend respectively,
and each may hold some unit tests and integration tests specific to either the frontend or the backend.

Any end to end tests will be located in the tests repo.

## Documentation

See ./api.json using <a href="https://editor.swagger.io">Swagger Editor</a>.
./api_spec.json is for development use and is used to generate ./api.json.
Mockups, ERD, class diagrams are currently in my private DropBox.
They may be moved into their own repo at the end of this to showcase all parts of this project.

## Database

Can change the database being used by the server and the tests.

Can either pass in argv[2] the extension to be added to the database name, this is just a wrapper that sets the DB_ENV environment variable.
Or set the DB_ENV environement variable to pass the extension.

## Automated Testing

-   Pre commit hook runs unit tests.
-   CI job should run any tests that have source files changed specifically (currently just outputs if any tests were affected for all sebsections, but only tests unit tests)

### NPM Test Scripts

Passes preset jest command line arguments that I have arranged into useful snippets

### Bash Test Script

1. Creates temporary database for testing
2. Passes JEST command line args to test runner
3. Tears down database if clean run

## Environment Variables

-   Env variables must be loaded into the Elastic Beanstalk as well as the job runner for CI/CD
-   copy .env_blank to .env and provide your own values

| name                  | type                       | description                                                                                                                      |
| --------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| DB_NAME               | string                     | the name of the SQL database to be connected to                                                                                  |
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
| TEST_EMAIL_1  | string                     | secondary email to use for regular user tests                                                                                    |
| TEST_EMAIL_2  | string                     | secondary email to use for regular user tests                                                                                    |

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
