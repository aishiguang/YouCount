Feature: gameplay

Scenario: start new round
Given user is ready
And previous best score is N
When user hits Enter key
Then a new round starts with a countdown
And random count of glyphs is shown on the screen

Scenario: random number per round
Given user starts a new round
When previous best score is N
Then the number of glyphs to count is a random number between N +- N / 3

Scenario: play a round
Given a number of glyphs are displayed on the screen
When user counts and inputs the number
Then if the input is correct, log score and a new round starts
And if the input is incorrect, the game ends and final score is displayed

Scenario: multi-digit input
Given a number of glyphs greater than 9 are displayed on the screen
When user inputs the count digit by digit
Then if the input digit is correct so far, show the input progress
And if the input digit is incorrect, the game ends and final score is displayed

Scenario: bulletin board
Given the game is running
When 10 seconds pass
Then the bulletin board switches to the next section
