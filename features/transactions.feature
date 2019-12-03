Feature: Transactions list
	As a customer
	In order to review my transactions
	I want to view them in a list

	Background:
		Given I am logged in as Alex
			And I have loaded Sludge
			And I have selected barrel 1
			And I have opened the Transactions tab

	Scenario: view transactions
		Then I should see 8 transactions

	Scenario: filter by account
		When I enter "Cheque" in the accountFilter field and press enter
		Then I should see 3 transactions

	Scenario: search
		When I enter "wellington" in the searchFilter field and press enter
		Then I should see 3 transactions

	Scenario: filter by bucket
		When I enter "food" in the bucketFilter field and press enter
		Then I should see 3 transactions

	Scenario: filter uncategorised
		When I enter "<None>" in the bucketFilter field and press enter
		Then I should see 4 transactions

	Scenario: categorise
		When I enter "petrol" in the txnBucket field and press enter
			And I enter "petrol" in the bucketFilter field and press enter
		Then I should see 1 transaction
			And the txnBucket field should contain "petrol"

	Scenario: auto-create rule defaults
		When I enter "Cheque" in the accountFilter field
			And I enter "wellington" in the searchFilter field
			And I enter "food" in the bucketFilter field
			And I click the magic glyph
		Then a modal should open
			And the account field should contain "Cheque"
			And the search field should contain "wellington"
			And the bucket field should contain "food"

	Scenario: auto-create rule and save
		When I enter "buy eat" in the searchFilter field
			And I click the magic glyph
			And I enter "food" in the bucket field
			And I click the "Save" button
		Then a modal should close
			And I should see 1 transaction
			And the txnBucket field should contain "food"
