var Set = require('./set2');
var time = require('./time');
var when = require('when');
var connection = require('./connection');
var client = connection.get();
var NORM_T_MULT = 2;

var Delta = function(name) {
  this.name = name;
};

Delta.prototype.init = function(opts) {
  if (!opts.time) {
    throw new Error('Missing time');
  }

  var d = when.defer();
  var self = this;
  var secondaryDate = Date.now() - ((Date.now() - opts.date) * NORM_T_MULT);
  when(Set.create({
    key: this.getPrimaryKey()
    , time: opts.time
    , date: opts.date
    , name: this.name
  })).then(function() {
    when(Set.create({
      key: self.getSecondaryKey()
      , time: opts.time * NORM_T_MULT
      , date: secondaryDate
      , name: self.name
    })).then(d.resolve).otherwise(d.reject);
  }).otherwise(d.reject);

  return d.promise;
};

Delta.prototype.incr = function(opts) {
  var d = when.defer();
  when(this.getSets())
    .then(function(sets) {
      var errors = [];
      var count = 0;      
      var check = function() {
        if (++count >= sets.length) {
          if (errors.length > 0) {
            d.reject(errors);
          } else {
            d.resolve();
          }
        }
      };
      
      sets.forEach(function(set) {
        when(set.incr(opts))
          .then(function(){
            check();
          })
          .otherwise(function(e) {
            console.log('E', e);
            errors.push(e);
            check();
          })
      });
    }).otherwise(d.reject);

  return d.promise;
};

Delta.prototype.incr_by = function(opts) {
  var d = when.defer();
  when(this.getSets())
    .then(function(sets) {
      var errors = [];
      var count = 0;
      var check = function() {
        if (++count >= sets.length) {
          if (errors.length > 0) {
            d.reject(errors);
          } else {
            d.resolve();
          }
        }
      };
      
      sets.forEach(function(i, set) {
        when(set.incr_by(opts))
          .then(function(){
            check();
          })
          .otherwise(function(e) {
            errors.push(e);
            check();
          })
      });
    }).otherwise(d.reject);

  return d.promise;
};

Delta.prototype.exists = function(name) {
  var d = when.defer();

  client.exists(name, function(e, res) {
    if (e) {
      d.reject(e);
    } else {
      d.resolve(res);
    }
  });

  return d.promise;
};

Delta.prototype.getSet = function(key) {
  var d = when.defer();

  when(Set.fetch(key))
    .then(d.resolve)
    .otherwise(d.reject);

  return d.promise;
};

Delta.prototype.getSets = function() {
  var d = when.defer();
  var sets = [];
  var self = this;
  when(this.getSet(this.getPrimaryKey))
    .then(function(set) {
      sets.push(set);
      when(self.getSet(self.getSecondaryKey()))
        .then(function(set) {
          sets.push(set);
          d.resolve(sets);
        }).otherwise(d.reject);
    }).otherwise(d.reject);

  return d.promise;
};

Delta.prototype.getPrimaryKey = function() {
  return this.name;
};

Delta.prototype.getSecondaryKey = function() {
  return this.name + '_2t';
};

/**
@param float opts[t] : mean lifetime of an observation (secs).
@param datetime opts[date] : a manual date to start decaying from.
*/
exports.create = function(opts) {
  var d = when.defer();
  if (!opts.name) {
    throw new Error('Missing distribution name');
  }

  if (!opts.time) {
    throw new Error('Missing mean lifetime');
  }

  opts.date = opts.date || Date.now();

  var delta = new Delta(opts.name);
  when(delta.init(opts))
    .then(function() {
      d.resolve(delta);
    }).otherwise(d.reject);
  return d.promise;
};

exports.fetch = function(name) {
  var d = when.defer();
  var delta = new Delta(name);
  when(delta.exists(name))
    .then(function() {
      d.resolve(delta);
    }).otherwise(reject);
  return d.promise;
};


when(exports.create({name: 'member', time: time.week()}))
  .then(function(delta) {
    when(delta.incr({bin: 'User', date: time.week()}))
      .then(function() {
        console.log('Incremented!');
      }).otherwise(function(e) {
        console.log('Incr Error', e);
      });
  }).otherwise(function(e) {
    console.log('Delta Error', e);
  })