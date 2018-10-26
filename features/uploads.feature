Feature: Statement uploads
	As a customer
	In order to manage my finances
	I want to upload statements

	Background:
		Given I am logged in as Morgan
			And I have loaded Sludge
			And I have opened the Transactions tab

	Scenario: Upload BNZ transactional statement
		When I upload statement "Personal-17SEP2018-to-19SEP2018.csv"
		Then I should see 3 transactions

	Scenario: Upload identical statement
		When I upload statement "Personal-17SEP2018-to-19SEP2018.csv"
			And I wait 500ms
		Then I should see 3 transactions

	Scenario: Upload overlapping statement
		When I upload statement "Personal-18SEP2018-to-20SEP2018.csv"
		Then I should see 6 transactions
			And I should see 2 transactions dated "20/9/2018"
			And I should see 1 transaction dated "19/9/2018"
			And I should see 1 transaction dated "18/9/2018"
			And I should see 2 transactions dated "17/9/2018"

	Scenario: Upload BNZ credit card statement
		When I upload statement "Credit-14SEP2018-to-21SEP2018.csv"
		Then I should see 12 transactions
