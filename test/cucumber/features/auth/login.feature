@setup_login
@cleanup_user_role
Feature: Login

Scenario: Succesful Login
    Given the user has valid credentials
    When the user logs in
    Then the user should be authenticated 

Scenario: Invalid Username
    Given the user has an invalid email
    When the user logs in
    Then the user should not be authenticated 

Scenario: Invalid Password
    Given the user has an invalid password
    When the user logs in
    Then the user should not be authenticated 

@setup_invite_user
Scenario: No password set
    Given a new user has not accepted their invite
    When the user logs in
    Then the user should not be authenticated 

Scenario: Not a member of a business
    Given a user is registered and is not a member of the business
    When the user logs in
    Then the user should not be authenticated 
