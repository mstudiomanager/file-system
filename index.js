/**
 * @fileoverview Strengthen the ability of file system
 * @author wliao <wliao@Ctrip.com> 
 */
var fs = require('fs');
var util = require('./vendor/util');
var path = require('path');

function checkCbAndOpts(options, callback) {
  if (util.isFunction(options)) {
    return {
      options: null,
      callback: options
    };
  } else if (util.isObject(options)) {
    return {
      options: options,
      callback: callback
    };
  } else {
    return {
      options: null,
      callback: util.noop
    }
  }
}

function getDirs(filepath) {
  filepath = filepath.replace(/\/$/, '').replace(/\\$/, '');

  if (util.path.isAbsolute(filepath)) {
    return filepath.split(path.sep);
  } else {
    return filepath.split('/');
  }
}

/**
 * @description
 * Create dir, if dir don't exists, it will not throw error.
 * And will mkdir for path, it is asynchronous.
 *
 * @example
 * ```js
 *   fs.mkdir('1/2/3/4/5', 511);
 * ```
 */
exports.mkdir = function(filepath, mode, callback) {
  var dirs = getDirs(filepath);
  var length = dirs.length;

  if (util.isFunction(mode)) {
    callback = mode;
    mode = null;
  }

  if (!util.isFunction(callback)) {
    callback = util.noop;
  }

  mode = mode || 511;

  while(length--) {
    exists = fs.existsSync(filepath);
    if (exists) {
      break;
    } else {
      item = dirs[length];
      last = filepath.lastIndexOf(item);
      filepath = filepath.slice(0, last);
    }
  }

  dirs = dirs.slice(length + 1);

  function create(filepath) {
    if (create.count == dirs.length) {
      var err;
      if (!create.count) {
       err = new Error("EEXIST mkdir '" + filepath + "'");
      }

      return callback(err);
    }
    
    filepath = path.join(filepath, dirs[create.count]);

    fs.mkdir(filepath, mode, function(err) {
      create.count++;
      create(filepath);
    });
  }

 create.count = 0;
 create(filepath);
}

/**
 * @description
 * Same as mkdir, but it is synchronous
 */
exports.mkdirSync = function(filepath, mode) {
  var dirs = getDirs(filepath);
  var length = dirs.length;
  var item, last, exists;

  while(length--) {
    exists = fs.existsSync(filepath);
    if (exists) {
      break;
    } else {
      item = dirs[length];
      last = filepath.lastIndexOf(item);
      filepath = filepath.slice(0, last);
    }
  }

  dirs.slice(length + 1).forEach(function(item) {
    filepath = path.join(filepath, item);

    fs.mkdirSync(filepath, mode);
  });
}

/**
 * @description 
 * Create file, if path don't exists, it will not throw error.
 * And will mkdir for path, it is asynchronous
 * 
 * @example
 * ```js
 *   fs.writeFile('path/filename.txt', 'something')
 *   fs.writeFile('path/filename.txt', 'something', {})
 * ```
 */
exports.writeFile = function(filename, data, options, callback) {
  var result = checkCbAndOpts(options, callback);
  var dirname = path.dirname(filename);
  options = result.options;
  callback = result.callback;

  // Create dir first
  exports.mkdir(dirname, function() {
    fs.writeFile(filename, data, options, callback);
  });
}