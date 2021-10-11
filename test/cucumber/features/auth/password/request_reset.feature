@setup_request_reset_password
@cleanup_user_role
Feature: Request Reset Password

Scenario: Request Reset Password Token Created
    Given I am registered
    When I request to reset the password
    Then a token should be created
    And I am sent a token
