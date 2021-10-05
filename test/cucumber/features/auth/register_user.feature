@setup_login
@cleanup_user_role
Feature: Signup User

Scenario: New user invited to business
Given the user is logged in as an admin
When a new user is added to the business
Then the user should get an invite

Scenario: Existing user invited to business
Given the user is logged in as an admin
When an existing user is added to the business
Then the user should get an invite

Scenario: User accepting invite joins business
Given the user has received an invite
When the user accepts the invite
Then the user is a member of the business

Scenario: User setting password redirects to login
Given the user has accepted the invite
When they set their password
Then the user should be redirected to the login page
