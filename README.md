![Continuous Deployment](https://github.com/noahvarghese/capstone-server/actions/workflows/cd.yaml/badge.svg)
# OnBoard - Backend

## About

This is my capstone project for college.
I have seperated it out into 3 repositories so as to prevent a clutter of files.

[capstone-client, capstone-server, capstone-test]

The client and server are the frontend and backend respectively,
and each may hold some unit tests and integration tests specific to either the frontend or the backend.

Any end to end tests will be located in the tests repo.

Documentation - mockups, ERD, class diagrams are currently in my private DropBox.

They may be moved into their own repo at the end of this to showcase all parts of this project.

## Tests

In the test/sample_data directory is the configuration for setup and teardown of each test case
Since we have tests for the models and the api, I have seperated the dependencies so as to provide common actions for setup teardown and running of each test within the context of the test areas.

### Models

Here the model types, test attributes for each type, and any dependencies are stored in individual objects.
All of these share the same keys so we can collect all the metadata for a specific test.

### Api

Here we have a few more bits of information. We have test attributes, dependencies for creation, dependencies for teardown, and urls.
The dependencies to setup for the specific test are done as api calls instead of operating directly on the database as in the models. Also the setup needs to follow how a genuine user would use the site.
The dependencies to teardown are done by modifying the database directly and skipping the api as not all teardown will be implemented in api calls, and it is faster.
The urls are either a string or a function that returns a string if url parameters are required

The template for the tests is necessary data is stored in an attribute "body" saved in the BaseWorld state, then an action 'submitForm' is performed that takes the data stored and submits it to the given url.

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

## API Documentation

<table>
    <thead>
        <th>method</th>
        <th>route</th>
        <th>body</th>
        <th>include credentials</th>
        <th>return status</th>
        <th>return type</th>
        <th>error status(es)</th>
        <th>error type(s)</th>
        <th>description</th>
    </thead>
    <tbody>
        <tr>
            <td>POST</td>
            <td>/auth/login</td>
            <td>
            <pre>{email: string; password: string;}</pre></td>
            <td>false</td>
            <td>200</td>
            <td>void</td>
            <td>400, 401</td>
            <td><pre>{message: string;} | void</pre></td>
            <td>logs user in, sets session variable so that a cookie is returned for use</td>
        </tr>
        <tr>
            <td>POST</td>
            <td>/auth/signup</td>
            <td><pre>
            {
                first_name: string;
                last_name: string;
                email: string;
                phone: string;
                address: string;
                city: string;
                postal_code: string;
                province: string;
                password: string;
                confirm_password: string;
                name: string;
            }</pre></td>
            <td>false</td>
            <td>201</td>
            <td><pre>void</pre></td>
            <td>400, 500</td>
            <td><pre>{message: string; field: string; } | {message: string;}</pre></td>
            <td>registers new user and new business, I should actually decouple this and make 2 network calls from the frontend</td>
        </tr>
        <tr>
            <td>POST</td>
            <td>/auth/logout</td>
            <td><pre></pre></td>
            <td>true</td>
            <td></td>
            <td><pre></pre></td>
            <td></td>
            <td><pre></pre></td>
            <td>Not Implemented</td>
        </tr>
        <tr>
            <td>POST</td>
            <td>/auth/requestResetPassword </td>
            <td><pre>{email: string;}</pre></td>
            <td>false</td>
            <td>200</td>
            <td><pre>void</pre></td>
            <td>401, 500</td>
            <td><pre>{message: string;}</pre></td>
            <td>submit email to receive a link to reset password via email</td>
        </tr>
        <tr>
            <td>POST</td>
            <td>/auth/resetPassword/{token}</td>
            <td><pre>{password: string; confirm_password:string;}</pre></td>
            <td>false</td>
            <td>200</td>
            <td><pre>void</pre></td>
            <td>401, 403, 500</td>
            <td><pre>{message: string;} | void</pre></td>
            <td>this is the link sent via email to reset the password</td>
        </tr>
        <tr>
            <td>POST</td>
            <td>/user/invite</td>
            <td><pre>{first_name: string; last_name: string; email: string; phone: string}</pre></td>
            <td>true</td>
            <td>200</td>
            <td><pre>void</pre></td>
            <td>400,500</td>
            <td><pre>{message: string;}</pre></td>
            <td>This is how a business adds a new user, will add user to database if user does not exist, and send invite to user</td>
        </tr>
        <tr>
            <td>POST</td>
            <td>/user/invite/:token</td>
            <td><pre></pre></td>
            <td>false</td>
            <td>200</td>
            <td><pre>void</pre></td>
            <td>400,500</td>
            <td><pre>{message: string;}</pre></td>
            <td>Not implmented</td>
        </tr>
        <tr>
            <td></td>
            <td></td>
            <td><pre></pre></td>
            <td></td>
            <td></td>
            <td><pre></pre></td>
            <td></td>
            <td><pre></pre></td>
            <td></td>
        </tr>
    </tbody>

</table>

## CI/CD

Utilizing GitHub actions for CI currently, can be found in ./github/workflows

## Testing

Test specific utilites are located in the ./test/util directory

Test data is located in the ./test/sample_data directory

A 'bag' is used to hold any data that needs to be passed between test steps, the implementation is located in the ./test/\*\*/support directory

### Unit tests

All unit tests are located in the same directories as the file(s) being tested using the same name but adding a .test between the file name and extension eg if file.ts is being tested the test name is file.test.ts

Any extra files pertaining solely to the unit tests are located under the test/jest directory

### Integration tests

Integration tests are located in the ./test/cucumber/features directory
Requires knowledge of cucumber and BDD
All database setup / cleanup is handled within the ./test/cucumber/hooks directory
Any extra files pertaining solely to this are located under the test/cucumber directory
