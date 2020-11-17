# Inspector | Code Execution Monitoring Tool
Simple code execution monitoring, built for NodeJs developers.

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

## Use

It’s important that Inspector is started before you require any other modules 
in your NodeJS application - i.e. before, `express`, `http`, `mysql`, etc.

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

Inspector will monitor your code execution in real time alerting you if something goes wrong.

## Official Documentation

**[See official documentation](https://docs.inspector.dev/platforms/nodejs)**

## LICENSE

This package is licensed under the [MIT](LICENSE) license.
