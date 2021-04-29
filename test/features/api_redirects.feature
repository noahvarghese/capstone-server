Feature: Routes handled accordingly

    Scenario: Root request redirects to frontend
        Given the user has navigated to the root of the backend
        Then they should be redirected to the frontend
