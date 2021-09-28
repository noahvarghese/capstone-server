Feature: Reset Password

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
Scenario: Reset Password Valid Token Resets Token and Expiry
    Given  the user has requested to reset their password
    When they go to reset their password
    Then the password is reset
    And the token is cleared
    And the token expiry is cleared

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
