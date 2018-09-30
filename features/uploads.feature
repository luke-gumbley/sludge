Feature: Statement uploads
	As a customer
	In order to manage my finances
	I want to upload statements

	Background:
		Given I am logged in as Morgan
			And I have loaded Sludge
			And I have opened the Transactions tab

	Scenario: Upload BNZ credit card statement
		When I upload statement "Credit-14SEP2018-to-21SEP2018.csv"
		Then I should see 6 transactions
