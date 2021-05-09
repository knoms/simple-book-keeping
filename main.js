const prompts = require('prompts'); //dependency for simple input prompts
const fs = require('fs');   //dependency for reading and writing the file
const clear = require('clear'); //dependency for clear() function to clear the console 

const store = 'book.json'; //sets name of the file that stores the account properties
let account; //variable that is gonna be filled with user data read from file, including the transactions
let balance = 0;    //balance variable that will hold the current balance calculated in calculateBalance() and will refered to in various functions, intialized with 0 just to make sure there is always an initial value to prevent unforeseen errors
let nextId = 0; //make sure nextId always has a value even if no transactions can be read from file 

//reads the book file to get the account data including transactions, then sorts the transactions, recalculates the balance and reads the highest transaction id to determine the id for the next transaction
function fetchData(){
    account = JSON.parse(fs.readFileSync(store, 'utf8'));  //reads the json file and parses it into an object
    if(account.transactions.length >0){ // checks for existing transactions to not break the system when there's no transactions to be read
        nextId = account.transactions.reduce(    //applies the reduce function to the transactions array to calculate the max id
            (max, transaction) => (transaction.id > max ? transaction.id : max), account.transactions[0].id   //checks the id of every transaction id the array if its bigger than the current max id and replaces the max id if true
      ) + 1;    //increments max id by 1 to determine id of next transaction to be written to the file
    }
    sortTransactionsByNewest();     //sort transaction in descending order by transaction date
    calculateBalance(); //(re)calculate balance to be able to always show the correct balance when showing transactions
}

//Sorts transactions descending by date so that they are displayed in chronological order
function sortTransactionsByNewest(){ 
    account.transactions.sort(function(a,b){ //sorts transactions based on the next line
        return new Date(b.date) - new Date(a.date); //compares dates a and b for size
    });
}

// Calculates the current account balance based on the transaction history
function calculateBalance(){
    balance = 0;    //Initializes global balance variable with 0 before calculating it to prevent counting repeatedly adding
    account.transactions.forEach(element => {        //iterates over transactions in file, executing the following function on every element
        if(new Date(element.date) <= Date.now() && isNumber(element.amount)){   //makes sure that only past transactions are counted into the balance and that no corrupted amount is attempted to be added
            balance += element.amount; //adds transaction amount to global balance variable
        }
    });
}

//begins the process to record a new transaction. It asks the user for description, date and amount of the transaction to be added, then executes writeTransaction() to write the entered transaction to the book file
function recordTransaction(){
    const transactionQuestions = [{ //defining the questions to inquire the user 
        type: 'text',   //defining answer type as String
        name: 'description',   //the name this user input will later be refered to (see below)
        message: 'Enter a description for the transaction: ',    //prompt shown to the user
        validate: description => description == '' || description == null ? "Can't be empty" : true //validating the user input before continuing: empty input will be prohibited
    },
    {
        type: 'date',   //defining answer type as date
        name: 'date',   //the name this user input will later be refered to (see below)
        message: 'Enter a date for the transaction (DD-MM-YYYY): ', //prompt shown to the user
        mask: 'DD-MM-YYYY', //defining the date format
        validate: date => date == ''|| date == null ? "Can't be empty" : true   //validating the user input before continuing: empty input will be prohibited
    },
    {
        type: 'number', //defining answer type as number, can be positive or negative
        name: 'amount', //defining the name of this question to be able to refer to its answer later on
        message: 'Enter the amount of the transaction: ',   //prompt shown to the user
        validate: amount => amount == ''|| amount == null ? "Can't be empty or zero" : true //validating the user input before continuing: empty input or 0 will be prohibited
    }];

    //Function that writes the transaction passed as a parameter to the book file.
    function writeTransaction(transactionEntered){ 
        var newTransaction = {  //initializing empty newTransaction object
            id: nextId,     //assigning the incremented unique id to be able to identify every transaction (not needed in current implementation)
            date: '',   //empty date
            description: '',    //empty description
            amount: '', //empty amount
        }
        newTransaction.description = transactionEntered.description;    //setting description of newTransaction object
        newTransaction.date = transactionEntered.date;  //setting date of newTransaction object
        newTransaction.amount = transactionEntered.amount;  //setting amount of newTransaction object
        account.transactions.push(newTransaction);   //adds new transaction to the local transactions array
        data = JSON.stringify(account);      //turns account object back into string in order to write it into the file again
        fs.writeFileSync( store, data);    //writes updated transactions into file (name of file provided through global variable store)
        calculateBalance(); //recalculates balance after adding a new transaction to be able to show updated balance after writing transaction to file
        nextId++;   //incrementing nextId to ensure the next transaction gets the correct id when adding another transaction before going to mainMenu and refetching nextId from file
    }
    clear();    //clears the console
    (async () => {

        let questionPointer = 0;
        let newQuestions = transactionQuestions; // intitializes the questions to ask
        let answersSoFar = {};
        
        const onSubmit = async (prompt, answer, answersSoFar) => { //defining optional onSubmit function to pass into propmts() to make sure writeTransaction gets executed after all questions are answered
            if(questionPointer == 2 && answersSoFar.amount !== '' && answersSoFar.amount !== null && answersSoFar.date !== '' && answersSoFar.date !== null){  //checks if onSubmit is executed after the third answer was submitted and if every information needed for writing the transaction has been received
                writeTransaction(answersSoFar); //writes transaction to file
                console.log("Transaction saved to file. Your new balance: " + balance + "€"); //confirms successfull saving to file and prints the new balance 
            }
            questionPointer += 1; //moves on to the next question to ensure writeTransaction is only executed when every question has been answered
        }
        await prompts(newQuestions, {onSubmit});    //prompts the questions defined above, passes the optional onSubmit function declared above

        whatToDoNext('recordTransaction');  //asks what the user wants to do after writing the transaction, passes the current function to offer the corresponding options
    })();
}

