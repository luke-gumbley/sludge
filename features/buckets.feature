Feature: Bucket list
	As a customer
	In order to review my buckets
	I want to view them in a list

	Scenario: view buckets
		Given I am logged in as "Alex"
			And I have loaded Sludge
		When I open the "Buckets" tab
		Then I should see more than 1 bucket
