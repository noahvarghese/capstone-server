Feature: Auth

# Login

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

# Reset Password

Scenario: Request Reset Password Token Created
    When the user requests to reset their password
    Then a token should be created

Scenario: Request Reset Password Token Sent
    When the user requests to reset their password
    Then they are sent a token

Scenario: Reset Password Valid Token
    Given the user has requested to reset their password
    When they go to reset their password
    Then the password is reset

Scenario: Reset Password Invalid Token
    Given the user has requested to reset their password
    When they go to reset their password
    Then the password is not reset

# Signup
Scenario: User Created
    Given an administator is performing this action
    When they go to register a new user
    Then a new user should exist

Scenario: User Received Registration Email
    Given an administator is performing this action
    When they go to register a new user
    Then the new user should have been sent a registration confirmation 

Scenario: User Created Token Generated
    Given an administator is performing this action
    When they go to register a new user
    Then a token should be created    

Scenario: Unauthorized User Creates User
    Given a non administrator is performing this action
    When they go to register a new user
    Then the users should remain the same