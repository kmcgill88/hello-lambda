'use strict';

const chai = require('chai');
const expect = chai.expect;

const constants = require('../../src/constants');

describe('Constants Tests', () => {
    it('should have a ping operation', () => {
        expect(constants).to.have.property('PING_OPERATTION').which.equals('ping');
    });

    it('should have an echo operation', () => {
        expect(constants).to.have.property('ECHO_OPERATION').which.equals('echo');
    });

    it('should have an say hello operation', () => {
        expect(constants).to.have.property('SAY_HELLO_OPERATION').which.equals('say-hello');
    });

    it('should have bad request property', () => {
        expect(constants).to.have.property('BAD_REQUEST').which.equals('[Bad Request] ');
    });

    it('should have unauthorized property', () => {
        expect(constants).to.have.property('UNAUTHORIZED').which.equals('[Unauthorized] ');
    });

    it('should have forbidden property', () => {
        expect(constants).to.have.property('FORBIDDEN').which.equals('[Forbidden] ');
    });

    it('should have not found property', () => {
        expect(constants).to.have.property('NOT_FOUND').which.equals('[Not Found] ');
    });

    it('should have too many requests property', () => {
        expect(constants).to.have.property('TOO_MANY_REQUESTS').which.equals('[Too Many Requests] ');
    });

    it('should have bad gateway property', () => {
        expect(constants).to.have.property('BAD_GATEWAY').which.equals('[Bad Gateway] ');
    });

    it('should have gateway timeout property', () => {
        expect(constants).to.have.property('GATEWAY_TIMEOUT').which.equals('[Gateway Timeout] ');
    });

    it('should have internal server error property', () => {
        expect(constants).to.have.property('INTERNAL_SERVER_ERROR').which.equals('[Internal Server Error] ');
    });

    it('should have service unavailable property', () => {
        expect(constants).to.have.property('SERVICE_UNAVAILABLE').which.equals('[Service Unavailable] ');
    });

    it('should have 12 constants', () => {
        expect(Object.keys(constants).length).to.equal(12);
    });
});
