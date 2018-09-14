Feature: Transactions list
	As a customer
	In order to review my transactions
	I want to view them in a list

	Background:
		Given I am logged in as Alex
			And I have loaded Sludge
			And I have opened the Transactions tab

	Scenario: view transactions
		Then I should see 8 transactions

	Scenario: filter by account
		When I enter "Cheque" in the account field and press enter
		Then I should see 3 transactions