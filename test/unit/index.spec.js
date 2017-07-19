'use strict';

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
chai.use(sinonChai);
const chance = require('chance').Chance();

const index = require('../../src/index');

const actions = require('../../src/actions');

describe('Index tests', () => {
    let event,
        context,
        actualError,
        actualResponse,
        sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        sandbox.stub(actions);
        sandbox.stub(console, 'log');
        context = {};
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('when pinging', () => {
        beforeEach((done) => {
            event = {
                operation: 'ping'
            };

            index.handler(event, context, (error, response) => {
                actualError = error;
                actualResponse = response;
                done();
            });
        });

        it('should not raise an error', () => {
            expect(actualError).to.equal(null);
        });

        it('should pong', () => {
            expect(actualResponse).to.equal('pong');
        });
    });

    describe('when operation is echo', () => {
        let data;

        beforeEach((done) => {
            data = chance.string();
            event = {
                operation: 'echo',
                data,
            };

            actions.echo.withArgs(data, sinon.match.func).yields(null, data);

            index.handler(event, context, (error, response) => {
                actualError = error;
                actualResponse = response;
                done();
            });
        });

        it('should not raise an error', () => {
            expect(actualError).to.equal(null);
        });

        it('should yield data', () => {
            expect(actualResponse).to.equal(data);
        });
    });

    describe('when operation is say hello', () => {
        let sayHelloResponse;

        beforeEach((done) => {
            sayHelloResponse = chance.string();
            event = {
                operation: 'say-hello',
            };

            actions.sayHello.withArgs(sinon.match.func).yields(null, sayHelloResponse);

            index.handler(event, context, (error, response) => {
                actualError = error;
                actualResponse = response;
                done();
            });
        });

        it('should not raise an error', () => {
            expect(actualError).to.equal(null);
        });

        it('should yield data', () => {
            expect(actualResponse).to.equal(sayHelloResponse);
        });
    });

    describe('when no operation', () => {
        beforeEach((done) => {
            event = {};

            index.handler(event, context, (error, response) => {
                actualError = error;
                actualResponse = response;
                done();
            });
        });

        it('should raise an error', () => {
            expect(actualError).to.be.an('error');
            expect(actualError.message).to.equal(`[Bad Request] An operation must be specified.`);
        });

        it('should yield undefined', () => {
            expect(actualResponse).to.equal(undefined);
        });
    });
});
