@setup_invite_user
@cleanup_user_role
Feature: Delete Department

Scenario: Global Admin Can Delete Department
    Given I am logged in as an admin
    When I dlete a department
    Then a department is deleted

Scenario: User who lacks CRUD department rights cannot delete departments
    Given I am logged in as a user
    When I delete a department
    Then I get an error