const express = require('express');
const router = require('./src/routes/laundry');

function printRoutes(stack, prefix = '') {
    stack.forEach(layer => {
        if (layer.route) {
            const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
            console.log(`${methods} ${prefix}${layer.route.path}`);
        } else if (layer.name === 'router' && layer.handle.stack) {
            printRoutes(layer.handle.stack, prefix + (layer.regexp.source.replace('^\\', '').replace('\\/?(?=\\/|$)', '')));
        } else if (layer.name === 'middleware') {
            console.log(`MIDDLEWARE at ${prefix}`);
        }
    });
}

console.log('--- Registered Laundry Routes ---');
if (router.stack) {
    printRoutes(router.stack);
} else {
    console.log('Router stack not found or empty');
}
