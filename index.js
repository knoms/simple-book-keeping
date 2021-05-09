const prompts = require('prompts');
const fs = require('fs');
const chalk = require('chalk');
const clear = require('clear');
// prompts.override(require('yargs').argv);
let properties;
let balance = 0;
let nextId = 0; //make sure nextId always has a value even if no transactions can be read from file 

//reads the book file to get the account data including transactions, then sorts the transactions, recalculates the balance and reads the highest transaction id to determine the id for the next transaction
function fetchData(){
    properties = JSON.parse(fs.readFileSync('book.json', 'utf8'));  //reads the json file and parses it into an object
    if(properties.transactions.length >0){ // checks for existing transactions to not break the system when there's no transactions to be read
        nextId = properties.transactions.reduce(    //applies the reduce function to the transactions array to calculate the max id
            (max, transaction) => (transaction.id > max ? transaction.id : max), properties.transactions[0].id   //checks the id of every transaction id the array if its bigger than the current max id and replaces the max id if true
      ) + 1;    //increments max id by 1 to determine id of next transaction to be written to the file
    }
    sortTransactionsByNewest();     //sort transaction in descending order by transaction date
    calculateBalance(); //(re)calculate balance to be able to always show the correct balance when showing transactions
}

//Sorts transactions descending by date so that they are displayed in chronological order
function sortTransactionsByNewest(){ 
    properties.transactions.sort(function(a,b){ //sorts transactions based on the next line
        return new Date(b.date) - new Date(a.date); //compares dates a and b for size
    });
}

// Calculates the current account balance based on the transaction history
function calculateBalance(){
    balance = 0;    //Initializes balance with 0 before calculating it to prevent counting repeatedly adding
    properties.transactions.forEach(element => {        //iterates over transactions in file
        if(new Date(element.date) <= Date.now() && isNumber(element.amount)){   //makes sure that only past transactions are counted into the balance and that no corrupted amount is attempted to be added
            balance += element.amount; //adds transaction to balance
        }
    });
}

function recordTransaction(){
    const transactionQuestions = [{ //defining the questions to inquire the user 
        type: 'text',   //defining answer type as String
        name: 'description',    //defining the name of this question to be able to refer to its answer 
        message: 'Enter a description for the transaction: ',    //prompt shown to the user
        validate: description => description == '' || description == null ? "Can't be empty" : true //validating the user input before continuing: empty input will be prohibited
    },
    {
        type: 'date',   //defining answer type as date
        name: 'date',   //defining the name of this question to be able to refer to its answer 
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
        properties.transactions.push(newTransaction);   //adds new transaction to the local transactions array
        data = JSON.stringify(properties);      //turns properties back into string in order to write it into the file again
        fs.writeFileSync("book.json", data);    //writes updated transactions into file
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
                console.log("Transaction saved to file. Your new balance: " + balance + "€");//confirms succesful saving to file and prints the new balance 
            }
            questionPointer += 1; //moves on to the next question to ensure writeTransaction is only executed when every question has been answered
        }
        await prompts(newQuestions, {onSubmit});    //prompts the questions defined above, passes the optional onSubmit function declared above

        whatToDoNext('recordTransaction');  //asks what the user wants to do after writing the transaction, passes the current function to offer the corresponding options
    })();
}

//prints a certain number of the last transactions in descending order by date, as well as the current balance. the number of transactions supposed to be shown can get passed as an optional parameter, 10 transactions are set as default if no number gets passed
async function showLastTransactions(x = 10){   
    clear();    //clears the console
    let count = x;
    console.log("______________________________________")
    console.log("Your last " + count + " transactions:\n")  //Prints out a statement as a header for the transactions table, informs the user how many transactions he asked for
        properties.transactions.forEach(element => {    //iterates over the transactions array
                if (count==0) return false; //quits the loop once enough transactions have been printed 
                if(element.date) {  //skips transactions with a corrupted date
                    console.log(element.date.slice(0,10) + ": " + element.description + " (" + element.amount + "€) "); //logs the date, description and amount of each transaction to the console. Slices the date to only show the date, instead of also the time, as stored in the file
                    count-=1       //Reduces count by 1 to ensure not more transactions than the number asked for are shown
                }
        });
    console.log("\nYour Current Balance: " + balance + "€\n")   //prints out the current balance to conclude the budget display
    whatToDoNext('showLastTransactions');   //asks what the user wants to do after showing the last transactions, passes the current function to offer the corresponding options
}

