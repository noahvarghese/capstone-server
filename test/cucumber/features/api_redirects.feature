Feature: Routes handled accordingly

    @redirect
    Scenario: Root request redirects to frontend
        When a user has navigated to the root of the backend
        Then they should be redirected to the frontend
