Feature: Signup Business

@signup_business
@db
Scenario: New business signup should direct user to dashboard
Given the user has valid inputs
When a new user registers a new business
Then a cookie should be returned

