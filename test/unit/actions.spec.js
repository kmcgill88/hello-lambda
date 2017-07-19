'use strict';

const chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    expect = chai.expect,
    chance = require('chance').Chance();
chai.use(sinonChai);

const actions = require('../../src/actions');

const constants = require('../../src/constants');

describe('Actions tests', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('when echoing', () => {

        let data,
            actualError,
            actualResponse;

        beforeEach((done) => {
            data = chance.string();

            actions.echo(data, (error, response) => {
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

    describe('when saying hello', () => {
        let actualError,
            actualResponse;

        beforeEach((done) => {
            actions.sayHello((error, response) => {
                actualError = error;
                actualResponse = response;
                done();
            });
        });

        it('should not raise an error', () => {
            expect(actualError).to.equal(null);
        });

        it('should yield data', () => {
            expect(actualResponse).to.equal('hello lambda');
        });

    });
});
