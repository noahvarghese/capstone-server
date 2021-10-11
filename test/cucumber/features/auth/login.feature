@setup_login
@cleanup_user_role
Feature: Login

Scenario: Succesful Login
    Given I have valid credentials
    When I log in
    Then I should be authenticated 

Scenario: Invalid Username
    Given I have an invalid email
    When I log in
    Then I should not be authenticated 

Scenario: Invalid Password
    Given I have an invalid password
    When I log in
    Then I should not be authenticated 

Scenario: Not accepted invite 
    Given I have been sent an invite 
    When I log in
    Then I should not be authenticated 