//prints a certain number of the last transactions in descending order by date, as well as the current balance. the number of transactions supposed to be shown can get passed as an optional parameter, x = 10 transactions are set as default if no number gets passed as is the case when calling this function from the main menu
async function showLastTransactions(count = 10){   
    clear();    //clears the console
    // let count = x;  // storing x in a temporary variable
    console.log("\nYour last " + count + " transaction(s):")  //Prints out a statement as a header for the transactions table, informs the user how many transactions he asked for
        account.transactions.forEach(element => {    //iterates over the transactions array, executing the following function on every element
                if (count==0) return false; //quits the loop once enough transactions have been printed 
                if(element.date) {  //skips transactions with a corrupted date
                    console.log(element.date.slice(0,10) + ": " + element.description + " (" + element.amount + "€) "); //logs the date, description and amount of each transaction to the console. Slices the date to only show the date, instead of also the time, as stored in the file
                    count-=1       //Reduces count by 1 to ensure not more transactions than the number asked for are shown
                }
        });
    console.log("\nYour Current Balance: " + balance + "€\n")   //Message concluding the list of transactions, printing out balance from the global variable balance, calculated through calculateBalance()
    whatToDoNext('showLastTransactions');   //asks what the user wants to do after showing the last transactions, passes the current function to offer the corresponding options
}

