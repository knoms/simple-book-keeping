const prompts = require('prompts');
var fs = require('fs');
prompts.override(require('yargs').argv);
var properties;


function fetchData(){
    properties = JSON.parse(fs.readFileSync('book.json', 'utf8'));
}

// Your program should ask the user to insert the description,the date and
// the amount of a transaction (positive for income, negative for expenses)
//  Your program reacts with a confirmation that the transaction has been saved to file and returns the current budget
//  Bonus: The user is able to insert multiple transactions at once

const questions = [{
    type: 'text',
    name: 'description',
    message: 'Enter a description for the transaction: ',
    validate: description => description = '' ? "Can't be empty" : true
},
{
    type: 'date',
    name: 'date',
    message: 'Enter a date for the transaction (DD-MM-YYYY): ', 
    mask: 'DD-MM-YYYY',
    validate: date => date = '' ? "Can't be empty" : true
},
{
    type: 'number',
    name: 'amount',
    message: 'Enter the amount of the transaction: ',
    validate: amount => amount = '' ? "Can't be empty" : true
}];

const onCancel = (prompt, answers) => {
    const response = prompts({
        type: 'toggle',
        name: 'confirm',
        message: 'Cancel transaction?',
        initial: false,
        active: 'yes',
        inactive: 'no'
      }).then((response) => {
        console.log(response.confirm)
        if (response.confirm = true) return false;
        else if (response.confirm != false) return true;
      }).catch((error) => {
          console.log(error);
    });
}

function recordTransaction(){
    // const response = prompts(questions, {onCancel:onCancel}).then((response) => {
    //     writeTransaction(response);
    //     console.log("Transaction added succesfully.")
    // }).catch((error) => {
    //         console.log(error);
    // }).finally(() => {
    //     // mainMenu();
    // });

    

//     (async () => {
//         const onCancel = prompt => {
//             // const response = prompts({
//             //         type: 'toggle',
//             //         name: 'confirm',
//             //         message: 'Cancel transaction?',
//             //         initial: false,
//             //         active: 'yes',
//             //         inactive: 'no'
//             //     }).then((response) => {
//             //         console.log(response.confirm)
//             //         if (response.confirm = true) return true;
//             //         else if (response.confirm = false) return false;
//             //     });
//             return true;
//         }
//         const onCancel = async (prompt, answersSoFar) => {

//             // Delete previous answer 
//             const keys = Object.keys(answersSoFar)
//             delete answersSoFar[keys[keys.length-1]]
    
//             // Remove previous questions
//             newQuestions = questions.filter((question, index) => {
//                 if (index >= questionPointer - 1) { return question; }
//             })
    
//             answersTotal = {...answersTotal, ...answersSoFar}  
//             // console.log(`answersTotalOnCancel, questionPointer: ${questionPointer}`, answersTotal)
//             questionPointer -= 1;
        
//             await prompts(newQuestions, { onCancel, onSubmit });
//         }
//         const response = await prompts(questions, {onCancel});
//     })();
//     writeTransaction(response);
//     mainMenu();
// }

(async () => {

    let questionPointer = 0;
    let newQuestions = questions;

    let answersTotal = {};
    
    const onCancel = async (prompt, answersSoFar) => {

        // // Delete previous answer 
        // const keys = Object.keys(answersSoFar)
        // delete answersSoFar[keys[keys.length-1]]

        // // // Remove previous questions
        // // newQuestions = questions.filter((question, index) => {
        // //     if (index >= questionPointer - 1) { return question; }
        // // })

        // answersTotal = {...answersTotal, ...answersSoFar}  
        // console.log(`answersTotalOnCancel, questionPointer: ${questionPointer}`, answersTotal)
        // questionPointer -= 1;
        await abortOrContinue(answersSoFar);
    
       // await prompts(newQuestions, { onCancel, onSubmit });
    }

    async function abortOrContinue(answersSoFar){
        const onSubmit = async (prompt, answer, answersSoFar) => { 
            console.log(answer);
            if(answer){
                mainMenu();
            } else {
                await prompts(questions, { onCancel, onSubmit }); 
            }
            // await prompts(questions, { onCancel, onSubmit });
        }
        await prompts({
                                type: 'toggle',
                                name: 'confirm',
                                message: 'Abort this transaction?',
                                initial: false,
                                active: 'yes, abort',
                                inactive: 'no, continue'
                            },{onSubmit});
    }

    const onSubmit = (prompt, answer, answersSoFar) => { 
        answersTotal = {...answersTotal, ...answersSoFar}
        if(questionPointer == 2){
            writeTransaction(answersTotal);
            console.log("Transaction saved");
        }
        questionPointer += 1;
    }

    await prompts(questions, { onCancel, onSubmit });
    // console.log(`answersTotalEnd, questionPointer: ${questionPointer}`, answersTotal)
     
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
}

// Your program returns the current budget and the last 10 transactions
//  Bonus:The user can specify how many transactions the program should
// return
//  Bonus: The user can specify a date range for the transactions to be returned (e.g. all transactions in January 2021)
    
function calculateBudget(){
    console.log("Your past transactions:")
    console.log("_________________________________\n")
    var sum = 0;
    properties.transactions.forEach(element => {
        console.log(element.date.slice(0,10) + ": " + element.description + " (" + element.amount + "€) ")
        sum += element.amount;
    });
    console.log("_________________________________")
    console.log("Current Balance: " + sum + "€\n")
}

function exit(){
    console.log("Exiting")
}

function mainMenu(){
    fetchData(); //refetching data to prevent data being displayed in different format after adding transaction
    console.log("Hi " + properties.name + "!")
    console.log("Welcome to simple book keeping")
    const response = prompts([
        {
            type: 'select',
            name: 'choice',
            message: 'What do you want to do?',
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





