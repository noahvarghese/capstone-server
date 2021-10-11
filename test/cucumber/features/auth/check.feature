@setup_auth_check
@cleanup_user_role
Feature: Check if authenticated 

Scenario: Authenticated User revisiting
    Given I have been authenticated
    When I check if I am authenticated
    Then a confirmation is returned

Scenario: Unauthenticated User revisiting
    Given I have not been authenticated
    When I check if I am authenticated
    Then an error is returned
