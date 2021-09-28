Feature: Login

@auth
@login
Scenario: Succesful Login
    Given the user has valid credentials
    When the user logs in
    Then a cookie should be returned

@auth
@login
Scenario: Invalid Username
    Given the user has an invalid email
    When the user logs in
    Then it should be unsuccessful

@auth
@login
Scenario: Invalid Password
    Given the user has an invalid password
    When the user logs in
    Then it should be unsuccessful

@auth
@login
Scenario: No password set
Given a new user has not accepted their invite
When the user logs in
Then they should not be logged in

@auth
@login
Scenario: Not a member of a business
Given a user is registered and is not a member of the business
When the user logs in
Then they should not be logged in
