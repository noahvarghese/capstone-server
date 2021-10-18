@setup_forgot_password
@cleanup_user_role
Feature: Forgot Password

Scenario: Forgot Password Token Created
    Given I am registered
    When I request to reset the password
    Then a token should be created
    And I am sent a token