//Asks the user for the start and end date of a timeframe to show transactions within, then displays the found transactions and the current balance
async function showTimeframe(){
    clear();    //clears the console
    response = await prompts([{  //initializes prompt of the following questions. 
        type: 'date',   //this question expects an input of the type date,
        name: 'from',   //the name this user input will later be refered to (see below)
        message: 'Enter a time frame to display your transactions.\n From: ', //Message displayed to the user, "/n" breaks the line
        mask: 'DD-MM-YYYY', //sets the format the date input will be asked for and stored as
        validate: from => from == ''|| from == null ? "Can't be empty" : true //validates the user input. If date is empty or null a message will be shown to the user, prohibiting him from progressing without entering a valid value
    },
    {
        type: 'date', //this question expects an input of the type date
        name: 'to', //the name this user input will later be refered to (see below)
        message: 'To: ', //Message displayed to the user
        mask: 'DD-MM-YYYY', //sets the format the date input will be asked for and stored as
        validate: to => to == ''|| to == null ? "Can't be empty" : true   //validates the user input. If to is empty or null a message will be shown to the user, prohibiting him from progressing without entering a valid value
    }, {onCancel:mainMenu}]);
    const from = new Date(response.from.setHours(12,0,0,0));    //intializes a date object from the "from" property the user entered. As Date() always stores the exact moment in time, including hours, minutes, seconds and milliseconds,  .setHours() is used to set the entered time to 12pm, to ensure that comparing from & to with the time of each transaction (see 2 lines below) takes into account only the day
    const to = new Date(response.to.setHours(12,0,0,0)); //intializes a date object from the "to" property the user entered. As Date() always stores the exact moment in time, including hours, minutes, seconds and milliseconds,  .setHours() is used to set the entered time to exactly 12pm, to ensure that comparing from & to with the time of each transaction (see line below) takes into account only the day
    const transactionsInTimeframe = account.transactions.filter(e => new Date(e.date).setHours(12,0,0,0) <= to && new Date(e.date).setHours(12,0,0,0) >= from); //filtering for all the transactions included in the time frame entered above and storing it in the timeframe. For that matter new Date() intializes Date objects and .setHours() sets the time to exactly 12pm to only take into account the day of a transaction. This way the actual time of the transaction is preserved in the log file but only ignored here.
    const count = transactionsInTimeframe.length; // counting the transactions in transactionsInTimeFrame to print it in the line below
    console.log(count + " transaction(s) found between " + from.toISOString().substring(0, 10) +  " and " + to.toISOString().substring(0, 10) + "\n");    //Printing the number of transactions found in the timeframe and the start and end date of the timeframe. toISOString and .substring(0,10) is needed to print it in a format understable for the user, otherwise it would just print as a number

    transactionsInTimeframe.forEach(element => {    //iterates over the transactions in the timeframe, executing the following function on every element
            console.log(element.date.slice(0,10) + ": " + element.description + " (" + element.amount + "€) "); //logs the date, description and amount of each transaction to the console. Slices the date to only show the date, instead of also the time, as stored in the file
    });
    console.log("_________________________________")    //prints a dividing line
    console.log("Your Current Balance: " + balance + "€\n") //Message concluding the list of transactions, printing out balance from the global variable balance, calculated through calculateBalance()
    whatToDoNext('showTimeframe');  //asks what the user wants to do after showing the transactios, passes the current function to to offer the corresponding options
}

//Exit function that is called when the user asks to exit the program
function exit(){
    console.log("Exiting")  //exiting message that marks the exit 
}

//Function that checks whether an object/value is a number, needed for preventing calculation with corrupted amounts that could cause errors
function isNumber(value) { 
    return typeof value === 'number' && isFinite(value);    // returns true if value is of the tyoe 'number' and finite
}

