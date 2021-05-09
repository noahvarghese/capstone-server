Feature: Login

Scenario: Succesful Admin Login
    When a user logs in
    Then a cookie should be returned