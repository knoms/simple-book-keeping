const prompts = require('prompts');
var fs = require('fs');
const chalk = require('chalk');
const clear = require('clear');
// prompts.override(require('yargs').argv);
var properties;
var transactions;
var balance = 0;


function fetchData(){
    properties = JSON.parse(fs.readFileSync('book.json', 'utf8'));
    sortTransactionsByNewest();
    calculateBalance();
}

//Sorts transactions descending by date so that they are displayed in chronological order
function sortTransactionsByNewest(){ 
    properties.transactions.sort(function(a,b){ //sorts transactions based on the next line
        return new Date(b.date) - new Date(a.date); //compares dates a and b for size
    });
}

function calculateBalance(){
    balance = 0;    //Initializes balance with 0 before calculating it
    properties.transactions.forEach(element => {        //iterates over transactions in file
        if(new Date(element.date) <= Date.now() && isNumber(element.amount)){   //makes sure that only past transactions are counted into the balance and that no corrupted amount is attempted to be added
            balance += element.amount; //adds transaction to balance
        }
    });
}


// Your program should ask the user to insert the description,the date and
// the amount of a transaction (positive for income, negative for expenses)
//  Your program reacts with a confirmation that the transaction has been saved to file and returns the current budget
//  Bonus: The user is able to insert multiple transactions at once

const transactionQuestions = [{
    type: 'text',
    name: 'description',
    message: 'Enter a description for the transaction: ',
    validate: description => description == '' || description == null ? "Can't be empty" : true
},
{
    type: 'date',
    name: 'date',
    message: 'Enter a date for the transaction (DD-MM-YYYY): ', 
    mask: 'DD-MM-YYYY',
    validate: date => date == ''|| date == null ? "Can't be empty" : true
},
{
    type: 'number',
    name: 'amount',
    message: 'Enter the amount of the transaction: ',
    validate: amount => amount == ''|| amount == null ? "Can't be empty or zero" : true
}];

function recordTransaction(){
    clear();
(async () => {

    let questionPointer = 0;
    let newQuestions = transactionQuestions; // intitializes the questions to ask
    let answersSoFar = {};
    
    const onSubmit = async (prompt, answer, answersSoFar) => { 
        if(questionPointer == 2 && answersSoFar.amount !== '' && answersSoFar.amount !== null && answersSoFar.date !== '' && answersSoFar.date !== null){ 
            writeTransaction(answersSoFar);
            console.log("Transaction saved to file. Your new balance: " + balance + "€");
        }
        questionPointer += 1;
    }
    await prompts(newQuestions, {onSubmit});
    whatToDoNext('recordTransaction');
})();
}

function writeTransaction(obj){
    var newTransaction = {
        id: null,
        date: '',
        description: '',
        amount: '',
    }
    newTransaction.id = 1;
    newTransaction.description = obj.description;
    newTransaction.date = obj.date;
    newTransaction.amount = obj.amount;
    properties.transactions.push(newTransaction);
    data = JSON.stringify(properties);
    fs.writeFileSync("book.json", data);
    calculateBalance();
}

async function showLastTransactions(x = 10){
    clear();
    var count = x;
    console.log("______________________________________")
    console.log("Your last " + count + " transactions:\n")
        properties.transactions.forEach(element => {
                if (count==0) return false;
                if(element.date) {
                    console.log(element.date.slice(0,10) + ": " + element.description + " (" + element.amount + "€) ");
                    count-=1
                }
        });
    console.log("\nYour Current Balance: " + balance + "€\n")
    whatToDoNext('showLastTransactions');
}

async function showTimeframe(){
    clear();
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
    var from = new Date(response.from.setHours(12,0,0,0));
    var to = new Date(response.to.setHours(12,0,0,0)); 
    var timeframe = properties.transactions.filter(e => new Date(e.date).setHours(12,0,0,0) <= to && new Date(e.date).setHours(12,0,0,0) >= from);
    const count = timeframe.length
    console.log(count + " transactions found between " + from.toISOString().substring(0, 10) +  " and " + to.toISOString().substring(0, 10) + "\n")

    timeframe.forEach(element => {
            console.log(element.date.slice(0,10) + ": " + element.description + " (" + element.amount + "€) ");
    });
    console.log("_________________________________")
    console.log("Your Current Balance: " + balance + "€\n")
    whatToDoNext('showTimeframe');
}


function exit(){
    console.log("Exiting")
}

var isNumber = function isNumber(value) {
    return typeof value === 'number' && isFinite(value);
}

async function whatToDoNext(functionPassed){
    const choices = [{
        title: functionPassed == 'showLastTransactions' ? "Show transactions in a certain timeframe" : 'showTimeframe' ? "Select a different timeframe": null,
        value: 2  ,
        show: functionPassed == 'showLastTransactions' || functionPassed == 'showTimeframe',
    },
    {
        title: functionPassed == 'showLastTransactions' ? "Show a different number of transactions" : 'showTimeframe' ? "Show the most recent transactions" : null,
        value: 3,
        show: functionPassed == 'showLastTransactions' || functionPassed == 'showTimeframe',
    },
    {
        title: functionPassed == 'recordTransaction' ? "Add another transaction" : null,
        value: 4,
        show: functionPassed == 'recordTransaction',
    },
    { 
        title: 'Go back to the menu', 
        value: 0, 
        show: true },
    { 
        title: 'Exit', 
        value: 1, 
        show: true 
    }].filter(option => option.show)
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
        console.log(response.choice);
        if(response.choice == 0) mainMenu()
        else if(response.choice ==1) exit()
        else if(response.choice == 2) showTimeframe()
        else if(response.choice == 3) showLastTransactions(response.number)
        else if(response.choice == 4) recordTransaction()
    })    
}

function mainMenu(){
    clear();
    fetchData(); //refetching data to prevent data being displayed in different format after adding transaction
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





