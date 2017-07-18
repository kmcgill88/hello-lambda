'use strict';

const index = require('./src/index');

// *** Ping

const event = {
    operation: 'ping',
};

index.handler(event, {}, (err, data) => {
    if (err) {
        console.log('Error!');
        console.log(err);
    } else {
        console.log('Success!');
        console.log(JSON.stringify(data, null, 2));
    }
});