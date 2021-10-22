@setup_invite_user
@cleanup_user_role
Feature: Create Role 

Scenario: Global Admin Can Create Role
    Given I am logged in as an admin
    When I create a role
    Then a new role exists

Scenario: User who lacks CRUD role rights cannot create roles
    Given I am logged in as a user
    When I create a role
    Then I get an error