////asks what the user wants to do after executing one of the available tasks, gets context passed as a parameter to offer the options to where the function was called (String expected)
function whatToDoNext(context){
    const options = [{  //defining the questions to inquire the user 
        title: context == 'showLastTransactions' ? "Show transactions in a certain timeframe" : 'showTimeframe' ? "Select a different timeframe": null, //Validates the context, resulting in a boolean that determines which String will be shown to user: If context  is "showLastTransactions" the title will be "Show transactions in a certain timeframe", if context is 'showTimeframe' it will be "Select a different timeframe", if neither of them it becomes null, a case that should not occur
        value: 2  , // the value of the choice property when this option is selected (used for processing the user input and executing the respective function, see below)
        show: context == 'showLastTransactions' || context == 'showTimeframe',  //Validates context, resulting in a boolean that determines if this option will be given to the user to select, if in this case context is equal to any of the two strings, it will be true and shown, otherwise false and not shown
    },
    {
        title: context == 'showLastTransactions' ? "Show a different number of transactions" : 'showTimeframe' ? "Show the most recent transactions" : null, //Validates the context, resulting in a boolean that determines which String will be shown to user, either "Show a different number of transactions" or "Show the most recent transactions", based on the value of context
        value: 3,   // the value of the choice property when this option is selected (used for processing the user input and executing the respective function, see below)
        show: context == 'showLastTransactions' || context == 'showTimeframe', //Validates context, resulting in a boolean that determines if this option will be given to the user to select, if in this case context is equal to any of the two strings, it will be true and shown, otherwise false and not shown
    },
    {
        title: context == 'recordTransaction' ? "Add another transaction" : null, //Validates context, resulting in a boolean that determines which String will be shown to user
        value: 4,   // the value of the choice property when this option is selected (used for processing the user input and executing the respective function, see below)
        show: context == 'recordTransaction',   //Validates context, resulting in a boolean that determines if this option will be given to the user to select, if in this case context is equal to 'recordTransaction' it will be true and the option will be shown, otherwise false and not shown
    },
    { 
        title: 'Go back to the menu',   //Message string shown to the user
        value: 0, // the value of the choice property when this option is selected (used for processing the user input and executing the respective function, see below)
        show: true //show is always true here because in any use case of the whatToDoNExt function going back to the main menu should be an option
    },   
    { 
        title: 'Exit',  //Message string shown to the user
        value: 1,  // the value of the choice property when this option is selected (used for processing the user input and executing the respective function, see below)
        show: true //show is always true here because in any use case of the whatToDoNExt function exiting the program should be an option
    }].filter(option => option.show); //only show the question supposed to be shown based on the context of the whatToDoNext function
    const response = prompts([        //prompting the user for a response to the questions declared below
        {
            type: 'select', //type of the prompt is select between multiple choices
            name: 'choice', //the name this user input will later be refered to (see below)
            message: 'What do you want to do next?',    //message prompted to the user
            choices: options,   //passing the options declared above to this question
        },
        {
            type: prev => prev == 3 ? 'number' : false, // type = false when the previous answer was not 3, so this question is asked only when the user chose option 3 "showLastTransactions" (in order to be shown type needs to be != false)
            name: 'number',     //inquiring the number of transactions the user wants to show
            message: 'How many transactions do you want to show?',  //message prompted to the user
        }
    ], {onCancel:mainMenu}).then((response) =>{ //when the usermakes his choice and selects an option, the then block is executed, passing on the users choice through the response object
        if(response.choice == 0) mainMenu() //handling the users choice by checking the choice value and executing the correct function
        else if(response.choice ==1) exit() //handling the users choice by checking the choice value and executing the correct function
        else if(response.choice == 2) showTimeframe()   //handling the users choice by checking the choice value and executing the correct function
        else if(response.choice == 3) showLastTransactions(response.number) //handling the users choice by checking the choice value and executing the correct function, passing the response.number property if the user chose option 3 and then entered a number
        else if(response.choice == 4) recordTransaction() //handling the users choice by checking the choice value and executing the correct function
    })    
}

//prompts the main menu, asking the user to choose between adding a transaction, showing the last transactions and exiting the program. No parameter expected. Will be called whenever the user starts the program and when he asks to return to the main menu.
async function mainMenu(){
    clear();    //clears the console
    fetchData(); //refetching data to prevent dates from being displayed in different format after adding transaction
    const response = await prompts([  //executes the prompts, asking the user for input
        {
            type: 'select', //type of the prompt is select between multiple choices
            name: 'choice', //the name this user input will later be refered to (see below)
            message: "Hi " + account.name + "! Welcome to lmu-mmt bookkeeping. What do you want to do?", //message prompt that welcomes the user to the menu, calling him by the name from the name property from the book file
            choices: [  //choices offered to the user 
                { title: 'New Transaction', description: 'Record a new transaction', value: 0 },        //The user will see both the title property and the description, the value will be used further below to process the users response
                { title: 'Current Budget', description: 'Show past transactions', value: 1 },     //The user will see both the title property and the description, the value will be used further below to process the users response
                { title: 'Exit', value: 2 },     //The user will see both the title property and the description, the value will be used further below to process the users response
            ],
        }
    ]).then((response) => { //when the usermakes his choice and selects an option, the then block is executed, passing on the users choice through the response object
        if(response.choice == 0) recordTransaction()        //handling the users choice by checking the choice value and executing the correct function
        if(response.choice == 1) showLastTransactions()     //handling the users choice by checking the choice value and executing the correct function
        if(response.choice == 2) exit() //handling the users choice by checking the choice value and executing the correct function
    }).catch((error) => {   //whenever any error occurs during the user input (e.g. the user presses ESC), this block gets executed,
            console.log('cancelled'); //printing out error message
        });
   
}



    mainMenu(); //starts the program




