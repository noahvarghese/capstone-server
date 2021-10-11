Feature: Routes handled accordingly

    @redirect
    Scenario: Root request redirects to frontend
        When I navigate to the root of the backend
        Then I should be redirected to the frontend
