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

Scenario: Request Reset Password
    Given the user has forgotton their password
    When they request to reset their password
    Then they are sent a token

Scenario: Reset Password Valid Token
    Given the user has requested to reset their password
    When they go to reset their password
    Then it is reset