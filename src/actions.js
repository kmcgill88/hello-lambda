'use strict';

const echo = (data, callback) =>  callback(null, data);

const sayHello = (callback) => callback(null, 'hello lambda');

module.exports = {
    echo,
    sayHello,
};
