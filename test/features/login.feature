Feature: Login

Scenario: Succesful Login
    Given the user has valid credentials
    When the user logs in
    Then a cookie should be returned

Scenario: Invalid Username
    Given the user has an invalid email
    When the user logs in
    Then it should be unsuccessful

Scenario: Invalid Password
    Given the user has an invalid password
    When the user logs in
    Then it should be unsuccessful