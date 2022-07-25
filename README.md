# Inspector | Code Execution Monitoring Tool

[![npm version](https://badge.fury.io/js/@inspector-apm%2Finspector-nodejs.svg)](https://badge.fury.io/js/@inspector-apm%2Finspector-nodejs)
[![npm downloads](https://img.shields.io/npm/dt/@inspector-apm/inspector-nodejs)](https://www.npmjs.com/package/@inspector-apm/inspector-nodejs)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](code_of_conduct.md)

Simple code execution monitoring for NodeJs backend applications.

## Install
Install the latest version by:

```
npm install @inspector-apm/inspector-nodejs --save
```

## Configure the Ingestion Key

You need an Ingestion Key to create an Inspector instance. You can obtain a key creating a new project in your [dashboard](https://www.inspector.dev).

If you use `dotenv` you can configure the Ingestion Key in your environment file:

```
INSPECTOR_INGESTION_KEY=[ingestion key]
```

## Integrate in your code

Inspector must be initialized before you require any other modules - i.e. before, `express`, `http`, `mysql`, etc.

```javascript
/*
 * Initialize Inspector with the Ingestion Key.
 */
const inspector = require('@inspector-apm/inspector-nodejs')({
  ingestionKey: 'xxxxxxxxxxxxx',
})

const app = require('express')()

/*
 * Attach the middleware to monitor HTTP requests fulfillment.
 */
app.use(inspector.expressMiddleware())


app.get('/', function (req, res) {
    return res.send('Home Page!')
})

app.get('/posts/:id', function (req, res) {
    return res.send('Single Post Details!')
})

app.listen(3006)
```

Inspector will monitor your code execution in real time, alerting you if something goes wrong.

## Official Documentation

**[Go to the official documentation](https://docs.inspector.dev/platforms/nodejs)**

## Contributing

We encourage you to contribute to Inspector! Please check out the [Contribution Guidelines](CONTRIBUTING.md) about how to proceed. Join us!

## LICENSE

This package is licensed under the [MIT](LICENSE) license.
