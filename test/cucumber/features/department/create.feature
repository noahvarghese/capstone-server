Feature: Create Department

Scenario: Global Admin Can Create Department
    Given I am logged in as an Admin
    When I create a department
    Then a new department exists

Scenario: User who lacks CRUD department rights cannot create departments
    Given I am logged in as a regular user
    When I create a department
    Then I receive an error
    And a new department does not exist