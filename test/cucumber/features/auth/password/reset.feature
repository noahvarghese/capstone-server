@setup_reset_password
@cleanup_user_role
Feature: Reset Password

Scenario: Reset Password Valid
    Given I have requested to reset the password
    When I reset the password
    Then the password is reset
    And the token is cleared
    And the token expiry is cleared

Scenario: Reset Password Invalid Token
    Given I have requested to reset the password
    And I have an invalid token
    When I reset the password
    Then the password is not reset

Scenario: Reset Password Passwords do not match
    Given I have requested to reset the password
    And the passwords do not match
    When I reset the password
    Then the password is not reset
