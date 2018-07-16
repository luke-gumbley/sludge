Feature: Bucket list
	As a customer
	In order to review my buckets
	I want to view them in a list

	Background:
		Given I am logged in as Alex
			And I have loaded Sludge
			And I have opened the Buckets tab

	Scenario: view buckets
		Then I should see more than 1 bucket

	Scenario: add bucket
		When I click the plus glyph
		Then a blank modal should open
