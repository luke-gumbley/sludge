Feature: Rules list
	As a customer
	In order to review my rules
	I want to view them in a list

	Background:
		Given I am logged in as Alex
			And I have loaded Sludge
			And I have selected barrel "Radford Flat"
			And I have opened the Rules tab

	Scenario: view rules
		Then I should see 3 rules

	Scenario: create rule defaults
		When I click the plus glyph
		Then a modal should open
			And the search field should contain ""
			And the account field should contain ""
			And the bucket field should contain ""

	Scenario: create rule and cancel
		When I click the plus glyph
			And I click the "Cancel" button
		Then a modal should close
			And I should see 3 rules

	Scenario: create rule and save
		When I click the plus glyph
			And I enter "ruley" in the search field
			And I enter "food" in the bucket field
			And I click the "Save" button
		Then a modal should close
			And I should see 4 rules
			And I should see a rule searching "ruley"

	Scenario: edit rule
		When I click the pencil-alt glyph
		Then a modal should open
			And the search field should contain "Pipes Christchurch"
			And the account field should contain ""
			And the bucket field should contain "internet"

	Scenario: edit rule and cancel
		When I click the pencil-alt glyph
			And I click the "Cancel" button
		Then a modal should close

	Scenario: edit rule and save
		When I click the last pencil-alt glyph
			And I enter "searchy" in the search field
			And I click the "Save" button
		Then a modal should close
			And I should see 4 rules
			And I should see a rule searching "searchy"

	Scenario: delete rule
		When I click the last trash glyph
		Then I should see 3 rules
