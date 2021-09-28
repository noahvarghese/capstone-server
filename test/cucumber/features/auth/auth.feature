Feature: Auth

@auth
@revisit
Scenario: Authenticated User revisiting
    Given the user has been authenticated
    When the user checks if they are authenticated
    Then a confirmation is returned

@auth
@revisit
Scenario: Authenticated User revisiting
    Given the user has not been authenticated
    When the user checks if they are authenticated
    Then an error is returned

# Logout
@auth
@logout
Scenario: Logout authenticated user
    Given the user has been authenticated
    When the user logs out
    Then the cookie is destroyed