@setup_accept_invite
@cleanup_user_role
Feature: User accepts invite

Scenario: User accepting invite joins business
Given the user has received an invite
When the user accepts the invite
Then the user is a member of the business