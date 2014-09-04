forgetsy-js
===========

Nodejs fork of [Forgetsy](https://github.com/cavvia/forgetsy) temporal trending library. This is still work in progress and needs proper testing and still undergoing heavy development. If you discover an issue, please open a ticket to have it resolved or fork and fix :-) The project use [Redis](https://github.com/antirez/redis) as the backend. 

Please fork and make it better.

Installation
------------
npm install [forgetsy-js](https://www.npmjs.org/package/forgetsy-js)

## Usage

### Create a distribution
```javascript
var delta = require('forgetsy-js');

// name of distribution
var name = 'facebook-shares';

// name of bin
var bin = 'my-content-id';

var promise = delta.create({
  name: name
  , time: time
});

promise.then(function(delta) {
  // the distribution was create..
});

promise.catch(function(e) {
  // there was an error creating distribution
});
```

### Increment a bin
```javascript
var promise = delta.get(name);

promise.then(function(delta) {
  var promise = delta.incr({
    bin: bin
    ,by: 1
  });

  promise.then(function() {
    // bin was incremented
  });

  promise.catch(function(e) {
    // bin was not incremented
  })
});
```

### Fetch a distribution (all)
```javascript
var promise = delta.get(name);

promise.then(function(delta) {
  var promise = delta.fetch();

  promise.then(function(trends) {
    console.log(trends);
  })

  promise.catch(function(e) {
    // error fetching distribution
  })
})
```

### Fetch a distribution (one)
```javascript
var promise = delta.get(name);

promise.then(function(delta) {
  // specify the bin to fetch
  var promise = delta.fetch({bin: bin});

  promise.then(function(trends) {
    console.log(trends);
  })

  promise.catch(function(e) {
    // error fetching distribution
  })
})
```

### Example output
```javascript
[
 {'item': 'one': 'score': 0.999999999997154}
,{'item': 'two': 'score': 0.9999999999939523}
]
```

### Testing
npm test