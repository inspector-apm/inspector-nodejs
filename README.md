# inspector-nodejs
Real-Time monitoring for NodeJs backend applications.

## Install
Install the latest version by:

```
npm install @inspector-apm/inspector-nodejs --save
```

## Use

To start sending data to Inspector you need an API key to create a configuration instance. You can obtain `INSPECTOR_API_KEY` creating a new project in your [Inspector](https://www.inspector.dev) dashboard.

```javascript
const { Inspector } = require('inspector-nodejs')

const inspector = new Inspector({})
```


All start with a `transaction`. Transaction represent an execution cycle and it can contains one or hundred of segments:

```javascript
// Start an execution cycle with a transaction
const transaction = inspector.startTransaction('foo')
```

Use `addSegment` method to monitor a code block in your transaction:

```javascript
// Trace performance of a code block
const segment = await inspector.addSegment(
    async (segment) => {
      // Do something here...
      return segment
    },
    'test async',
    'test label',
  )
```

Inspector will collect information to produce performance chart in your dashboard.

**[See official documentation](https://docs.inspector.dev)**

## LICENSE

This package is licensed under the [MIT](LICENSE) license.
