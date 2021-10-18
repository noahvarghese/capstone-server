@setup_invite_user
@cleanup_user_role
Feature: Send Invite To Join Business

Scenario: New user invited to business
Given I am logged in as an admin
When a new user is added to the business
Then the user should get an invite

Scenario: Existing user invited to business
Given I am logged in as an admin
When an existing user is added to the business
Then the user should get an invite