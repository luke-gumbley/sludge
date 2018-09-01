Feature: Bucket list
	As a customer
	In order to review my buckets
	I want to view them in a list

	Background:
		Given I am logged in as Alex
			And I have loaded Sludge
			And I have opened the Buckets tab

	Scenario: view buckets
		Then I should see 5 buckets

	Scenario: delete bucket
		When I click the second trash glyph
		Then I should see 4 buckets

	Scenario: edit bucket
		When I click the pencil-alt glyph
		Then a modal should open
			And the name field should contain "mortgage"
			And the amount field should contain "1234.56"
			And the period field should contain "1"
			And the budget field should contain "Slush"

	Scenario: edit bucket and save
		When I click the pencil-alt glyph
			And I enter "deathgrip" in the name field
			And I click the "Save" button
		Then a modal should close
			And I should see a bucket called "deathgrip"

	Scenario: edit bucket and cancel
		When I click the pencil-alt glyph
			And I click the "Cancel" button
		Then a modal should close

	Scenario: create bucket defaults
		When I click the plus glyph
		Then a modal should open
			And the name field should contain ""
			And the amount field should contain "0.00"
			And the period field should contain "0"
			And the budget field should contain "Slush"

	Scenario: create bucket and save
		When I click the plus glyph
			And I enter "bucky" in the name field
			And I click the "Save" button
		Then a modal should close
			And I should see a bucket called "bucky"

	Scenario: create bucket and cancel
		When I click the plus glyph
			And I click the "Cancel" button
		Then a modal should close
			And I should see 5 buckets
