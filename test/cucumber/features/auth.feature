Feature: Auth

# Login

@auth
Scenario: Succesful Login
    Given the user has valid credentials
    When the user logs in
    Then a cookie should be returned

@auth
Scenario: Invalid Username
    Given the user has an invalid email
    When the user logs in
    Then it should be unsuccessful

@auth
Scenario: Invalid Password
    Given the user has an invalid password
    When the user logs in
    Then it should be unsuccessful

# Reset Password

@reset_password
@auth
Scenario: Request Reset Password Token Created
    Given the user is registered
    When the user requests to reset their password
    Then a token should be created

@reset_password
@auth
Scenario: Request Reset Password Token Sent
    Given the user is registered
    When the user requests to reset their password
    Then they are sent a token

@reset_password
@auth
Scenario: Reset Password Valid Token
    Given the user has requested to reset their password
    When they go to reset their password
    Then the password is reset

@reset_password
@auth
Scenario: Reset Password Invalid Token
    Given the user has requested to reset their password
    And they have an invalid token
    When they go to reset their password
    Then the password is not reset

@reset_password
@auth
Scenario: Reset Password Passwords do not match
    Given the user has requested to reset their password
    And the passwords do not match
    When they go to reset their password
    Then the password is not reset

# Signup
@signup 
@signup_event_cleanup
Scenario: Succesful signup sends cookie
    Given the user has valid inputs
    When a new user is registered for an existing business
    Then a cookie should be returned


@signup
@signup_event_cleanup
Scenario: User Created for existing business
    Given the user has valid inputs
    When a new user is registered for an existing business
    Then the 'user' should get a welcome email

@db
Scenario: New business sign up
    Given the user has valid inputs
    When a new user registers a new business
    Then the 'user' should get a welcome email
    And the 'business' should get a welcome email

@signup
@signup_event_cleanup
Scenario: Business gets notified on user register
    Given the user has valid inputs
    When a new user is registered for an existing business
    Then the business should be notified by email
