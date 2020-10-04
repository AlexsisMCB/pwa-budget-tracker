// variable to hold db connection
let db;

// establish connection to IndexedDB database called 'budget-tracker'
const request = indexedDB.open('budget-tracker', 1);

// emit if database version changes
request.onupgradeneeded = function(event) {
    // save a reference to the database
    const db = event.target.result;
    // create object store, set to auto increment
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

// if successful
request.onsuccess = function(event) {
    // save reference to db in global variable upon success
    db = event.target.result;

    // check if app online
    if (navigator.onLine) {
        // send all local db data to api
        // function here
        uploadTransaction();
    }
};

request.onerror = function(event) {
    // log error
    console.log(event.target.errorCode);
};

// execute if submit new transaction
function saveRecord(budget) {
    // open new transaction with database read and write permissions
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access 'new_transaction'
    const budgetObjectStore = transaction.objectStore('new_transaction');

    // add budget to store with add method
    budgetObjectStore.add(budget);
}

function uploadTransaction() {
    // open on db
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access store
    const budgetObjectStore = transaction.objectStore('new_transaction');

    // get all records
    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function() {
        // data sent to indexedDb store
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                // open new transaction
                const transaction = db.transaction(['new_transaction'], 'readwrite');
                // access new_transaction object store
                const budgetObjectStore = transaction.objectStore('new_transaction');
                // clear all items
                budgetObjectStore.clear();

                alert('All saved transactions submitted!')
            })
            .catch(err => {
                console.log(err);
            });
        }
    }
}

// listen for app to return online
window.addEventListener('online', uploadTransaction);