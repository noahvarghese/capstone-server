@cleanup_user_role
Feature: Signup Business

Scenario: New business signup should direct user to dashboard
    Given the user has valid inputs
    When a new user registers a new business
    Then the user should be authenticated

