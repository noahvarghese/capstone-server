@setup_invite_user
@cleanup_user_role
Feature: Remove Member 

Scenario: Global Admin Can Remove Member
    Given I am logged in as an admin
    When I remove a member
    Then a member is removed 

Scenario: User who lacks CRUD user rights cannot remove users
    Given I am logged in as a user
    When I remove a member
    Then I get an error