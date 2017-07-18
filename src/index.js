'use strict';

const actions = require('./actions'),
    constants = require('./constants');

exports.handler = (event, context, callback) => {
    console.log(`Event: ${JSON.stringify(event, null, 2)}`);
    console.log(`Context: ${JSON.stringify(context, null, 2)}`);

    process.env.OPERATION = event.operation;

    if (event.operation === constants.PING_OPERATTION) {
        callback(null, 'pong');
        return;
    }

    if (event.operation === constants.ECHO_OPERATION) {
        actions.echo(event.data, callback);
    } else {
        callback(new Error(`${constants.BAD_REQUEST}An operation must be specified.`));
    }
};
