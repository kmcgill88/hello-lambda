'use strict';

const AWS = require('aws-sdk');
AWS.config.update({region: "us-east-1"});
const s3 = new AWS.S3({apiVersion: '2006-03-01'});
const lambda = new AWS.Lambda({apiVersion: '2015-03-31'});
const fs = require('fs');
const async = require('async');

const config = require('./config.json');

const FUNCTION_NAME = config.lambda.functionName;
const STAGING_BUCKET = config.staging.bucket;
const LAMBDA_EXECUTION_ROLE = config.lambda.role;
const LAMBDA_TIMEOUT = config.lambda.timeout;
const LAMBDA_RUNTIME = config.lambda.runtime;
const LAMBDA_HANDLER = config.lambda.handler;

module.exports = function (grunt) {

    require('matchdep').filterAll('grunt-*').forEach(grunt.loadNpmTasks);

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        eslint: {
            target: ['Gruntfile.js', 'src/**/*.js', './test/**/*.js']
        },

        mochaTest: {
            unit_test: {
                options: {
                    reporter: 'XUnit',
                    captureFile: 'results/test/unit_results.xml',
                    quiet: true,
                    clearRequireCache: false
                },
                src: ['test/unit/**/*.spec.js']
            }
        },

        zip: {
            package: {
                cwd: 'src/',
                src: [
                    'src/**/*',
                    'node_modules/**/*',
                    'package.json'
                ],
                dest: `dist/${FUNCTION_NAME}.zip`
            }
        },

        clean: ['build', 'dist', 'temp', 'manifest.json']

    });

    grunt.registerTask('lint', ['eslint']);

    grunt.registerTask('unit-tests', ['mochaTest:unit_test']);

    grunt.registerTask('verify', ['lint', 'unit-tests']);

    grunt.registerTask('package', ['zip:package']);

    grunt.task.registerTask('stage', 'Stages resources for later deployment.', function () {
        const done = this.async();
        const buildNumber = process.env.BUILD_NUMBER;
        if (!buildNumber) {
            grunt.fail.fatal('BUILD_NUMBER environment variable must be set.');
        }
        grunt.log.writeln(`Stagging the lambda zip file.`);
        const params = {
            'Bucket': STAGING_BUCKET,
            'Key': `${FUNCTION_NAME}/${FUNCTION_NAME}-${buildNumber}.zip`,
            'Body': fs.createReadStream(`./dist/${FUNCTION_NAME}.zip`)
        };
        s3.upload(params, function (error, data) {
            if (error) {
                grunt.log.writeln("Something unexpected happened. " + JSON.stringify(error));
                done(error);
            } else {
                grunt.log.writeln(JSON.stringify(data, null, 2));
                done(true);
            }
        });
    });

    grunt.task.registerTask('manifest', 'Creates a manifest of the build for continuous delivery.', function () {
        const buildNumber = process.env.BUILD_NUMBER;
        if (!buildNumber) {
            grunt.fail.fatal('BUILD_NUMBER environment variable must be set.');
        }
        const manifest = {
            'FunctionName': FUNCTION_NAME,
            'S3Bucket': STAGING_BUCKET,
            'S3Key': `${FUNCTION_NAME}/${FUNCTION_NAME}-${buildNumber}.zip`,
            'Role': LAMBDA_EXECUTION_ROLE,
            'Timeout': LAMBDA_TIMEOUT,
            'Handler': LAMBDA_HANDLER,
            'Runtime': LAMBDA_RUNTIME,
        };
        grunt.file.write('./manifest.json', JSON.stringify(manifest));
    });

    grunt.registerTask('build-and-stage', ['package', 'stage', 'manifest']);

    grunt.task.registerTask('provision-beta', `Provisions ${FUNCTION_NAME}.`, function () {
        const done = this.async();
        const manifest = grunt.file.readJSON('manifest.json');
        async.waterfall([
            function (callback) {
                const params = {
                    'FunctionName': FUNCTION_NAME,
                    'Code': {
                        'S3Bucket': manifest.S3Bucket,
                        'S3Key': manifest.S3Key
                    },
                    'Handler': manifest.Handler,
                    'Runtime': manifest.Runtime,
                    'Role': manifest.Role,
                    'Timeout': manifest.Timeout
                };
                lambda.createFunction(params, callback);
            },
            function (data, callback) {
                const params = {
                    FunctionName: FUNCTION_NAME
                };
                lambda.publishVersion(params, callback);
            },
            function (data, callback) {
                const params = {
                    FunctionName: FUNCTION_NAME,
                    FunctionVersion: data.Version,
                    Name: 'beta'
                };
                lambda.createAlias(params, callback);
            }
        ], function (error, data) {
            if (error) {
                grunt.log.writeln("Something unexpected happened. " + JSON.stringify(error));
                done(error);
            } else {
                grunt.log.writeln(JSON.stringify(data, null, 2));
                done(true);
            }
        });
    });

    grunt.task.registerTask('deploy-beta', `Deploys ${FUNCTION_NAME} to prod.`, function () {
        const done = this.async();
        const manifest = grunt.file.readJSON('manifest.json');
        async.waterfall([
            function (callback) {
                const params = {
                    'FunctionName': FUNCTION_NAME,
                    'S3Bucket': manifest.S3Bucket,
                    'S3Key': manifest.S3Key
                };
                lambda.updateFunctionCode(params, callback);
            },
            function (data, callback) {
                const params = {
                    FunctionName: FUNCTION_NAME
                };
                lambda.publishVersion(params, callback);
            },
            function (data, callback) {
                const params = {
                    FunctionName: FUNCTION_NAME,
                    FunctionVersion: data.Version,
                    Name: 'beta'
                };
                lambda.updateAlias(params, callback);
            }
        ], function (error, data) {
            if (error) {
                grunt.log.writeln("Something unexpected happened. " + JSON.stringify(error));
                done(error);
            } else {
                grunt.log.writeln(JSON.stringify(data, null, 2));
                done(true);
            }
        });
    });

    grunt.task.registerTask('deprovision-beta', `Deprovisions ${FUNCTION_NAME}.`, function () {
        const done = this.async();
        async.waterfall([
            function (callback) {
                const params = {
                    FunctionName: FUNCTION_NAME,
                    Name: 'beta'
                };
                lambda.deleteAlias(params, callback);
            }
        ], function (error, data) {
            if (error) {
                grunt.log.writeln("Something unexpected happened. " + JSON.stringify(error));
                done(error);
            } else {
                grunt.log.writeln(JSON.stringify(data, null, 2));
                done(true);
            }
        });
    });

    grunt.task.registerTask('provision-test', `Provisions ${FUNCTION_NAME}.`, function () {
        const done = this.async();
        async.waterfall([
            function (callback) {
                const params = {
                    FunctionName: FUNCTION_NAME,
                    Name: 'beta'
                };
                lambda.getAlias(params, callback);
            },
            function (data, callback) {
                const params = {
                    FunctionName: FUNCTION_NAME,
                    FunctionVersion: data.FunctionVersion,
                    Name: 'test'
                };
                lambda.createAlias(params, callback);
            }
        ], function (error, data) {
            if (error) {
                grunt.log.writeln("Something unexpected happened. " + JSON.stringify(error));
                done(error);
            } else {
                grunt.log.writeln(JSON.stringify(data, null, 2));
                done(true);
            }
        });
    });

    grunt.task.registerTask('deploy-test', `Deploys ${FUNCTION_NAME} to test.`, function () {
        const done = this.async();
        async.waterfall([
            function (callback) {
                const params = {
                    FunctionName: FUNCTION_NAME,
                    Name: 'beta'
                };
                lambda.getAlias(params, callback);
            },
            function (data, callback) {
                const params = {
                    FunctionName: FUNCTION_NAME,
                    FunctionVersion: data.FunctionVersion,
                    Name: 'test'
                };
                lambda.updateAlias(params, callback);
            }
        ], function (error, data) {
            if (error) {
                grunt.log.writeln("Something unexpected happened. " + JSON.stringify(error));
                done(error);
            } else {
                grunt.log.writeln(JSON.stringify(data, null, 2));
                done(true);
            }
        });
    });

    grunt.task.registerTask('deprovision-test', `Deprovisions ${FUNCTION_NAME}.`, function () {
        const done = this.async();
        async.waterfall([
            function (callback) {
                const params = {
                    FunctionName: FUNCTION_NAME,
                    Name: 'test'
                };
                lambda.deleteAlias(params, callback);
            }
        ], function (error, data) {
            if (error) {
                grunt.log.writeln("Something unexpected happened. " + JSON.stringify(error));
                done(error);
            } else {
                grunt.log.writeln(JSON.stringify(data, null, 2));
                done(true);
            }
        });
    });

    grunt.task.registerTask('provision-prod', `Provisions ${FUNCTION_NAME}.`, function () {
        const done = this.async();
        async.waterfall([
            function (callback) {
                const params = {
                    FunctionName: FUNCTION_NAME,
                    Name: 'test'
                };
                lambda.getAlias(params, callback);
            },
            function (data, callback) {
                const params = {
                    FunctionName: FUNCTION_NAME,
                    FunctionVersion: data.FunctionVersion,
                    Name: 'prod'
                };
                lambda.createAlias(params, callback);
            }
        ], function (error, data) {
            if (error) {
                grunt.log.writeln("Something unexpected happened. " + JSON.stringify(error));
                done(error);
            } else {
                grunt.log.writeln(JSON.stringify(data, null, 2));
                done(true);
            }
        });
    });

    grunt.task.registerTask('deploy-prod', `Deploys ${FUNCTION_NAME} to prod.`, function () {
        const done = this.async();
        async.waterfall([
            function (callback) {
                const params = {
                    FunctionName: FUNCTION_NAME,
                    Name: 'test'
                };
                lambda.getAlias(params, callback);
            },
            function (data, callback) {
                const params = {
                    FunctionName: FUNCTION_NAME,
                    FunctionVersion: data.FunctionVersion,
                    Name: 'prod'
                };
                lambda.updateAlias(params, callback);
            }
        ], function (error, data) {
            if (error) {
                grunt.log.writeln("Something unexpected happened. " + JSON.stringify(error));
                done(error);
            } else {
                grunt.log.writeln(JSON.stringify(data, null, 2));
                done(true);
            }
        });
    });

    grunt.task.registerTask('deprovision-prod', `Deprovisions ${FUNCTION_NAME}.`, function () {
        const done = this.async();
        async.waterfall([
            function (callback) {
                const params = {
                    FunctionName: FUNCTION_NAME,
                    Name: 'prod'
                };
                lambda.deleteAlias(params, callback);
            }
        ], function (error, data) {
            if (error) {
                grunt.log.writeln("Something unexpected happened. " + JSON.stringify(error));
                done(error);
            } else {
                grunt.log.writeln(JSON.stringify(data, null, 2));
                done(true);
            }
        });
    });

    grunt.task.registerTask('deprovision-all', `Deprovisions ${FUNCTION_NAME}.`, function () {
        const done = this.async();
        async.waterfall([
            function (callback) {
                const params = {
                    FunctionName: FUNCTION_NAME
                };
                lambda.deleteFunction(params, callback);
            }
        ], function (error, data) {
            if (error) {
                grunt.log.writeln("Something unexpected happened. " + JSON.stringify(error));
                done(error);
            } else {
                grunt.log.writeln(JSON.stringify(data, null, 2));
                done(true);
            }
        });
    });

    grunt.registerTask('default', ['verify']);

};
