'use strict';

var util = require('./util');

var Observer = window.MutationObserver || window.WebKitMutationObserver;

var arraySlice = Array.prototype.slice;

var dom = {

  array: function(nodes) {
    return arraySlice.call(nodes);
  },

  all: function (node, selector) {
    return dom.array(node.querySelectorAll(selector));
  },

  // "itself" - if true, will start from the element itself
  //            and return it if it matches
  closest: function (node, selector, itself) {
    if (!itself || false) {
      node = node.parentNode;
    }
    while(node) {
      if (this.is(node, selector)) {
        return node;
      }
      node = node.parentNode;
    }
    return null;
  },

  is: function (node) {

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }

    var selectors = arraySlice.call(arguments, 1);
    var is = true;

    selectors.forEach(function (selector) {
      var isClass = selector[0] === '.' &&
                    node.classList.contains(selector.slice(1));
      var isId = selector[0] === '#' && node.id === selector.slice(1);
      var isTag = node.tagName === selector.toUpperCase();

      if (! (isClass || isId || isTag)) {
        is = false;
      }
    });

    return is;
  },

  delegate: function (node, eventName, selector, cb) {
    var handler = function (e) {
      if (!this.is(e.target, selector)) {
        return true;
      }
      cb.bind(e.currentTarget)(e);
    };
    node.addEventListener(eventName, handler.bind(this));
  },

  // try to query element over periods of time
  // then call success or fail callback
  attempt: function (node, selector, delay, attempts, success, fail) {
    var el;

    function query() {
      el = node.querySelector(selector);
      if (attempts > 0 && !el) {
        attempts -= 1;
        setTimeout(query, delay);
      } else if (attempts === 0) {
        if (fail) { fail(); }
      } else {
        if (success) { success(el); }
      }
    }

    query();
  },

  attr: function (nodes, attrs) {
    if (nodes.length === undefined) {
      nodes = [nodes];
    }

    this.array(nodes).forEach(function (node) {
      Object.keys(attrs).forEach(function (attr) {
        node[attr] = attrs[attr];
      });
    });
  },

  style: function (nodes, styles) {
    if (nodes.length === undefined) {
      nodes = [nodes];
    }

    this.array(nodes).forEach(function (node) {
      Object.keys(styles).forEach(function (prop) {
        node.style[prop] = styles[prop];
      });
    });
  },

  hide: function (nodes) {
    this.style(nodes, { display: 'none' });
  },

  create: function (selector, attrs, styles) {
    var parts = selector.split('.');

    var tagName = parts[0] || 'div';

    var node = document.createElement(tagName);

    if (parts.length > 1) {
      node.className = parts.slice(1).join(' ');
    }

    if (attrs !== undefined) {
      this.attr(node, attrs);
    }

    if (styles !== undefined) {
      this.style(node, styles);
    }

    return node;
  },

  onChildAdd: function (selector, selectors, callback) {
    var found = null, that = this;
    var observer = new Observer(function (mutations) {
      mutations.forEach(function (mutation) {
        if (!mutation.addedNodes.length) { return; }
        var addedNodes = that.array(mutation.addedNodes);
        addedNodes.forEach(function (addedNode) {
          if (that.is.apply(that, [addedNode].concat(selectors))) {
            found = addedNode;
          }
        });

        if (found === null) { return callback(null); }
      });

      if (found === null) { return callback(null); }

      callback(found);
    });

    var node = selector;
    if (typeof selector === 'string') {
      node = document.querySelector(selector);
    }

    observer.observe(node, {
      childList: true
    });

    return observer;
  },

  template: {

    parseExpr: function (expr, context) {
      var filters = [],
          value = '',
          args,
          method;

      if (expr.indexOf('|') !== -1) {
        filters = expr.split('|');
        expr = filters.shift();
      }

      if (!Object.hasOwnProperty.call(context, expr)) {
        return '';
      }

      value = context[expr];

      filters.forEach(function (filter) {
        args = filter.split(':');
        method = args.shift();
        if (Object.hasOwnProperty.call(util, method)) {
          value = util[method].apply(util, [value].concat(args));
        }
      });

      return value;
    },

    compile: function (text, context, options) {
      options = util.extend({
        startSymbol: '{{',
        endSymbol: '}}'
      }, options);

      var startIndex,
          endIndex,
          index = 0,
          textLength = text.length,
          expr,
          parsed,
          startSymbolLength = options.startSymbol.length,
          endSymbolLength = options.endSymbol.length;

      while (index < textLength) {
        startIndex = text.indexOf(options.startSymbol, index);
        if (startIndex !== -1) {
          endIndex = text.indexOf(options.endSymbol, startIndex +
                                  startSymbolLength);
          if (endIndex !== -1) {
            expr = text.substring(startIndex + startSymbolLength, endIndex);
            parsed = this.parseExpr(expr, context);

            text = text.substring(0, startIndex) +
                   parsed +
                   text.substring(endIndex + endSymbolLength, text.length - 1);

            index = endIndex + endSymbolLength - expr.length + parsed.length;
            textLength = textLength - expr.length + parsed.length;
          } else {
            break;
          }
        } else {
          break;
        }
      }

      var fragment = document.createElement('div');
      fragment.innerHTML = text;

      return fragment.firstChild;
    }

  }

};

module.exports = dom;