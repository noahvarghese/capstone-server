@setup_invite_user
@cleanup_user_role
Feature: Delete Role

Scenario: Global Admin Can Delete Role
    Given I am logged in as an admin
    When I dlete a role
    Then a role is deleted

Scenario: User who lacks CRUD role rights cannot delete roles
    Given I am logged in as a user
    When I delete a role
    Then I get an error