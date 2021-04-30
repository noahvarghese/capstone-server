@Model
@Business
Feature: Business Model CRUD

    @Create
    Scenario: Create New Business
        Given the new business "Oakville Windows and Doors"
        When the business details are entered
        Then a new business should be registered

    @Read
    Scenario: Find Business
        Given there is an existing business "Oakville Windows and Doors"
        When there is a search for the business by "name"
        Then the business details should be found

    @Update
    Scenario: Update Business
        Given there is an existing business "Oakville Windows and Doors"
        When the "postal code" field is updated
        Then the business should be updated
    
    @Delete
    Scenario: Delete Business
        Given there is an existing business "Oakville Windows and Doors"
        When the business is deleted
        Then it should not exist

