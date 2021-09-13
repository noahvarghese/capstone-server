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

## Areas of Focus

-   Node / Express
-   TypeScript
-   CI/CD
-   AWS (Elastic Beanstalk, CodeDeploy, CodeBuild, CodePipeline, EC2, ACM)
-   Automated Testing

## Environment Variables

-   Env variables must be loaded into the Elastic Beanstalk as well as the job runner for CI/CD
- copy .env_blank to .env

| name | 

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
