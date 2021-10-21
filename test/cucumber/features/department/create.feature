@setup_invite_user
@cleanup_user_role
Feature: Create Department

Scenario: Global Admin Can Create Department
    Given I am logged in as an admin
    When I create a department
    Then a new department exists

Scenario: User who lacks CRUD department rights cannot create departments
    Given I am logged in as a user
    When I create a department
    Then I get an error