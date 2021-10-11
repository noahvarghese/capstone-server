@setup_register_business
@cleanup_user_role
Feature: Signup Business

Scenario: New business signup should direct user to dashboard
    Given I have valid inputs
    When I register a new business
    Then I should be authenticated

