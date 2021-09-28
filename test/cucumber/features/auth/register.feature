@signup
@signup_event_cleanup
Scenario: New user added to business should receive an invite
    Given the user is logged in as an admin
    When a new user is added to the business
    Then the user should get an invite

@signup
@signup_event_cleanup
Scenario: User accepting the invite should result in them joining the business
Given the user has received an invite
When they accept the invite
Then they are a member of the business

@signup
@signup_event_cleanup
Scenario: User setting password should direct user to dashboard
Given the user has accepted the invite
When they set their password
Then they should be redirected to the dashboard

@signup
@signup_event_cleanup
Scenario: Existing user added to business
Given the user is logged in as an admin
When an existing user is added to the business
Then the user should get an invite

@db
Scenario: New business sign up should direct user to dashboard
    Given the user has valid inputs
    When a new user registers a new business
    Then a cookie should be returned