async function showTimeframe(){
    clear();    //clears the console
    response = await prompts([{
        type: 'date',
        name: 'from',
        message: 'Enter a time frame to display your transactions.\n From: ', 
        mask: 'DD-MM-YYYY',
        validate: date => date == ''|| date == null ? "Can't be empty" : true
    },
    {
        type: 'date',
        name: 'to',
        message: 'To: ', 
        mask: 'DD-MM-YYYY',
        validate: date => date == ''|| date == null ? "Can't be empty" : true
    }, {onCancel:mainMenu}]);
    const from = new Date(response.from.setHours(12,0,0,0));
    const to = new Date(response.to.setHours(12,0,0,0)); 
    const timeframe = properties.transactions.filter(e => new Date(e.date).setHours(12,0,0,0) <= to && new Date(e.date).setHours(12,0,0,0) >= from);
    const count = timeframe.length
    console.log(count + " transactions found between " + from.toISOString().substring(0, 10) +  " and " + to.toISOString().substring(0, 10) + "\n")

    timeframe.forEach(element => {
            console.log(element.date.slice(0,10) + ": " + element.description + " (" + element.amount + "€) ");
    });
    console.log("_________________________________")
    console.log("Your Current Balance: " + balance + "€\n")
    whatToDoNext('showTimeframe');  //asks what the user wants to do after showing the transactios, passes the current function to to offer the corresponding options
}


function exit(){
    console.log("Exiting")
}

function isNumber(value) {
    return typeof value === 'number' && isFinite(value);
}

////asks what the user wants to do after executing one of the available tasks, gets context passed as a parameter to offer the corresponding options
async function whatToDoNext(context){
    const choices = [{
        title: context == 'showLastTransactions' ? "Show transactions in a certain timeframe" : 'showTimeframe' ? "Select a different timeframe": null,
        value: 2  ,
        show: context == 'showLastTransactions' || context == 'showTimeframe',
    },
    {
        title: context == 'showLastTransactions' ? "Show a different number of transactions" : 'showTimeframe' ? "Show the most recent transactions" : null,
        value: 3,
        show: context == 'showLastTransactions' || context == 'showTimeframe',
    },
    {
        title: context == 'recordTransaction' ? "Add another transaction" : null,
        value: 4,
        show: context == 'recordTransaction',
    },
    { 
        title: 'Go back to the menu', 
        value: 0, 
        show: true },
    { 
        title: 'Exit', 
        value: 1, 
        show: true 
    }].filter(option => option.show); //only show the question supposed to be shown based on the context of the whatToDoNext function
    const response = await prompts([
        {
            type: 'select',
            name: 'choice',
            message: 'What do you want to do next?',
            choices: choices,
        },
        {
            type: prev => prev == 3 ? 'number' : false,
            name: 'number',
            message: 'How many transactions do you want to show?',
        }
    ], {onCancel:mainMenu}).then((response) =>{
        if(response.choice == 0) mainMenu()
        else if(response.choice ==1) exit()
        else if(response.choice == 2) showTimeframe()
        else if(response.choice == 3) showLastTransactions(response.number)
        else if(response.choice == 4) recordTransaction()
    })    
}

function mainMenu(){
    clear();    //clears the console
    fetchData(); //refetching data to prevent dates from being displayed in different format after adding transaction
    const response = prompts([
        {
            type: 'select',
            name: 'choice',
            message: "Hi " + properties.name + "! Welcome to lmu-mmt bookkeeping. What do you want to do?",
            choices: [
                { title: 'New Transaction', description: 'Record a new transaction', value: 0 },
                { title: 'Current Budget', description: 'Show past transactions', value: 1 },
                { title: 'Exit', value: 2 },
            ],
        }
    ]).then((response) => {
        if(response.choice == 0) recordTransaction()
        if(response.choice == 1) showLastTransactions()
        if(response.choice == 2) exit()
    }).catch((error) => {
            console.log('cancelled');
        });
   
}



mainMenu();





