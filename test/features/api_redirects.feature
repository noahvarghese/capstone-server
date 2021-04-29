Feature: Routes handled accordingly

    Scenario: Root request redirects to frontend
        Given the user has chosen an environment
        When the user navigates to the backend
        Then they should be redirected to the frontend
