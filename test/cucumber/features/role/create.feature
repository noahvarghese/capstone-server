Feature: Create Role 

Scenario: Global Admin Can Create Role
    Given I am logged in as an Admin
    When I create a role
    Then a new role exists

Scenario: User who lacks CRUD role rights cannot create roles
    Given I am logged in as a regular user
    When I create a role
    Then I receive an error
    And a new role does not exist