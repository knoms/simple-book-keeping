const prompts = require('prompts');
var fs = require('fs');
const chalk = require('chalk');
const { until } = require('async');
const clear = require('clear');
const { message } = require('prompt');
// prompts.override(require('yargs').argv);
var properties;
var transactions;
var balance = 0;


function fetchData(){
    properties = JSON.parse(fs.readFileSync('book.json', 'utf8'));
    transactions = properties.transactions;
    sortTransactionsByNewest();
    calculateBalance();
}

function sortTransactionsByNewest(){
    transactions.sort(function(a,b){
        return new Date(b.date) - new Date(a.date);
    });
}

function calculateBalance(){
    balance = 0;
    properties.transactions.forEach(element => {
        if(isNumber(element.amount)){
            balance += element.amount;
        }
    });
}


// Your program should ask the user to insert the description,the date and
// the amount of a transaction (positive for income, negative for expenses)
//  Your program reacts with a confirmation that the transaction has been saved to file and returns the current budget
//  Bonus: The user is able to insert multiple transactions at once

const questions = [{
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
    let newQuestions = questions;

    let answersTotal = {};
    
    const onCancel = async (prompt, answersSoFar) => {
        const onContinue = async (prompt, answer, answersSoFar) => { 
            console.log(answer);
            answersTotal = {...answersTotal, ...answersSoFar}
            if(answer == true){
                console.log("true");
                mainMenu();
            } else if(answer ==false){
                console.log("else");
                // await prompts(questions, { onCancel, onSubmit:onSubmit }).override(answersSoFar); 
                questionPointer -=1;
                return true;
            }
        };
        response = await prompts({
            type: 'toggle',
            name: 'confirm',
            message: 'Abort this transaction?',
            initial: false,
            active: 'yes, abort',
            inactive: 'no, continue'
        },{onSubmit:onContinue, onCancel:whatToDoNext(recordTransaction)});
        if(!response.answer) {
            questionPointer -=1;
            return true;
        }
    }

    const onSubmit = async (prompt, answer, answersSoFar) => { 
        ç
        if(questionPointer == 2 && answersTotal.amount !== '' && answersTotal.amount !== null && answersTotal.date !== '' && answersTotal.date !== null){ 
            writeTransaction(answersTotal);
            console.log("Transaction saved to file. Your new balance: " + balance + "€");
        }
        questionPointer += 1;
    }
    await prompts(newQuestions, {onSubmit});
    whatToDoNext(recordTransaction);
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
    console.log("Your Current Balance: " + balance + "€\n")
    console.log("______________________________________")
    console.log("Your last " + count + " transactions:\n")
    while (count > 0){
        properties.transactions.forEach(element => {
                if (count==0) return false;
                console.log(element.date.slice(0,10) + ": " + element.description + " (" + element.amount + "€) ");
                count-=1;
        });
    }
    console.log("\n");
    whatToDoNext(showLastTransactions);
}

async function calculateBudget(){
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
    whatToDoNext(calculateBudget);
}


function exit(){
    console.log("Exiting")
}

var isNumber = function isNumber(value) {
    return typeof value === 'number' && isFinite(value);
}

async function whatToDoNext(func){
    const firstOption = func == calculateBudget ? "Select different timeframe" : func == showLastTransaction ? "Show transactions in a certain timeframe" : func == recordTransaction ? "Add another transaction" : "Nothing";
    const secondOption = func = showLastTransactions ? "Show a different number of transactions" : calculateBudget ? "Show the last transactions" : true;
    var dynamicChoices = [{ title: firstOption, value: 0 }, {title: secondOption, value: 3}];
    const standardChoices = [
        { title: 'Go back to the menu', value: 1 },
        { title: 'Exit', value: 2 },
    ];
    const combinedChoices = dynamicChoices.concat(standardChoices);
    const response = await prompts([
        {
            type: 'select',
            name: 'choice',
            message: 'What do you want to do next?',
            choices: combinedChoices,
        },
        {
            type: prev => prev == 3 ? 'number' : false,
            name: 'number',
            message: 'How many transactions do you want to show?',
        }
    ], {onCancel:mainMenu});
    if(response.choice == 0) func()
    else if(response.choice == 1) mainMenu()
    else if(response.choice == 2) exit()
    else if(response.choice == 3) showLastTransactions(response.number)
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
                { title: 'Calculate my budget', description: 'Show past transactions', value: 1 },
                { title: 'Exit', value: 2 },
            ],
        }
    ]).then((response) => {
        if(response.choice == 0) recordTransaction()
        if(response.choice == 1) calculateBudget()
        if(response.choice == 2) exit()
    }).catch((error) => {
            console.log('cancelled');
        });
   
}



mainMenu();





