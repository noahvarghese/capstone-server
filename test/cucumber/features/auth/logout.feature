@setup_logout
@cleanup_user_role
Feature: Logout

Scenario: Logout authenticated user
    When I log out
    Then the cookie is destroyed

