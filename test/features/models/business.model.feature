Feature: Business Model CRUD

    Scenario: Create New Business
        Given the business "Oakville Windows and Doors"
        When the business details are entered
        Then a new business should be registered