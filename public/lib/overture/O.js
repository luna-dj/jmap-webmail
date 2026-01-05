"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // source/animation/Easing.js
  var Easing_exports = {};
  __export(Easing_exports, {
    bouncelessSpring: () => bouncelessSpring,
    cubicBezier: () => cubicBezier,
    ease: () => ease,
    easeIn: () => easeIn,
    easeInOut: () => easeInOut,
    easeOut: () => easeOut,
    linear: () => linear
  });
  var cubicBezier = function(p1x, p1y, p2x, p2y) {
    const cX = 3 * p1x;
    const bX = 3 * (p2x - p1x) - cX;
    const aX = 1 - cX - bX;
    const cY = 3 * p1y;
    const bY = 3 * (p2y - p1y) - cY;
    const aY = 1 - cY - bY;
    const bezierX = (t) => t * (cX + t * (bX + t * aX));
    const bezierXDerivative = (t) => cX + t * (2 * bX + 3 * aX * t);
    const newtonRaphson = (x) => {
      let prev;
      let t = x;
      do {
        prev = t;
        t = t - (bezierX(t) - x) / bezierXDerivative(t);
      } while (Math.abs(t - prev) > 1e-4);
      return t;
    };
    const output = (x) => {
      if (x === 0 || x === 1) {
        return x;
      }
      const t = newtonRaphson(x);
      return t * (cY + t * (bY + t * aY));
    };
    output.cssName = "cubic-bezier(" + p1x + "," + p1y + "," + p2x + "," + p2y + ")";
    return output;
  };
  var ease = cubicBezier(0.25, 0.1, 0.25, 1);
  var easeIn = cubicBezier(0.42, 0, 1, 1);
  var easeOut = cubicBezier(0, 0, 0.58, 1);
  var easeInOut = cubicBezier(0.42, 0, 0.58, 1);
  var linear = function(n) {
    return n;
  };
  linear.cssName = "linear";
  var bouncelessSpring = ({
    mass = 1,
    stiffness = 100,
    velocity = 0,
    offset = 0
  } = {}) => {
    const undampedAngularFrequency = Math.sqrt(stiffness / mass);
    const A = 1 + offset;
    const B = -velocity + undampedAngularFrequency;
    const output = (x) => {
      const growth = A + B * x;
      const decay = Math.exp(-x * undampedAngularFrequency);
      const t = growth * decay;
      return 1 - t;
    };
    return output;
  };
  bouncelessSpring.cssName = null;

  // source/animation/SpringUtils.js
  var SpringUtils_exports = {};
  __export(SpringUtils_exports, {
    createScreenTransition: () => createScreenTransition,
    createSpringTransition: () => createSpringTransition,
    defaultScreenTransition: () => defaultScreenTransition
  });

  // source/core/Core.js
  var isIdentical = function(a, b) {
    return a === b;
  };
  var isSameObserver = function(a, b) {
    return a.object === b.object && a.method === b.method && a.path === b.path;
  };
  var OBJECT_ALLOCATED = 0;
  var OBJECT_INITIALISED = 1;
  var OBJECT_DESTROYED = 2;
  var Metadata = class {
    constructor(object) {
      this.object = object;
      this.dependents = {};
      this.allDependents = {};
      this.cache = {};
      this.observers = {};
      this.changed = null;
      this.depth = 0;
      this.pathObservers = {};
      this.bindings = {};
      this.inits = {};
      this.lifestage = OBJECT_ALLOCATED;
      object.__meta__ = this;
    }
    /**
            Method: Metadata#addObserver
    
            Called by observer-managing utilities; you should use one of those
            instead! (You probably want to use a decorator to add an observer, or,
            rarely, ObservableProps#addObserverForKey.)
    
            Add an observer to this Metadata object.
    
            When firing observers we always iterate forwards and cache the length
            before we start. This means we can use Array.push rather than replacing
            the whole array; the semantics are the same. We rewrite the array if we
            remove an observer, but this is less common and is more expensive
            regardless as you have to do a splice otherwise.
    
            Parameters:
                key      - {String} The property to observe.
                observer - {Object} An object which contains an 'object' and
                                    'method' key.
    
            Returns:
                {Metadata} Returns self.
        */
    addObserver(key, observer) {
      const observers = this.observers;
      let keyObservers = observers[key];
      if (!keyObservers) {
        keyObservers = observers[key] = [];
      } else if (!observers.hasOwnProperty(key)) {
        keyObservers = observers[key] = keyObservers.slice();
      }
      keyObservers.push(observer);
      return this;
    }
    /**
            Method: Metadata#hasObserver
    
            Called by observer-managing utilities; you should use one of those
            instead!
    
            Check to see if an observer exists on this Metadata object.
    
            Parameters:
                key      - {String} The property to observe.
                observer - {Object} An object which contains an 'object' and
                                    'method' key.
    
            Returns:
                {Metadata} Returns self.
        */
    hasObserver(key, observer) {
      const observers = this.observers;
      const keyObservers = observers[key];
      if (keyObservers) {
        const isSame = typeof observer === "function" ? isIdentical : isSameObserver;
        const l = keyObservers.length;
        for (let i = 0; i < l; i += 1) {
          if (isSame(keyObservers[i], observer)) {
            return true;
          }
        }
      }
      return false;
    }
    /**
            Method: Metadata#removeObserver
    
            Called by observer-managing utilities; you should use one of those
            instead!
    
            Remove the observer from this Metadata object.
    
            Parameters:
                key      - {String} The property to observe.
                observer - {Object} An object which contains an 'object' and
                                    'method' key.
    
            Returns:
                {Metadata} Returns self.
        */
    removeObserver(key, observer) {
      const observers = this.observers;
      const keyObservers = observers[key];
      if (keyObservers) {
        const isSame = typeof observer === "function" ? isIdentical : isSameObserver;
        const newObservers = keyObservers.filter(
          (item) => !isSame(item, observer)
        );
        if (!newObservers.length) {
          observers[key] = null;
        } else if (newObservers.length !== keyObservers.length) {
          observers[key] = newObservers;
        }
      }
      return this;
    }
  };
  var meta = function(object) {
    let data = object.__meta__;
    if (!data) {
      data = new Metadata(object);
    } else if (data.object !== object) {
      data = Object.create(data);
      data.object = object;
      data.cache = {};
      data.observers = Object.create(data.observers);
      data.changed = null;
      data.depth = 0;
      data.bindings = Object.create(data.bindings);
      data.inits = Object.create(data.inits);
      object.__meta__ = data;
    }
    return data;
  };
  var isDestroyed = function(object) {
    return meta(object).lifestage === OBJECT_DESTROYED;
  };
  var guids = /* @__PURE__ */ new WeakMap();
  var nextGuid = 0;
  var guid = function(item) {
    if (item === null) {
      return "null";
    }
    switch (typeof item) {
      case "boolean":
        return item ? "true" : "false";
      case "number":
        return "num:" + item.toString(36);
      case "string":
        return "str:" + item;
      case "undefined":
        return "undefined";
    }
    if (item instanceof Date) {
      return "date:" + +item;
    }
    let itemGuid = item.__guid__ || guids.get(item);
    if (!itemGuid) {
      itemGuid = "id:" + nextGuid.toString(36);
      nextGuid += 1;
      guids.set(item, itemGuid);
    }
    return itemGuid;
  };
  var mixin = function(object, extras, doNotOverwrite) {
    if (extras) {
      const force = !doNotOverwrite;
      let metadata;
      for (const key in extras) {
        if (key !== "__meta__" && (force || !object.hasOwnProperty(key))) {
          const old = object[key];
          const value = extras[key];
          if (old && old.__teardownProperty__) {
            if (!metadata) {
              metadata = meta(object);
            }
            old.__teardownProperty__(metadata, key, object);
          }
          if (value && value.__setupProperty__) {
            if (!metadata) {
              metadata = meta(object);
            }
            value.__setupProperty__(metadata, key, object);
          }
          object[key] = value;
        }
      }
    }
    return object;
  };
  var merge = function(base, extras) {
    for (const key in extras) {
      if (extras.hasOwnProperty(key)) {
        if (base.hasOwnProperty(key) && base[key] && extras[key] && typeof base[key] === "object" && typeof extras[key] === "object") {
          merge(base[key], extras[key]);
        } else {
          base[key] = extras[key];
        }
      }
    }
    return base;
  };
  var clone = function(value) {
    let cloned = value;
    if (value && typeof value === "object") {
      if (value instanceof Array) {
        cloned = [];
        for (let i = value.length - 1; i >= 0; i -= 1) {
          cloned[i] = clone(value[i]);
        }
      } else if (value instanceof Date) {
        cloned = new Date(value);
      } else {
        cloned = {};
        for (const key in value) {
          cloned[key] = clone(value[key]);
        }
      }
    }
    return cloned;
  };
  var isEqual = function(a, b) {
    if (a === b) {
      return true;
    }
    if (a && b && typeof a === "object" && typeof b === "object") {
      if (a instanceof Array) {
        if (b instanceof Array && a.length === b.length) {
          for (let i = 0, l = a.length; i < l; i += 1) {
            if (!isEqual(a[i], b[i])) {
              return false;
            }
          }
          return true;
        }
      } else if (a instanceof Date) {
        return +a === +b;
      } else {
        const constructor = a.constructor;
        if (a.constructor !== b.constructor) {
          return false;
        }
        if (constructor.isEqual) {
          return constructor.isEqual(a, b);
        }
        for (const key in a) {
          if (!isEqual(a[key], b[key])) {
            return false;
          }
        }
        for (const key in b) {
          if (!isEqual(a[key], b[key])) {
            return false;
          }
        }
        return true;
      }
    }
    return false;
  };
  var classes = {};
  var Class = function(params) {
    const parent = params.Extends;
    const init = params.init || function() {
      parent.apply(this, arguments);
    };
    let name = null;
    if (params.hasOwnProperty("Name")) {
      name = params.Name;
      try {
        Object.defineProperty(init, "name", {
          configurable: true,
          value: params.Name
        });
      } catch (error) {
      }
      delete params.Name;
    }
    const proto = parent.prototype;
    init.parent = proto;
    init.prototype = Object.create(proto);
    init.prototype.constructor = init;
    delete params.Extends;
    let mixins = params.Mixin;
    if (mixins) {
      if (!(mixins instanceof Array)) {
        mixins = [mixins];
      }
      for (let i = 0, l = mixins.length; i < l; i += 1) {
        mixin(init.prototype, mixins[i], false);
      }
      delete params.Mixin;
    }
    mixin(init.prototype, params, false);
    classes[name] = init;
    return init;
  };

  // source/core/hex.js
  var HEX_CHARS = "0123456789abcdef".split("");
  var BYTE_TO_HEX = new Array(256);
  for (let i = 0; i < 256; i += 1) {
    BYTE_TO_HEX[i] = HEX_CHARS[i >> 4] + HEX_CHARS[i & 15];
  }

  // source/localisation/i18n.js
  var i18n_exports = {};
  __export(i18n_exports, {
    activeLocaleCode: () => activeLocaleCode,
    addLocale: () => addLocale,
    compare: () => compare,
    date: () => localiseDate,
    fileSize: () => fileSize,
    get: () => get,
    getLocale: () => getLocale,
    letterAlternatives: () => letterAlternatives,
    list: () => localiseList,
    loc: () => localise,
    localise: () => localise,
    makeSearchRegExp: () => makeSearchRegExp,
    number: () => localiseNumber,
    ordinal: () => ordinal,
    regionName: () => localiseRegionName,
    setLocale: () => setLocale
  });

  // source/core/String.js
  var splitter = /%(\+)?(?:'(.))?(-)?(\d+)?(?:\.(\d+))?(?:\$(\d+))?([%sn@])/g;
  var formatString = (string, ...args) => {
    splitter.lastIndex = 0;
    let output = "";
    let i = 0;
    let argIndex = 1;
    let part;
    while (part = splitter.exec(string)) {
      output += string.slice(i, part.index);
      i = part.index + part[0].length;
      const data = args[(parseInt(part[6], 10) || argIndex) - 1];
      let toInsert;
      switch (part[7]) {
        case "%":
          output += "%";
          continue;
        case "s":
          toInsert = data;
          break;
        case "n":
          toInsert = part[1] && data >= 0 ? "+" : "";
          toInsert += part[5] !== void 0 ? data.toFixed(part[5]) : data + "";
          break;
        case "@":
          toInsert = data.toString();
          break;
      }
      let padLength = (part[4] || 0) - toInsert.length;
      if (padLength > 0) {
        const padChar = part[2] || " ";
        let padding = padChar;
        while (padLength -= 1) {
          padding += padChar;
        }
        if (part[3]) {
          toInsert += padding;
        } else {
          toInsert = padding + toInsert;
        }
      }
      output += toInsert;
      argIndex += 1;
    }
    output += string.slice(i);
    return output;
  };
  var escapeRegExp = (string) => {
    return string.replace(/([-.*+?^${}()|[\]/\\])/g, "\\$1");
  };
  var capitalise = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };
  var camelCase = (string) => {
    return string.replace(/-([a-z])/g, (_, letter) => {
      return letter.toUpperCase();
    });
  };
  var hyphenate = (string) => {
    return string.replace(/[A-Z]/g, (letter) => {
      return "-" + letter.toLowerCase();
    });
  };

  // source/localisation/i18n.js
  var locales = {};
  var alternatives = {
    A: "[Aa\xAA\xC0-\xC5\xE0-\xE5\u0100-\u0105\u01CD\u01CE\u0200-\u0203\u0226\u0227\u1D2C\u1D43\u1E00\u1E01\u1E9A\u1EA0-\u1EA3\u2090\u2100\u2101\u213B\u249C\u24B6\u24D0\u3371-\u3374\u3380-\u3384\u3388\u3389\u33A9-\u33AF\u33C2\u33CA\u33DF\u33FF\uFF21\uFF41]",
    B: "[Bb\u1D2E\u1D47\u1E02-\u1E07\u212C\u249D\u24B7\u24D1\u3374\u3385-\u3387\u33C3\u33C8\u33D4\u33DD\uFF22\uFF42]",
    C: "[Cc\xC7\xE7\u0106-\u010D\u1D9C\u2100\u2102\u2103\u2105\u2106\u212D\u216D\u217D\u249E\u24B8\u24D2\u3376\u3388\u3389\u339D\u33A0\u33A4\u33C4-\u33C7\uFF23\uFF43]",
    D: "[Dd\u010E\u010F\u01C4-\u01C6\u01F1-\u01F3\u1D30\u1D48\u1E0A-\u1E13\u2145\u2146\u216E\u217E\u249F\u24B9\u24D3\u32CF\u3372\u3377-\u3379\u3397\u33AD-\u33AF\u33C5\u33C8\uFF24\uFF44]",
    E: "[Ee\xC8-\xCB\xE8-\xEB\u0112-\u011B\u0204-\u0207\u0228\u0229\u1D31\u1D49\u1E18-\u1E1B\u1EB8-\u1EBD\u2091\u2121\u212F\u2130\u2147\u24A0\u24BA\u24D4\u3250\u32CD\u32CE\uFF25\uFF45]",
    F: "[Ff\u1DA0\u1E1E\u1E1F\u2109\u2131\u213B\u24A1\u24BB\u24D5\u338A-\u338C\u3399\uFB00-\uFB04\uFF26\uFF46]",
    G: "[Gg\u011C-\u0123\u01E6\u01E7\u01F4\u01F5\u1D33\u1D4D\u1E20\u1E21\u210A\u24A2\u24BC\u24D6\u32CC\u32CD\u3387\u338D-\u338F\u3393\u33AC\u33C6\u33C9\u33D2\u33FF\uFF27\uFF47]",
    H: "[Hh\u0124\u0125\u021E\u021F\u02B0\u1D34\u1E22-\u1E2B\u1E96\u210B-\u210E\u24A3\u24BD\u24D7\u32CC\u3371\u3390-\u3394\u33CA\u33CB\u33D7\uFF28\uFF48]",
    I: "[Ii\xCC-\xCF\xEC-\xEF\u0128-\u0130\u0132\u0133\u01CF\u01D0\u0208-\u020B\u1D35\u1D62\u1E2C\u1E2D\u1EC8-\u1ECB\u2071\u2110\u2111\u2139\u2148\u2160-\u2163\u2165-\u2168\u216A\u216B\u2170-\u2173\u2175-\u2178\u217A\u217B\u24A4\u24BE\u24D8\u337A\u33CC\u33D5\uFB01\uFB03\uFF29\uFF49]",
    J: "[Jj\u0132-\u0135\u01C7-\u01CC\u01F0\u02B2\u1D36\u2149\u24A5\u24BF\u24D9\u2C7C\uFF2A\uFF4A]",
    K: "[Kk\u0136\u0137\u01E8\u01E9\u1D37\u1D4F\u1E30-\u1E35\u212A\u24A6\u24C0\u24DA\u3384\u3385\u3389\u338F\u3391\u3398\u339E\u33A2\u33A6\u33AA\u33B8\u33BE\u33C0\u33C6\u33CD-\u33CF\uFF2B\uFF4B]",
    L: "[Ll\u0139-\u0140\u01C7-\u01C9\u02E1\u1D38\u1E36\u1E37\u1E3A-\u1E3D\u2112\u2113\u2121\u216C\u217C\u24A7\u24C1\u24DB\u32CF\u3388\u3389\u33D0-\u33D3\u33D5\u33D6\u33FF\uFB02\uFB04\uFF2C\uFF4C]",
    M: "[Mm\u1D39\u1D50\u1E3E-\u1E43\u2120\u2122\u2133\u216F\u217F\u24A8\u24C2\u24DC\u3377-\u3379\u3383\u3386\u338E\u3392\u3396\u3399-\u33A8\u33AB\u33B3\u33B7\u33B9\u33BD\u33BF\u33C1\u33C2\u33CE\u33D0\u33D4-\u33D6\u33D8\u33D9\u33DE\u33DF\uFF2D\uFF4D]",
    N: "[Nn\xD1\xF1\u0143-\u0149\u01CA-\u01CC\u01F8\u01F9\u1D3A\u1E44-\u1E4B\u207F\u2115\u2116\u24A9\u24C3\u24DD\u3381\u338B\u339A\u33B1\u33B5\u33BB\u33CC\u33D1\uFF2E\uFF4E]",
    O: "[Oo\xBA\xD2-\xD6\xF2-\xF6\u014C-\u0151\u01A0\u01A1\u01D1\u01D2\u01EA\u01EB\u020C-\u020F\u022E\u022F\u1D3C\u1D52\u1ECC-\u1ECF\u2092\u2105\u2116\u2134\u24AA\u24C4\u24DE\u3375\u33C7\u33D2\u33D6\uFF2F\uFF4F]",
    P: "[Pp\u1D3E\u1D56\u1E54-\u1E57\u2119\u24AB\u24C5\u24DF\u3250\u3371\u3376\u3380\u338A\u33A9-\u33AC\u33B0\u33B4\u33BA\u33CB\u33D7-\u33DA\uFF30\uFF50]",
    Q: "[Qq\u211A\u24AC\u24C6\u24E0\u33C3\uFF31\uFF51]",
    R: "[Rr\u0154-\u0159\u0210-\u0213\u02B3\u1D3F\u1D63\u1E58-\u1E5B\u1E5E\u1E5F\u20A8\u211B-\u211D\u24AD\u24C7\u24E1\u32CD\u3374\u33AD-\u33AF\u33DA\u33DB\uFF32\uFF52]",
    S: "[Ss\u015A-\u0161\u017F\u0218\u0219\u02E2\u1E60-\u1E63\u20A8\u2101\u2120\u24AE\u24C8\u24E2\u33A7\u33A8\u33AE-\u33B3\u33DB\u33DC\uFB06\uFF33\uFF53]",
    T: "[Tt\u0162-\u0165\u021A\u021B\u1D40\u1D57\u1E6A-\u1E71\u1E97\u2121\u2122\u24AF\u24C9\u24E3\u3250\u32CF\u3394\u33CF\uFB05\uFB06\uFF34\uFF54]",
    U: "[Uu\xD9-\xDC\xF9-\xFC\u0168-\u0173\u01AF\u01B0\u01D3\u01D4\u0214-\u0217\u1D41\u1D58\u1D64\u1E72-\u1E77\u1EE4-\u1EE7\u2106\u24B0\u24CA\u24E4\u3373\u337A\uFF35\uFF55]",
    V: "[Vv\u1D5B\u1D65\u1E7C-\u1E7F\u2163-\u2167\u2173-\u2177\u24B1\u24CB\u24E5\u2C7D\u32CE\u3375\u33B4-\u33B9\u33DC\u33DE\uFF36\uFF56]",
    W: "[Ww\u0174\u0175\u02B7\u1D42\u1E80-\u1E89\u1E98\u24B2\u24CC\u24E6\u33BA-\u33BF\u33DD\uFF37\uFF57]",
    X: "[Xx\u02E3\u1E8A-\u1E8D\u2093\u213B\u2168-\u216B\u2178-\u217B\u24B3\u24CD\u24E7\u33D3\uFF38\uFF58]",
    Y: "[Yy\xDD\xFD\xFF\u0176-\u0178\u0232\u0233\u02B8\u1E8E\u1E8F\u1E99\u1EF2-\u1EF9\u24B4\u24CE\u24E8\u33C9\uFF39\uFF59]",
    Z: "[Zz\u0179-\u017E\u01F1-\u01F3\u1DBB\u1E90-\u1E95\u2124\u2128\u24B5\u24CF\u24E9\u3390-\u3394\uFF3A\uFF5A]"
  };
  var active = null;
  var activeLocaleCode = "";
  var addLocale = (locale) => {
    locales[locale.code] = locale;
  };
  var setLocale = (localeCode) => {
    if (locales[localeCode]) {
      active = locales[localeCode];
      activeLocaleCode = localeCode;
      if (typeof Intl !== "undefined") {
        compare = new Intl.Collator(localeCode, {
          sensitivity: "base"
        }).compare;
      }
    }
  };
  var getLocale = (localeCode) => localeCode ? locales[localeCode] || null : active;
  var get = (key) => active[key];
  var localise = (text, ...args) => {
    const translation = active.translations[text];
    if (translation === void 0) {
      return text;
    }
    return translation(active, args);
  };
  var localiseList = (items, type = "conjunction") => typeof Intl !== "undefined" && Intl.ListFormat ? new Intl.ListFormat(activeLocaleCode, {
    style: "short",
    type
  }).format(items) : items.join(", ");
  var localiseRegionName = (isoCode) => active.getRegionName(isoCode);
  var localiseDate = (date2, type, utc) => active.getFormattedDate(date2, type, utc);
  var localiseNumber = (n) => active.getFormattedNumber(n);
  var ordinal = (n) => active.getFormattedOrdinal(n);
  var fileSize = (bytes, decimalPlaces) => active.getFormattedFileSize(bytes, decimalPlaces);
  var compare = (a, b) => a.toLowerCase().localeCompare(b.toLowerCase());
  var makeSearchRegExp = (string) => {
    let anchorToStart = true;
    let source = string.trim().replace(/[-.*+?^${}()|[\]/\\ A-Z]/gi, (char, index, _string) => {
      switch (char) {
        case "*": {
          if (!index) {
            anchorToStart = false;
            return "";
          }
          const next = _string.charAt(index + 1);
          if (!next) {
            return "";
          }
          return "[^" + escapeRegExp(next) + "]*";
        }
        case "?":
          return ".";
        case " ":
          return "|";
        default:
          if (/[A-Z]/i.test(char)) {
            return alternatives[char.toUpperCase()];
          }
          return "\\" + char;
      }
    });
    if (anchorToStart) {
      source = "(^|\\W|_)(" + source + ")";
    } else {
      source = "()(" + source + ")";
    }
    return new RegExp(source, "i");
  };
  var letterAlternatives = alternatives;

  // source/core/sortByProperties.js
  var sortByProperties = function(properties) {
    if (!(properties instanceof Array)) {
      properties = [properties];
    }
    const l = properties.length;
    return (a, b) => {
      const hasGet = !!a.get;
      for (let i = 0; i < l; i += 1) {
        let prop = properties[i];
        let reverse = false;
        let emptyIsFirst = true;
        if (prop.startsWith("-")) {
          prop = prop.slice(1);
          reverse = true;
        }
        if (prop.startsWith("!")) {
          prop = prop.slice(1);
          emptyIsFirst = false;
        }
        let aVal = hasGet ? a.get(prop) : a[prop];
        let bVal = hasGet ? b.get(prop) : b[prop];
        let type = typeof aVal;
        if (type !== typeof bVal) {
          aVal = aVal ? String(aVal) : "";
          bVal = bVal ? String(bVal) : "";
          type = "string";
        }
        if (aVal === bVal) {
          continue;
        }
        if (reverse) {
          const temp = aVal;
          aVal = bVal;
          bVal = temp;
        }
        if (type !== "number") {
          if (!aVal) {
            return emptyIsFirst ? -1 : 1;
          }
          if (!bVal) {
            return emptyIsFirst ? 1 : -1;
          }
        }
        if (type === "string") {
          return compare(aVal, bVal);
        }
        if (aVal < bVal) {
          return -1;
        }
        if (aVal > bVal) {
          return 1;
        }
      }
      return 0;
    };
  };

  // source/core/KeyValue.js
  var KeyValue_exports = {};
  __export(KeyValue_exports, {
    filter: () => filter,
    fromQueryString: () => fromQueryString,
    keyOf: () => keyOf,
    zip: () => zip
  });
  var keyOf = (object, value) => {
    for (const key in object) {
      if (object[key] === value) {
        return key;
      }
    }
    return null;
  };
  var filter = (object, include) => {
    const result = {};
    for (const key in object) {
      if (include[key]) {
        result[key] = object[key];
      }
    }
    return result;
  };
  var zip = (keys2, values) => {
    const object = {};
    for (let i = 0, l = Math.min(keys2.length, values.length); i < l; i += 1) {
      object[keys2[i]] = values[i];
    }
    return object;
  };
  var fromQueryString = (query) => {
    const result = {};
    query.split("&").forEach((pair) => {
      const parts = pair.split("=").map(decodeURIComponent);
      result[parts[0]] = parts[1];
    });
    return result;
  };

  // source/core/Math.js
  var Math_exports = {};
  __export(Math_exports, {
    limit: () => limit,
    mod: () => mod
  });
  var limit = (number, min, max) => number < min ? min : number > max ? max : number;
  var mod = (number, n) => {
    const m = number % n;
    return m < 0 ? m + n : m;
  };

  // source/core/RegExp.js
  var RegExp_exports = {};
  __export(RegExp_exports, {
    domain: () => domain,
    domainPattern: () => domainPattern,
    email: () => email,
    emailAndQueryParamsPattern: () => emailAndQueryParamsPattern,
    emailPattern: () => emailPattern,
    url: () => url,
    urlPattern: () => urlPattern
  });
  var domainPattern = "(?:[a-z0-9](?:[a-z0-9\\-]{0,61}[a-z0-9])?\\.)+[a-z]{2,}";
  var domainAndPortPattern = domainPattern + "(?:[:]\\d{2,5})?";
  var domain = new RegExp("^" + domainPattern + "$", "i");
  var emailPattern = "[\\w\\-.%+]+@" + domainPattern + "\\b";
  var emailAndQueryParamsPattern = emailPattern + // Allow query parameters in the mailto: style
  "(?:[?][^&?\\s]+=[^\\s?&`!()\\[\\]{};:'\".,<>\xAB\xBB\u201C\u201D\u2018\u2019]+(?:&[^&?\\s]+=[^\\s?&`!()\\[\\]{};:'\".,<>\xAB\xBB\u201C\u201D\u2018\u2019]+)*)?";
  var email = new RegExp("(" + emailPattern + ")", "i");
  var urlPattern = "(?:https?://" + domainAndPortPattern + "|(?<![@/])" + domainAndPortPattern + "(?![@a-z0-9]))(?:[/?#](?:[a-z0-9\\-._~:/?#@!$&'*+,;=%]*[a-z0-9\\-_~/$*=]|\\([a-z0-9\\-._~:/?#@!$&'*+,;=%\\[\\]]+?\\))+)?";
  try {
    new RegExp(urlPattern);
  } catch (error) {
    urlPattern = urlPattern.replace("(?<![@/])", "");
  }
  var url = new RegExp("\\b" + urlPattern, "i");

  // source/animation/SpringUtils.js
  var estimateSpringDuration = (easing, maxDuration = 1e3) => {
    maxDuration /= 1e3;
    const timestep = 1 / 120;
    let elapsedDuration = 0;
    let isDone = false;
    do {
      elapsedDuration += timestep;
      isDone = Math.abs(1 - easing(elapsedDuration)) < timestep;
    } while (!isDone && elapsedDuration < maxDuration);
    return elapsedDuration * 1e3;
  };
  var createSpringTransition = (springOptions) => {
    const easing = bouncelessSpring(springOptions);
    const duration2 = estimateSpringDuration(easing);
    return { duration: duration2, easing };
  };
  var createScreenTransition = (velocity = 1, offset = 0) => createSpringTransition({
    velocity: limit(velocity, 0, 10),
    offset,
    mass: 0.23,
    stiffness: 30
  });
  var defaultScreenTransition = createScreenTransition();

  // source/dom/DOMEvent.js
  var DOMEvent_exports = {};
  __export(DOMEvent_exports, {
    isClickModified: () => isClickModified,
    keys: () => keys,
    lookupKey: () => lookupKey
  });
  var keys = {
    8: "Backspace",
    9: "Tab",
    13: "Enter",
    16: "Shift",
    17: "Control",
    18: "Alt",
    20: "CapsLock",
    27: "Escape",
    32: "Space",
    33: "PageUp",
    34: "PageDown",
    35: "End",
    36: "Home",
    37: "ArrowLeft",
    38: "ArrowUp",
    39: "ArrowRight",
    40: "ArrowDown",
    46: "Delete",
    144: "NumLock"
  };
  var keyReplacements = {
    // For our own convenience
    " ": "Space",
    // For some older browsers (specifically, Firefox < 37)
    "Left": "ArrowLeft",
    "Right": "ArrowRight",
    "Up": "ArrowUp",
    "Down": "ArrowDown",
    // For iOS Safari/WKWebView, to work around
    // https://bugreport.apple.com/web/?problemID=37144181
    "UIKeyInputEscape": "Escape",
    "UIKeyInputLeftArrow": "ArrowLeft",
    "UIKeyInputRightArrow": "ArrowRight",
    "UIKeyInputUpArrow": "ArrowUp",
    "UIKeyInputDownArrow": "ArrowDown"
  };
  var lookupKey = function(event, noModifiers) {
    const isKeyPress = event.type === "keypress";
    let key = event.key;
    if (!key || event.altKey) {
      const code = event.keyCode || event.which;
      const preferAscii = isKeyPress && code > 32 && event.which !== 0 && event.charCode !== 0;
      const str = String.fromCharCode(code);
      key = !preferAscii && keys[code] || str;
      if (!preferAscii && 111 < code && code < 124) {
        key = "F" + (code - 111);
      }
    } else {
      key = keyReplacements[key] || key;
    }
    if (/^[A-Za-z]$/.test(key)) {
      key = event.shiftKey ? key.toUpperCase() : key.toLowerCase();
    }
    let modifiers = "";
    if (!noModifiers) {
      const altAndShift = !isKeyPress || /[a-z]/.test(key);
      if (event.altKey && altAndShift) {
        modifiers += "Alt-";
      }
      if (event.ctrlKey) {
        modifiers += "Ctrl-";
      }
      if (event.metaKey) {
        modifiers += "Meta-";
      }
      if (event.shiftKey && altAndShift) {
        modifiers += "Shift-";
      }
    }
    return modifiers + key;
  };
  var isClickModified = function(event) {
    return !!event.button || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
  };

  // source/foundation/BoundProps.js
  var bindingKey = "__binding__";
  var BoundProps = {
    /**
            Method: O.BoundProps#initBindings
    
            Initialises bound properties. Creates a new Binding object if the
            binding is inherited, then connects it to the appropriate key and does
            an initial sync. You should never call this directly, but rather iterate
            through the keys of `O.meta( this ).inits`, calling
            `this[ 'init' + key ]()` for all keys which map to a truthy value.
    
            Returns:
                {O.BoundProps} Returns self.
        */
    initBindings() {
      const bindings = meta(this).bindings;
      for (const key in bindings) {
        let binding;
        if (binding = bindings[key]) {
          if (!bindings.hasOwnProperty(key)) {
            binding = bindings[key] = Object.create(binding);
          }
          this[key] = void 0;
          binding.to(key, this).connect();
        }
      }
      return this;
    },
    /**
            Method: O.BoundProps#destroyBindings
    
            Disconnect and destroy all bindings connected to this object. You should
            never call this directly, but rather iterate through the keys of
            `O.meta( this ).inits`, calling `this[ 'destroy' + key ]()` for all keys
            which map to a truthy value.
    
            Returns:
                {O.BoundProps} Returns self.
        */
    destroyBindings() {
      const bindings = meta(this).bindings;
      for (const key in bindings) {
        const binding = bindings[key];
        if (binding) {
          binding.destroy();
        }
      }
      return this;
    },
    /**
            Method: O.BoundProps#registerBinding
    
            Call this whenever you add a binding to an object after initialisation,
            otherwise suspend/remove/destroy will not work correctly.
    
            Returns:
                {O.BoundProps} Returns self.
        */
    registerBinding(binding) {
      const metadata = meta(this);
      metadata.bindings[bindingKey + guid(binding)] = binding;
      metadata.inits.Bindings = (metadata.inits.Bindings || 0) + 1;
      return this;
    },
    /**
            Method: O.BoundProps#deregisterBinding
    
            Call this if you destroy a binding to this object before the object
            itself is destroyed.
    
            Returns:
                {O.BoundProps} Returns self.
        */
    deregisterBinding(binding) {
      const metadata = meta(this);
      const bindings = metadata.bindings;
      const key = keyOf(bindings, binding);
      if (key) {
        bindings[key] = null;
        metadata.inits.Bindings -= 1;
      }
      return this;
    },
    /**
            Method: O.BoundProps#suspendBindings
    
            Suspend all bindings to the object. This means that any bindings to the
            object will still note if there is a change, but will not sync that
            change until the binding is resumed.
    
            Returns:
                {O.BoundProps} Returns self.
        */
    suspendBindings() {
      const bindings = meta(this).bindings;
      for (const key in bindings) {
        const binding = bindings[key];
        if (binding) {
          binding.suspend();
        }
      }
      return this;
    },
    /**
            Method: O.BoundProps#resumeBindings
    
            Resume (and sync if necessary) all bindings to the object.
    
            Returns:
                {O.BoundProps} Returns self.
        */
    resumeBindings() {
      const bindings = meta(this).bindings;
      for (const key in bindings) {
        const binding = bindings[key];
        if (binding) {
          binding.resume();
        }
      }
      return this;
    }
  };

  // source/foundation/getFromPath.js
  var isNum = /^\d+$/;
  var getFromPath = function(root, path) {
    let currentPosition = 0;
    const pathLength = path.length;
    while (currentPosition < pathLength) {
      if (!root) {
        return void 0;
      }
      let nextDot = path.indexOf(".", currentPosition);
      if (nextDot === -1) {
        nextDot = pathLength;
      }
      const key = path.slice(currentPosition, nextDot);
      root = root.getObjectAt && isNum.test(key) ? root.getObjectAt(+key) : root.get ? root.get(key) : root[key];
      currentPosition = nextDot + 1;
    }
    return root;
  };

  // source/foundation/Enumerable.js
  var defaultComparator = function(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
  };
  var createCallback = function(callback, bind2) {
    if (!bind2) {
      return callback;
    }
    return function(value, index, enumerable) {
      return callback.call(bind2, value, index, enumerable);
    };
  };
  var Enumerable = {
    // :: Accessor methods =====================================================
    /**
            Method: O.Enumerable#first
    
            Returns:
                {*} The first item in the enumerable.
        */
    first() {
      return this.getObjectAt(0);
    },
    /**
            Method: O.Enumerable#last
    
            Returns:
                {*} The last item in the enumerable.
        */
    last() {
      return this.getObjectAt(this.get("length") - 1);
    },
    /**
            Method: O.Enumerable#indexOf
    
            Returns the index in the enumerable of the first occurrence of an item.
    
            Parameters:
                item - {*} The item to search for.
                from - {Number} (optional) The index to start searching from.
    
            Returns:
                {Number} The (first) index in the array of the item or -1 if not
                found.
        */
    indexOf(item, from) {
      const l = this.get("length");
      for (from = from < 0 ? Math.max(0, l + from) : from || 0; from < l; from += 1) {
        if (this.getObjectAt(from) === item) {
          return from;
        }
      }
      return -1;
    },
    /**
            Method: O.Enumerable#lastIndexOf
    
            Returns the index in the enumerable of the last occurrence of an item.
    
            Parameters:
                item - {*} The item to search for.
                from - {Number} (optional) The index to start searching from.
    
            Returns:
                {Number} The (last) index in the array of the item or -1 if not
                found.
        */
    lastIndexOf(item, from) {
      const l = this.get("length");
      for (from = from < 0 ? l + from : from || l - 1; from >= 0; from -= 1) {
        if (this.getObjectAt(from) === item) {
          return from;
        }
      }
      return -1;
    },
    /**
            Method: O.Enumerable#binarySearch
    
            *Presumes the enumerable is sorted.*
    
            Does a binary search on the enumerable to find the index for the given
            value, or if not in the enumerable, then the index at which it should
            be inserted to maintain the ordering.
    
            Parameters:
                value      - {*} The value to search for in the enumerable.
                comparator - {Function} (optional). A comparator function. If not
                             supplied, the comparison will be made simply by the `<`
                             infix comparator.
    
            Returns:
                {Number} The index to place the value in the sorted enumerable.
        */
    binarySearch(value, comparator) {
      let lower = 0;
      let upper = this.get("length");
      if (!comparator) {
        comparator = defaultComparator;
      }
      while (lower < upper) {
        const middle = lower + upper >> 1;
        const candidate = this.getObjectAt(middle);
        if (comparator(candidate, value) < 0) {
          lower = middle + 1;
        } else {
          upper = middle;
        }
      }
      return lower;
    },
    /**
            Method: O.Enumerable#includes
    
            Tests whether the item is in the enumerable.
    
            Parameters:
                item - {*} The item to check.
                from - {Number} (optional) The index to start searching from.
    
            Returns:
                {Boolean} True if the item is present.
        */
    includes(item, from) {
      return this.indexOf(item, from) > -1;
    },
    /**
            Method: O.Enumerable#find
    
            Tests each item in the enumerable with a given function and returns the
            first item for which the function returned a truthy value. The function
            will be supplied with 3 parameters when called:
    
            1. The value.
            2. The index of the value in the enumerable.
            3. The enumerable itself.
    
            Parameters:
                fn   - {Function} The function to test each value with.
                bind - {Object} (optional) The object to bind the 'this' parameter
                       to on each call of the function.
    
            Returns:
                {*} The object found, or null if none found.
        */
    find(fn, bind2) {
      const callback = createCallback(fn, bind2);
      for (let i = 0, l = this.get("length"); i < l; i += 1) {
        const value = this.getObjectAt(i);
        if (callback(value, i, this)) {
          return value;
        }
      }
      return null;
    },
    /**
            Method: O.Enumerable#findLast
    
            Tests each item in the enumerable with a given function and returns the
            last item for which the function returned a truthy value. The function
            will be supplied with 3 parameters when called:
    
            1. The value.
            2. The index of the value in the enumerable.
            3. The enumerable itself.
    
            Parameters:
                fn   - {Function} The function to test each value with.
                bind - {Object} (optional) The object to bind the 'this' parameter
                       to on each call of the function.
    
            Returns:
                {*} The object found, or null if none found.
        */
    findLast(fn, bind2) {
      const callback = createCallback(fn, bind2);
      for (let i = this.get("length") - 1; i >= 0; i -= 1) {
        const value = this.getObjectAt(i);
        if (callback(value, i, this)) {
          return value;
        }
      }
      return null;
    },
    // :: Iteration methods ====================================================
    /**
            Method: O.Enumerable#forEach
    
            Applies the given function to each item in the enumerable. The function
            will be supplied with 3 parameters when called:
    
            1. The value.
            2. The index of the value in the enumerable.
            3. The enumerable itself.
    
            Parameters:
                fn   - {Function} The function to apply to each value.
                bind - {Object} (optional) The object to bind the 'this' parameter
                       to on each call of the function.
    
            Returns:
                {O.Enumerable} Returns self.
        */
    forEach(fn, bind2) {
      const callback = createCallback(fn, bind2);
      for (let i = 0, l = this.get("length"); i < l; i += 1) {
        callback(this.getObjectAt(i), i, this);
      }
      return this;
    },
    /**
            Method: O.Enumerable#filter
    
            Tests each item in the enumerable with a given function and returns an
            array of all items for which the function returned a truthy value. The
            function will be supplied with 3 parameters when called:
    
            1. The value.
            2. The index of the value in the enumerable.
            3. The enumerable itself.
    
            Parameters:
                fn   - {Function} The function to test each value with.
                bind - {Object} (optional) The object to bind the 'this' parameter
                       to on each call of the function.
    
            Returns:
                {Array} The items which were accepted by the function.
        */
    filter(fn, bind2) {
      const callback = createCallback(fn, bind2);
      const results = [];
      for (let i = 0, l = this.get("length"); i < l; i += 1) {
        const value = this.getObjectAt(i);
        if (callback(value, i, this)) {
          results.push(value);
        }
      }
      return results;
    },
    /**
            Method: O.Enumerable#take
    
            Filters the array with an acceptance function, stopping when the max
            desired number of elements have been found, thereby preventing iteration
            of the entire list.
    
            The acceptance function will be supplied with 3 parameters when called:
    
            1. The value.
            2. The index of the value in the enumerable.
            3. The enumerable itself.
    
            Parameters:
                max  - {Number} The max number of elements in the returned array.
                fn   - {Function} The function to test each value with.
                bind - {Object} (optional) The object to bind the 'this' parameter
                       to on each call of the function.
    
            Returns:
                {Array} The items which were accepted by the function, limited by
                the `max` number allowed.
        */
    take(max, fn, bind2) {
      if (!fn) {
        fn = () => true;
      }
      const accept = createCallback(fn, bind2);
      let count = 0;
      const results = [];
      for (let i = 0, l = this.get("length"); i < l && count < max; i += 1) {
        const value = this.getObjectAt(i);
        if (accept(value, i, this)) {
          results.push(value);
          count += 1;
        }
      }
      return results;
    },
    /**
            Method: O.Enumerable#map
    
            Applies the given function to each item in the enumerable and returns an
            array of all the results. The function will be supplied with 3
            parameters when called:
    
            1. The value.
            2. The index of the value in the enumerable.
            3. The enumerable itself.
    
            Parameters:
                fn   - {Function} The function to apply to each value.
                bind - {Object} (optional) The object to bind the 'this' parameter
                       to on each call of the function.
    
            Returns:
                {Array} The result of each function call.
        */
    map(fn, bind2) {
      const callback = createCallback(fn, bind2);
      const results = [];
      for (let i = 0, l = this.get("length"); i < l; i += 1) {
        results[i] = callback(this.getObjectAt(i), i, this);
      }
      return results;
    },
    /**
            Method: O.Enumerable#flatMap
    
            Applies the given function to each item in the enumerable and returns an
            array of all the results, and then flattening the result by one level.
    
            The function will be supplied with 3 parameters when called:
    
            1. The value.
            2. The index of the value in the enumerable.
            3. The enumerable itself.
    
            Parameters:
                fn   - {Function} The function to apply to each value.
                bind - {Object} (optional) The object to bind the 'this' parameter
                       to on each call of the function.
    
            Returns:
                {Array} The result of each function call.
        */
    flatMap(fn, bind2) {
      const callback = createCallback(fn, bind2);
      const results = [];
      for (let i = 0, l = this.get("length"); i < l; i += 1) {
        const result = callback(this.getObjectAt(i), i, this);
        if (Array.isArray(result)) {
          results.push(...result.flat());
        } else {
          results.push(result);
        }
      }
      return results;
    },
    /**
            Method: O.Enumerable#reduce
    
            ECMAScript 5 reduce method.
    
            Parameters:
                fn      - {Function} The function to apply to the accumulator and
                          each item in the array.
                initial - {*} (optional) The initial value of the accumulator. Taken
                          to be the first value in the array if not supplied.
    
            Returns:
                {*} The reduced value.
        */
    reduce(fn, initial) {
      let i = 0;
      const l = this.get("length");
      let acc;
      if (!l && arguments.length === 1) {
        throw new TypeError(
          "reduce of empty enumerable with no initial value"
        );
      }
      if (arguments.length >= 2) {
        acc = initial;
      } else {
        acc = this.getObjectAt(0);
        i = 1;
      }
      for (; i < l; i += 1) {
        acc = fn(acc, this.getObjectAt(i), i, this);
      }
      return acc;
    },
    /**
            Method: O.Enumerable#every
    
            Applies the given function to each item in the enumerable until it finds
            one for which the function returns a falsy value. The function will be
            supplied with 3 parameters when called:
    
            1. The value.
            2. The index of the value in the enumerable.
            3. The enumerable itself.
    
            Parameters:
                fn   - {Function} The function to apply to test the values with.
                bind - {Object} (optional) The object to bind the 'this' parameter
                       to on each call of the function.
    
            Returns:
                {Boolean} Were all items accepted by the function?
        */
    every(fn, bind2) {
      const callback = createCallback(fn, bind2);
      for (let i = 0, l = this.get("length"); i < l; i += 1) {
        if (!callback(this.getObjectAt(i), i, this)) {
          return false;
        }
      }
      return true;
    },
    /**
            Method: O.Enumerable#some
    
            Applies the given function to each item in the enumerable until it finds
            one for which the function returns a truthy value. The function will be
            supplied with 3 parameters when called:
    
            1. The value.
            2. The index of the value in the enumerable.
            3. The enumerable itself.
    
            Parameters:
                fn   - {Function} The function to apply to test the values with.
                bind - {Object} (optional) The object to bind the 'this' parameter
                       to on each call of the function.
    
            Returns:
                {Boolean} Did the function accept at least one item?
        */
    some(fn, bind2) {
      const callback = createCallback(fn, bind2);
      for (let i = 0, l = this.get("length"); i < l; i += 1) {
        if (callback(this.getObjectAt(i), i, this)) {
          return true;
        }
      }
      return false;
    },
    /**
            Method: O.Enumerable#slice
    
            Returns a new array consisting of the elements from the 'start' index to
            the 'end' index (not inclusive) of the array upon which this method is
            called. The original array will not be modified.
    
            Parameters:
                start - {Number} (optional) The index at which to begin copying
                        elements from the original array.
                end   - {Number} (optional) The index at which to stop copying
                        elements from the original array. The item at this index is
                        not copied.
    
            Returns:
                {Array} The new array containing the extracted elements.
        */
    slice(start = 0, end) {
      const length = this.get("length");
      if (!end) {
        end = length;
      } else if (end < 0) {
        end = Math.max(0, length + end);
      }
      const array = new Array(end - start);
      for (let i = start, l = end; i < l; i += 1) {
        array[i - start] = this.getObjectAt(i);
      }
      return array;
    }
  };

  // source/core/Array.js
  Object.assign(Array.prototype, {
    /**
            Method: Array#get
    
            Returns the property of the object with the name given as the only
            parameter.
    
            Parameters:
                key - {String} The name of the property to return.
    
            Returns:
                {*} The requested property of this array.
        */
    get(key) {
      return this[key];
    },
    /**
            Method: Array#set
    
            Sets the value of a given property on the Array.
    
            Parameters:
                key   - {String} The name of the property to set.
                value - {*} The value to set the property to.
    
            Returns:
                {Array} Returns self.
        */
    set(key, value) {
      this[key] = value;
      return this;
    },
    /**
            Method: Array#getObjectAt
    
            Returns the value at a given index in the array.
    
            Parameters:
                index - {Number} The index of the value to return.
    
            Returns:
                {*} The value at the given index in this array.
        */
    getObjectAt(index) {
      return this[index];
    },
    /**
            Method: Array#setObjectAt
    
            Sets the value at a given index in the array.
    
            Parameters:
                index - {Number} The index at which to set the value.
                value - {*} The value to set at the given index.
    
            Returns:
                {Array} Returns self.
        */
    setObjectAt(index, value) {
      this[index] = value;
      return this;
    },
    /**
            Method: Array#include
    
            Adds an item to the end of the array if it is not already present (as
            determined by strict '===' equality).
    
            Parameters:
                item - {*} The item to add to the array.
    
            Returns:
                {Array} Returns self.
        */
    include(item) {
      let i = 0;
      const l = this.length;
      while (i < l && this[i] !== item) {
        i += 1;
      }
      this[i] = item;
      return this;
    },
    /**
            Method: Array#erase
    
            Removes all occurrences (as determined by strict '===' equality) of the
            item from the array.
    
            Parameters:
                item - {*} The item to be removed from the array.
    
            Returns:
                {Array} Returns self.
        */
    erase(item) {
      for (let i = this.length - 1; i >= 0; i -= 1) {
        if (this[i] === item) {
          this.splice(i, 1);
        }
      }
      return this;
    },
    first: Enumerable.first,
    last: Enumerable.last,
    binarySearch: Enumerable.binarySearch,
    take: Enumerable.take
  });

  // source/foundation/ComputedProps.js
  var computeDependentKeys = function(cache, key, results) {
    const dependents = cache[key];
    if (dependents) {
      for (let i = dependents.length - 1; i >= 0; i -= 1) {
        const dependentKey = dependents[i];
        if (results.indexOf(dependentKey) === -1) {
          results.push(dependentKey);
          computeDependentKeys(cache, dependentKey, results);
        }
      }
    }
    return results;
  };
  var ComputedProps = {
    /**
            Method: O.ComputedProps#propertiesDependentOnKey
    
            Returns an array of the name of all computed properties
            which depend on the given key.
    
            Parameters:
                key - {String} The name of the key to fetch the dependents of.
    
            Returns:
                {Array} Returns the list of dependents (may be empty).
        */
    propertiesDependentOnKey(key) {
      const metadata = meta(this);
      return metadata.allDependents[key] || (metadata.allDependents[key] = computeDependentKeys(
        metadata.dependents,
        key,
        []
      ));
    },
    /**
            Method: O.ComputedProps#propertyDidChange
    
            Invalidates any cached values depending on the property.
    
            Parameters:
                key      - {String} The name of the property which has changed.
                oldValue - {*} (optional) The old value of the property.
                newValue - {*} (optional) The new value of the property.
    
            Returns:
                {O.ComputedProps} Returns self.
        */
    propertyDidChange(key) {
      const dependents = this.propertiesDependentOnKey(key);
      const cache = meta(this).cache;
      for (let i = dependents.length - 1; i >= 0; i -= 1) {
        delete cache[dependents[i]];
      }
      return this;
    },
    /**
            Method: O.ComputedProps#computedPropertyDidChange
    
            Invalidates the cached value for a property then calls
            propertyDidChange.
    
            Parameters:
                key - {String} The name of the computed property which has changed.
                newValue - {*} (optional) The new value for the property
    
            Returns:
                {O.ComputedProps} Returns self.
        */
    computedPropertyDidChange(key, newValue) {
      const cache = meta(this).cache;
      const oldValue = cache[key];
      delete cache[key];
      if (newValue !== void 0) {
        cache[key] = newValue;
      }
      return this.propertyDidChange(key, oldValue, newValue);
    },
    /**
            Method: O.ComputedProps#set
    
            Sets the value of the named property on this object to the value given.
            If that property is actually a computed property, the new value is
            passed as an argument to that method. This will automatically call
            `propertyDidChange()` to invalidate cached values that depend on this
            property (and notify observers about the change in the case of
            <O.ObservableProps> objects).
    
            Parameters:
                key   - {String} The name of the property to set.
                value - {*} The new value of the property.
    
            Returns:
                {O.ComputedProps} Returns self.
        */
    set(key, value) {
      let oldValue = this[key];
      let silent;
      if (oldValue && oldValue.isProperty) {
        silent = !!oldValue.isSilent;
        value = oldValue.call(this, value, key);
        if (!oldValue.isVolatile) {
          const cache = meta(this).cache;
          oldValue = cache[key];
          cache[key] = value;
          silent = silent || oldValue === value;
        } else {
          oldValue = void 0;
        }
      } else {
        silent = oldValue === value;
        this[key] = value;
      }
      return silent ? this : this.propertyDidChange(key, oldValue, value);
    },
    /**
            Method: O.ComputedProps#get
    
            Gets the value of the named property on this object. If there is an
            accessor function for this property it will call that rather than just
            returning the function. Values will be cached for efficient subsequent
            retrieval unless the accessor function is marked volatile.
    
            Parameters:
                key - {String} The name of the property to fetch.
    
            Returns:
                {*} The value of the property.
        */
    get(key) {
      const value = this[key];
      if (value && value.isProperty) {
        if (value.isVolatile) {
          return value.call(this, void 0, key);
        }
        const cache = meta(this).cache;
        return key in cache ? cache[key] : cache[key] = value.call(this, void 0, key);
      }
      return value;
    },
    /**
            Method: O.ComputedProps#getFromPath
    
            Gets the value at the given path string relative to the object on which
            the method was called.
    
            Parameters:
                path - {String} The path (e.g. 'widget.view.height');
    
            Returns:
                {*} The value at that path relative to this object.
        */
    getFromPath(path) {
      return getFromPath(this, path);
    },
    /**
            Method: O.ComputedProps#increment
    
            Adds the value of the delta argument to the value stored in the property
            with the given key.
    
            Parameters:
                key   - {String} The name of the numerical property.
                delta - {Number} The amount to add to the current value.
    
            Returns:
                {O.ComputedProps} Returns self.
        */
    increment(key, delta2) {
      return this.set(key, this.get(key) + delta2);
    },
    /**
            Method: O.ComputedProps#toggle
    
            Sets the value of the given key to the boolean negation of its previous
            value.
    
            Parameters:
                key - {String} The name of the property to toggle.
    
            Returns:
                {O.ComputedProps} Returns self.
        */
    toggle(key) {
      return this.set(key, !this.get(key));
    }
  };

  // source/foundation/Event.js
  var Event = class {
    /**
            Constructor: O.Event
    
            Parameters:
                type   - {String} The event type.
                target - {Object} The target on which the event is to fire.
                mixin  - {Object} (optional) Any further properties to add to the
                         event.
        */
    constructor(type, target, mixin2) {
      this.type = type;
      this.target = target;
      this.defaultPrevented = false;
      this.propagationStopped = false;
      Object.assign(this, mixin2);
    }
    /**
            Method: O.Event#preventDefault
    
            Prevent the default action for this event (if any).
    
            Returns:
                {O.Event} Returns self.
        */
    preventDefault() {
      this.defaultPrevented = true;
      return this;
    }
    /**
            Method: O.Event#stopPropagation
    
            Stop bubbling the event up to the next target.
    
            Returns:
                {O.Event} Returns self.
        */
    stopPropagation() {
      this.propagationStopped = true;
      return this;
    }
  };

  // source/foundation/RunLoop.js
  var RunLoop_exports = {};
  __export(RunLoop_exports, {
    cancel: () => cancel,
    didError: () => didError,
    eraseAllQueues: () => eraseAllQueues,
    flushAllQueues: () => flushAllQueues,
    flushQueue: () => flushQueue,
    frameStartTime: () => frameStartTime,
    invoke: () => invoke,
    invokeAfterDelay: () => invokeAfterDelay,
    invokeInNextEventLoop: () => invokeInNextEventLoop,
    invokeInNextFrame: () => invokeInNextFrame,
    invokePeriodically: () => invokePeriodically,
    mayRedraw: () => mayRedraw,
    processTimeouts: () => processTimeouts,
    queueFn: () => queueFn,
    setDidError: () => setDidError
  });

  // source/foundation/Heap.js
  var Heap = class {
    constructor(comparator) {
      this.data = [];
      this.length = 0;
      this.comparator = comparator;
    }
    /**
         Method (private): Heap#_up
    
            Moves an element up the heap until the heap's comparator is satisfied. It
            starts with the element at the provided index and uses the comparator
            function to compare it to its parent node, swapping positions as
            necessary.
    
            Parameters:
                i - {Number} The index of the element to be moved up.
    
            Returns:
                {Number} The index of the element after moving it up.
         */
    _up(i) {
      const data = this.data;
      const comparator = this.comparator;
      let parentNode;
      const node = data[i];
      while (i) {
        const j = i - 1 >> 1;
        parentNode = data[j];
        if (comparator(node, parentNode) >= 0) {
          break;
        }
        data[j] = node;
        data[i] = parentNode;
        i = j;
      }
      return i;
    }
    /**
         Method (private): Heap#_down
    
            Moves an element down the heap until the heap's comparator is satisfied. It
            starts with the element at the provided index and uses the comparator
            function to compare it to its children nodes, swapping positions as
            necessary.
    
            Parameters:
                i - {Number} The index of the element to be moved down.
    
            Returns:
                {Number} The index of the element after moving it down.
         */
    _down(i) {
      const data = this.data;
      const length = this.length;
      const comparator = this.comparator;
      const node = data[i];
      while (true) {
        let j = (i << 1) + 1;
        const k = j + 1;
        if (j >= length) {
          break;
        }
        let childNode = data[j];
        if (k < length && comparator(childNode, data[k]) > 0) {
          childNode = data[k];
          j = k;
        }
        if (comparator(node, childNode) <= 0) {
          break;
        }
        data[j] = node;
        data[i] = childNode;
        i = j;
      }
      return i;
    }
    /**
         Method: Heap#push
    
            Adds an element to the heap. It initially adds the provided element to
            the bottom of the Heap instance. It maintains the heap's comparator by
            incrementing the length and calling Heap#_up using the incremented
            length as the provided index.
    
            Parameters:
                node - {*} The element to be added to the heap.
    
            Returns:
                {Object} The Heap instance.
         */
    push(node) {
      if (node != null) {
        const length = this.length;
        this.data[length] = node;
        this.length = length + 1;
        this._up(length);
      }
      return this;
    }
    /**
         Method: Heap#pop
    
            Removes and returns the top element from the Heap instance. It then
            decrements the length and calls Heap#_down from index 0 to maintain
            the heap's comparator.
    
            Returns:
                {*} The element that was removed from the heap.
        */
    pop() {
      const data = this.data;
      let length = this.length;
      if (!length) {
        return null;
      }
      const nodeToReturn = data[0];
      length -= 1;
      data[0] = data[length];
      data[length] = null;
      this.length = length;
      this._down(0);
      return nodeToReturn;
    }
    /**
         Method: Heap#peek
    
            Returns the top element of the Heap instance without removing it.
    
            Returns:
                {*} The top element of the Heap.
         */
    peek() {
      return this.data[0];
    }
    /**
         Method: Heap#remove
    
            Removes the provided element from the heap. If the element is found, it
            decrements the length and, if necessary, calls Heap#_up followed by
            Heap#_down to maintain the heap's comparator.
    
            Parameters:
                node - {*} The element to be removed from the heap.
    
            Returns:
                {Object} The Heap instance.
         */
    remove(node) {
      const data = this.data;
      let length = this.length;
      const i = node == null || !length ? -1 : data.lastIndexOf(node, length - 1);
      if (i < 0) {
        return this;
      }
      length -= 1;
      data[i] = data[length];
      data[length] = null;
      this.length = length;
      if (i !== length) {
        this._down(this._up(i));
      }
      return this;
    }
    /**
         Method: Heap#forEach
    
            Iterates over each element in the Heap instance and applies the provided
            function to it.
    
            Parameters:
                fn - {Function} The function to call with each element in the Heap
                      instance.
         */
    forEach(fn) {
      const data = this.data;
      for (let i = 0, l = this.length; i < l; i += 1) {
        fn(data[i]);
      }
    }
  };

  // source/foundation/RunLoop.js
  var Timeout = class {
    constructor(time2, period, fn, bind2, doNotSchedule) {
      this.time = time2;
      this.period = period;
      this.fn = fn;
      this.bind = bind2;
      this.doNotSchedule = doNotSchedule || false;
    }
  };
  var parentsBeforeChildren = (a, b) => {
    let aView = a[1];
    let bView = b[1];
    if (!aView || !aView.parentView) {
      aView = null;
    }
    if (!bView || !bView.parentView) {
      bView = null;
    }
    if (aView === bView) {
      return 0;
    }
    if (!aView || !bView) {
      return !aView ? 1 : -1;
    }
    let aDepth = 0;
    let bDepth = 0;
    while (aView = aView.get("parentView")) {
      aDepth += 1;
    }
    while (bView = bView.get("parentView")) {
      bDepth += 1;
    }
    return aDepth - bDepth;
  };
  var frameStartTime = 0;
  var mayRedraw = false;
  var _queueOrder = ["before", "bindings", "middle", "render", "after"];
  var _queues = {
    before: [],
    bindings: [],
    middle: [],
    render: [],
    after: [],
    nextLoop: [],
    nextFrame: []
  };
  var _timeouts = new Heap((a, b) => {
    return a.time - b.time;
  });
  var MAX_SAFE_INTEGER = 9007199254740991;
  var _nextTimeout = MAX_SAFE_INTEGER;
  var _timer = null;
  var _willFlushQueues = false;
  var flushQueue = (queue) => {
    const toInvoke = _queues[queue];
    const l = toInvoke.length;
    if (l) {
      _queues[queue] = [];
      if (queue === "render") {
        toInvoke.sort(parentsBeforeChildren);
      }
      for (let i = 0; i < l; i += 1) {
        const tuple = toInvoke[i];
        const fn = tuple[0];
        const bind2 = tuple[1];
        try {
          if (bind2) {
            fn.call(bind2);
          } else {
            fn();
          }
        } catch (error) {
          didError(error);
        }
      }
      return true;
    }
    return false;
  };
  var flushAllQueues = () => {
    const order = _queueOrder;
    const l = order.length;
    let i = 0;
    while (i < l) {
      const queueName = order[i];
      if (_queues[queueName].length) {
        if (i > 2 && !mayRedraw && !document.hidden) {
          if (!_queues.nextFrame.length) {
            requestAnimationFrame(nextFrame);
          }
          break;
        }
        flushQueue(queueName);
        i = 0;
      } else {
        i = i + 1;
      }
    }
    _willFlushQueues = false;
  };
  var needsFlushAllQueues = () => {
    if (!_willFlushQueues) {
      _willFlushQueues = true;
      queueMicrotask(flushAllQueues);
    }
  };
  var eraseAllQueues = () => {
    for (const id in _queues) {
      _queues[id].length = 0;
    }
  };
  var addToQueue = (queue, fn, bind2, allowDups) => {
    const toInvoke = _queues[queue];
    const l = toInvoke.length;
    if (!fn) {
      try {
        fn();
      } catch (error) {
        didError(error);
      }
    } else {
      if (!allowDups) {
        for (let i = 0; i < l; i += 1) {
          const tuple = toInvoke[i];
          if (tuple[0] === fn && tuple[1] === bind2) {
            return;
          }
        }
      }
      toInvoke[l] = [fn, bind2];
    }
  };
  var queueFn = (queue, fn, bind2, allowDups) => {
    addToQueue(queue, fn, bind2, allowDups);
    needsFlushAllQueues();
  };
  var invoke = (fn, bind2, args) => {
    let returnValue;
    try {
      if (args) {
        returnValue = fn.apply(bind2, args);
      } else if (bind2) {
        returnValue = fn.call(bind2);
      } else {
        returnValue = fn();
      }
    } catch (error) {
      didError(error);
    }
    return returnValue;
  };
  var invokeInNextEventLoop = (fn, bind2, allowDups) => {
    if (!_queues.nextLoop.length) {
      setTimeout(nextLoop, 0);
    }
    return addToQueue("nextLoop", fn, bind2, allowDups);
  };
  var invokeInNextFrame = (fn, bind2, allowDups) => {
    if (!_queues.nextFrame.length) {
      requestAnimationFrame(nextFrame);
    }
    return addToQueue("nextFrame", fn, bind2, allowDups);
  };
  var invokeAfterDelay = (fn, delay, bind2, doNotSchedule) => {
    const timeout = new Timeout(Date.now() + delay, 0, fn, bind2, doNotSchedule);
    _timeouts.push(timeout);
    if (!doNotSchedule) {
      _scheduleTimeout(timeout);
    }
    return timeout;
  };
  var invokePeriodically = (fn, period, bind2, doNotSchedule) => {
    const timeout = new Timeout(
      Date.now() + period,
      period,
      fn,
      bind2,
      doNotSchedule
    );
    _timeouts.push(timeout);
    if (!doNotSchedule) {
      _scheduleTimeout(timeout);
    }
    return timeout;
  };
  var _scheduleTimeout = (timeout) => {
    const time2 = timeout.time;
    if (time2 < _nextTimeout) {
      clearTimeout(_timer);
      const delay = Math.max(0, time2 - Date.now());
      _timer = setTimeout(processTimeouts, delay);
      _nextTimeout = time2;
    }
  };
  var processTimeouts = () => {
    const timeouts = _timeouts;
    const now = Date.now();
    let nextToSchedule = null;
    _nextTimeout = 0;
    while (timeouts.length) {
      const timeout = timeouts.peek();
      if (timeout.time > now) {
        nextToSchedule = timeout;
        break;
      }
      timeouts.pop();
      const period = timeout.period;
      if (period) {
        timeout.time = now + period;
        timeouts.push(timeout);
      }
      invoke(timeout.fn, timeout.bind);
    }
    if (nextToSchedule && nextToSchedule.doNotSchedule) {
      nextToSchedule = null;
      timeouts.forEach((timeout) => {
        if (!timeout.doNotSchedule && (!nextToSchedule || nextToSchedule.time > timeout.time)) {
          nextToSchedule = timeout;
        }
      });
    }
    _nextTimeout = MAX_SAFE_INTEGER;
    if (nextToSchedule) {
      _scheduleTimeout(nextToSchedule);
    }
  };
  var cancel = (token) => {
    _timeouts.remove(token);
  };
  var didError = (error) => {
    if (window.console) {
      console.log(error.name, error.message, error.stack);
    }
  };
  var setDidError = (fn) => {
    didError = fn;
  };
  var nextLoop = invoke.bind(null, flushQueue, null, ["nextLoop"]);
  var nextFrame = (time2) => {
    frameStartTime = time2;
    mayRedraw = true;
    invoke(flushQueue, null, ["nextFrame"]);
    flushAllQueues();
    mayRedraw = false;
  };

  // source/foundation/EventTarget.js
  var eventPrefix = "__event__";
  var EventTarget = {
    /**
            Property: O.EventTarget#nextEventTarget
            Type: (O.EventTarget|null)
    
            Pointer to the next object in the event bubbling chain.
        */
    nextEventTarget: null,
    /**
            Method: O.EventTarget#on
    
            Add a function to be called whenever an event of a particular type is
            fired.
    
            Parameters:
                type   - {String} The name of the event to subscribe to.
                object - {(Function|Object)} The function to be called when the
                         event fires, or alternatively supply an object and in the
                         third parameter give the name of the method to be called on
                         it.
                method - {String} (optional) The name of the callback method to be
                         called on object. Ignored if a function is passed for the
                         2nd parameter.
    
            Returns:
                {O.EventTarget} Returns self.
        */
    on(type, object, method) {
      if (typeof object !== "function") {
        object = { object, method };
      }
      meta(this).addObserver(eventPrefix + type, object);
      return this;
    },
    /**
            Method: O.EventTarget#once
    
            Add a function to be called the next time an event of a particular type
            is fired, but not for subsequent firings.
    
            Parameters:
                type - {String} The name of the event to subscribe to.
                fn   - {Function} The function to be called when the event fires.
    
            Returns:
                {O.EventTarget} Returns self.
        */
    once(type, fn) {
      const once = function(event) {
        fn.call(this, event);
        this.off(type, once);
      };
      this.on(type, once);
      return this;
    },
    /**
            Method: O.EventTarget#fire
    
            Fires an event, causing all subscribed functions to be called with an
            event object as the single parameter and the scope bound to the object
            on which they subscribed to the event. In the case of subscribed
            object/method name pairs, the scope will remain the object on which the
            method is called.
    
            The event object contains the properties supplied in the details
            parameter and also a type attribute, with the type of the event, a
            target attribute, referencing the object on which the event was actually
            fired, a preventDefault function, which stops the default function
            firing if supplied, and a stopPropagation function, which prevents the
            event bubbling any further.
    
            Both parameters are optional, but at least one must be specified. If the
            `type` parameter is omitted, the `event` parameter must be an `Event` or
            `O.Event` instance, and its `type` property will be used.
    
            Parameters:
                type  - {String} (optional) The name of the event being fired.
                event - {Event|O.Event|Object} (optional) An event object or object
                        of values to be added to the event object.
    
            Returns:
                {O.EventTarget} Returns self.
        */
    fire(type, event) {
      let target = this;
      if (typeof type !== "string" && !event) {
        event = type;
        type = event.type;
      }
      const typeKey = eventPrefix + type;
      if (!event || !(event instanceof Event)) {
        if (event && /Event\]$/.test(event.toString())) {
          event.stopPropagation = function() {
            this.propagationStopped = true;
            return this;
          };
        } else {
          event = new Event(type, target, event);
        }
      }
      event.propagationStopped = false;
      while (target) {
        const handlers = meta(target).observers[typeKey];
        const l = handlers ? handlers.length : 0;
        for (let i = 0; i < l; i += 1) {
          try {
            const handler = handlers[i];
            if (typeof handler === "function") {
              handler.call(target, event);
            } else {
              (handler.object || target)[handler.method](event);
            }
          } catch (error) {
            didError(error);
          }
        }
        target = event.propagationStopped ? null : target.get ? target.get("nextEventTarget") : target.nextEventTarget;
      }
      return this;
    },
    /**
            Method: O.EventTarget#off
    
            Detaches a particular event handler. This method has no effect if the
            function supplied is not subscribed to the event type given.
    
            Parameters:
                type   - {String} The name of the event to detach handlers from.
                object - {(Function|Object)} The function to detach or the object
                         whose method will be detached.
                method - {String} (optional) The name of the callback method to be
                         detached. Ignored if a function is passed for the 2nd
                         parameter.
    
            Returns:
                {O.EventTarget} Returns self.
        */
    off(type, object, method) {
      if (typeof object !== "function") {
        object = { object, method };
      }
      meta(this).removeObserver(eventPrefix + type, object);
      return this;
    }
  };

  // source/_codependent/_Binding.js
  var Binding = null;
  var setBinding = (x) => Binding = x;

  // source/foundation/Binding.js
  var _resolveRootAndPath = function(binding, direction, root, path) {
    const beginObservablePath = path.lastIndexOf("*") + 1;
    const observablePath = path.slice(beginObservablePath);
    const staticPath = beginObservablePath ? path.slice(0, beginObservablePath - 1) : "";
    const lastDot = observablePath.lastIndexOf(".");
    binding[direction + "Object"] = staticPath ? getFromPath(root, staticPath) : root;
    binding[direction + "Path"] = observablePath;
    binding[direction + "PathBeforeKey"] = lastDot === -1 ? "" : observablePath.slice(0, lastDot);
    binding[direction + "Key"] = observablePath.slice(lastDot + 1);
  };
  var isNum2 = /^\d+$/;
  var identity = (v) => v;
  var Binding2 = class {
    __setupProperty__(metadata, key) {
      metadata.bindings[key] = this;
      metadata.inits.Bindings = (metadata.inits.Bindings || 0) + 1;
    }
    __teardownProperty__(metadata, key) {
      metadata.bindings[key] = null;
      metadata.inits.Bindings -= 1;
    }
    /**
            Property: O.Binding#isConnected
            Type: Boolean
    
            Is the instance currently observing for changes?
            This property is READ ONLY.
        */
    /**
            Property: O.Binding#isNotInSync
            Type: Boolean
    
            Has the data changed on the from object (or the 'to' object if two-way)?
            This property is READ ONLY.
        */
    /**
            Property: O.Binding#isSuspended
            Type: Boolean
    
            Should the binding stop propagating changes? This property is READ ONLY.
        */
    /**
            Property: O.Binding#willSyncForward
            Type: Boolean
    
            The direction to sync at the next sync. True if syncing from the 'from'
            object to the 'to' object, false if it's going to do the reverse.
        */
    /**
            Property: O.Binding#isTwoWay
            Type: Boolean
            Default: false
    
            Are changes just propagated from the 'from' object to the 'to' object,
            or are they also sent the other way?
        */
    /**
            Property: O.Binding#queue
            Type: String
            Default: 'bindings'
    
            During which queue in the run loop should the binding sync?
        */
    /**
            Constructor: O.Binding
    
            Parameters:
                mixin - {Object} (optional). Can set isTwoWay or the transform to
                        use on the binding.
        */
    constructor(mixin2) {
      this.isConnected = false;
      this.isSuspended = true;
      this.isNotInSync = true;
      this.willSyncForward = true;
      this._doNotDelayConnection = false;
      this._fromPath = null;
      this._fromRoot = null;
      this._toPath = null;
      this._toRoot = null;
      this.fromObject = null;
      this.fromPath = "";
      this.fromPathBeforeKey = "";
      this.fromKey = "";
      this.toObject = null;
      this.toPath = "";
      this.toPathBeforeKey = "";
      this.toKey = "";
      this.isTwoWay = false;
      this.transform = identity;
      this.queue = "bindings";
      Object.assign(this, mixin2);
    }
    /**
            Method: O.Binding#destroy
    
            Disconnects binding and prevents any further value syncs.
        */
    destroy() {
      this.disconnect();
      this.isConnected = true;
    }
    /**
            Method: O.Binding#from
    
            Sets the path and object to observe for changes. This method has no
            effect if it is called after the object is connected.
    
            Parameters:
                root - {Object} (optional) The object the static path is resolved
                       against, will be the "to" root if not supplied.
                path - {String} Any path before a *' is resolved at connection time
                       and then remains static. Path components after this are
                       treated as a dynamic path to watch for changes. If there is
                       no '*' present in the string, the entire string is taken as a
                       dynamic path.
    
            Returns:
                {O.Binding} Returns self.
        */
    from(root, path) {
      const rootIsPath = typeof root === "string";
      this._fromRoot = rootIsPath ? path : root;
      this._fromPath = rootIsPath ? root : path;
      return this;
    }
    /**
            Method: O.Binding#to
    
            Sets the path and object to propagate changes to. This method has no
            effect if it is called after the object is connected.
    
            Parameters:
                root - {Object} (optional) The object the static path is resolved
                       against, will be the "from" root if not supplied.
                path - {String} Any path before a *' is resolved at connection time
                       and then remains static. Path components after this are
                       treated as a dynamic path to watch for changes. If there is
                       no '*' present in the string, the entire string is taken as a
                       dynamic path.
    
            Returns:
                {O.Binding} Returns self.
        */
    to(root, path) {
      const rootIsPath = typeof root === "string";
      this._toRoot = rootIsPath ? path : root;
      this._toPath = rootIsPath ? root : path;
      return this;
    }
    // ------------
    /**
            Property: O.Binding#fromObject
            Type: Object
    
            The static object the observed path begins from.
        */
    /**
            Property: O.Binding#fromPath
            Type: String
    
            The dynamic path to observe on the from object.
        */
    /**
            Property: O.Binding#fromKey
            Type: String
    
            The final component of the fromPath (the property name on the final
            object).
        */
    /**
            Property: O.Binding#fromPathBeforeKey
            Type: String
    
            The dynamic 'from' path component before the final key.
        */
    /**
            Property: O.Binding#toObject
            Type: Object
    
            The static object from which the object-to-update path is resolved.
        */
    /**
            Property: O.Binding#toPath
            Type: String
    
            The dynamic path to follow on the to object.
        */
    /**
            Property: O.Binding#toKey
            Type: String
    
            The final component of the toPath (the property name on the final
            object).
        */
    /**
            Property: O.Binding#toPathBeforeKey
            Type: String
    
            The dynamic 'to' path component before the final key.
        */
    // ------------
    /**
            Method: O.Binding#connect
    
            Starts observing for changes and syncs the current value of the observed
            property on the from object with the bound property on the to object.
    
            Returns:
                {O.Binding} Returns self.
        */
    connect() {
      if (this.isConnected) {
        return this;
      }
      this.isSuspended = false;
      _resolveRootAndPath(
        this,
        "from",
        this._fromRoot || this._toRoot,
        this._fromPath
      );
      _resolveRootAndPath(
        this,
        "to",
        this._toRoot || this._fromRoot,
        this._toPath
      );
      const fromObject = this.fromObject;
      const toObject = this.toObject;
      if (toObject instanceof Element) {
        this.queue = "render";
      }
      if (!this._doNotDelayConnection && (!fromObject || !toObject)) {
        this._doNotDelayConnection = true;
        queueFn("before", this.connect, this);
        return this;
      }
      const fromPath = this.fromPath;
      if (!fromObject) {
        throw new TypeError(
          "Binding#connect: fromObject is not set (fromPath = " + fromPath + ")"
        );
      }
      fromObject.addObserverForPath(fromPath, this, "fromDidChange");
      this.sync();
      if (this.isTwoWay) {
        toObject.addObserverForPath(this.toPath, this, "toDidChange");
      }
      this.isConnected = true;
      return this;
    }
    /**
            Method: O.Binding#disconnect
    
            Stops observing for changes.
    
            Returns:
                {O.Binding} Returns self.
        */
    disconnect() {
      if (!this.isConnected) {
        return this;
      }
      this.fromObject.removeObserverForPath(
        this.fromPath,
        this,
        "fromDidChange"
      );
      if (this.isTwoWay) {
        this.toObject.removeObserverForPath(
          this.toPath,
          this,
          "toDidChange"
        );
      }
      this.isConnected = false;
      this.isSuspended = true;
      this.isNotInSync = true;
      this.willSyncForward = true;
      return this;
    }
    /**
            Method: O.Binding#suspend
    
            Stop propagating changes. The instance will still note when the observed
            object changes, but will not sync this to the bound property on the to
            object until the <O.Binding#resume> method is called.
    
            Returns:
                {O.Binding} Returns self.
        */
    suspend() {
      this.isSuspended = true;
      return this;
    }
    /**
            Method: O.Binding#resume
    
            Restart propagating changes. Sync the to object if the observed property
            has changed.
    
            Returns:
                {O.Binding} Returns self.
        */
    resume() {
      if (this.isSuspended && this.isConnected) {
        this.isSuspended = false;
        this.sync();
      }
      return this;
    }
    // ------------
    /**
            Property: O.Binding#transform
            Type: Function
    
            A function which is applied to a value coming from one object before it
            is set on the other object.
        */
    // ------------
    /**
            Method: O.Binding#fromDidChange
    
            Called when the observed property on the from object changes; adds the
            binding to the queue to be synced at the end of the run loop.
    
            Returns:
                {O.Binding} Returns self.
        */
    fromDidChange() {
      return this.needsSync(true);
    }
    /**
            Method: O.Binding#toDidChange
    
            If the binding is two-way, this is called when the observed property on
            the to object changes; adds the binding to the queue to be synced at the
            end of the run loop.
    
            Returns:
                {O.Binding} Returns self.
        */
    toDidChange() {
      return this.needsSync(false);
    }
    /**
            Method: O.Binding#needsSync
    
            Adds the binding to the queue to be synced at the end of the run loop.
    
            Parameters:
                direction - {Boolean} True if sync needed from the "from" object to
                            the "to" object, false if the reverse.
    
            Returns:
                {O.Binding} Returns self.
        */
    needsSync(direction) {
      const queue = this.queue;
      const inQueue = this.isNotInSync;
      this.willSyncForward = direction;
      this.isNotInSync = true;
      if (!inQueue && !this.isSuspended) {
        if (queue) {
          queueFn(queue, this.sync, this, true);
        } else {
          this.sync();
        }
      }
      return this;
    }
    /**
            Method: O.Binding#sync
    
            If the observed property has changed, this method applies any transforms
            and propagates the data to the other object.
    
            Parameters:
                force - {Boolean} If true, sync the binding even if it hasn't
                        changed.
    
            Returns:
                {Boolean} Did the binding actually make a change?
        */
    sync(force) {
      if (!force && (!this.isNotInSync || this.isSuspended)) {
        return false;
      }
      this.isNotInSync = false;
      const syncForward = this.willSyncForward;
      const from = syncForward ? "from" : "to";
      const to = syncForward ? "to" : "from";
      const pathBeforeKey = this[to + "PathBeforeKey"];
      let toObject = this[to + "Object"];
      if (pathBeforeKey) {
        toObject = toObject.getFromPath(pathBeforeKey);
      }
      if (!toObject) {
        return false;
      }
      const key = this[to + "Key"];
      const value = this.transform(
        this[from + "Object"].getFromPath(this[from + "Path"]),
        syncForward
      );
      if (value !== void 0) {
        if (isNum2.test(key)) {
          toObject.setObjectAt(+key, value);
        } else {
          toObject.set(key, value);
        }
      }
      return true;
    }
  };
  setBinding(Binding2);
  var bind = function(root, path, transform) {
    const binding = new Binding2().from(root, path);
    if (transform) {
      binding.transform = transform;
    }
    return binding;
  };
  var bindTwoWay = function(root, path, transform) {
    const binding = bind(root, path, transform);
    binding.isTwoWay = true;
    return binding;
  };

  // source/foundation/ObservableProps.js
  var _setupTeardownPaths = function(object, method) {
    const pathObservers = meta(object).pathObservers;
    for (const key in pathObservers) {
      const paths = pathObservers[key];
      if (paths) {
        for (let i = paths.length - 1; i >= 0; i -= 1) {
          object[method](paths[i], object, key);
        }
      }
    }
  };
  var _notifyObserversOfKey = function(that, metadata, key, oldValue, newValue) {
    const isInitialised = metadata.lifestage === OBJECT_INITIALISED;
    const observers = metadata.observers[key];
    const l = observers ? observers.length : 0;
    let haveCheckedForNew = false;
    for (let i = 0; i < l; i += 1) {
      const observer = observers[i];
      const object = observer.object || that;
      const method = observer.method;
      const path = observer.path;
      if (isInitialised) {
        if (path) {
          if (newValue === void 0 && !haveCheckedForNew) {
            newValue = /^\d+$/.test(key) ? that.getObjectAt(parseInt(key, 10)) : that.get(key);
            haveCheckedForNew = true;
          }
          if (oldValue) {
            oldValue.removeObserverForPath(path, object, method);
          }
          if (newValue) {
            newValue.addObserverForPath(path, object, method);
          }
          object[method](
            that,
            key,
            oldValue && oldValue.getFromPath(path),
            newValue && newValue.getFromPath(path)
          );
        } else {
          object[method](that, key, oldValue, newValue);
        }
      } else {
        if (newValue && path) {
          newValue.addObserverForPath(path, object, method);
        }
        if (object instanceof Binding2) {
          object[method]();
          object.sync();
        }
      }
    }
  };
  var _notifyGenericObservers = function(that, metadata, changed) {
    const observers = metadata.observers["*"];
    for (let i = 0, l = observers ? observers.length : 0; i < l; i += 1) {
      const observer = observers[i];
      (observer.object || that)[observer.method](that, changed);
    }
  };
  var ObservableProps = {
    /**
            Method: O.Observable#initObservers
    
            Initialises any observed paths on the object (observed keys do not
            require initialisation. You should never call this directly, but rather
            iterate through the keys of `O.meta( this ).inits`, calling
            `this[ 'init' + key ]()` for all keys which map to truthy values.
        */
    initObservers() {
      _setupTeardownPaths(this, "addObserverForPath");
    },
    /**
            Method: O.Observable#destroyObservers
    
            Removes any observed paths from the object (observed keys do not require
            destruction. You should never call this directly, but rather iterate
            through the keys of `O.meta( this ).inits`, calling
            `this[ 'destroy' + key ]()` for all keys which map to a truthy value.
        */
    destroyObservers() {
      _setupTeardownPaths(this, "removeObserverForPath");
    },
    /**
            Method: O.ObservableProps#hasObservers
    
            Returns true if any property on the object is currently being observed
            by another object.
    
            Returns:
                {Boolean} Does the object have any observers?
        */
    hasObservers() {
      const observers = meta(this).observers;
      for (const key in observers) {
        const keyObservers = observers[key];
        const length = keyObservers ? keyObservers.length : 0;
        for (let i = length - 1; i >= 0; i -= 1) {
          const object = keyObservers[i].object;
          if (object && object !== this && // Ignore bindings that belong to the object.
          !(object instanceof Binding2 && object.toObject === this)) {
            return true;
          }
        }
      }
      return false;
    },
    /**
            Method: O.ObservableProps#beginPropertyChanges
    
            Call this before changing a set of properties (and then call
            <endPropertyChanges> afterwards) to ensure that if a dependent property
            changes more than once, observers of that property will only be notified
            once of the change. No observer will be called until
            the matching <endPropertyChanges> call is made.
    
            Returns:
                {O.ObservableProps} Returns self.
        */
    beginPropertyChanges() {
      meta(this).depth += 1;
      return this;
    },
    /**
            Method: O.ObservableProps#endPropertyChanges
    
            Call this after changing a set of properties (having called
            <beginPropertyChanges> before) to ensure that if a dependent property
            changes more than once, observers of that property will only be notified
            once of the change.
    
            Returns:
                {O.ObservableProps} Returns self.
        */
    endPropertyChanges() {
      const metadata = meta(this);
      if (metadata.depth === 1) {
        let changed;
        while (changed = metadata.changed) {
          metadata.changed = null;
          for (const key in changed) {
            _notifyObserversOfKey(
              this,
              metadata,
              key,
              changed[key].oldValue,
              changed[key].newValue
            );
          }
          if (metadata.observers["*"]) {
            _notifyGenericObservers(this, metadata, changed);
          }
        }
      }
      metadata.depth -= 1;
      return this;
    },
    /**
            Method: O.ObservableProps#propertyDidChange
    
            Overrides the method in <O.ComputedProps>. Invalidates any cached
            values depending on the property and notifies any observers about the
            change. Will also notify any observers of dependent values about the
            change.
    
            Parameters:
                key      - {String} The name of the property which has changed.
                oldValue - {*} The old value for the property.
                newValue - {*} (optional) The new value for the property. Only there
                           if it's not a computed property.
    
            Returns:
                {O.ObservableProps} Returns self.
        */
    propertyDidChange(key, oldValue, newValue) {
      const metadata = meta(this);
      const isInitialised = metadata.lifestage === OBJECT_INITIALISED;
      const dependents = isInitialised ? this.propertiesDependentOnKey(key) : [];
      const length = dependents.length;
      const depth = metadata.depth;
      const hasGenericObservers = !!metadata.observers["*"];
      const fastPath = !length && !depth && !hasGenericObservers;
      const changed = fastPath ? null : metadata.changed || {};
      const cache = metadata.cache;
      if (fastPath) {
        _notifyObserversOfKey(this, metadata, key, oldValue, newValue);
      } else {
        for (let i = length - 1; i >= 0; i -= 1) {
          const prop = dependents[i];
          if (!changed[prop]) {
            changed[prop] = {
              oldValue: cache[prop]
            };
          }
          delete cache[prop];
        }
        changed[key] = {
          oldValue: changed[key] ? changed[key].oldValue : oldValue,
          newValue
        };
        if (metadata.depth) {
          metadata.changed = changed;
        } else {
          for (const prop in changed) {
            _notifyObserversOfKey(
              this,
              metadata,
              prop,
              changed[prop].oldValue,
              changed[prop].newValue
            );
          }
          if (isInitialised && hasGenericObservers) {
            _notifyGenericObservers(this, metadata, changed);
          }
        }
      }
      return this;
    },
    /**
            Method: O.ObservableProps#addObserverForKey
    
            Registers an object and a method to be called on that object whenever a
            particular key changes in value. The method will be called with the
            following parameters: object, key, oldValue, newValue. If it is a
            computed property the oldValue and newValue arguments may not be
            present. You can also observe '*' to be notified of any changes to the
            object; in this case the observer will only be supplied with the first
            argument: this object.
    
            Parameters:
                key    - {String} The property to observe.
                object - {Object} The object on which to call the callback method.
                method - {String} The name of the callback method.
    
            Returns:
                {O.ObservableProps} Returns self.
        */
    addObserverForKey(key, object, method) {
      meta(this).addObserver(key, { object, method });
      return this;
    },
    /**
            Method: O.ObservableProps#removeObserverForKey
    
            Removes an object/method pair from the list of those to be called when
            the property changes. Must use identical arguments to a previous call to
            <addObserverForKey>.
    
            Parameters:
                key    - {String} The property which is being observed.
                object - {Object} The object which is observing it.
                method - {String} The name of the callback method on the observer
                         object.
    
            Returns:
                {O.ObservableProps} Returns self.
        */
    removeObserverForKey(key, object, method) {
      meta(this).removeObserver(key, { object, method });
      return this;
    },
    /**
            Method: O.ObservableProps#addObserverForPath
    
            Registers an object and a method to be called on that object whenever
            any property in a given path string changes. Note, this path is live, in
            that if you observe `foo.bar.x` and `bar` changes, you will receive a
            callback, and the observer will be deregistered from the old `bar`, and
            registered on the new one.
    
            Parameters:
                path   - {String} The path to observe.
                object - {Object} The object on which to call the callback method.
                method - {String} The name of the callback method.
    
            Returns:
                {O.ObservableProps} Returns self.
        */
    addObserverForPath(path, object, method) {
      const nextDot = path.indexOf(".");
      if (nextDot === -1) {
        this.addObserverForKey(path, object, method);
      } else {
        const key = path.slice(0, nextDot);
        const value = this.get(key);
        const restOfPath = path.slice(nextDot + 1);
        meta(this).addObserver(key, {
          path: restOfPath,
          object,
          method
        });
        if (value && !(value instanceof Binding2)) {
          value.addObserverForPath(restOfPath, object, method);
        }
      }
      return this;
    },
    /**
            Method: O.ObservableProps#removeObserverForPath
    
            Removes an observer for a path added with <addObserverForPath>.
    
            Parameters:
                path   - {String} The path which is being observed.
                object - {Object} The object which is observing it.
                method - {String} The name of the callback method on the observer
                         object.
    
            Returns:
                {O.ObservableProps} Returns self.
        */
    removeObserverForPath(path, object, method) {
      const nextDot = path.indexOf(".");
      if (nextDot === -1) {
        this.removeObserverForKey(path, object, method);
      } else {
        const key = path.slice(0, nextDot);
        const value = this.get(key);
        const restOfPath = path.slice(nextDot + 1);
        meta(this).removeObserver(key, {
          path: restOfPath,
          object,
          method
        });
        if (value) {
          value.removeObserverForPath(restOfPath, object, method);
        }
      }
      return this;
    }
  };

  // source/foundation/Object.js
  var Obj = function() {
    for (let i = 0, l = arguments.length; i < l; i += 1) {
      mixin(this, arguments[i]);
    }
    const metadata = meta(this);
    const inits = metadata.inits;
    for (const method in inits) {
      if (inits[method]) {
        this["init" + method]();
      }
    }
    metadata.lifestage = OBJECT_INITIALISED;
  };
  var ObjPrototype = Obj.prototype;
  ObjPrototype.constructor = Obj;
  ObjPrototype.init = Obj;
  mixin(ObjPrototype, ComputedProps);
  mixin(ObjPrototype, BoundProps);
  mixin(ObjPrototype, ObservableProps);
  mixin(ObjPrototype, EventTarget);
  mixin(ObjPrototype, {
    constructor: Obj,
    destroy() {
      const metadata = meta(this);
      const inits = metadata.inits;
      for (const method in inits) {
        if (inits[method]) {
          this["destroy" + method]();
        }
      }
      metadata.lifestage = OBJECT_DESTROYED;
    }
  });

  // source/ua/UA.js
  var UA_exports = {};
  __export(UA_exports, {
    browser: () => browser,
    canTouch: () => canTouch,
    isAndroid: () => isAndroid,
    isApple: () => isApple,
    isIOS: () => isIOS,
    isLinux: () => isLinux,
    isMac: () => isMac,
    isWin: () => isWin,
    platform: () => platform,
    version: () => version
  });
  var ua = navigator.userAgent.toLowerCase();
  var other = ["other", "0"];
  var documentElement = typeof document !== "undefined" ? document.documentElement : {};
  var platform = /ip(?:ad|hone|od)/.test(ua) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1 ? "ios" : (/android/.exec(ua) || /mac|win|linux/.exec(navigator.platform.toLowerCase()) || other)[0];
  var isMac = platform === "mac";
  var isWin = platform === "win";
  var isLinux = platform === "linux";
  var isIOS = platform === "ios";
  var isAndroid = platform === "android";
  var isApple = isMac || isIOS;
  var browser = (/firefox|edge/.exec(ua) || /chrome|safari/.exec(ua) || other)[0];
  var version = parseFloat(
    (/(?:; rv:|edge\/|version\/|firefox\/|os )(\d+(?:[._]\d+)?)/.exec(ua) || /chrome\/(\d+\.\d+)/.exec(ua) || other)[1].replace("_", ".")
  );
  var canTouch = "ontouchstart" in documentElement;

  // source/application/formatKeyForPlatform.js
  var platformKeys = {
    ArrowUp: "\u2191",
    ArrowDown: "\u2193",
    ArrowRight: "\u2192",
    ArrowLeft: "\u2190",
    Alt: isApple ? "\u2325" : "Alt-",
    Cmd: isApple ? "\u2318" : "Ctrl-",
    Ctrl: isApple ? "\u2303" : "Ctrl-",
    Meta: isApple ? "\u2318" : "Meta-",
    Shift: isApple ? "\u21E7" : "Shift-",
    Escape: "Esc",
    Enter: isApple ? "\u21B5" : "Enter",
    Backspace: isApple ? "\u232B" : "Backspace",
    Delete: isApple ? "\u2326" : "Delete"
  };
  var modifierOrder = (isApple ? ["Ctrl", "Alt", "Shift", "Cmd", "Meta"] : ["Meta", "Cmd", "Ctrl", "Alt", "Shift"]).reduce((order, x, index) => {
    order[x] = index + 1;
    return order;
  }, {});
  var sortModifierKeys = function(a, b) {
    return (modifierOrder[a] || 9) - (modifierOrder[b] || 9);
  };
  var formatKeyForPlatform = function(shortcut) {
    return shortcut.split("-").sort(sortModifierKeys).map((key) => platformKeys[key] || capitalise(key)).join("");
  };

  // source/dom/Element.js
  var Element_exports = {};
  __export(Element_exports, {
    appendChildren: () => appendChildren,
    contains: () => contains,
    create: () => create,
    cssStringFromKeyValue: () => cssStringFromKeyValue,
    forView: () => forView,
    getAncestors: () => getAncestors,
    getPosition: () => getPosition,
    getRawBoundingClientRect: () => getRawBoundingClientRect,
    getStyle: () => getStyle,
    nearest: () => nearest,
    setAttributes: () => setAttributes,
    setStyle: () => setStyle,
    setStyles: () => setStyles
  });

  // source/_codependent/_View.js
  var View = null;
  var setView = (x) => View = x;

  // source/views/activeViews.js
  var activeViews = new Obj();
  var getViewFromNode = function(node) {
    const doc2 = node.ownerDocument;
    let view2 = null;
    while (!view2 && node && node !== doc2) {
      view2 = activeViews[node.id] || null;
      node = node.parentNode;
    }
    return view2;
  };

  // source/foundation/Decorators.js
  var makeComputedDidChange = function(key) {
    return function() {
      this.computedPropertyDidChange(key);
    };
  };
  var setupComputed = function(metadata, key, object) {
    const dependencies = this.dependencies;
    let dependents = metadata.dependents;
    if (!metadata.hasOwnProperty("dependents")) {
      dependents = metadata.dependents = clone(dependents);
      metadata.allDependents = {};
    }
    let method;
    let pathObservers;
    let methodObservers;
    for (let i = dependencies.length - 1; i >= 0; i -= 1) {
      const valueThisKeyDependsOn = dependencies[i];
      if (valueThisKeyDependsOn.indexOf(".") === -1) {
        (dependents[valueThisKeyDependsOn] || (dependents[valueThisKeyDependsOn] = [])).push(key);
      } else {
        if (!method) {
          method = "__" + key + "DidChange__";
          metadata.inits.Observers = (metadata.inits.Observers || 0) + 1;
        }
        if (!object[method]) {
          object[method] = makeComputedDidChange(key);
        }
        if (!pathObservers) {
          pathObservers = metadata.pathObservers;
          if (!metadata.hasOwnProperty("pathObservers")) {
            pathObservers = metadata.pathObservers = Object.create(pathObservers);
          }
          methodObservers = pathObservers[method];
          if (!methodObservers) {
            methodObservers = pathObservers[method] = [];
          } else if (!pathObservers.hasOwnProperty(method)) {
            methodObservers = pathObservers[method] = methodObservers.slice();
          }
        }
        methodObservers.push(valueThisKeyDependsOn);
      }
    }
  };
  var teardownComputed = function(metadata, key) {
    const dependencies = this.dependencies;
    let dependents = metadata.dependents;
    if (!metadata.hasOwnProperty("dependents")) {
      dependents = metadata.dependents = clone(dependents);
      metadata.allDependents = {};
    }
    let method;
    let pathObservers;
    let methodObservers;
    for (let i = dependencies.length - 1; i >= 0; i -= 1) {
      const valueThisKeyDependsOn = dependencies[i];
      if (valueThisKeyDependsOn.indexOf(".") === -1) {
        dependents[valueThisKeyDependsOn].erase(key);
      } else {
        if (!method) {
          method = "__" + key + "DidChange__";
          metadata.inits.Observers -= 1;
        }
        if (!pathObservers) {
          pathObservers = metadata.pathObservers;
          if (!metadata.hasOwnProperty("pathObservers")) {
            pathObservers = metadata.pathObservers = Object.create(pathObservers);
          }
          methodObservers = pathObservers[method];
          if (!pathObservers.hasOwnProperty(method)) {
            methodObservers = pathObservers[method] = methodObservers.slice();
          }
        }
        methodObservers.erase(valueThisKeyDependsOn);
      }
    }
  };
  var setupObserver = function(metadata, method) {
    const observes = this.observedProperties;
    let pathObservers;
    for (let i = observes.length - 1; i >= 0; i -= 1) {
      const key = observes[i];
      if (key.indexOf(".") === -1) {
        metadata.addObserver(key, { object: null, method });
      } else {
        if (!pathObservers) {
          pathObservers = metadata.pathObservers;
          if (!metadata.hasOwnProperty("pathObservers")) {
            pathObservers = metadata.pathObservers = Object.create(pathObservers);
          }
          pathObservers = pathObservers[method] = [];
          metadata.inits.Observers = (metadata.inits.Observers || 0) + 1;
        }
        pathObservers.push(key);
      }
    }
  };
  var teardownObserver = function(metadata, method) {
    const observes = this.observedProperties;
    let pathObservers;
    for (let i = observes.length - 1; i >= 0; i -= 1) {
      const key = observes[i];
      if (key.indexOf(".") === -1) {
        metadata.removeObserver(key, { object: null, method });
      } else if (!pathObservers) {
        pathObservers = metadata.pathObservers;
        if (!metadata.hasOwnProperty("pathObservers")) {
          pathObservers = metadata.pathObservers = Object.create(pathObservers);
        }
        pathObservers[method] = null;
        metadata.inits.Observers -= 1;
      }
    }
  };
  Object.assign(Function.prototype, {
    /**
            Method: Function#property
    
            Marks a function as a property getter/setter. If a call to
            <O.ComputedProps#get> or <O.ComputedProps#set> is made and the
            current value of the property is this method, the method will be called
            rather than just returned/overwritten itself.
    
            Normally, properties will only be dependent on other properties on the
            same object. You may also specify paths though, e.g. `object.obj2.prop`
            and this will also work, however if you do this the object (and all
            other objects in the path) *MUST* also include the <O.ObservableProps>
            mixin.
    
            Parameters:
                var_args - {...String} All arguments are treated as the names of
                           properties this value depends on; if any of these are
                           changed, the cached value for this property will be
                           invalidated.
    
            Returns:
                {Function} Returns self.
        */
    property(...dependencies) {
      this.isProperty = true;
      if (dependencies.length) {
        this.dependencies = dependencies;
        this.__setupProperty__ = setupComputed;
        this.__teardownProperty__ = teardownComputed;
      }
      return this;
    },
    /**
            Method: Function#nocache
    
            Marks a getter method such that its value is not cached.
    
            Returns:
                {Function} Returns self.
        */
    nocache() {
      this.isVolatile = true;
      return this;
    },
    /**
            Method: Function#doNotNotify
    
            Marks a computed property so that when it is set,
            <O.ComputedProps#propertyDidChange> is not automatically called.
    
            Returns:
                {Function} Returns self.
        */
    doNotNotify() {
      this.isSilent = true;
      return this;
    },
    /**
            Method: Function#observes
    
            Defines the list of properties (on the same object) or paths (relative
            to this object) that this method is interested in. Whenever one of these
            properties changes, the method will automatically be called.
    
            Parameters:
                var_args - {...String} All arguments are treated as the names of
                        properties this method should observe.
    
            Returns:
                {Function} Returns self.
        */
    observes() {
      const properties = this.observedProperties || (this.observedProperties = []);
      for (let i = arguments.length - 1; i >= 0; i -= 1) {
        properties.push(arguments[i]);
      }
      this.__setupProperty__ = setupObserver;
      this.__teardownProperty__ = teardownObserver;
      return this;
    },
    /**
            Method: Function#on
    
            Defines the list of events this method is interested in. Whenever one of
            these events is triggered on the object to which this method belongs,
            the method will automatically be called.
    
            Parameters:
                var_args - {...String} All arguments are treated as the names of
                        events this method should be triggered by.
    
            Returns:
                {Function} Returns self.
        */
    on(...eventTypes) {
      return this.observes.apply(
        this,
        eventTypes.map((type) => {
          return eventPrefix + type;
        })
      );
    },
    /**
            Method: Function#queue
    
            Parameters:
                queue     - {String} The name of the queue to add calls to this
                            function to.
                allowDups - {Boolean} (optional). If true, the object/method will be
                            added to the queue even if already present.
    
            Returns:
                {Function} Returns wrapper that passes calls to
                <O.RunLoop.queueFn>.
        */
    queue(queue, allowDups) {
      const fn = this;
      return function() {
        queueFn(queue, fn, this, allowDups);
        return this;
      };
    },
    /**
            Method: Function#nextLoop
    
            Parameters:
                allowDups - {Boolean} (optional). If true, the object/method will be
                            added to the queue even if already present.
    
            Returns:
                {Function} Returns wrapper that passes calls to
                <O.RunLoop.invokeInNextEventLoop>.
        */
    nextLoop(allowDups) {
      const fn = this;
      return function() {
        invokeInNextEventLoop(fn, this, allowDups);
        return this;
      };
    },
    /**
            Method: Function#nextFrame
    
            Parameters:
                allowDups - {Boolean} (optional). If true, the object/method will be
                            added to the queue even if already present.
    
            Returns:
                {Function} Returns wrapper that passes calls to
                <O.RunLoop.invokeInNextFrame>.
        */
    nextFrame(allowDups) {
      const fn = this;
      return function() {
        invokeInNextFrame(fn, this, allowDups);
        return this;
      };
    },
    /**
            Method: Function#invokeInRunLoop
    
            Wraps any calls to this function inside a call to <O.RunLoop.invoke>.
    
            Returns:
                {Function} Returns wrapped function.
        */
    invokeInRunLoop() {
      const fn = this;
      return function() {
        return invoke(fn, this, arguments);
      };
    }
  });

  // source/views/ViewEventsController.js
  var etSearch = function(candidate, b) {
    const a = candidate[0];
    return a < b ? -1 : a > b ? 1 : 0;
  };
  var ViewEventsController = {
    /**
            Property (private): O.ViewEventsController#_eventTargets
            Type: [Number,O.EventTarget][]
    
            List of event targets to dispatch events to.
        */
    _eventTargets: [],
    /**
            Method: O.ViewEventsController#addEventTarget
    
            Adds an event target to queue to receive view events. The position in
            the queue is determined by the priority argument:
    
            * Greater than 0 => before the view hierarchy receives the event.
            * Less than 0 => after the view hierarchy receives the event.
    
            If an existing target in the queue has the same priority as the new one,
            the new one will be inserted such that it fires before the old one.
    
            Parameters:
                eventTarget - {O.EventTarget} The event target to add.
                priority    - {Number} The priority of the event target.
    
            Returns:
                {O.ViewEventsController} Returns self.
        */
    addEventTarget(eventTarget, priority) {
      if (!priority) {
        priority = 0;
      }
      const eventTargets = this._eventTargets.slice();
      let index = eventTargets.binarySearch(priority, etSearch);
      const length = eventTargets.length;
      while (index < length && eventTargets[index][0] === priority) {
        index += 1;
      }
      eventTargets.splice(index, 0, [priority, eventTarget]);
      this._eventTargets = eventTargets;
      return this;
    },
    /**
            Method: O.ViewEventsController#removeEventTarget
    
            Removes an event target from the queue that was previously added via
            <O.ViewEventsController#addEventTarget>.
    
            Parameters:
                eventTarget - {O.EventTarget} The event target to remove from the
                              queue.
    
            Returns:
                {O.ViewEventsController} Returns self.
        */
    removeEventTarget(eventTarget) {
      this._eventTargets = this._eventTargets.filter(
        (target) => target[1] !== eventTarget
      );
      return this;
    },
    /**
            Method: O.ViewEventsController#handleEvent
    
            Dispatches an event to each of the targets registered with the
            controller, until it reaches the end of the list or one of them calls
            `event.stopPropagation()`.
    
            Parameters:
                event - {Event} The event object to dispatch.
                view  - {O.View} (optional) The view at which the event originated.
                        This is the view the event will be fired upon after it has
                        been through all the pushed targets. If not supplied, the
                        view will be looked up via the DOM node in the
                        `event.target` property.
        */
    handleEvent: function(event, view2, _rootView, elEventCallback) {
      const eventTargets = this._eventTargets;
      if (!view2) {
        view2 = getViewFromNode(event.target) || _rootView;
      }
      event.targetView = view2;
      for (let i = eventTargets.length - 1; i >= 0; i -= 1) {
        let eventTarget = eventTargets[i][1];
        if (eventTarget === this) {
          if (elEventCallback) {
            elEventCallback(event);
            if (event.propagationStopped) {
              break;
            }
          }
          eventTarget = view2;
        }
        if (eventTarget) {
          eventTarget.fire(event.type, event);
          if (event.propagationStopped) {
            break;
          }
        }
      }
    }.invokeInRunLoop()
  };
  ViewEventsController.addEventTarget(ViewEventsController, 0);

  // source/dom/Element.js
  var directProperties = {
    // Note: SVGElement#className is an SVGAnimatedString.
    class: "className",
    className: "className",
    defaultValue: "defaultValue",
    for: "htmlFor",
    html: "innerHTML",
    text: "textContent",
    unselectable: "unselectable",
    value: "value"
  };
  var svgTagNames = /* @__PURE__ */ new Set([
    "svg",
    "altGlyph",
    "altGlyphDef",
    "altGlyphItem",
    "animate",
    "animateColor",
    "animateMotion",
    "animateTransform",
    "circle",
    "ellipse",
    "rect",
    "line",
    "polyline",
    "polygon",
    "image",
    "path",
    "clipPath",
    "color-profile",
    "cursor",
    "defs",
    "desc",
    "g",
    "symbol",
    "view",
    "use",
    "switch",
    "foreignObject",
    "filter",
    "feBlend",
    "feColorMatrix",
    "feComponentTransfer",
    "feComposite",
    "feConvolveMatrix",
    "feDiffuseLighting",
    "feDisplacementMap",
    "feDistantLight",
    "feFlood",
    "feFuncA",
    "feFuncB",
    "feFuncG",
    "feFuncR",
    "feGaussianBlur",
    "feImage",
    "feMerge",
    "feMergeNode",
    "feMorphology",
    "feOffset",
    "fePointLight",
    "feSpecularLighting",
    "feSpotLight",
    "feTile",
    "feTurbulence",
    "font",
    "font-face",
    "font-face-format",
    "font-face-name",
    "font-face-src",
    "font-face-uri",
    "glyph",
    "glyphRef",
    "hkern",
    "linearGradient",
    "marker",
    "mask",
    "pattern",
    "radialGradient",
    "set",
    "stop",
    "missing-glyph",
    "mpath",
    "text",
    "textPath",
    "tref",
    "tspan",
    "vkern",
    "metadata",
    "title"
  ]);
  var svgNS = "http://www.w3.org/2000/svg";
  var booleanProperties = {
    autofocus: 1,
    checked: 1,
    defaultChecked: 1,
    disabled: 1,
    hidden: 1,
    indeterminate: 1,
    multiple: 1,
    open: 1,
    readOnly: 1,
    required: 1,
    selected: 1,
    webkitdirectory: 1
  };
  var cssNoPx = {
    opacity: 1,
    zIndex: 1
  };
  var styleNames = {
    float: "cssFloat"
  };
  var userSelectProperty = "user-select";
  {
    const style = document.createElement("div").style;
    style.cssText = "user-select:none";
    if (!style.length) {
      if (browser === "firefox") {
        userSelectProperty = "-moz-user-select";
        styleNames.userSelect = "MozUserSelect";
      } else {
        userSelectProperty = "-webkit-user-select";
        styleNames.userSelect = "WebkitUserSelect";
      }
    }
  }
  var doc = document;
  var DOCUMENT_POSITION_CONTAINED_BY = 16;
  var view = null;
  var forView = function(newView) {
    const oldView = view;
    view = newView;
    return oldView;
  };
  var setAttributes = function(el, props) {
    const currentView = view;
    for (const prop in props) {
      const value = props[prop];
      if (value === void 0) {
        continue;
      }
      if (prop.startsWith("on")) {
        el.addEventListener(prop.slice(2), (event) => {
          ViewEventsController.handleEvent(
            event,
            currentView,
            null,
            value
          );
          event.stopPropagation();
        });
        continue;
      }
      if (Binding && value instanceof Binding) {
        value.to(prop, el).connect();
        if (currentView) {
          currentView.registerBinding(value);
        }
        continue;
      }
      el.set(prop, value);
    }
    return el;
  };
  var appendChildren = function(el, children) {
    if (!(children instanceof Array)) {
      children = [children];
    }
    for (let i = 0, l = children.length; i < l; i += 1) {
      let node = children[i];
      if (node) {
        if (node instanceof Array) {
          appendChildren(el, node);
        } else if (View && node instanceof View) {
          view.insertView(node, el);
        } else {
          if (typeof node !== "object") {
            node = doc.createTextNode(node);
          }
          el.appendChild(node);
        }
      }
    }
    return el;
  };
  var create = function(tag, props, children) {
    if (props instanceof Array) {
      children = props;
      props = null;
    }
    if (/[#.]/.test(tag)) {
      const parts = tag.split(/([#.])/);
      tag = parts[0];
      if (!props) {
        props = {};
      }
      const l = parts.length;
      for (let i = 1; i + 1 < l; i += 2) {
        const name = parts[i + 1];
        if (parts[i] === "#") {
          props.id = name;
        } else {
          props.className = props.className ? props.className + " " + name : name;
        }
      }
    }
    const el = svgTagNames.has(tag) ? doc.createElementNS(svgNS, tag) : doc.createElement(tag);
    if (props) {
      setAttributes(el, props);
    }
    if (children) {
      appendChildren(el, children);
    }
    return el;
  };
  var getStyle = function(el, style) {
    return window.getComputedStyle(el).getPropertyValue(style);
  };
  var setStyle = function(el, style, value) {
    if (value !== void 0) {
      style = camelCase(style);
      style = styleNames[style] || style;
      if (typeof value === "number" && !cssNoPx[style]) {
        value += "px";
      }
      el.style[style] = value;
    }
    return this;
  };
  var setStyles = function(el, styles) {
    for (const prop in styles) {
      setStyle(el, prop, styles[prop]);
    }
    return this;
  };
  var contains = function(el, potentialChild) {
    const relation = el.compareDocumentPosition(potentialChild);
    return !relation || !!(relation & DOCUMENT_POSITION_CONTAINED_BY);
  };
  var nearest = function(el, test, limit2) {
    if (!limit2) {
      limit2 = el.ownerDocument.documentElement;
    }
    if (typeof test === "string") {
      const nodeName = test.toUpperCase();
      test = (node) => node.nodeName === nodeName;
    }
    while (el && !test(el)) {
      if (!el || el === limit2) {
        return null;
      }
      el = el.parentNode;
    }
    return el;
  };
  var getPosition = function(el, ancestor) {
    let rect = getRawBoundingClientRect(el);
    const position = {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    };
    if (ancestor) {
      rect = getPosition(ancestor);
      if (ancestor.nodeName === "BODY") {
        ancestor = ancestor.parentNode;
      }
      position.top -= rect.top - ancestor.scrollTop;
      position.left -= rect.left - ancestor.scrollLeft;
    }
    return position;
  };
  Element.prototype.get = function(key) {
    const prop = directProperties[key];
    if (prop) {
      const value = this[prop];
      return value instanceof SVGAnimatedString ? value.animVal : value;
    }
    return booleanProperties[key] ? !!this[key] : this.getAttribute(key);
  };
  Element.prototype.set = function(key, value) {
    const prop = directProperties[key];
    if (prop) {
      const currentValue = this[prop];
      value = value == null ? "" : "" + value;
      if (currentValue instanceof SVGAnimatedString) {
        currentValue.baseVal = value;
      } else {
        this[prop] = value;
      }
    } else if (booleanProperties[key]) {
      this[key] = !!value;
    } else if (key === "styles") {
      setStyles(this, value);
    } else if (key === "children") {
      let child;
      while (child = this.lastChild) {
        this.removeChild(child);
      }
      appendChildren(this, value);
    } else if (value == null) {
      this.removeAttribute(key);
    } else if (key === "+class") {
      this.set("class", this.get("class") + " " + value);
    } else {
      this.setAttribute(key, "" + value);
    }
    return this;
  };
  var getAncestors = function(el) {
    const ancestors = [];
    while (el) {
      ancestors.push(el);
      el = el.parentElement;
    }
    return ancestors.reverse();
  };
  var cssStringFromKeyValue = function(object) {
    let result = "";
    for (let key in object) {
      let value = object[key];
      if (value !== void 0) {
        if (typeof value === "number" && !cssNoPx[key]) {
          value += "px";
        }
        key = hyphenate(key);
        if (key === "user-select") {
          key = userSelectProperty;
        }
        result += key;
        result += ":";
        result += value;
        result += ";";
      }
    }
    return result;
  };
  var getRawBoundingClientRect = (el) => {
    const scaledRect = el.getBoundingClientRect();
    const zoom = el.currentCSSZoom || 1;
    if (zoom === 1) {
      return scaledRect;
    }
    const rawRect = {};
    for (let i = 0, keys2 = Object.keys(scaledRect.toJSON()); i < keys2.length; i += 1) {
      const key = keys2[i];
      rawRect[key] = scaledRect[key] / zoom;
    }
    return rawRect;
  };

  // source/drag/DragEffect.js
  var DragEffect_exports = {};
  __export(DragEffect_exports, {
    ALL: () => ALL,
    COPY: () => COPY,
    DEFAULT: () => DEFAULT,
    LINK: () => LINK,
    MOVE: () => MOVE,
    NONE: () => NONE,
    effectToString: () => effectToString
  });
  var NONE = 0;
  var COPY = 1;
  var MOVE = 2;
  var LINK = 4;
  var ALL = 1 | 2 | 4;
  var DEFAULT = 8;
  var effectToString = [
    "none",
    "copy",
    "move",
    "copyMove",
    "link",
    "copyLink",
    "linkMove",
    "all",
    ""
  ];

  // source/drag/DropTarget.js
  var DropTarget = {
    /**
            Property: O.DropTarget#isDropTarget
            Type: Boolean
            Default: true
    
            Identifies the view as a drop target.
        */
    isDropTarget: true,
    /**
            Property: O.DropTarget#hasDragOver
            Type: Boolean
    
            True if the view is a drag is currently over the view.
        */
    hasDragOver: false,
    /**
            Property: O.DropTarget#dropEffect
            Type: O.DragEffect
            Default: O.DragEffect.MOVE
    
            The effect that will be applied to the data if dropped.
        */
    dropEffect: MOVE,
    /**
            Property: O.DropTarget#dropAcceptedDataTypes
            Type: Object
    
            An object mapping data types the drop target can handle to a truthy
            value.
        */
    dropAcceptedDataTypes: {},
    /**
            Method: O.DropTarget#willAcceptDrag
    
            When a drag moves over the drop target, this method will be called to
            determine whether the target is willing to accept the drag. If it
            returns true, it will become the active drop target. If it returns
            false, it will be ignored, and any parent views which are drop targets
            will be considered instead.
    
            Unless overridden, this method simply checks whether any of the data
            types available in the drag are included in its dropAcceptedDataTypes
            property.
    
            Parameters:
                drag - {O.Drag} The drag instance.
    
            Returns:
                {Boolean} Can the drag be dropped here?
        */
    willAcceptDrag(drag) {
      const acceptedTypes = this.get("dropAcceptedDataTypes");
      const availableTypes = drag.get("dataTypes");
      for (let i = availableTypes.length - 1; i >= 0; i -= 1) {
        if (acceptedTypes[availableTypes[i]]) {
          return true;
        }
      }
      return false;
    },
    /**
            Method: O.DropTarget#dropEntered
    
            Called when a drag instance enters the view. If this method is called,
            the dropExited method is guaranteed to be called later.
    
            Sets the drop effect on the drag instance and updates the hasDragOver
            property.
    
            Parameters:
                drag - {O.Drag} The drag instance.
        */
    dropEntered(drag) {
      drag.set("dropEffect", this.get("dropEffect"));
      this.set("hasDragOver", true);
    },
    /**
            Method: O.DropTarget#dropMoved
    
            Called when a drag instance that has entered the view moves position
            (without exiting the view).
    
            Parameters:
                drag - {O.Drag} The drag instance.
        */
    dropMoved() {
    },
    /**
            Method: O.DropTarget#dropExited
    
            Called when a drag instance exits the view.
    
            Resets the drop effect on the drag instance and updates the hasDragOver
            property.
    
            Parameters:
                drag - {O.Drag} The drag instance.
        */
    dropExited(drag) {
      drag.set("dropEffect", DEFAULT);
      this.set("hasDragOver", false);
    },
    /**
            Method: O.DropTarget#drop
    
            Called when a drag instance is dropped on the view.
    
            Parameters:
                drag - {O.Drag} The drag instance.
        */
    drop() {
    }
  };

  // source/foundation/Transform.js
  var Transform_exports = {};
  __export(Transform_exports, {
    defaultValue: () => defaultValue,
    invert: () => invert,
    isEqualToValue: () => isEqualToValue,
    toBoolean: () => toBoolean,
    toFloat: () => toFloat,
    toInt: () => toInt,
    toString: () => toString,
    undefinedToNull: () => undefinedToNull
  });
  var toBoolean = function(value) {
    return !!value;
  };
  var toString = function(value) {
    return value != null ? value + "" : "";
  };
  var toInt = function(value) {
    return parseInt(value, 10) || 0;
  };
  var toFloat = function(value) {
    return parseFloat(value);
  };
  var invert = function(value) {
    return !value;
  };
  var defaultValue = function(value) {
    return function(v) {
      return v !== void 0 ? v : value;
    };
  };
  var undefinedToNull = function(value) {
    return value === void 0 ? null : value;
  };
  var isEqualToValue = function(value) {
    return function(syncValue, syncForward) {
      return syncForward ? syncValue === value : syncValue ? value : void 0;
    };
  };

  // source/views/View.js
  var UID = 0;
  var POSITION_SAME = 0;
  var POSITION_DISCONNECTED = 1;
  var POSITION_PRECEDING = 2;
  var POSITION_FOLLOWING = 4;
  var POSITION_CONTAINS = 8;
  var POSITION_CONTAINED_BY = 16;
  var POINTER_DOWN = "pointerdown";
  var POINTER_UP = "pointerup";
  var POINTER_MOVE = "pointermove";
  var renderView = function(view2) {
    return view2.render().get("layer");
  };
  var isRedrawingLayer = false;
  var View2 = Class({
    Name: "View",
    Extends: Obj,
    /**
            Property: O.View#parentView
            Type: O.View|null
    
            The parent view of this view.
        */
    /**
            Property: O.View#childViews
            Type: O.View[]
    
            An array of the child views of this view.
        */
    /**
            Property: O.View#syncOnlyInDocument
            Type: Boolean
            Default: true
    
            If true, all bindings to the view will be suspended when the view is not
            in the document, and resumed/resynced just before being inserted into
            the document for efficiency.
        */
    syncOnlyInDocument: true,
    init: function() {
      this._suspendRedraw = false;
      this._needsRedraw = null;
      this.parentView = null;
      this.isRendered = false;
      this.isInDocument = false;
      View2.parent.constructor.apply(this, arguments);
      if (this._autoID = !this.get("id")) {
        this.set("id", "v" + UID);
        UID += 1;
      }
      const children = this.get("childViews") || (this.childViews = []);
      for (let i = children.length - 1; i >= 0; i -= 1) {
        children[i].set("parentView", this);
      }
      if (this.get("syncOnlyInDocument")) {
        this.suspendBindings();
      }
    },
    destroy() {
      if (this.get("isInDocument")) {
        throw new Error("Cannot destroy a view in the document");
      }
      const children = this.get("childViews");
      for (let i = children.length - 1; i >= 0; i -= 1) {
        children[i].destroy();
      }
      if (this.get("isRendered")) {
        this.willDestroyLayer(this.get("layer"));
      }
      View2.parent.destroy.call(this);
    },
    suspend() {
      if (!this._suspendRedraw) {
        this.suspendBindings();
        this._suspendRedraw = true;
      }
      return this;
    },
    resume() {
      if (this._suspendRedraw) {
        this._suspendRedraw = false;
        this.resumeBindings();
        if (this._needsRedraw && this.get("isInDocument")) {
          queueFn("render", this.redraw, this);
        }
      }
      return this;
    },
    // --- Screen reader accessibility ---
    /**
            Property: O.View#ariaAttributes
            Type: Object|null
    
            A set of aria attributes to apply to the layer node. The key is the name
            of the attribute, excluding the 'aria-' prefix. The role attribute can
            also be set here.
    
            It’s *possible* for a view to set ARIA attributes on the layer in other
            places, so long as they never appear in this property, but that feels
            like a bad idea. Just let this property control all the ARIA attributes;
            life will be easier for you if you do this.
    
            Example value:
    
                {
                    role: 'menu',
                    modal: 'true'
                }
        */
    ariaAttributes: null,
    // --- Layer ---
    /**
            Property: O.View#isRendered
            Type: Boolean
    
            Has the <O.View#render> method been called yet?
        */
    /**
            Property: O.View#isInDocument
            Type: Boolean
    
            Is the view currently part of the document DOM tree hierarchy?
        */
    /**
            Property: O.View#id
            Type: String
    
            The id of the view. Automatically assigned if not overridden. Will be
            set as the id of the underlying DOM node.
        */
    /**
            Property: O.View#className
            Type: String|undefined
            Default: undefined
    
            If defined, this is set as the class attribute on the underlying DOM
            node. Any change to this property will be propagated to the DOM node.
        */
    className: void 0,
    /**
            Property: O.View#layerTag
            Type: String
            Default: 'div'
    
            The node type to use for the layer representing this view.
        */
    layerTag: "div",
    /**
            Property: O.View#layer
            Type: Element
    
            The underlying DOM node for this layer.
        */
    layer: function() {
      const layer = create(this.get("layerTag"), {
        id: this.get("id"),
        className: this.get("className"),
        // (`|| undefined` to omit the attribute rather than leaving empty.)
        style: cssStringFromKeyValue(this.get("layerStyles")) || void 0
      });
      this.didCreateLayer(layer);
      this.redrawAriaAttributes(layer);
      return layer;
    }.property(),
    /**
            Method: O.View#didCreateLayer
    
            Called immediately after the layer is created. By default does nothing.
    
            Parameters:
                layer - {Element} The DOM node.
        */
    didCreateLayer() {
    },
    /**
            Method: O.View#willDestroyLayer
    
            Called immediately before the layer is destroyed.
    
            Parameters:
                layer - {Element} The DOM node.
        */
    willDestroyLayer() {
      this.set("isRendered", false);
    },
    /**
            Method: O.View#willEnterDocument
    
            Called immediately before the layer is appended to the document.
    
            Returns:
                {O.View} Returns self.
        */
    willEnterDocument() {
      if (this.get("syncOnlyInDocument")) {
        this.resume();
      }
      if (this._needsRedraw) {
        this.redraw();
      }
      const childViews = this.get("childViews");
      for (let i = 0; i < childViews.length; i += 1) {
        childViews[i].willEnterDocument();
      }
      return this;
    },
    /**
            Method: O.View#didEnterDocument
    
            Called immediately after the layer is appended to the document.
    
            Returns:
                {O.View} Returns self.
        */
    didEnterDocument() {
      if (this._needsRedraw) {
        queueFn("render", this.redraw, this);
      }
      this.set("isInDocument", true);
      const id = this.get("id");
      if (this._autoID) {
        activeViews[id] = this;
      } else {
        activeViews.set(id, this);
      }
      this.computedPropertyDidChange("pxLayout");
      const childViews = this.get("childViews");
      for (let i = 0; i < childViews.length; i += 1) {
        childViews[i].didEnterDocument();
      }
      return this;
    },
    /**
            Method: O.View#willLeaveDocument
    
            Called immediately before the layer is removed from the document.
    
            Returns:
                {O.View} Returns self.
        */
    willLeaveDocument() {
      this.set("isInDocument", false);
      const id = this.get("id");
      if (this._autoID) {
        delete activeViews[id];
      } else {
        activeViews.set(id, null);
      }
      const children = this.get("childViews");
      for (let i = children.length - 1; i >= 0; i -= 1) {
        children[i].willLeaveDocument();
      }
      return this;
    },
    /**
            Method: O.View#didLeaveDocument
    
            Called immediately after the layer is removed from the document.
    
            Returns:
                {O.View} Returns self.
        */
    didLeaveDocument() {
      const children = this.get("childViews");
      for (let i = children.length - 1; i >= 0; i -= 1) {
        children[i].didLeaveDocument();
      }
      if (this.get("syncOnlyInDocument")) {
        this.suspend();
      }
      return this;
    },
    viewNeedsRedraw() {
      this.propertyNeedsRedraw(this, "layer");
    },
    // --- Event triage ---
    /**
            Property: O.View#nextEventTarget
            Type: O.EventTarget|null
    
            The next object to bubble events to. Unless overridden, this will be the
            parent view of this view.
        */
    nextEventTarget: function() {
      return this.get("parentView");
    }.property("parentView"),
    /**
            Method: O.View#handleEvent
    
            Handler for native DOM events where this view class is registered as the
            handler. If you need to observe a DOM event which for performance
            reasons is not normally observed by the root view, for example
            mousemove, you should register the view object *directly* as the
            handler, e.g.
    
                layer.addEventListener( 'mouseover', this, false );
    
            The handleEvent method will then cause the event to be fired in the
            normal fashion on the object.
    
            Parameters:
                event - {Event} The DOM event object.
        */
    handleEvent(event) {
      ViewEventsController.handleEvent(event);
    },
    // --- Behaviour ---
    /**
            Property: O.View#isDraggable
            Type: Boolean
            Default: false
    
            Is this a draggable view? Note, to make the view draggable, you should
            include <O.Draggable> in your subclass rather than just setting this to
            true.
        */
    isDraggable: false,
    // --- Layout ---
    /**
            Property: O.View#positioning
            Type: String
            Default: 'relative'
    
            What type of positioning to use to layout the DOM node of this view.
            Will normally be either 'relative' (the default) or 'absolute'.
        */
    positioning: "relative",
    /**
            Property: O.View#layout
            Type: Object
            Default: {}
    
            The CSS properties to apply to the view's layer. Any number values are
            presumed to be in 'px', any string values are presumed to have an
            appropriate unit suffix.
        */
    layout: {},
    /**
            Property: O.View#layerStyles
            Type: Object
    
            An object representing all of the CSS styles set on the view DOM node,
            as calculated from various other properties on the view. These are
            recalculated, and the DOM node is updated, if any of the dependent
            properties change.
        */
    layerStyles: function() {
      return Object.assign(
        {
          position: this.get("positioning")
        },
        this.get("layout")
      );
    }.property("layout", "positioning"),
    /**
            Method: O.View#render
    
            Ensure the view is rendered. Has no effect if the view is already
            rendered.
    
            Returns:
                {O.View} Returns self.
        */
    render() {
      if (!this.get("isRendered")) {
        if (this.get("syncOnlyInDocument")) {
          this.resumeBindings();
        }
        this.set("isRendered", true);
        const prevView = forView(this);
        const layer = this.get("layer");
        const children = this.draw(layer);
        if (children) {
          appendChildren(layer, children);
        }
        forView(prevView);
      }
      return this;
    },
    /**
            Method (protected): O.View#draw
    
            Draw the initial state of the view. You should override this method to
            draw your views. By default, it simply calls <O.View#render> on all
            child views and appends them to the view's DOM node.
    
            Parameters:
                layer   - {Element} The root DOM node of the view.
        */
    draw() {
      return this.get("childViews").map(renderView);
    },
    /**
            Property (private): O.View#_needsRedraw
            Type: Array|null
    
            Array of tuples for properties that need a redraw. Each tuple has the
            property name as the first item and the old value as the second.
        */
    /**
            Method: O.View#propertyNeedsRedraw
    
            Adds a property to the needsRedraw queue and if in document, schedules
            the O.View#redraw method to be run in the next 'render' phase of the run
            loop. This method is automatically called when the className or
            layerStyles properties change. If the view needs to be redrawn when
            other properties change too, override this method and add the other
            properties as observees as well.
    
            Parameters:
                _             - {*} Unused
                layerProperty - {String} The name of the property needing a redraw
                oldProp       - {*} The previous value of the property
        */
    propertyNeedsRedraw: function(_, layerProperty, oldProp) {
      if (this.get("isRendered")) {
        const needsRedraw = this._needsRedraw || (this._needsRedraw = []);
        const l = needsRedraw.length;
        for (let i = 0; i < l; i += 1) {
          if (needsRedraw[i][0] === layerProperty) {
            return this;
          }
        }
        needsRedraw[l] = [layerProperty, oldProp];
        if (!this._suspendRedraw && this.get("isInDocument")) {
          queueFn("render", this.redraw, this);
        }
      }
      return this;
    }.observes("className", "layerStyles", "ariaAttributes"),
    /**
            Method: O.View#redraw
    
            Updates the rendering of the view to account for any changes in the
            state of the view. By default, just calls
            `this.redraw<Property>( layer, oldValue )` for each property that has
            been passed to <O.View#propertyNeedsRedraw>.
    
            Returns:
                {O.View} Returns self.
        */
    redraw() {
      const needsRedraw = this._needsRedraw;
      if (needsRedraw && !this._suspendRedraw && !isDestroyed(this) && this.get("isRendered")) {
        const layer = this.get("layer");
        this._needsRedraw = null;
        for (let i = 0, l = needsRedraw.length; i < l; i += 1) {
          const prop = needsRedraw[i];
          this["redraw" + capitalise(prop[0])](layer, prop[1]);
        }
      }
      return this;
    },
    /**
            Method: O.View#redrawLayer
    
            Redraws the entire layer by removing all existing children and then
            calling <O.View#draw> again. Warning: it is only safe to use this
            implementation if the view has no child views and no bindings to any of
            its DOM elements.
    
            Parameters:
                layer - {Element} The view's layer.
        */
    redrawLayer(layer) {
      const prevView = forView(this);
      let childViews = this.get("childViews");
      for (let i = childViews.length - 1; i >= 0; i -= 1) {
        const view2 = childViews[i];
        this.removeView(view2);
        view2.destroy();
      }
      let node;
      while (node = layer.lastChild) {
        layer.removeChild(node);
      }
      isRedrawingLayer = true;
      appendChildren(layer, this.draw(layer));
      isRedrawingLayer = false;
      if (this.get("isInDocument")) {
        childViews = this.get("childViews");
        for (let i = 0; i < childViews.length; i += 1) {
          childViews[i].didEnterDocument();
        }
      }
      forView(prevView);
    },
    /**
            Method: O.View#redrawClassName
    
            Sets the className on the layer to match the className property of the
            view. Called automatically when the className property changes.
    
            Parameters:
                layer - {Element} The view's layer.
        */
    redrawClassName(layer) {
      const className = this.get("className");
      if (className !== void 0) {
        layer.setAttribute("class", className);
      }
    },
    /**
            Method: O.View#redrawLayerStyles
    
            Sets the style attribute on the layer to match the layerStyles property
            of the view. Called automatically when the layerStyles property changes.
    
            Parameters:
                layer - {Element} The view's layer.
        */
    redrawLayerStyles(layer) {
      layer.style.cssText = cssStringFromKeyValue(this.get("layerStyles"));
      if (this.get("isInDocument")) {
        this.didResize();
      }
    },
    /**
            Method: O.View#redrawAriaAttributes
    
            Sets the ARIA attributes on the layer to match the ariaAttributes
            property of the view. Called automatically when the ariaAttributes
            property changes.
    
            Parameters:
                layer - {Element} The view's layer.
                oldAriaAttributes - {undefined|null|Object} The previous value.
        */
    redrawAriaAttributes(layer, oldAriaAttributes) {
      const ariaAttributes = this.get("ariaAttributes");
      for (let attribute in oldAriaAttributes) {
        if (!ariaAttributes || !(attribute in ariaAttributes)) {
          if (attribute !== "role") {
            attribute = "aria-" + attribute;
          }
          layer.removeAttribute(attribute);
        }
      }
      for (let attribute in ariaAttributes) {
        const value = ariaAttributes[attribute];
        if (attribute !== "role") {
          attribute = "aria-" + attribute;
        }
        layer.setAttribute(attribute, value);
      }
    },
    // --- Dimensions ---
    /**
            Method: O.View#parentViewDidResize
    
            Called automatically whenever the parent view resizes. Rather than
            override this method, you should normally observe the <O.View#pxLayout>
            property if you're interested in changes to the view size.
        */
    parentViewDidResize() {
      if (this.get("isInDocument")) {
        this.didResize();
      }
    },
    /**
            Method: O.View#didResize
    
            Called when the view may have resized. This will invalidate the pxLayout
            properties and inform child views.
        */
    didResize() {
      this.computedPropertyDidChange("pxLayout");
      const children = this.get("childViews");
      for (let i = children.length - 1; i >= 0; i -= 1) {
        children[i].parentViewDidResize();
      }
    },
    /**
            Property: O.View#scrollTop
            Type: Number
    
            The vertical scroll position in pixels.
        */
    scrollTop: 0,
    /**
            Property: O.View#scrollLeft
            Type: Number
    
            The horizontal scroll position in pixels.
        */
    scrollLeft: 0,
    /**
            Property: O.View#pxLayout
            Type: Object
    
            An object specifying the layout of the view in pixels. Properties:
            - top: The y-axis offset in pixels of the top edge of the view from the
              top edge of its parent's view.
            - left: The x-axis offset in pixels of the left edge of the view from
              the left edge of its parent's view.
            - width: The width of the view in pixels.
            - height: The height of the view in pixels.
        */
    pxLayout: function() {
      return {
        top: this.get("pxTop"),
        left: this.get("pxLeft"),
        width: this.get("pxWidth"),
        height: this.get("pxHeight")
      };
    }.property(),
    /**
            Property: O.View#pxTop
            Type: Number
    
            The position in pixels of the top edge of the layer from the top edge of
            the parent view's layer.
        */
    pxTop: function() {
      if (!this.get("isInDocument")) {
        return 0;
      }
      const parent = this.get("parentView").get("layer");
      const parentOffsetParent = parent.offsetParent;
      let layer = this.get("layer");
      let offset = 0;
      do {
        if (layer === parentOffsetParent) {
          offset -= parent.offsetTop;
          break;
        }
        offset += layer.offsetTop;
      } while ((layer = layer.offsetParent) && layer !== parent);
      return offset;
    }.property("pxLayout"),
    /**
            Property: O.View#pxLeft
            Type: Number
    
            The position in pixels of the left edge of the layer from the left edge
            of the parent view's layer.
        */
    pxLeft: function() {
      if (!this.get("isInDocument")) {
        return 0;
      }
      const parent = this.get("parentView").get("layer");
      const parentOffsetParent = parent.offsetParent;
      let layer = this.get("layer");
      let offset = 0;
      do {
        if (layer === parentOffsetParent) {
          offset -= parent.offsetLeft;
          break;
        }
        offset += layer.offsetLeft;
      } while ((layer = layer.offsetParent) && layer !== parent);
      return offset;
    }.property("pxLayout"),
    /**
            Property: O.View#pxWidth
            Type: Number
    
            The width of the view's layer in pixels.
        */
    pxWidth: function() {
      return this.get("isInDocument") ? this.get("layer").offsetWidth : 0;
    }.property("pxLayout"),
    /**
            Property: O.View#pxHeight
            Type: Number
    
            The height of the view's layer in pixels.
        */
    pxHeight: function() {
      return this.get("isInDocument") ? this.get("layer").offsetHeight : 0;
    }.property("pxLayout"),
    /**
            Property: O.View#visibleRect
            Type: Object
    
            Using a pixel coordinate system with (0,0) at the top left corner of
            this view's layer, returns the rectangle (x, y, width, height) of this
            layer which is currently visible on screen.
    
            For performance reasons, the default implementation does not accurately
            take into account clipping by parent view; you should must include
            <O.TrueVisibleRect> in the view if you need this to be accurate.
        */
    visibleRect: function() {
      return {
        x: this.get("scrollLeft"),
        y: this.get("scrollTop"),
        width: this.get("pxWidth"),
        height: this.get("pxHeight")
      };
    }.property("scrollLeft", "scrollTop", "pxLayout"),
    /**
            Method: O.View#getPositionRelativeTo
    
            Get the offset of this view relative to another view. Both views should
            be currently in the document.
    
            Parameters:
                view - {O.View} The view to get the offset from.
    
            Returns:
                {Object} An object with 'top' and 'left' properties, each being the
                number of pixels this view is offset from the given view, and
                'width' and 'height' properties for the dimensions of this view.
        */
    getPositionRelativeTo(view2) {
      if (view2.syncBackScroll) {
        view2.syncBackScroll();
        view2.redraw();
      }
      this.redraw();
      const selfPosition = getPosition(this.get("layer"));
      const viewPosition = getPosition(view2.get("layer"));
      selfPosition.top -= viewPosition.top - view2.get("scrollTop");
      selfPosition.left -= viewPosition.left - view2.get("scrollLeft");
      return selfPosition;
    },
    // --- Insertion and deletion ---
    /**
            Method: O.View#insertView
    
            Insert a new child view. If the view already has a parent view, it will
            be removed from that view first.
    
            Parameters:
                view       - {O.View} The new child view to insert.
                relativeTo - {(Element|O.View)} (optional) The DOM node or child
                             view to insert the new child view's layer relative to.
                             If not supplied, or null/undefined, the child will be
                             inserted relative to this view's layer.
                where      - {String} (optional) Specifies where the view's layer
                             should be placed in the DOM tree relative to the
                             relativeView node. Defaults to 'bottom' (appended to
                             node), may also be 'before', 'after' or 'top'.
    
            Returns:
                {O.View} Returns self.
        */
    insertView(view2, relativeTo, where) {
      const oldParent = view2.get("parentView");
      const childViews = this.get("childViews");
      if (oldParent === this) {
        return this;
      }
      if (!relativeTo && (where === "before" || where === "after")) {
        this.get("parentView").insertView(view2, this, where);
        return this;
      }
      if (oldParent) {
        oldParent.removeView(view2);
      }
      view2.set("parentView", this);
      if (relativeTo instanceof View2) {
        let index = childViews.indexOf(relativeTo);
        index = index > -1 ? where === "before" ? index : index + 1 : childViews.length;
        childViews.splice(index, 0, view2);
        relativeTo = relativeTo.get("layer");
      } else if (where === "top") {
        childViews.unshift(view2);
      } else {
        childViews.push(view2);
      }
      if (this.get("isRendered")) {
        if (!relativeTo) {
          relativeTo = this.get("layer");
          if (where === "before" || where === "after") {
            where = "";
          }
        }
        const isInDocument = this.get("isInDocument");
        const parent = where === "before" || where === "after" ? relativeTo.parentNode : relativeTo;
        const before = where === "before" ? relativeTo : where === "top" ? relativeTo.firstChild : where === "after" ? relativeTo.nextSibling : null;
        const layer = view2.render().get("layer");
        if (isInDocument) {
          view2.willEnterDocument();
        }
        if (before) {
          parent.insertBefore(layer, before);
        } else {
          parent.appendChild(layer);
        }
        if (isInDocument && !isRedrawingLayer) {
          view2.didEnterDocument();
        }
      }
      this.propertyDidChange("childViews");
      return this;
    },
    /**
            Method: O.View#replaceView
    
            Replaces one child view with another. If the new view already has a
            parent view, it will be removed from that view first. The new view will
            be inserted in the exact same position in the DOM as the view it is
            replacing. If the oldView supplied is not actually an existing child of
            this view, this method has no effect.
    
            Parameters:
                view    - {O.View} The new child view to insert.
                oldView - {O.View} The old child view to replace.
    
            Returns:
                {O.View} Returns self.
        */
    replaceView(view2, oldView) {
      if (view2 === oldView) {
        return this;
      }
      const children = this.get("childViews");
      const i = children.indexOf(oldView);
      const oldParent = view2.get("parentView");
      if (i === -1) {
        return this;
      }
      if (oldParent) {
        oldParent.removeView(view2);
      }
      view2.set("parentView", this);
      children.setObjectAt(i, view2);
      if (this.get("isRendered")) {
        const isInDocument = this.get("isInDocument");
        const oldLayer = oldView.get("layer");
        view2.render();
        if (isInDocument) {
          oldView.willLeaveDocument();
          view2.willEnterDocument();
        }
        oldLayer.parentNode.replaceChild(view2.get("layer"), oldLayer);
        if (isInDocument) {
          view2.didEnterDocument();
          oldView.didLeaveDocument();
        }
      }
      oldView.set("parentView", null);
      this.propertyDidChange("childViews");
      return this;
    },
    /**
            Method: O.View#removeView
    
            Removes a child view from this view. Has no effect if the view passed as
            an argument is not a child view of this view.
    
            Parameters:
                view - {O.View} The child view to remove.
    
            Returns:
                {O.View} Returns self.
        */
    removeView(view2) {
      const children = this.get("childViews");
      const i = children.lastIndexOf(view2);
      if (i === -1) {
        return this;
      }
      if (this.get("isRendered")) {
        const isInDocument = this.get("isInDocument");
        const layer = view2.get("layer");
        if (isInDocument) {
          view2.willLeaveDocument();
        }
        layer.remove();
        if (isInDocument) {
          view2.didLeaveDocument();
        }
      }
      children.splice(i, 1);
      view2.set("parentView", null);
      this.propertyDidChange("childViews");
      return this;
    },
    /**
            Method: O.View#detach
    
            Removes this view from its parentView. Has no effect if this view
            does not have a parentView.
    
            Returns:
                {O.View} Returns self.
        */
    detach() {
      const parentView = this.get("parentView");
      if (parentView) {
        parentView.removeView(this);
      }
      return this;
    },
    // --- Tree position and searching ---
    /**
            Method: O.View#compareViewTreePosition
    
            Returns a constant giving the relative position in the view tree (as
            specified by the parentView/childViews parameters) of this view compared
            to the view given as a parameter. The constants are:
    
                O.View.POSITION_SAME         - They are the same view instance.
                O.View.POSITION_DISCONNECTED - This view is not in the same tree as
                                               the given view.
                O.View.POSITION_PRECEDING    - This view is before the given view in
                                               the DOM tree
                O.View.POSITION_FOLLOWING    - This view is after the given view in
                                               the DOM tree
                O.View.POSITION_CONTAINS     - This view contains the given view.
                O.View.POSITION_CONTAINED_BY - This view is contained by the given
                                               view.
    
            Parameters:
                view - {O.View} The view to compare position to.
    
            Returns:
                {Number} Relative position.
        */
    compareViewTreePosition(b) {
      if (this === b) {
        return POSITION_SAME;
      }
      let a = this;
      const aParents = [a];
      const bParents = [b];
      let parent = a;
      while (parent = parent.get("parentView")) {
        if (parent === b) {
          return POSITION_CONTAINED_BY;
        }
        aParents.push(parent);
      }
      parent = b;
      while (parent = parent.get("parentView")) {
        if (parent === a) {
          return POSITION_CONTAINS;
        }
        bParents.push(parent);
      }
      for (let al = aParents.length - 1, bl = bParents.length - 1; al >= 0 && bl >= 0; al -= 1, bl -= 1) {
        a = aParents[al];
        b = bParents[bl];
        if (a !== b) {
          parent = aParents[al + 1];
          if (!parent) {
            return POSITION_DISCONNECTED;
          }
          const children = parent.get("childViews");
          for (let i = children.length - 1; i >= 0; i -= 1) {
            const view2 = children[i];
            if (view2 === b) {
              return POSITION_PRECEDING;
            }
            if (view2 === a) {
              return POSITION_FOLLOWING;
            }
          }
          break;
        }
      }
      return POSITION_DISCONNECTED;
    },
    /**
            Method: O.View#getParent
    
            Finds the nearest ancestor in the view hierarchy which is an instance of
            a particular view class.
    
            Parameters:
                Type - {O.Class} A view type (i.e. a subclass of O.View).
    
            Returns:
                {(O.View|null)} Returns the nearest parent view of the given type or
                null if none of the view's ancestors are of the required type.
        */
    getParent(Type) {
      let parent = this;
      do {
        parent = parent.get("parentView");
      } while (parent && !(parent instanceof Type));
      return parent || null;
    },
    /**
            Method: O.View#getParentWhere
    
            Finds the nearest ancestor in the view hierarchy which satisfies the
            given condition function.
    
            Parameters:
                condition - {function( View ) -> boolean} The function to check
                            against each ancestor view; if this function returns
                            true, that view will be returned.
    
            Returns:
                {(O.View|null)} Returns the nearest parent view for which the
                condition function returns true, or null if the condition function
                never returns true.
        */
    getParentWhere(condition) {
      let parent = this;
      do {
        parent = parent.get("parentView");
      } while (parent && !condition(parent));
      return parent || null;
    },
    /**
            Method: O.View#getShortcutTarget
    
            Get the DOM node that should be targeted when drawing the tooltip
            for this shortcut.
    
            Parameters:
                key - {String} The key combination for the shortcut whose
                tooltip will be drawn.
    
            Returns:
                {Element[]|null} The DOM nodes that the tooltip should be drawn
                above or null if no tooltip should be displayed.
        */
    getShortcutTarget() {
      return null;
    }
  });
  setView(View2);
  var LAYOUT_FILL_PARENT = {
    top: 0,
    left: 0,
    bottom: 0,
    right: 0
  };
  var peekId = function() {
    return "v" + UID;
  };

  // source/views/collections/SwitchView.js
  var forEachView = function(views, method, args) {
    const length = views ? views.length : 0;
    for (let i = length - 1; i >= 0; i -= 1) {
      const view2 = views[i];
      if (view2 instanceof View2 && !isDestroyed(view2)) {
        if (args) {
          view2[method].apply(view2, args);
        } else {
          view2[method]();
        }
      }
    }
  };
  var flattenAndPrune = function(array, node) {
    if (node instanceof Array) {
      node.reduce(flattenAndPrune, array);
    } else if (node) {
      array.push(node);
    }
    return array;
  };
  var SwitchView = Class({
    Name: "SwitchView",
    Extends: View2,
    syncOnlyInDocument: false,
    init: function() {
      this._oldView = null;
      this._index = -1;
      this.index = 0;
      this.views = [];
      this.subViews = [];
      SwitchView.parent.constructor.apply(this, arguments);
      this.isRendered = true;
      const views = this.get("views");
      let view2;
      for (let i = views.length - 1; i >= 0; i -= 1) {
        view2 = views[i];
        if (view2 && !(view2 instanceof Array)) {
          views[i] = [view2];
        }
      }
    },
    destroy() {
      let views = this.get("views");
      for (let i = views.length - 1; i >= 0; i -= 1) {
        forEachView(views[i], "destroy");
      }
      views = this.get("subViews");
      for (let i = views.length - 1; i >= 0; i -= 1) {
        forEachView(views[i], "destroy");
      }
      SwitchView.parent.destroy.call(this);
    },
    // ---
    layer: function() {
      return document.createComment("SwitchView " + this.get("id"));
    }.property(),
    willEnterDocument() {
      this.resume();
      this.redraw();
      return this;
    },
    didEnterDocument() {
      this.set("isInDocument", true);
      if (this.get("index") !== this._index) {
        this.switchNeedsRedraw();
      }
      return this;
    },
    willLeaveDocument() {
      return this.set("isInDocument", false);
    },
    didLeaveDocument() {
      return this.suspend();
    },
    // ---
    redraw() {
      const oldIndex = this._index;
      const newIndex = this.get("index");
      if (oldIndex > -1 && oldIndex !== newIndex && !isDestroyed(this)) {
        if (this._suspendRedraw) {
          this._needsRedraw = [];
        } else {
          this._needsRedraw = null;
          const parentView = this.get("parentView");
          if (parentView) {
            this._remove(parentView);
            this._add();
          }
        }
      }
    },
    switchNeedsRedraw: function() {
      if (this.get("isInDocument")) {
        if (this._suspendRedraw) {
          this._needsRedraw = [];
        } else {
          queueFn("render", this.redraw, this);
        }
      }
    }.observes("index"),
    parentViewDidChange: function(_, __, oldParent, newParent) {
      if (oldParent) {
        oldParent.removeObserverForKey("childViews", this, "_add");
        this._remove(oldParent);
      }
      if (newParent) {
        if (newParent.get("childViews").includes(this)) {
          this._add();
        } else {
          newParent.addObserverForKey("childViews", this, "_add");
        }
      }
    }.observes("parentView"),
    _add() {
      const index = this.get("index");
      const views = this.get("views")[index];
      const subViews = this.get("subViews")[index];
      const parent = this.get("parentView");
      const isInDocument = parent.get("isInDocument");
      const position = this.get("layer");
      const layer = position.parentNode;
      parent.removeObserverForKey("childViews", this, "_add");
      if (this._index !== -1) {
        return;
      }
      this._index = index;
      if (subViews) {
        forEachView(subViews, "set", ["parentView", parent]);
        if (isInDocument) {
          forEachView(subViews, "willEnterDocument");
        }
      }
      const length = views ? views.length : 0;
      for (let i = length - 1; i >= 0; i -= 1) {
        let node = views[i];
        if (node instanceof View2) {
          parent.insertView(node, this, "after");
        } else {
          if (typeof node !== "object") {
            node = views[i] = document.createTextNode(node);
          }
          const before = position.nextSibling;
          if (before) {
            layer.insertBefore(node, before);
          } else {
            layer.appendChild(node);
          }
        }
      }
      if (subViews) {
        if (isInDocument) {
          forEachView(subViews, "didEnterDocument");
        }
        Array.prototype.push.apply(parent.get("childViews"), subViews);
        parent.propertyDidChange("childViews");
      }
    },
    _remove(parent) {
      const oldIndex = this._index;
      const views = this.get("views")[oldIndex];
      const subViews = this.get("subViews")[oldIndex];
      const isInDocument = parent.get("isInDocument");
      if (isInDocument && subViews) {
        forEachView(subViews, "willLeaveDocument");
      }
      const length = views ? views.length : 0;
      for (let i = length - 1; i >= 0; i -= 1) {
        const node = views[i];
        if (node instanceof View2) {
          parent.removeView(node);
        } else {
          node.remove();
        }
      }
      if (subViews) {
        if (isInDocument) {
          forEachView(subViews, "didLeaveDocument");
        }
        forEachView(subViews, "set", ["parentView", null]);
        const childViews = parent.get("childViews");
        for (let i = subViews.length - 1; i >= 0; i -= 1) {
          const view2 = subViews[i];
          let index = childViews.lastIndexOf(view2);
          let numToRemove = 1;
          if (index > -1) {
            while (i > 0 && index > 0 && subViews[i - 1] === childViews[index - 1]) {
              i -= 1;
              index -= 1;
              numToRemove += 1;
            }
            childViews.splice(index, numToRemove);
          }
        }
        parent.propertyDidChange("childViews");
      }
      this._index = -1;
    },
    // ---
    /*
        If views are inside el() methods, they will call this method. Collect
        them up, then pass them as subViews when show() or otherwise() is
        called.
    */
    insertView(view2, parentNode) {
      this.childViews.push(view2);
      const oldParent = view2.get("parentView");
      if (oldParent) {
        oldParent.removeView(view2);
      }
      parentNode.appendChild(view2.render().get("layer"));
      return this;
    },
    case(index, view2) {
      view2 = view2 ? view2 instanceof Array ? view2 : [view2] : null;
      this.views[index] = view2 && view2.reduce(flattenAndPrune, []);
      const subViews = this.childViews;
      if (subViews.length) {
        this.subViews[index] = subViews;
        this.childViews = [];
      }
      return this;
    },
    show(view2) {
      return this.case(0, view2);
    },
    otherwise(view2) {
      return this.case(1, view2);
    },
    end() {
      forView(this._oldView);
      this._oldView = null;
      return this;
    }
  });
  var pickViewWhen = function(bool) {
    return bool ? 0 : 1;
  };
  var pickViewUnless = function(bool) {
    return bool ? 1 : 0;
  };
  var choose = function(object, property, transform) {
    const switchView = new SwitchView({
      index: bind(object, property, transform)
    });
    switchView._oldView = forView(switchView);
    return switchView;
  };
  var when = function(object, property, transform) {
    const pickView = transform ? function(value, syncForward) {
      return pickViewWhen(transform(value, syncForward));
    } : pickViewWhen;
    return choose(object, property, pickView);
  };
  var unless = function(object, property, transform) {
    const pickView = transform ? function(value, syncForward) {
      return pickViewUnless(transform(value, syncForward));
    } : pickViewUnless;
    return choose(object, property, pickView);
  };

  // source/views/controls/AbstractControlView.js
  var AbstractControlView = Class({
    Name: "AbstractControlView",
    Extends: View2,
    /**
            Property: O.AbstractControlView#isDisabled
            Type: Boolean
            Default: false
    
            Is the control disabled?
        */
    isDisabled: false,
    /**
            Property: O.AbstractControlView#isFocused
            Type: Boolean
    
            Represents whether the control currently has focus or not.
        */
    isFocused: false,
    /**
            Property: O.AbstractControlView#tabIndex
            Type: Number
            Default: 0
    
            If set, this will become the tab index for the control.
        */
    tabIndex: 0,
    /**
            Property: O.AbstractControlView#type
            Type: String
            Default: ''
    
            A space-separated list of CSS classnames to give the layer in the DOM,
            irrespective of state.
        */
    type: "",
    /**
            Property: O.AbstractControlView#baseClassName
            Type: String
            Default: ''
    
            A string used as the base-level class name by this view; expected to be
            static. Other class names are appended to this string to create the full
            list of class names for a view's state.
        */
    baseClassName: "",
    /**
            Method: O.AbstractControlView#didEnterDocument
    
            Overridden to drop focus before leaving the DOM.
            See <O.View#didEnterDocument>.
        */
    willLeaveDocument() {
      if (isIOS && this.get("isFocused")) {
        this.blur();
      }
      return AbstractControlView.parent.willLeaveDocument.call(this);
    },
    /**
            Property (private): O.AbstractControlView#_domControl
            Type: Element|null
    
            A reference to the DOM control managed by the view.
        */
    _domControl: null,
    // --- Keep render in sync with state ---
    abstractControlNeedsRedraw: function(self, property, oldValue) {
      return this.propertyNeedsRedraw(self, property, oldValue);
    }.observes("isDisabled", "tabIndex"),
    /**
            Method: O.AbstractControlView#redrawIsDisabled
    
            Updates the disabled attribute on the DOM control to match the
            isDisabled property of the view.
        */
    redrawIsDisabled() {
      this._domControl.disabled = this.get("isDisabled");
    },
    /**
            Method: O.AbstractControlView#redrawTabIndex
    
            Updates the tabIndex attribute on the DOM control to match the tabIndex
            property of the view.
        */
    redrawTabIndex() {
      this._domControl.tabIndex = this.get("tabIndex");
    },
    // --- Focus ---
    /**
            Method: O.AbstractControlView#focus
    
            Focusses the control.
    
            Returns:
                {O.AbstractControlView} Returns self.
        */
    focus() {
      if (this.get("isInDocument")) {
        this._domControl.focus({
          preventScroll: true
        });
        if (!this.get("isFocused")) {
          this.fire("focus", {
            target: this._domControl,
            targetView: this
          });
        }
      }
      return this;
    },
    /**
            Method: O.AbstractControlView#blur
    
            Removes focus from the control.
    
            Returns:
                {O.AbstractControlView} Returns self.
        */
    blur() {
      if (this.get("isInDocument")) {
        this._domControl.blur();
        if (this.get("isFocused")) {
          this.fire("blur", {
            target: this._domControl,
            targetView: this
          });
        }
      }
      return this;
    },
    /**
            Method (private): O.AbstractControlView#_updateIsFocused
    
            Updates the <#isFocused> property.
    
            Parameters:
                event - {Event} The focus event.
        */
    _updateIsFocused: function(event) {
      this.set(
        "isFocused",
        event.type === "focus" && event.target === this._domControl
      );
    }.on("focus", "blur")
  });

  // source/application/keyboardShortcuts.js
  var keyboardShortcuts_exports = {};
  __export(keyboardShortcuts_exports, {
    ACTIVE_IN_INPUT: () => ACTIVE_IN_INPUT,
    DEFAULT_IN_INPUT: () => DEFAULT_IN_INPUT,
    DELETE_ITEM: () => DELETE_ITEM,
    DISABLE_IN_INPUT: () => DISABLE_IN_INPUT
  });
  var DEFAULT_IN_INPUT = 0;
  var ACTIVE_IN_INPUT = 1;
  var DISABLE_IN_INPUT = 2;
  var DELETE_ITEM = isApple ? "Cmd-Backspace" : "Delete";

  // source/application/toPlatformKey.js
  var toPlatformKey = function(key) {
    if (key.includes("Cmd-")) {
      key = key.replace("Cmd-", isApple ? "Meta-" : "Ctrl-");
      if (!isApple && key.includes("Shift-") && key.charAt(key.length - 2) === "-") {
        key = key.slice(0, -1) + key.slice(-1).toUpperCase();
      }
    }
    return key;
  };

  // source/views/controls/Activatable.js
  var Activatable = {
    /**
            Property: O.Activatable#shortcut
            Type: String
            Default: ''
    
            If set, this will be registered as the keyboard shortcut to activate the
            control when it is in the document.
        */
    shortcut: "",
    /**
            Property: O.Activatable#shortcutWhenInputFocused
            Type: Enum
            Default: GlobalKeyboardShortcuts.DEFAULT_IN_INPUT
    
            If a shortcut is set, should it be active when an input is focused?
        */
    shortcutWhenInputFocused: DEFAULT_IN_INPUT,
    /**
            Property: O.Activatable#tooltip
            Type: String
            Default: ''
    
            A tooltip to show when the mouse hovers over the view.
        */
    tooltip: "",
    didCreateLayer(layer) {
      this.redrawTooltip(layer);
    },
    getShortcutTarget(key) {
      const shortcut = this.get("shortcut").split(" ")[0];
      if (shortcut === "") {
        return null;
      }
      return toPlatformKey(shortcut) === key ? this.get("layer") : null;
    },
    _updateShortcutRegistration: function() {
      if (this.get("isInDocument")) {
        const shortcut = this.get("shortcut");
        if (shortcut) {
          shortcut.split(" ").forEach((key) => {
            ViewEventsController.kbShortcuts.register(
              key,
              this,
              "activate",
              this.get("shortcutWhenInputFocused")
            );
          });
        }
      } else {
        const shortcut = this.get("shortcut");
        if (shortcut) {
          shortcut.split(" ").forEach((key) => {
            ViewEventsController.kbShortcuts.deregister(
              key,
              this,
              "activate"
            );
          });
        }
      }
    }.observes("isInDocument"),
    // --- Keep render in sync with state ---
    tooltipNeedsRedraw: function(self, property, oldValue) {
      return this.propertyNeedsRedraw(self, property, oldValue);
    }.observes("tooltip"),
    /**
            Method: O.Activatable#redrawTooltip
    
            Parameters:
                layer - {Element} The DOM layer for the view.
    
            Updates the title attribute on the DOM layer to match the tooltip
            property of the view.
        */
    redrawTooltip(layer) {
      const tooltip = this.get("tooltip");
      if (tooltip) {
        layer.title = tooltip;
      }
    },
    // --- Activate ---
    /**
            Method: O.Activatable#activate
    
            An abstract method to be overridden by subclasses. This is the action
            performed when the target is activated, either by being clicked on or
            via a keyboard shortcut.
        */
    activate() {
    }
  };

  // source/views/controls/ButtonView.js
  var ButtonView = Class({
    Name: "ButtonView",
    Extends: AbstractControlView,
    Mixin: [Activatable],
    /**
            Property: O.ButtonView#isActive
            Type: Boolean
            Default: false
    
            If the button is a toggle (like in the case of <O.MenuButtonView>, where
            the menu is either visible or not), this property should be set to true
            when in the active state, and false when not. This provides a CSS hook
            for drawing the correct style to represent the button state.
    
            <O.MenuButtonView> instances will automatically set this property
            correctly, but if you subclass O.ButtonView yourself in a similar way,
            be sure to set this when the state changes.
        */
    isActive: false,
    /**
            Property: O.ButtonView#isWaiting
            Type: Boolean
            Default: false
    
            Is the button waiting for something to complete? Setting this to true
            will disable the button and add an 'is-waiting' class name.
        */
    isWaiting: false,
    /**
            Property: O.ButtonView#type
            Type: Element|null
            Default: null
    
            An element to insert before the label.
        */
    icon: null,
    /**
            Property: O.ButtonView#label
            Type: String|null
            Default: ''
    
            Label text drawn within the button.
        */
    label: "",
    // --- Render ---
    /**
            Property: O.ButtonView#layerTag
            Type: String
            Default: 'button'
    
            Overrides default in <O.View#layerTag>.
        */
    layerTag: "button",
    /**
            Property: O.ButtonView#baseClassName
            Type: String
            Default: 'v-Button'
    
            Overrides default in <O.AbstractControlView#baseClassName>.
        */
    baseClassName: "v-Button",
    /**
            Property: O.ButtonView#className
            Type: String
    
            Overrides default in <O.View#className>. The layer will always have the
            class "ButtonView" plus any classes listed in the <O.ButtonView#type>
            property. In addition, it may have the following classes depending on
            the state:
    
            hasIcon     - If the view has an icon property set.
            active      - If the view's isActive property is true.
            disabled    - If the view's isDisabled property is true.
        */
    className: function() {
      const type = this.get("type");
      return this.get("baseClassName") + (type ? " " + type : "") + (this.get("icon") ? " has-icon" : "") + (this.get("isActive") ? " is-active" : "") + (this.get("isWaiting") ? " is-waiting" : "") + (this.get("isDisabled") ? " is-disabled" : "");
    }.property("type", "icon", "isActive", "isWaiting", "isDisabled"),
    drawLabel(label) {
      return create("span.label", [label]);
    },
    /**
            Method: O.ButtonView#draw
    
            Overridden to draw view. See <O.View#draw>. For DOM structure, see
            general <O.ButtonView> notes.
        */
    draw(layer) {
      this._domControl = layer;
      layer.type = "button";
      let icon = this.get("icon");
      if (!icon) {
        icon = document.createComment("icon");
      }
      let label = this.get("label");
      if (label) {
        label = this.drawLabel(label);
      } else {
        label = document.createComment("label");
      }
      this._domLabel = label;
      this.redrawIsDisabled(layer);
      this.redrawTabIndex(layer);
      return [icon, label];
    },
    // --- Keep render in sync with state ---
    /**
            Method: O.ButtonView#buttonNeedsRedraw
    
            Calls <O.View#propertyNeedsRedraw> for extra properties requiring
            redraw.
        */
    buttonNeedsRedraw: function(self, property, oldValue) {
      if (property === "isWaiting") {
        property = "isDisabled";
      }
      return this.propertyNeedsRedraw(self, property, oldValue);
    }.observes("icon", "isWaiting", "label"),
    redrawIcon(layer) {
      let icon = this.get("icon");
      if (!icon) {
        icon = document.createComment("icon");
      }
      layer.replaceChild(icon, layer.firstChild);
    },
    redrawIsDisabled() {
      this._domControl.disabled = this.get("isDisabled") || this.get("isWaiting");
    },
    redrawLabel(layer) {
      let label = this.get("label");
      if (label) {
        label = this.drawLabel(label);
        layer.replaceChild(label, this._domLabel);
        this._domLabel = label;
        this.fire("button:resize");
      }
    },
    // --- Activate ---
    /**
            Property: O.ButtonView#target
            Type: Object|null
            Default: null
    
            The object to fire an event/call a method on when the button is
            activated. If null (the default), the ButtonView instance itself will be
            used.
        */
    target: null,
    /**
            Property: O.ButtonView#action
            Type: String|null
            Default: null
    
            The name of the event to fire on the <#target> when the button is
            activated. Note, you should set *either* the action property or the
            <#method> property. If both are set, the action property will be
            ignored.
        */
    action: null,
    /**
            Property: O.ButtonView#method
            Type: String|null
            Default: null
    
            The name of the method to call on the <#target> when the button is
            activated. Note, you should set *either* the <#action> property or the
            method property. If both are set, the action property will be ignored.
        */
    method: null,
    /**
            Method: O.ButtonView#activate
    
            This method is called when the button is triggered, either by being
            clicked/tapped on, or via a keyboard shortcut. If the button is
            disabled, it will do nothing. Otherwise, it calls the method named in
            the <#method> property on the object instead. Or, if no method is
            defined, it fires an event with the name given in the <#action> property
            on the <#target> object, if one is set.
    
            If an event is fired, the `originView` property of the event object
            provides a reference back to the button that fired it. If a method is
            called, the ButtonView instance will be passed as the sole argument.
    
            It also fires an event called `button:activate` on itself.
        */
    activate(event) {
      if (!this.get("isDisabled") && !this.get("isWaiting")) {
        this.isKeyActivation = !!event && !!event.type && event.type.startsWith("key");
        const target = this.get("target") || this;
        const method = this.get("method");
        const action = method ? null : this.get("action");
        if (method) {
          target[method](this, event);
        } else if (action) {
          target.fire(action, { originView: this, originEvent: event });
        }
        this.fire("button:activate");
      }
    },
    // --- Keep state in sync with render ---
    /**
            Property: O.ButtonView#noRepeatWithin
            Type: Number
    
            Time in ms to ignore further clicks after being clicked. By default,
            this is 200ms, which encompasses most double clicks. So for people that
            automatically double click everything (yep! that's a type of user), we
            won't trigger twice. This is important if you automatically select the
            next item after applying an action.
        */
    noRepeatWithin: 200,
    /**
            Property (private): O.ButtonView#_ignoreUntil
            Type: Number
    
            We want to trigger on mouseup so that the button can be used in a menu
            in a single click action. However, we also want to trigger on click for
            accessibility reasons. We don't want to trigger twice though, and at the
            time of the mouseup event there's no way to know if a click event will
            follow it. However, if a click event *is* following it, the click event
            will already be in the event queue, so we temporarily ignore clicks and
            put a callback function onto the end of the event queue to stop
            ignoring them. We can also add any delay for the noRepeatWithin property
            to extend the time we ignore further clicks.
        */
    _ignoreUntil: 0,
    /**
        Method (private): O.ButtonView#_setIgnoreUntil
    */
    _setIgnoreUntil() {
      this._ignoreUntil = Date.now() + this.get("noRepeatWithin");
    },
    /**
            Method: O.ButtonView#mouseActivate
    
            Activates the button on normal clicks.
    
            Parameters:
                event - {Event} The click or mouseup event.
        */
    mouseActivate: function(event) {
      if (this._ignoreUntil > Date.now() || event.button || event.metaKey || event.ctrlKey) {
        return;
      }
      if (event.type !== POINTER_UP || this.getParentWhere((x) => x.isMenuView)) {
        this._ignoreUntil = 41024448e5;
        invokeInNextEventLoop(this._setIgnoreUntil, this);
        this.activate(event);
        event.preventDefault();
        this.blur();
      }
    }.on(POINTER_UP, "click"),
    /**
            Method: O.ButtonView#keyboardActivate
    
            Activates the button when it has keyboard focus and the `enter` or
            `space` key is pressed.
    
            Parameters:
                event - {Event} The keypress event.
        */
    keyboardActivate: function(event) {
      const key = lookupKey(event);
      if (key === "Enter" || key === "Space") {
        this.activate(event);
        event.preventDefault();
        event.stopPropagation();
      }
      if (key === "Escape") {
        this.blur();
        event.stopPropagation();
      }
    }.on("keydown")
  });

  // source/views/controls/FileButtonView.js
  function _cloneFiles(files) {
    const promises = [];
    for (const file of files) {
      promises.push(
        file.arrayBuffer().then(
          (buffer) => new File([buffer], file.name, { type: file.type })
        )
      );
    }
    return Promise.all(promises);
  }
  var FileButtonView = Class({
    Name: "FileButtonView",
    Extends: ButtonView,
    /**
            Property: O.FileButtonView#acceptMultiple
            Type: Boolean
            Default: false
    
            Should the user be allowed to select multiple files at once?
        */
    acceptMultiple: false,
    /**
            Property: O.FileButtonView#acceptFolder
            Type: Boolean
            Default: false
    
            Should the user be allowed to select a folder to upload instead of
            individual files (if the browser supports it)?
        */
    acceptFolder: false,
    /**
            Property: O.FileButtonView#acceptOnlyTypes
            Type: String
            Default: ''
    
            A comma-separated list of MIME types that may be selected by the user.
            Modern browsers only (set directly as the `accept` attribute in the
            `<input>` element).
        */
    acceptOnlyTypes: "",
    // --- Render ---
    baseClassName: "v-FileButton",
    className: function() {
      return "v-Button " + ButtonView.prototype.className.call(this);
    }.property(...ButtonView.prototype.className.dependencies),
    type: "v-Button",
    drawControl() {
      return this._domControl = create("input", {
        className: this.get("baseClassName") + "-input",
        type: "file",
        accept: this.get("acceptOnlyTypes") || void 0,
        multiple: this.get("acceptMultiple"),
        webkitdirectory: this.get("acceptFolder") || void 0
      });
    },
    /**
            Method: O.FileButtonView#draw
    
            Overridden to draw view. See <O.View#draw>. For DOM structure, see
            general <O.FileButtonView> notes.
        */
    draw(layer) {
      const children = FileButtonView.parent.draw.call(this, layer);
      children.push(this.drawControl());
      return children;
    },
    // --- Activate ---
    /**
            Method: O.FileButtonView#activate
    
            Opens the OS file chooser dialog.
        */
    activate() {
      this._setIgnoreUntil();
      this._domControl.click();
      this._setIgnoreUntil();
    },
    /**
            Method (private): O.FileButtonView#_fileWasChosen
    
            Parameters:
                event - {Event} The change event.
    
            Calls the method or fires the action on the target (see <O.ButtonView>
            for description of these), with the files as the first argument or
            `files` property on the event object.
        */
    _fileWasChosen: function(event) {
      const input = this._domControl;
      const inputFiles = Array.from(input.files);
      const _notify = (files) => {
        if (event.target === input && files.length) {
          if (!this.get("isDisabled")) {
            const target = this.get("target") || this;
            const method = this.get("method");
            const action = method ? null : this.get("action");
            if (method) {
              target[method](files, this);
            } else if (action) {
              target.fire(action, {
                originView: this,
                files
              });
            }
          }
        }
        input.value = "";
        this.fire("button:activate");
      };
      if (isAndroid && Blob.prototype.arrayBuffer) {
        _cloneFiles(inputFiles).then(_notify);
      } else {
        _notify(inputFiles);
      }
    }.on("change")
  });

  // source/views/RootView.js
  var passiveSupported = false;
  try {
    const options = Object.defineProperty({}, "passive", {
      // eslint-disable-next-line getter-return
      get() {
        passiveSupported = true;
      }
    });
    window.addEventListener("test", options, options);
    window.removeEventListener("test", options, options);
  } catch (error) {
    passiveSupported = false;
  }
  var RootView = Class({
    Name: "RootView",
    Extends: View2,
    syncOnlyInDocument: false,
    layer: null,
    init: function(node, ...mixins) {
      RootView.parent.constructor.apply(this, mixins);
      const className = this.get("className");
      const nodeIsDocument = node.nodeType === 9;
      const doc2 = nodeIsDocument ? node : node.ownerDocument;
      const win = doc2.defaultView;
      [
        "click",
        "dblclick",
        POINTER_DOWN,
        POINTER_UP,
        "keypress",
        "keydown",
        "keyup",
        "dragstart",
        "touchstart",
        "touchmove",
        "touchend",
        "touchcancel",
        "wheel",
        "cut",
        "submit",
        "contextmenu"
      ].forEach((event) => {
        node.addEventListener(
          event,
          this,
          passiveSupported ? {
            passive: false
          } : false
        );
      });
      ["focus", "blur", "change", "input"].forEach((event) => {
        node.addEventListener(event, this, true);
      });
      ["resize", "scroll"].forEach((event) => {
        win.addEventListener(event, this, false);
      });
      this.isRendered = true;
      this.isInDocument = true;
      this.layer = nodeIsDocument ? node.body : node;
      if (className) {
        this.layer.className = className;
      }
    },
    safeAreaInsetBottom: 0,
    _onScroll: function(event) {
      const layer = this.get("layer");
      const isBody = layer.nodeName === "BODY";
      const doc2 = layer.ownerDocument;
      const win = doc2.defaultView;
      const left = isBody ? win.pageXOffset : layer.scrollLeft;
      const top = isBody ? win.pageYOffset : layer.scrollTop;
      this.beginPropertyChanges().set("scrollLeft", left).set("scrollTop", top).endPropertyChanges();
      event.stopPropagation();
    }.on("scroll"),
    focus() {
      const layer = this.get("layer");
      const activeElement = layer.ownerDocument.activeElement;
      const view2 = getViewFromNode(activeElement);
      if (view2 instanceof AbstractControlView) {
        view2.blur();
      } else if (activeElement.blur) {
        activeElement.blur();
      }
    },
    pxTop: 0,
    pxLeft: 0,
    handleEvent: function(event) {
      switch (event.type) {
        // We observe mousemove when mousedown.
        case POINTER_DOWN:
          if (event.pointerType !== "mouse") {
            return;
          }
          this.get("layer").ownerDocument.addEventListener(
            POINTER_MOVE,
            this,
            false
          );
          break;
        case POINTER_UP:
          if (event.pointerType !== "mouse") {
            return;
          }
          this.get("layer").ownerDocument.removeEventListener(
            POINTER_MOVE,
            this,
            false
          );
          break;
        // Window resize events: just notify parent has resized.
        case "resize":
          this.didResize();
          return;
        // Scroll events are special.
        case "scroll":
          this._onScroll(event);
          return;
      }
      ViewEventsController.handleEvent(event, null, this);
    }.invokeInRunLoop()
  });

  // source/animation/Animation.js
  var reduceMotionQuery = window.matchMedia("(prefers-reduced-motion:reduce)");
  var reduceMotion = reduceMotionQuery.matches;
  reduceMotionQuery.addListener((ev) => reduceMotion = ev.matches);
  var animations = [];
  var nextFrame2 = function() {
    const anims = animations;
    const length = anims.length;
    const time2 = frameStartTime;
    if (length) {
      invokeInNextFrame(nextFrame2);
      for (let i = length - 1; i >= 0; i -= 1) {
        const objAnimations = anims[i];
        const objLength = objAnimations.length;
        const hasMultiple = i > 1;
        let object;
        if (hasMultiple) {
          object = objAnimations[0].object;
          object.beginPropertyChanges();
        }
        for (let j = objLength - 1; j >= 0; j -= 1) {
          const animation = objAnimations[j];
          let animTime = animation.startTime;
          if (animTime <= 0) {
            if (!animTime) {
              animation.startTime = -1;
              continue;
            }
            animation.startTime = animTime = time2;
          }
          animTime = time2 - animTime;
          const duration2 = animation.duration;
          if (animTime < duration2 && !reduceMotion) {
            animation.drawFrame(
              // Normalised position along timeline [0..1].
              animation.ease(animTime / duration2),
              // Normalised time animation has been running.
              animTime,
              false
            );
          } else {
            animation.drawFrame(1, duration2, true);
            animation.stop();
          }
        }
        if (hasMultiple) {
          object.endPropertyChanges();
        }
      }
    }
  };
  var Animation = class {
    /**
            Property: O.Animation#isRunning
            Type: Boolean
    
            Is the animation currently in progress?
        */
    /**
            Property (private): O.Animation#startTime
            Type: Number
    
            A timestamp for when the animation began. Do not alter manually.
        */
    /**
            Property: O.Animation#object
            Type: Object
    
            The object on which to set the property during animation.
        */
    /**
            Property: O.Animation#property
            Type: String
    
            The name of the property to set on the object being animated.
        */
    constructor(mixin2) {
      this.isRunning = false;
      this.startTime = 0;
      this.startValue = null;
      this.endValue = null;
      this.deltaValue = null;
      Object.assign(this, mixin2);
    }
    /**
            Method: O.Animation#animate
    
            Transition to a new (given) value. If it is currently in the middle of
            an animation, that will be stopped and the new animation will transition
            from whatever the current value is to the new value.
    
            Parameters:
                value    - {*} The new value to animate to.
                duration - {Number} (optional) The length of the animation (in ms).
                easing   - {Function} (optional) The easing function to use.
    
            Returns:
                {O.Animation} Returns self.
        */
    animate(value, duration2, easing) {
      if (this.isRunning) {
        this.stop();
      }
      if (duration2) {
        this.duration = duration2;
      }
      if (easing) {
        this.ease = easing;
      }
      if (!this.prepare(value)) {
        return this;
      }
      const object = this.object;
      const metadata = meta(object);
      const objAnimations = metadata.animations || (metadata.animations = []);
      this.startTime = 0;
      if (!animations.length) {
        invokeInNextFrame(nextFrame2);
      }
      if (!objAnimations.length) {
        animations.push(objAnimations);
      }
      objAnimations.push(this);
      this.isRunning = true;
      if (object.willAnimate) {
        object.willAnimate(this);
      }
      return this;
    }
    /**
            Method (protected): O.Animation#prepare
    
            Called at the beginning of a new animation to perform any calculations
            that are constant in every frame, or otherwise initialise the animation.
    
            Parameters:
                value - {*} The new value to be transitioned to.
    
            Returns:
                {Boolean} Is there anything to actually animate. Returns false if
                the value is already at the desired end point.
        */
    prepare(value) {
      if (typeof value === "object") {
        this.startValue = value.startValue;
        this.endValue = value.endValue;
      } else {
        this.startValue = this.object.get(this.property);
        this.endValue = value;
      }
      this.deltaValue = this.endValue - this.startValue;
      return !!this.deltaValue;
    }
    /**
            Method (protected): O.Animation#drawFrame
    
            Called 60 times a second (or as frequently as the browser can manage)
            whilst the animation is in progress to draw each frame in the animation.
            The default implementation just interpolates from the start (numeric)
            value to the end (numeric)value and sets the <#property> on the
            <#object> with the new value. Override this method to do something
            different when drawing a frame.
    
            Parameters:
                position    - {Number} A number, normally between 0 and 1, giving
                              the position in the animation, modified by the easing
                              function (the easing function may cause the number to
                              go beyond 0 and 1).
                time        - {Number} (optional) (unused) The length of the
                              animation (in ms). Can be used in override methods.
                isLastFrame - {Boolean} (optional) Indicates that no more frames
                              come after this one.
        */
    drawFrame(position, time2, isLastFrame) {
      const value = isLastFrame ? this.endValue : this.startValue + position * this.deltaValue;
      this.object.set(this.property, value);
    }
    /**
            Method: O.Animation#stop
    
            Stop the animation (at the current position), if it is in progress.
    
            Returns:
                {O.Animation} Returns self.
        */
    stop() {
      if (this.isRunning) {
        const object = this.object;
        const objAnimations = meta(object).animations;
        objAnimations.erase(this);
        if (!objAnimations.length) {
          animations.erase(objAnimations);
        }
        this.isRunning = false;
        if (object.didAnimate) {
          object.didAnimate(this);
        }
      }
      return this;
    }
    /**
            Method: O.Animation#reset
    
            Reset the animation to its initial position.
    
            Returns:
                {O.Animation} Returns self.
         */
    reset() {
      if (this.isRunning) {
        this.drawFrame(this.startValue, this.startTime, false);
        this.stop();
      }
      return this;
    }
  };
  Animation.prototype.duration = 300;
  Animation.prototype.ease = ease;

  // source/views/containers/ScrollView.js
  var ScrollAnimation = class extends Animation {
    prepare(coordinates) {
      const object = this.object;
      const startX = this.startX = object.get("scrollLeft");
      const startY = this.startY = object.get("scrollTop");
      const endX = this.endX = coordinates.x || 0;
      const endY = this.endY = coordinates.y || 0;
      const deltaX = this.deltaX = endX - startX;
      const deltaY = this.deltaY = endY - startY;
      setStyle(object.get("layer"), "will-change", "scroll-position");
      return !!(deltaX || deltaY);
    }
    drawFrame(position) {
      const isRunning = position < 1;
      const object = this.object;
      const x = isRunning ? this.startX + position * this.deltaX : this.endX;
      const y = isRunning ? this.startY + position * this.deltaY : this.endY;
      object._scrollTo(x, y);
      if (!isRunning) {
        setStyle(object.get("layer"), "will-change", "auto");
      }
    }
  };
  ScrollAnimation.prototype.duration = 250;
  var supportsScrollEnd = "onscrollend" in document;
  var ScrollView = Class({
    Name: "ScrollView",
    Extends: View2,
    init: function() {
      this._scrollSnap = "";
      this._scrollSnapPause = 0;
      this._scrollSnapResuming = false;
      this._scrollendTimer = null;
      this._scrollendCounter = 0;
      this.scrollPaddingY = 0;
      ScrollView.parent.init.apply(this, arguments);
    },
    /**
            Property: O.ScrollView#showScrollbarX
            Type: Boolean
            Default: false
    
            Show a scrollbar if the content horizontally overflows the bounds of the
            DOM element representing this view?
        */
    showScrollbarX: false,
    /**
            Property: O.ScrollView#showScrollbarY
            Type: Boolean
            Default: true
    
            Show a scrollbar if the content vertically overflows the bounds of the
            DOM element representing this view?
        */
    showScrollbarY: true,
    /**
            Property: O.ScrollView#positioning
            Type: String
            Default: 'absolute'
    
            Overrides default in <O.View#positioning>.
        */
    positioning: "absolute",
    /**
            Property: O.ScrollView#layout
            Type: Object
            Default:
                    {
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%'
                    }
    
            Overrides default in <O.View#layout>.
        */
    layout: LAYOUT_FILL_PARENT,
    /**
            Property: O.ScrollView#layerStyles
            Type: Object
    
            Sets the overflow styles to show the scrollbars.
        */
    layerStyles: function() {
      const styles = View2.prototype.layerStyles.call(this);
      styles.overflowX = this.get("showScrollbarX") ? "auto" : "hidden";
      styles.overflowY = this.get("showScrollbarY") ? "auto" : "hidden";
      return styles;
    }.property("layout", "positioning", "showScrollbarX", "showScrollbarY"),
    isFixedDimensions: function() {
      const positioning = this.get("positioning");
      return positioning === "absolute" || positioning === "fixed";
    }.property("positioning"),
    /**
            Property: O.ScrollView#keys
            Type: Object
            Default: {}
    
            Keyboard shortcuts to scroll the view. A map of keyboard shortcut to the
            method name to call on the O.ScrollView instance. These shortcuts will
            automatically be activated/deactivated when the view is added/removed
            to/from the document.
    
            For example, on the main scroll view for you content, you might set:
    
                {
                    'PageDown': 'scrollPage',
                    'PageUp': 'reverseScrollPage',
                    'Space': 'scrollPage',
                    'Shift-Space': 'reverseScrollPage',
                    'ArrowDown': 'scrollLine',
                    'ArrowUp': 'reverseScrollLine'
                }
        */
    keys: {},
    handleEvent(event) {
      if (event.type !== "scrollend" || !this.get("isAnimating")) {
        ScrollView.parent.handleEvent.call(this, event);
      }
    },
    didCreateLayer(layer) {
      layer.tabIndex = -1;
    },
    willEnterDocument() {
      ScrollView.parent.willEnterDocument.call(this);
      if (this.get("showScrollbarY")) {
        this.getParent(RootView).addObserverForKey(
          "safeAreaInsetBottom",
          this,
          "redrawSafeArea"
        );
        if (this.get("isFixedDimensions")) {
          const scrollContents = this._scrollContents || this.get("layer");
          scrollContents.appendChild(
            this._safeAreaPadding = create(
              "div.v-Scroll-safeAreaPadding"
            )
          );
          this.redrawSafeArea();
        }
      }
      return this.pauseScrollSnap();
    },
    didEnterDocument() {
      const layer = this.get("layer");
      layer.addEventListener("scroll", this, false);
      layer.addEventListener("scrollend", this, false);
      const keys2 = this.get("keys");
      const shortcuts = ViewEventsController.kbShortcuts;
      for (const key in keys2) {
        shortcuts.register(key, this, keys2[key]);
      }
      ScrollView.parent.didEnterDocument.call(this);
      return this.resumeScrollSnap();
    },
    willLeaveDocument() {
      const keys2 = this.get("keys");
      const shortcuts = ViewEventsController.kbShortcuts;
      for (const key in keys2) {
        shortcuts.deregister(key, this, keys2[key]);
      }
      const layer = this.get("layer");
      layer.removeEventListener("scroll", this, false);
      layer.removeEventListener("scrollend", this, false);
      return ScrollView.parent.willLeaveDocument.call(this);
    },
    didLeaveDocument() {
      const safeAreaPadding = this._safeAreaPadding;
      if (safeAreaPadding) {
        safeAreaPadding.remove();
        this._safeAreaPadding = null;
      }
      if (this.get("showScrollbarY")) {
        this.getParent(RootView).removeObserverForKey(
          "safeAreaInsetBottom",
          this,
          "redrawSafeArea"
        );
      }
      return ScrollView.parent.didLeaveDocument.call(this);
    },
    insertView(view2, relativeTo, where) {
      const safeAreaPadding = this._safeAreaPadding;
      if (!relativeTo && safeAreaPadding && (!where || where === "bottom")) {
        relativeTo = safeAreaPadding;
        where = "before";
      }
      return ScrollView.parent.insertView.call(this, view2, relativeTo, where);
    },
    redrawSafeArea: function() {
      const safeAreaPadding = this._safeAreaPadding;
      if (safeAreaPadding) {
        this._safeAreaPadding.style.height = Math.max(
          this.get("scrollPaddingY"),
          this.getParent(RootView).get("safeAreaInsetBottom")
        ) + "px";
      } else {
        this.didResize();
      }
    }.observes("scrollPaddingY"),
    // ---
    _restoreScroll: function() {
      if (this.get("isInDocument")) {
        const layer = this.get("layer");
        layer.scrollLeft = this.get("scrollLeft");
        layer.scrollTop = this.get("scrollTop");
      }
    }.queue("render").observes("isInDocument"),
    /**
            Property: O.ScrollView#scrollAnimation
            Type: O.Animation
    
            An <O.Animation> object to animate scrolling on this object. Normally
            you will not need to interact with this directly, but just set the
            `withAnimation` argument to `true` when you call O.ScrollView#scrollTo.
            However, if you wish to change the duration or easing method, you can do
            so by setting it on this object.
        */
    scrollAnimation: function() {
      return new ScrollAnimation({
        object: this
      });
    }.property(),
    /**
            Property: O.ScrollView#isAnimating
            Type: Boolean
    
            Is the scroll currently animating?
        */
    isAnimating: false,
    willAnimate() {
      this.set("isAnimating", true);
    },
    didAnimate() {
      this.set("isAnimating", false).fire("scrollend");
    },
    /**
            Method: O.ScrollView#scrollToTop
    
            Scrolls the view to the top
        */
    scrollToTop() {
      return this.scrollTo(0, 0, true);
    },
    /**
            Method: O.ScrollView#scrollToBottom
    
            Scrolls the view to the bottom
        */
    scrollToBottom() {
      return this.scrollTo(
        0,
        this.get("layer").scrollHeight - this.get("pxHeight"),
        true
      );
    },
    /**
            Method: O.ScrollView#scrollPage
    
            Scrolls the view down by the view height - 50px.
        */
    scrollPage() {
      return this.scrollBy(0, this.get("pxHeight") - 50, true);
    },
    /**
            Method: O.ScrollView#reverseScrollPage
    
            Scrolls the view up by the view height - 50px.
        */
    reverseScrollPage() {
      return this.scrollBy(0, 50 - this.get("pxHeight"), true);
    },
    /**
            Method: O.ScrollView#scrollLine
    
            Scrolls the view down by 40px.
        */
    scrollLine() {
      return this.scrollBy(0, 40);
    },
    /**
            Method: O.ScrollView#reverseScrollLine
    
            Scrolls the view up by 40px.
        */
    reverseScrollLine() {
      return this.scrollBy(0, -40);
    },
    /**
            Method: O.ScrollView#scrollBy
    
            Scroll the view by the given number of pixels (use negative values to
            scroll up/left).
    
            Parameters:
                x             - {Number} The number of pixels to scroll right.
                y             - {Number} The number of pixels to scroll down.
                withAnimation - {Boolean} (optional) If true, animate the scroll.
    
            Returns:
                {Boolean} Did the view actually scroll (false if already at end)?
        */
    scrollBy(x, y, withAnimation) {
      const left = this.get("scrollLeft");
      const top = this.get("scrollTop");
      x += left;
      y += top;
      this.scrollTo(x, y, withAnimation);
      return top !== this.get("scrollTop") || left !== this.get("scrollLeft");
    },
    /**
            Method: O.ScrollView#scrollToView
    
            Scroll the view to show a sub-view in the top left of the view.
    
            Parameters:
                view          - {View} The sub-view to scroll to.
                offset        - {Object} (optional) If supplied, must contain
                                numerical `x` and `y` properties which give the
                                number of pixels to offset the subview from the top
                                left of the scroll view.
                withAnimation - {Boolean} (optional) If true, animate the scroll.
                onlyIfNotVisible - {Boolean} (optional) Don't scroll if visible.
    
            Returns:
                {O.ScrollView} Returns self.
        */
    scrollToView(view2, offset, withAnimation, onlyIfNotVisible) {
      const position = view2.getPositionRelativeTo(this);
      const offsetX = offset && offset.x || 0;
      const offsetY = offset && offset.y || 0;
      if (onlyIfNotVisible) {
        const offsetTop = position.top - this.get("scrollTop");
        const offsetBottom = offsetTop + view2.get("pxHeight");
        const scrollViewHeight = this.get("pxHeight") - this.getParent(RootView).get("safeAreaInsetBottom");
        let scrollBy = 0;
        if (offsetTop < 0) {
          scrollBy = offsetTop - offsetY;
        } else if (offsetBottom > scrollViewHeight) {
          scrollBy = offsetBottom + offsetY - scrollViewHeight;
        }
        if (scrollBy) {
          this.scrollBy(0, Math.round(scrollBy), withAnimation);
        }
        return this;
      }
      return this.scrollTo(
        position.left + offsetX,
        position.top + offsetY,
        withAnimation
      );
    },
    /**
            Method: O.ScrollView#scrollBy
    
            Scroll the view to a given position, where (0,0) represents the scroll
            view fully .
    
            Parameters:
                x             - {Number} The number of pixels to set the horizontal
                                scroll-position to.
                y             - {Number} The number of pixels to set the vertical
                                scroll-position to.
                withAnimation - {Boolean} (optional) If true, animate the scroll.
    
            Returns:
                {O.ScrollView} Returns self.
        */
    scrollTo(x, y, withAnimation) {
      x = x < 0 ? 0 : Math.round(x);
      y = y < 0 ? 0 : Math.round(y);
      const isInDocument = this.get("isInDocument");
      const scrollAnimation = this.get("scrollAnimation");
      scrollAnimation.stop();
      if (withAnimation && isInDocument) {
        scrollAnimation.animate({
          x,
          y
        });
      } else {
        if (isInDocument) {
          this.pauseScrollSnap();
        }
        this.beginPropertyChanges().set("scrollLeft", x).set("scrollTop", y).propertyNeedsRedraw(this, "scroll").endPropertyChanges().fire("scrollend");
        if (isInDocument) {
          this.resumeScrollSnap();
        }
      }
      return this;
    },
    /**
            Method (private): O.ScrollView#_scrollTo
    
            Set the new values and immediately redraw. Fast path for animation.
        */
    _scrollTo(x, y) {
      this.set("scrollLeft", x).set("scrollTop", y);
      this.redrawScroll();
    },
    /**
            Method: O.ScrollView#redrawScroll
    
            Redraws the scroll position in the layer to match the view's state.
        */
    redrawScroll() {
      const layer = this.get("layer");
      const x = this.get("scrollLeft");
      const y = this.get("scrollTop");
      const styles = layer.style;
      if (isIOS) {
        styles.overflowX = "hidden";
        styles.overflowY = "hidden";
      }
      layer.scrollLeft = x;
      layer.scrollTop = y;
      if (isIOS) {
        styles.overflowX = this.get("showScrollbarX") ? "auto" : "hidden";
        styles.overflowY = this.get("showScrollbarY") ? "auto" : "hidden";
      }
      if ((x || y) && this.get("isInDocument")) {
        queueFn("after", this.syncBackScroll, this);
      }
    },
    pauseSnapWhileAnimating: function() {
      if (this.get("isAnimating")) {
        this.pauseScrollSnap();
      } else {
        this.resumeScrollSnap();
      }
    }.observes("isAnimating"),
    pauseScrollSnap() {
      if ((this._scrollSnapPause += 1) === 1 && !this._scrollSnapResuming) {
        const layer = this.get("layer");
        const scrollSnapType = layer.style.scrollSnapType;
        layer.style.scrollSnapType = "none";
        this._scrollSnap = scrollSnapType;
      }
      return this;
    },
    resumeScrollSnap() {
      const scrollSnapType = this._scrollSnap;
      if ((this._scrollSnapPause -= 1) === 0 && scrollSnapType !== "none" && !this._scrollSnapResuming) {
        this._scrollSnapResuming = true;
        invokeInNextFrame(() => {
          invokeInNextEventLoop(() => {
            this._scrollSnapResuming = false;
            if (this._scrollSnapPause === 0) {
              this.get("layer").style.scrollSnapType = scrollSnapType;
            }
          });
        });
      }
      return this;
    },
    /**
            Method: O.ScrollView#syncBackScroll
    
            Parameters:
                event - {Event} (optional) The scroll event object.
    
            Updates the view properties when the layer scrolls.
        */
    syncBackScroll: function(event) {
      if (this._needsRedraw) {
        return;
      }
      const layer = this.get("layer");
      const x = layer.scrollLeft;
      const y = layer.scrollTop;
      this.beginPropertyChanges().set("scrollLeft", x).set("scrollTop", y).endPropertyChanges();
      if (event) {
        event.stopPropagation();
      }
      if (!supportsScrollEnd && !this.get("isAnimating")) {
        this._simulateScrollEnd();
      }
    }.on("scroll"),
    _simulateScrollEnd() {
      const counter = this._scrollendCounter += 1;
      if (this._scrollendTimer) {
        return;
      }
      this._scrollendTimer = invokeAfterDelay(() => {
        this._scrollendTimer = null;
        if (counter === this._scrollendCounter) {
          this.fire("scrollend");
        } else {
          this._simulateScrollEnd();
        }
      }, 1e3);
    },
    // ---
    /**
            Method: O.ScrollView#focus
    
            Focuses the scrollable element. This will mean default browser shortcuts
            will work for scrolling (e.g. up/down/space etc.).
    
            Returns:
                {O.ScrollView} Returns self.
        */
    focus() {
      const layer = this.get("layer");
      layer.tabIndex = -1;
      layer.focus();
      return this;
    },
    // This is a bit gnarly. When the focus is inside a node inside the scroll
    // view we must not have a tab index, because when we have one the browser
    // will blur the control and focus the scroll view if the user drags on the
    // scrollbar, and the focus should remain in the control.
    //
    // However, when the focus is anywhere else, we do want the tab index, as
    // without it the browser won't focus the scroll view when you click in it,
    // which we want so that native keyboard shortcuts work correctly to scroll.
    _setTabIndex: function(event) {
      const layer = this.get("layer");
      if (event.type === "blur" || event.target === layer) {
        layer.tabIndex = -1;
      } else {
        layer.removeAttribute("tabIndex");
      }
    }.on("focus", "blur")
  });

  // source/views/panels/ModalEventHandler.js
  var ModalEventHandler = Class({
    Name: "ModalEventHandler",
    Extends: Obj,
    init: function() {
      ModalEventHandler.parent.constructor.apply(this, arguments);
      this._seenMouseDown = false;
    },
    inView(view2, event) {
      let targetView = event.targetView;
      while (targetView && targetView !== view2) {
        targetView = targetView.get("parentView");
      }
      return !!targetView;
    },
    // If a user clicks outside the menu we want to close it. But we don't want
    // the mousedown/mouseup/click events to propagate to what's below. The
    // events fire in that order, and not all are guaranteed to fire (the user
    // could mousedown and drag their mouse out of the window before releasing
    // it or vica versa. If there is a drag in between mousedown and mouseup,
    // the click event won't fire).
    //
    // The safest to hide on is click, as we know there are no more events from
    // this user interaction which we need to capture, and it also means the
    // user has clicked and released outside the pop over; a decent indication
    // we should close it. However, if the pop over was triggered on mousedown
    // we may still see a mouseup and a click event from this initial user
    // interaction, but these must not hide the view. Therefore, we make sure
    // we've seen at least one mousedown event after the popOver view shows
    // before hiding on click. On Android/iOS, we will not see a mousedown
    // event, so we also count a touchstart event.
    handleMouse: function(event) {
      const view2 = this.get("view");
      const type = event.type;
      if (!event.seenByModal && !this.inView(view2, event)) {
        if (type !== "contextmenu") {
          event.stopPropagation();
        }
        if (type === POINTER_DOWN) {
          this._seenMouseDown = true;
          if (event.target.nodeName === "INPUT") {
            event.preventDefault();
          }
        } else if (type === "click" || type === "tap" || type === "contextmenu") {
          event.preventDefault();
          if (this._seenMouseDown) {
            if (view2.clickedOutside) {
              view2.clickedOutside(event);
            }
          }
        } else if (type === "wheel") {
          const scrollView = this.get("view").getParent(ScrollView);
          if (!scrollView || !this.inView(scrollView, event)) {
            event.preventDefault();
          }
        }
      }
      event.seenByModal = true;
    }.on("click", POINTER_DOWN, POINTER_UP, "tap", "wheel", "contextmenu"),
    // If the user clicks on a scroll bar to scroll (I know, who does that
    // these days right?), we don't want to count that as a click. So cancel
    // the seen mousedown on scroll events.
    handleScroll: function() {
      this._seenMouseDown = false;
    }.on("scroll"),
    handleKeys: function(event) {
      const view2 = this.get("view");
      if (!event.seenByModal && !this.inView(view2, event)) {
        event.stopPropagation();
        if (view2.keyOutside) {
          view2.keyOutside(event);
        }
      }
      event.seenByModal = true;
    }.on("keypress", "keydown", "keyup"),
    handleTouch: function(event) {
      const view2 = this.get("view");
      if (!event.seenByModal && !this.inView(view2, event)) {
        event.preventDefault();
        event.stopPropagation();
        this._seenMouseDown = true;
      }
      event.seenByModal = true;
    }.on("touchstart")
  });

  // source/views/panels/PopOverView.js
  var PopOverView = Class({
    Name: "PopOverView",
    Extends: View2,
    init: function() {
      this.parentPopOverView = null;
      this.isVisible = false;
      this.options = {};
      this._inResize = false;
      PopOverView.parent.init.apply(this, arguments);
    },
    className: function() {
      const options = this.get("options");
      const positionToThe = options && options.positionToThe || "bottom";
      const alignEdge = options && options.alignEdge || "left";
      const extra = options.className || "";
      return "v-PopOverContainer v-PopOverContainer--p" + positionToThe.charAt(0) + " v-PopOverContainer--a" + alignEdge.charAt(0) + (extra ? " " + extra : "");
    }.property("options"),
    positioning: "absolute",
    ariaAttributes: {
      modal: "true"
    },
    draw() {
      const children = [
        this._aFlex = create("div"),
        this._popOver = create("div.v-PopOver", [
          this._callout = create("b.v-PopOver-callout", [
            create("b.v-PopOver-triangle")
          ])
        ]),
        this._bFlex = create("div")
      ];
      this.redrawLayer();
      return children;
    },
    redrawLayer() {
      const options = this.get("options");
      if (!options) {
        return;
      }
      const alignWithView = options.alignWithView;
      if (!alignWithView.get("isInDocument")) {
        this.hide();
        return;
      }
      const atNode = options.atNode || (alignWithView === this.get("parentPopOverView") ? alignWithView._popOver : alignWithView.get("layer"));
      const positionToThe = options.positionToThe || "bottom";
      const positionToTheLeftOrRight = positionToThe === "left" || positionToThe === "right";
      const alignEdge = options.alignEdge || "left";
      const offsetTop = options.offsetTop || 0;
      const offsetLeft = options.offsetLeft || 0;
      const rootView = alignWithView.getParent(RootView);
      const position = getRawBoundingClientRect(atNode);
      const posTop = position.top;
      const posLeft = position.left;
      const posWidth = position.width;
      const posHeight = position.height;
      const aFlexEl = this._aFlex;
      const bFlexEl = this._bFlex;
      const popOverEl = this._popOver;
      const calloutEl = this._callout;
      const safeAreaInsetBottom = rootView.get("safeAreaInsetBottom");
      const layout = {};
      let calloutStyle = "";
      this.insertView(options.view, this._popOver);
      if (safeAreaInsetBottom) {
        layout.marginBottom = safeAreaInsetBottom;
      }
      switch (positionToThe) {
        case "top":
          layout.marginBottom = Math.max(
            safeAreaInsetBottom,
            rootView.get("pxHeight") - posTop - offsetTop
          );
          break;
        case "right":
          layout.marginLeft = posLeft + posWidth + offsetLeft;
          break;
        case "bottom":
          layout.marginTop = posTop + posHeight + offsetTop;
          break;
        case "left":
          layout.marginRight = rootView.get("pxWidth") - posLeft - offsetLeft;
          break;
      }
      let aFlex;
      let bFlex;
      let startDistance;
      let endDistance;
      switch (alignEdge) {
        case "top":
          aFlex = "0 1 " + (posTop + offsetTop) + "px";
          bFlex = "1 0 0";
          break;
        case "middle":
          startDistance = Math.round(posTop + offsetTop + posHeight / 2);
          endDistance = rootView.get("pxHeight") - safeAreaInsetBottom - startDistance;
          aFlex = startDistance + " 0 0";
          bFlex = endDistance + " 0 0";
          calloutStyle = "top:" + 100 * startDistance / (startDistance + endDistance) + "%";
          break;
        case "bottom":
          aFlex = "1 0 0";
          bFlex = "0 1 " + (rootView.get("pxHeight") - (posTop + posHeight + offsetTop)) + "px";
          break;
        case "left":
          aFlex = "0 1 " + (posLeft + offsetLeft) + "px";
          bFlex = "1 0 0";
          break;
        case "centre":
          startDistance = Math.round(posLeft + offsetLeft + posWidth / 2);
          endDistance = rootView.get("pxWidth") - startDistance;
          aFlex = startDistance + " 0 0";
          bFlex = endDistance + " 0 0";
          calloutStyle = "left:" + 100 * startDistance / (startDistance + endDistance) + "%";
          break;
        case "right":
          aFlex = "1 0 0";
          bFlex = "0 1 " + (rootView.get("pxWidth") - (posLeft + posWidth + offsetLeft)) + "px";
          break;
      }
      if (!options.showCallout) {
        calloutStyle = "display:none";
      }
      aFlexEl.className = positionToTheLeftOrRight ? "v-PopOverContainer-top" : "v-PopOverContainer-left";
      aFlexEl.style.cssText = "flex:" + aFlex;
      bFlexEl.className = positionToTheLeftOrRight ? "v-PopOverContainer-bottom" : "v-PopOverContainer-right";
      bFlexEl.style.cssText = "flex:" + bFlex;
      if (!this.get("isVisible")) {
        popOverEl.classList.remove("is-positioned");
      }
      calloutEl.style.cssText = calloutStyle;
      this.set("layout", layout).redraw().keepInBounds();
    },
    /**
            Property: O.PopOverView#parentMargin
            Type: {top: number, left: number, right: number, bottom: number}
    
            The popover will ensure that it is at least N pixels away from each edge
            of the parent view.
        */
    parentMargin: {
      top: 12,
      left: 12,
      right: 12,
      bottom: 12
    },
    keepInBounds: function() {
      if (!this.get("isInDocument")) {
        return;
      }
      const rootView = this.get("parentView");
      const popOverEl = this._popOver;
      const options = this.get("options");
      const positionToThe = options.positionToThe;
      const positionToTheLeftOrRight = positionToThe === "left" || positionToThe === "right";
      const parentMargin = options.parentMargin || this.get("parentMargin");
      let keepInVerticalBounds = options.keepInVerticalBounds;
      let keepInHorizontalBounds = options.keepInHorizontalBounds;
      const calloutOffsetLeft = options.calloutOffsetLeft || 0;
      const calloutOffsetTop = options.calloutOffsetTop || 0;
      let deltaLeft = 0;
      let deltaTop = 0;
      if (keepInHorizontalBounds === void 0) {
        keepInHorizontalBounds = !positionToTheLeftOrRight;
      }
      if (keepInVerticalBounds === void 0) {
        keepInVerticalBounds = positionToTheLeftOrRight;
      }
      const position = getRawBoundingClientRect(popOverEl);
      let gap;
      if (keepInHorizontalBounds) {
        if (!rootView.get("showScrollbarX")) {
          gap = rootView.get("pxWidth") - position.right;
          if (gap < 0) {
            deltaLeft += gap;
            deltaLeft -= parentMargin.right;
          }
        }
        gap = position.left + deltaLeft;
        if (gap < 0) {
          deltaLeft -= gap;
          deltaLeft += parentMargin.left;
        }
      }
      if (keepInVerticalBounds) {
        if (!rootView.get("showScrollbarY")) {
          gap = rootView.get("pxHeight") - position.bottom;
          if (gap < 0) {
            deltaTop += gap;
            deltaTop -= parentMargin.bottom;
          }
        }
        gap = position.top + deltaTop;
        if (gap < 0) {
          deltaTop -= gap;
          deltaTop += parentMargin.top;
        }
      }
      if (deltaLeft || deltaTop) {
        setStyle(
          this.get("layer"),
          "transform",
          "translate(" + deltaLeft + "px," + deltaTop + "px)"
        );
      }
      if (options.showCallout) {
        setStyle(
          this._callout,
          "transform",
          "translate(" + (calloutOffsetLeft + (positionToTheLeftOrRight ? 0 : -deltaLeft)) + "px," + (calloutOffsetTop + (positionToTheLeftOrRight ? -deltaTop : 0)) + "px)"
        );
      }
      popOverEl.classList.add("is-positioned");
    }.queue("after"),
    viewNeedsRedraw: function() {
      this.propertyNeedsRedraw(this, "layer");
    }.observes("options"),
    didResize() {
      if (!this._inResize) {
        this._inResize = true;
        if (this.get("options").alignWithView.get("isInDocument")) {
          this.redrawLayer();
        } else {
          this.hide();
        }
        this._inResize = false;
      }
    },
    /*
        Options
        - view -> The view to append to the pop over
        - alignWithView -> the view to align to
        - atNode -> the node within the view to align to
        - positionToThe -> 'bottom'/'top'/'left'/'right'
        - alignEdge -> 'left'/'centre'/'right'/'top'/'middle'/'bottom'
        - showCallout -> true/false
        - offsetLeft
        - offsetTop
        - resistHiding -> true to stop clicking outside or pressing Esc closing
          the popover, false for normal behaviour; may also be a function
          returning true or false
          (incidental note: this would be nicer if options was an O.Object)
        - onHide: fn
    */
    show(options) {
      const alignWithView = options.alignWithView;
      if (alignWithView === this) {
        return this.get("subPopOverView").show(options);
      }
      this.hide();
      this.set("options", options);
      alignWithView.getParent(RootView).insertView(this);
      if (!options.allowEventsOutside) {
        const eventHandler = this.get("eventHandler");
        ViewEventsController.addEventTarget(eventHandler, 10);
      }
      this.set("isVisible", true);
      return this;
    },
    didEnterDocument() {
      PopOverView.parent.didEnterDocument.call(this);
      this.getParent(RootView).addObserverForKey(
        "safeAreaInsetBottom",
        this,
        "viewNeedsRedraw"
      );
      return this;
    },
    willLeaveDocument() {
      this.getParent(RootView).removeObserverForKey(
        "safeAreaInsetBottom",
        this,
        "viewNeedsRedraw"
      );
      return PopOverView.parent.willLeaveDocument.call(this);
    },
    didLeaveDocument() {
      PopOverView.parent.didLeaveDocument.call(this);
      this.hide();
      return this;
    },
    hide() {
      if (this.get("isVisible")) {
        const subPopOverView = this.hasSubView() ? this.get("subPopOverView") : null;
        const eventHandler = this.get("eventHandler");
        const options = this.get("options");
        let onHide;
        if (subPopOverView) {
          subPopOverView.hide();
        }
        this.set("isVisible", false).detach().removeView(this.get("childViews")[0]);
        ViewEventsController.removeEventTarget(eventHandler);
        eventHandler._seenMouseDown = false;
        this.set("options", null);
        if (onHide = options.onHide) {
          onHide(options, this);
        }
      }
      return this;
    },
    hasSubView() {
      return !!meta(this).cache.subPopOverView && this.get("subPopOverView").get("isVisible");
    },
    subPopOverView: function() {
      return new PopOverView({ parentPopOverView: this });
    }.property(),
    eventHandler: function() {
      return new ModalEventHandler({ view: this });
    }.property(),
    softHide() {
      const options = this.get("options");
      if (this.get("isVisible") && (!options.resistHiding || typeof options.resistHiding === "function" && !options.resistHiding())) {
        this.hide();
      }
    },
    clickedOutside(event) {
      let view2 = this;
      let parent;
      while ((parent = view2.get("parentPopOverView")) && !parent.get("layer").contains(event.target)) {
        view2 = parent;
      }
      view2.softHide();
    },
    keyOutside(event) {
      this.get("childViews")[0].fire(event.type, event);
    },
    closeOnEsc: function(event) {
      if (lookupKey(event) === "Escape") {
        this.softHide();
      }
    }.on("keydown"),
    stopEvents: function(event) {
      event.stopPropagation();
    }.on(
      "click",
      POINTER_DOWN,
      POINTER_UP,
      "keypress",
      "keydown",
      "keyup",
      "tap",
      "contextmenu"
    )
  });

  // source/views/controls/ClearSearchButtonView.js
  var ClearSearchButtonView = Class({
    Name: "ClearSearchButtonView",
    Extends: ButtonView,
    positioning: "absolute",
    baseClassName: "v-ClearSearchButton",
    tooltip: function() {
      return localise("Shortcut: {value1}", formatKeyForPlatform("Ctrl-/"));
    }.property(),
    // Alternatives are for AZERTY keyboard
    shortcut: "Ctrl-/ Ctrl-Shift-/ Ctrl-Shift-:",
    shortcutWhenInputFocused: ACTIVE_IN_INPUT
  });

  // source/datastore/record/ValidationError.js
  var ValidationError = class {
    constructor(type, explanation) {
      this.type = type;
      this.explanation = explanation;
    }
  };
  var REQUIRED = 1;

  // source/views/controls/AbstractInputView.js
  var AbstractInputView = Class({
    Name: "AbstractInputView",
    Extends: AbstractControlView,
    /**
            Property: O.AbstractInputView#label
            Type: String|Element|null
            Default: null
    
            A label for the control, to be displayed next to it.
        */
    label: null,
    /**
            Property: O.AbstractInputView#label
            Type: String|Element|null
            Default: null
    
            A description for the control, to be displayed next to it.
        */
    description: null,
    /**
            Property: O.AbstractInputView#name
            Type: String|undefined
            Default: undefined
    
            If set, this will be the name attribute of the control.
        */
    name: void 0,
    /**
            Property: O.AbstractInputView#value
            Type: *
            Default: false
    
            The value represented by this control, for example true/false if a
            checkbox is checked/unchecked, or the text input into a textarea.
        */
    value: false,
    /**
            Property: O.AbstractInputView#error
            Type: ValidationError|null
            Default: null
    
            A validation error for this input.
        */
    error: null,
    /**
            Property: O.AbstractInputView#isValid
            Type: Boolean
            Default: true
    
            If false, an `is-invalid' class will be added to the view's class name.
        */
    isValid: function(isValid) {
      if (isValid !== void 0) {
        return isValid;
      }
      const error = this.get("error");
      if (error && error.type !== REQUIRED) {
        return this.get("isFocused");
      }
      return true;
    }.property("error", "isFocused"),
    /**
            Property: O.AbstractInputView#inputAttributes
            Type: Object
    
            Extra attributes to add to the text view. Examples include:
    
            - maxLength: Number
            - autocomplete: 'on' or 'off'
            - autocapitalize: 'on' or 'off'
            - autocorrect: 'on' or 'off'
            - pattern: String (regexp)
        */
    inputAttributes: {
      // The real value to turn off autocomplete is "off". However, browsers
      // mostly ignore that these days, as they think they know better,
      // *sigh*. So instead we set this to "ignore" - as this is not a value
      // they understand, the browser doesn't know what autocomplete options
      // to give so in effect this turns off autocomplete!
      autocomplete: "ignore"
    },
    /**
            Property: O.AbstractInputView#className
            Type: String
            Default: baseClassName
    
            Overrides default in <O.View#className>.
        */
    className: function() {
      const type = this.get("type");
      return this.get("baseClassName") + (this.get("isDisabled") ? " is-disabled" : "") + (this.get("isFocused") ? " is-focused" : "") + (this.get("isValid") ? "" : " is-invalid") + (type ? " " + type : "");
    }.property("baseClassName", "isDisabled", "isFocused", "isValid", "type"),
    /**
            Method: O.AbstractInputView#drawControl
    
            Overridden by subclasses to create a DOM input control. Must set
            this._domControl for O.AbstractInputView#drawLabel.
        */
    drawControl() {
      throw new Error("drawControl() must be overridden in subclass");
    },
    /**
            Method: O.AbstractInputView#drawLabel
    
            Creates a label element for the DOM input control returned by
            O.AbstractInputView#drawControl.
        */
    drawLabel(label) {
      const control = this._domControl;
      return create("label", { for: control && control.id }, [label]);
    },
    /**
            Method: O.AbstractInputView#drawDescription
    
            Creates a label element for the DOM input control returned by
            O.AbstractInputView#drawControl.
        */
    drawDescription(description) {
      return create("p", [description]);
    },
    /**
            Method: O.AbstractInputView#drawHelp
    
            Indirection for O.AbstractInputView#drawDescription to allow
            conditionally drawing descriptions e.g. for input validity.
        */
    drawHelp() {
      const description = this.get("description");
      return description ? this.drawDescription(description) : null;
    },
    draw(layer) {
      const controlEl = this.drawControl();
      const label = this.get("label");
      const labelEl = label ? this.drawLabel(label) : null;
      const descriptionEl = this.drawHelp();
      this.redrawInputAttributes(layer);
      this.redrawTabIndex(layer);
      return [labelEl, controlEl, descriptionEl];
    },
    // --- Keep render in sync with state ---
    abstractInputNeedsRedraw: function(self, property, oldValue) {
      return this.propertyNeedsRedraw(self, property, oldValue);
    }.observes("inputAttributes", "name", "value"),
    /**
            Method: O.AbstractInputView#redrawInputAttributes
    
            Updates any other properties of the `<input>` element.
        */
    redrawInputAttributes() {
      const inputAttributes = this.get("inputAttributes");
      const control = this._domControl;
      for (const property in inputAttributes) {
        control.set(property, inputAttributes[property]);
      }
    },
    /**
            Method: O.AbstractInputView#redrawName
    
            Updates the name attribute on the DOM control to match the name
            property of the view.
        */
    redrawName() {
      this._domControl.name = this.get("name");
    },
    /**
            Method: O.AbstractInputView#redrawValue
    
            Updates the content of the input to match the <#value> property.
        */
    redrawValue() {
      this._domControl.value = this.get("value");
    },
    // --- Input ---
    userDidInput(value) {
      this.set("value", value);
    }
  });

  // source/views/controls/TextInputView.js
  var TextInputView = Class({
    Name: "TextInputView",
    Extends: AbstractInputView,
    init: function() {
      TextInputView.parent.constructor.apply(this, arguments);
      this._settingFromInput = false;
      this._verticalBorderWidth = 0;
    },
    /**
            Property: O.TextInputView#autocomplete
            Type: AutoCompleteController | null
            Default: null
    
            Can be set to an instance of the AutoCompleteController class to show
            autocomplete suggestions for this input.
        */
    autocomplete: null,
    /**
            Property: O.TextInputView#isMultiline
            Type: Boolean
            Default: false
    
            If set to true, the text field will accept line breaks.
    
            This property *must not* be changed after the view has been rendered.
        */
    isMultiline: false,
    /**
            Property: O.TextInputView#isExpanding
            Type: Boolean
            Default: false
    
            If <#isMultiline> is set to true, setting <#isExpanding> to true will
            make it automatically expand vertically to fit its contents, rather than
            show a scrollbar.
        */
    isExpanding: false,
    /**
            Property: O.TextInputView#isHighlighted
            Type: Boolean
            Default: false
    
            If true, a `highlight` class will be added to the view's class name.
            This is a styling hook for highlighting the view, e.g. if it fails
            validation.
        */
    isHighlighted: false,
    /**
            Property: O.TextInputView#inputType
            Type: String
            Default: "text"
    
            The type property for the <input> DOM node (e.g. "password", "tel" etc.)
        */
    inputType: "text",
    /**
            Property: O.TextInputView#placeholder
            Type: String
            Default: undefined
    
            Placeholder text to be displayed in the text input when it is empty.
        */
    placeholder: void 0,
    /**
            Property: O.TextInputView#ghost
            Type: Change | null
            Default: null
    
            The ghost property is a Change object, which causes the input view to
            draw the change as ghost text if desired.
        */
    ghost: null,
    /**
            Property: O.TextInputView#value
            Type: String
            Default: ''
    
            The value currently input in the text field.
        */
    value: "",
    /**
            Property: O.TextInputView#selection
            Type: Object
    
            When used as a getter, this will return an object with two properties:
    
            start - {Number} The number of characters offset from the beginning of
                    the text that the selection starts.
            end   - {Number} The number of characters offset from the beginning of
                    the text that the selection ends.
    
            Note, if there is no selection, the start and end values will be the
            same, and give the position of the cursor.
    
            When used as a setter, you can give it an object as described above to
            set the selection, or if you just want to give it a cursor position, you
            can pass a number instead.
    
        */
    selection: function(selection) {
      const control = this._domControl;
      const isNumber = typeof selection === "number";
      let start = selection ? isNumber ? selection : selection.start : 0;
      let end = selection ? isNumber ? selection : selection.end || start : start;
      if (selection !== void 0) {
        this.redraw();
        try {
          control.setSelectionRange(start, end);
        } catch (error) {
        }
      } else {
        try {
          start = control.selectionStart;
          end = control.selectionEnd;
        } catch (error) {
        }
      }
      return selection || {
        start,
        end
      };
    }.property().nocache(),
    invalidateSelection: function() {
      this.computedPropertyDidChange("selection");
    }.on("click", "selectionchange"),
    /**
            Property: O.TextInputView#blurOnKeys
            Type: Object
            Default: { Escape: true }
    
            For each truthy value in the object, if the user is focused in the
            text view and hits the key, the focus will be removed.
        */
    blurOnKeys: { Escape: true },
    // --- Render ---
    baseClassName: "v-TextInput",
    /**
            Property: O.TextInputView#className
            Type: String
    
            Overrides default in <O.View#className>. Will have the class `v-TextInput`,
            and any classes given in the <#type> property, along with the following
            other class names dependent on state:
    
            is-highlight - The <#isHighlighted> property is true.
            is-focused  - The <#isFocused> property is true.
            is-invalid   - The <#isValid> property is false.
            is-disabled  - The <#isDisabled> property is true.
            has-ghost  - The <#ghost> property is set.
        */
    className: function() {
      const type = this.get("type");
      return this.get("baseClassName") + (this.get("isExpanding") ? " v-TextInput--expanding" : "") + (this.get("isMultiline") ? " v-TextInput--multiline" : "") + (this.get("isHighlighted") ? " is-highlighted" : "") + (this.get("isFocused") ? " is-focused" : "") + (this.get("isValid") ? "" : " is-invalid") + (this.get("isDisabled") ? " is-disabled" : "") + (this.get("ghost") ? " has-ghost" : "") + (type ? " " + type : "");
    }.property(
      "type",
      "isExpanding",
      "isHighlighted",
      "isFocused",
      "isValid",
      "isDisabled",
      "ghost"
    ),
    drawGhost() {
      const change = this.get("ghost");
      this._ghost = change ? create("span.v-TextInput-ghost", change.draw(this.get("value"))) : document.createComment("ghost");
      return this._ghost;
    },
    drawControl() {
      const isMultiline = this.get("isMultiline");
      return create("div.v-TextInput-control", [
        this._domControl = create(isMultiline ? "textarea" : "input", {
          id: this.get("id") + "-input",
          className: "v-TextInput-input",
          rows: isMultiline ? "1" : void 0,
          name: this.get("name"),
          type: this.get("inputType"),
          disabled: this.get("isDisabled"),
          tabIndex: this.get("tabIndex"),
          placeholder: this.get("placeholder") || void 0,
          value: this.get("value")
        }),
        this.drawGhost()
      ]);
    },
    // --- Keep render in sync with state ---
    /**
            Method: O.TextInputView#textNeedsRedraw
    
            Calls <O.View#propertyNeedsRedraw> for extra properties requiring
            redraw.
        */
    textNeedsRedraw: function(self, property, oldValue) {
      const isValue = property === "value";
      if (!isValue || !this._settingFromInput) {
        this.propertyNeedsRedraw(self, property, oldValue);
      }
      if (isValue && this.get("isExpanding")) {
        this.propertyNeedsRedraw(self, "textHeight", oldValue);
      }
    }.observes("value", "isExpanding", "placeholder", "inputType", "ghost"),
    /**
            Method: O.TextInputView#redrawPlaceholder
    
            Updates the placeholder text in the DOM when the <#placeholder> property
            changes.
        */
    redrawPlaceholder() {
      this._domControl.placeholder = this.get("placeholder");
    },
    redrawInputType() {
      this._domControl.type = this.get("inputType");
    },
    redrawGhost() {
      const oldGhost = this._ghost;
      oldGhost.parentNode.replaceChild(this.drawGhost(), oldGhost);
      this.updateGhostScroll();
    },
    updateGhostScroll() {
      const ghost = this._ghost;
      if (ghost.nodeType === 1) {
        ghost.scrollLeft = this.get("scrollLeft");
      }
    },
    redrawTextHeight() {
      const control = this._domControl;
      const style = control.style;
      const scrollView = this.getParent(ScrollView);
      style.height = "auto";
      const scrollHeight = control.scrollHeight;
      if (scrollHeight) {
        style.height = this._verticalBorderWidth + scrollHeight + "px";
      }
      if (scrollView) {
        scrollView.redrawScroll();
      }
      this.didResize();
    },
    redrawIsExpanding() {
      if (this.get("isExpanding")) {
        this.redrawTextHeight();
      } else {
        this._domControl.style.height = "auto";
        this.didResize();
        if (this.get("isFocused")) {
          this.blur().focus();
        }
      }
    },
    // --- Activate ---
    selectAll() {
      return this.set("selection", {
        start: 0,
        end: this.get("value").length
      });
    },
    copySelectionToClipboard() {
      let focused = null;
      if (!this.get("isFocused")) {
        focused = document.activeElement;
        this.focus();
      }
      let didSucceed = false;
      try {
        didSucceed = document.execCommand("copy");
      } catch (error) {
      }
      if (focused) {
        focused.focus();
      }
      return didSucceed;
    },
    // --- Scrolling and focus ---
    savedSelection: null,
    /**
            Method: O.TextInputView#didEnterDocument
    
            Overridden to restore scroll position and selection. See
            <O.View#didEnterDocument>.
        */
    didEnterDocument() {
      TextInputView.parent.didEnterDocument.call(this);
      const control = this._domControl;
      if (this.get("isMultiline")) {
        if (this.get("isExpanding")) {
          const style = getComputedStyle(this._domControl);
          if (style.boxSizing === "border-box") {
            this._verticalBorderWidth = parseInt(style.borderTopWidth, 10) + parseInt(style.borderBottomWidth, 10);
          }
          this.redrawTextHeight();
        }
        const left = this.get("scrollLeft");
        const top = this.get("scrollTop");
        if (left) {
          control.scrollLeft = left;
        }
        if (top) {
          control.scrollTop = top;
        }
      }
      control.addEventListener("scroll", this, false);
      const selection = this.get("savedSelection");
      if (selection) {
        this.set("selection", selection).focus();
        this.set("savedSelection", null);
      }
      return this;
    },
    /**
            Method: O.TextInputView#willLeaveDocument
    
            Overridden to save scroll position and selection. See
            <O.View#willLeaveDocument>.
        */
    willLeaveDocument() {
      if (this.get("isFocused")) {
        this.set("savedSelection", this.get("selection"));
        this.blur();
      }
      this._domControl.removeEventListener("scroll", this, false);
      return TextInputView.parent.willLeaveDocument.call(this);
    },
    /**
            Method (private): O.TextInputView#_syncBackScrolls
    
            Sets the <O.View#scrollLeft> and <O.View#scrollTop> properties whenever
            the user scrolls the textarea.
    
            Parameters:
                event - {Event} The scroll event.
        */
    _syncBackScrolls: function(event) {
      const control = this._domControl;
      const left = control.scrollLeft;
      const top = control.scrollTop;
      this.beginPropertyChanges().set("scrollLeft", left).set("scrollTop", top).endPropertyChanges();
      this.updateGhostScroll();
      event.stopPropagation();
    }.on("scroll"),
    // --- Keep state in sync with render ---
    /**
            Method: O.TextInputView#syncBackValue
    
            Updates the <#value> property when the user interacts with the textarea.
    
            Parameters:
                event - {Event} The input event.
        */
    syncBackValue: function() {
      this._settingFromInput = true;
      this.userDidInput(
        // Remove control chars (0x00-0x1F, 0x7F)
        // except tab (0x09), LF (0x0A), CR (0x0D)
        this._domControl.value.replace(
          /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g,
          ""
        )
      );
      this._settingFromInput = false;
    }.on("input"),
    /**
            Method (private): O.TextInputView#_onClick
    
            Focus and set selection to the end.
    
            Parameters:
                event - {Event} The click event.
        */
    _onClick: function(event) {
      if (event.target === this.get("layer")) {
        this.set("selection", this.get("value").length).focus();
      }
    }.on("click"),
    /**
            Method (private): O.TextInputView#_blurOnKey
    
            Blur the text area when the user hits certain keys, provided by the
            <#blurOnKeys> property.
    
            Parameters:
                event - {Event} The keyup event.
        */
    _blurOnKey: function(event) {
      if (event.isComposing) {
        return;
      }
      const key = lookupKey(event, true);
      if (this.get("blurOnKeys")[key]) {
        this.blur();
      }
    }.on("keyup"),
    attachAutoComplete: function() {
      const autocomplete = this.get("autocomplete");
      if (autocomplete) {
        autocomplete.attach(this);
      }
    }.on("focus")
  });
  meta(TextInputView.prototype).removeObserver("value", {
    object: null,
    method: "abstractInputNeedsRedraw"
  });

  // source/views/controls/SearchInputView.js
  var SearchInputView = Class({
    Name: "SearchInputView",
    Extends: TextInputView,
    Mixin: [Activatable],
    icon: null,
    inputAttributes: {
      autocapitalize: "off",
      autocomplete: "off",
      autocorrect: "off",
      spellcheck: "false"
    },
    // Helps password managers know this is not a username input!
    name: "search",
    baseClassName: "v-TextInput v-SearchInput",
    draw(layer) {
      const control = this.drawControl();
      this.redrawInputAttributes(layer);
      this.redrawTabIndex(layer);
      this.redrawTooltip(layer);
      return [
        control,
        this.get("icon"),
        when(this, "value").show([
          new ClearSearchButtonView({
            label: localise("Clear search"),
            target: this,
            method: "reset"
          })
        ]).end()
      ];
    },
    // Only draw the tooltip on the _domControl
    redrawTooltip() {
      const domControl = this._domControl;
      if (domControl) {
        Activatable.redrawTooltip.call(this, domControl);
      }
    },
    /**
            Method: O.SearchInputView#activate
    
            Overridden to focus the text view. See <O.Activatable#activate>.
        */
    activate() {
      this.focus();
    },
    reset() {
      this.set("ghost", null).set("value", "").focus();
    }
  });

  // source/views/menu/MenuFilterView.js
  var MenuFilterView = Class({
    Name: "MenuFilterView",
    Extends: View2,
    isFiltering: bind("controller*isFiltering"),
    ariaAttributes: {
      hidden: "true"
    },
    className: function() {
      return "v-MenuFilter" + (this.get("isFiltering") ? " is-filtering" : "");
    }.property("isFiltering"),
    draw() {
      const controller = this.get("controller");
      const searchTextView = this._input = new SearchInputView({
        shortcut: this.get("shortcut"),
        placeholder: this.get("placeholder"),
        tabIndex: -1,
        blurOnKeys: {},
        value: bindTwoWay(controller, "search"),
        getShortcutTarget() {
          return null;
        }
      });
      return searchTextView;
    },
    // ---
    focus() {
      this._input.focus();
      return this;
    },
    blur() {
      this._input.blur();
      return this;
    },
    setup: function() {
      const controller = this.get("controller");
      if (this.get("isInDocument")) {
        controller.on("done", this, "blur");
      } else {
        controller.off("done", this, "blur");
        controller.set("isFiltering", false);
      }
    }.observes("isInDocument"),
    willLeaveDocument() {
      this.blur();
      return MenuFilterView.parent.willLeaveDocument.call(this);
    },
    // ---
    didFocus: function() {
      this.get("controller").set("isFiltering", true);
      const scrollView = this.getParent(ScrollView);
      if (scrollView) {
        scrollView.scrollTo(0, 0, false);
      }
    }.on("focus"),
    handler: function() {
      return new Obj({
        view: this._input,
        controller: this.get("controller"),
        done: function(event) {
          if (!isClickModified(event)) {
            queueFn("after", () => {
              if (!this.view.get("isFocused")) {
                this.controller.set("isFiltering", false);
              }
            });
          }
        }.on("click", "keydown")
      });
    }.property(),
    captureEvents: function(_, __, ___, isFiltering) {
      const handler = this.get("handler");
      if (isFiltering) {
        ViewEventsController.addEventTarget(handler, 15);
      } else {
        ViewEventsController.removeEventTarget(handler);
      }
    }.observes("isFiltering"),
    // ---
    keydown: function(event) {
      const controller = this.get("controller");
      let scrollView;
      ViewEventsController.kbShortcuts.set("inKBMode", true);
      switch (lookupKey(event)) {
        case "Escape":
          if (controller.get("search")) {
            controller.resetSearch();
          } else {
            controller.done();
          }
          break;
        case "Enter":
          controller.selectFocused();
          break;
        case "Ctrl-k":
        case "ArrowUp":
          controller.focusPrevious();
          break;
        case "Ctrl-j":
        case "ArrowDown":
          controller.focusNext();
          break;
        case "ArrowLeft":
          if (!controller.collapseFocused()) {
            return;
          }
          break;
        case "ArrowRight":
          if (!controller.expandFocused()) {
            return;
          }
          break;
        default:
          scrollView = this.getParent(ScrollView);
          if (scrollView) {
            scrollView.scrollTo(0, 0, false);
          }
          return;
      }
      event.stopPropagation();
      event.preventDefault();
    }.on("keydown")
  });

  // source/views/menu/MenuOptionView.js
  var MenuOptionView = Class({
    Name: "MenuOptionView",
    Extends: View2,
    isFocused: false,
    layerTag: "li",
    className: function() {
      return "v-MenuOption" + (this.get("content").get("button").get("isLastOfSection") && this.get("index") < this.getFromPath("list.length") - 1 ? " v-MenuOption--lastOfSection" : "") + (this.get("isFocused") ? " is-focused" : "");
    }.property("isFocused"),
    draw() {
      const button = this.get("content").get("button");
      const title = button.get("sectionTitle");
      return [title ? create("h2.v-MenuOption-title", [title]) : null, button];
    },
    _focusTimeout: null,
    takeFocus() {
      if (this.get("isInDocument")) {
        this.get("controller").focus(this.get("content")).expandFocused();
      }
    },
    loseFocus() {
      this.get("controller").focus(null);
    },
    mousemove: function(event) {
      if (event.type === "pointermove" && event.pointerType !== "mouse") {
        return;
      }
      if (!this.get("isFocused") && !this._focusTimeout) {
        const popOverView = this.getParent(PopOverView);
        if (popOverView && popOverView.hasSubView()) {
          this._focusTimeout = invokeAfterDelay(this.takeFocus, 75, this);
        } else {
          this.takeFocus();
        }
      }
    }.on("pointermove"),
    mouseout: function() {
      if (this._focusTimeout) {
        cancel(this._focusTimeout);
        this._focusTimeout = null;
      }
      if (this.get("isFocused") && !this.get("childViews")[0].get("isActive")) {
        this.loseFocus();
      }
    }.on("pointerout")
  });

  // source/views/menu/MenuButtonView.js
  function getClientCoords(touch) {
    const clientX = -Infinity < touch.clientX && touch.clientX < Infinity ? touch.clientX : null;
    const clientY = -Infinity < touch.clientY && touch.clientY < Infinity ? touch.clientY : null;
    return { x: clientX, y: clientY };
  }
  var MenuButtonView = Class({
    Name: "MenuButtonView",
    Extends: ButtonView,
    /**
            Property: O.MenuButtonView#type
            Type: String
            Default: 'v-MenuButton'
    
            Overrides default in <O.ButtonView#type>.
        */
    baseClassName: "v-MenuButton",
    className: function() {
      return "v-Button " + ButtonView.prototype.className.call(this);
    }.property(...ButtonView.prototype.className.dependencies),
    /**
            Property: O.MenuButtonView#popOverView
            Type: O.PopOverView
    
            The <O.PopOverView> instance to use to show the menu view.
        */
    popOverView: null,
    /**
            Property: O.MenuButtonView#popOverViewOptions
            Type: Object
    
            Options to pass to <O.PopOverView#show>.
        */
    popOverOptions: {},
    /**
            Property: O.MenuButtonView#menuView
            Type: O.MenuView
    
            The <O.MenuView> instance to show when the button is pressed.
        */
    menuView: null,
    /**
            Property: O.MenuButtonView#destroyMenuViewOnClose
            Type: Boolean
    
            If the menu view is regenerated each time it is opened, set this to
            true to destroy the view when the pop over is closed.
        */
    destroyMenuViewOnClose: false,
    /**
            Property: O.MenuButtonView#alignMenu
            Type: String
            Default: 'left'
    
            Which of the menu and button edges should be aligned? Valid options are
            'left', 'right' or 'centre'.
        */
    alignMenu: "left",
    /**
            Property: O.MenuButtonView#isInMenu
            Type: Boolean
    
            Is this a child view of an <O.MenuOptionView>?
        */
    isInMenu: function() {
      return this.get("parentView") instanceof MenuOptionView;
    }.property("parentView"),
    /**
            Property: O.MenuButtonView#activateOnMenuFocus
            Type: Boolean
    
            When nested within another menu, set to false to prevent menuView from
            being activated when focused.
        */
    activateOnMenuFocus: true,
    /**
            Property: O.MenuButtonView#activateOnTouchStart
            Type: Boolean
    
            For touch input, should this activate on touch start, or only on
            tap (after touch end).
        */
    activateOnTouchStart: false,
    // --- Accessibility ---
    didCreateLayer(layer) {
      MenuButtonView.parent.didCreateLayer.call(this, layer);
      layer.setAttribute("aria-expanded", "false");
    },
    ariaNeedsRedraw: function(self, property, oldValue) {
      return this.propertyNeedsRedraw(self, "aria", oldValue);
    }.observes("isActive"),
    redrawAria(layer) {
      layer.setAttribute("aria-controls", this.getFromPath("menuView.id"));
      layer.setAttribute("aria-expanded", this.get("isActive") + "");
    },
    focusAfterMenu: function() {
      const activeElement = document.activeElement;
      if (!activeElement || activeElement === document.body) {
        this.focus();
      }
    }.queue("after").on("focusAfterMenu"),
    // --- Activate ---
    /**
            Method: O.MenuButtonView#activate
    
            Overridden to show menu associated with button, if not already visible.
            Ignores target/method/action properties.
        */
    activate(event) {
      if (!this.get("isActive") && !this.get("isDisabled")) {
        this.isKeyActivation = !!event && !!event.type && event.type.startsWith("key");
        this.set("isActive", true);
        const buttonView = this;
        const wasFocused = this.get("isFocused");
        const menuView = this.get("menuView");
        let popOverView;
        let menuOptionView;
        const popOverOptions = Object.assign(
          {
            view: menuView,
            alignWithView: buttonView,
            alignEdge: this.get("alignMenu"),
            onHide() {
              buttonView.set("isActive", false);
              if (wasFocused) {
                buttonView.fire("focusAfterMenu");
              }
              if (menuOptionView) {
                menuOptionView.get("controller").removeObserverForKey(
                  "focused",
                  popOverView,
                  "hide"
                );
              }
              if (buttonView.get("destroyMenuViewOnClose")) {
                menuView.destroy();
              }
            }
          },
          this.get("popOverOptions")
        );
        if (this.get("isInMenu")) {
          popOverView = this.getParent(PopOverView);
          const parentOptions = popOverView.get("options");
          popOverOptions.showCallout = false;
          if (this.get("activateOnMenuFocus")) {
            const preferLeft = parentOptions.positionToThe === "left";
            const rootViewWidth = this.getParent(RootView).get("pxWidth");
            const position = getRawBoundingClientRect(
              this.get("layer")
            );
            menuOptionView = this.get("parentView");
            popOverOptions.alignWithView = popOverView;
            popOverOptions.atNode = this.get("layer");
            popOverOptions.positionToThe = preferLeft && position.left > position.width ? "left" : !preferLeft && rootViewWidth - position.right > position.width ? "right" : position.left < rootViewWidth - position.right ? "right" : "left";
            popOverOptions.keepInHorizontalBounds = true;
            popOverOptions.alignEdge = "top";
            popOverOptions.offsetTop = popOverOptions.view.get(
              "showFilter"
            ) ? -35 : -5;
            popOverOptions.offsetLeft = 0;
          } else {
            popOverOptions.alignWithView = parentOptions.alignWithView;
            popOverOptions.atNode = parentOptions.atNode;
          }
        } else {
          popOverView = this.get("popOverView");
        }
        popOverView = popOverView.show(popOverOptions);
        if (menuOptionView) {
          menuOptionView.get("controller").addObserverForKey("focused", popOverView, "hide");
        }
      }
    },
    // --- Keep state in sync with render ---
    /**
            Method (private): O.MenuButtonView#_activateOnMousedown
    
            Activates the button on mousedown, not just on click. This allows the
            user to press the mouse down on the button to show the menu, drag down
            to the option they want, then release the button to select it.
        */
    _activateOnMousedown: function(event) {
      if (event.button || event.metaKey || event.ctrlKey) {
        return;
      }
      this.activate(event);
    }.on(POINTER_DOWN),
    _activateOnTouchstart: function(event) {
      if (!this.get("activateOnTouchStart") || this.get("isInMenu")) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      this._didMove = false;
      this._touchedView = null;
      this._initialCoords = getClientCoords(event.touches[0]);
      this.focus();
      this.activate(event);
    }.on("touchstart"),
    _handleTouchmove: function(event) {
      const initialCoords = this._initialCoords;
      const touch = event.changedTouches[0];
      if (!initialCoords || !touch) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const coords = getClientCoords(touch);
      if (coords.x === null || coords.y === null || isEqual(coords, initialCoords)) {
        return;
      }
      const node = document.elementFromPoint(coords.x, coords.y);
      if (!node) {
        return;
      }
      const view2 = getViewFromNode(node);
      if (!view2) {
        return;
      }
      this._didMove = true;
      const menuOption = view2 instanceof MenuOptionView && view2 || view2.getParent(MenuOptionView);
      const lastView = this._touchedView;
      if (menuOption) {
        if (menuOption !== lastView) {
          this._initialCoords = coords;
          menuOption.takeFocus();
        }
      } else if (lastView instanceof MenuOptionView) {
        lastView.loseFocus();
      }
      this._touchedView = menuOption || !(view2 instanceof MenuFilterView) && view2.getParent(MenuFilterView) || view2;
    }.on("touchmove"),
    _handleTouchend: function(event) {
      if (!this._initialCoords) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const view2 = this._touchedView;
      const didMove = this._didMove;
      this._didMove = false;
      this._touchedView = null;
      this._initialCoords = null;
      if (!didMove || !view2 || view2 === this || view2 === this.get("popOverView") || view2.getParent(MenuButtonView) === this) {
        return;
      }
      if (view2 instanceof MenuOptionView) {
        const button = view2.getFromPath("content.button");
        if (button instanceof FileButtonView) {
          button.fire("confirm", event);
          this.get("popOverView").hide();
        } else {
          view2.get("controller").selectFocused();
        }
      } else if (view2 instanceof MenuFilterView) {
        view2.focus();
      } else {
        this.get("popOverView").hide();
      }
    }.on("touchend")
  });

  // source/foundation/MutableEnumerable.js
  var MutableEnumerable = {
    // :: Mutation methods =====================================================
    /**
            Method: O.MutableEnumerable#push
    
            ECMAScript Array#push.
    
            Parameters:
                var_args - {...*} The items to add to the end of the array.
    
            Returns:
                {Number} The new length of the array.
        */
    push(...newItems) {
      this.replaceObjectsAt(this.get("length"), 0, newItems);
      return this.get("length");
    },
    /**
            Method: O.MutableEnumerable#pop
    
            ECMAScript Array#pop.
    
            Returns:
                {*} The removed last value from the array.
        */
    pop() {
      const length = this.get("length");
      return length === 0 ? void 0 : this.replaceObjectsAt(length - 1, 1)[0];
    },
    /**
            Method: O.MutableEnumerable#unshift
    
            ECMAScript Array#unshift.
    
            Parameters:
                var_args - {...*} The items to add to the beginning of the array.
    
            Returns:
                {Number} The new length of the array.
        */
    unshift(...newItems) {
      this.replaceObjectsAt(0, 0, newItems);
      return this.get("length");
    },
    /**
            Method: O.MutableEnumerable#shift
    
            ECMAScript Array#shift.
    
            Returns:
                {*} The removed first value from the array.
        */
    shift() {
      return this.get("length") === 0 ? void 0 : this.replaceObjectsAt(0, 1)[0];
    },
    /**
            Method: O.MutableEnumerable#splice
    
            ECMAScript Array#splice.
    
            Parameters:
                index         - {Number} The index to start removing/inserting items
                                at.
                numberRemoved - {Number} The number of items to remove.
                var_args      - {...*} The items to insert starting from position
                                index.
    
            Returns:
                {Array} The items removed from the array.
        */
    splice(index, numberRemoved, ...newItems) {
      return this.replaceObjectsAt(index, numberRemoved, newItems);
    }
  };

  // source/foundation/ObservableRange.js
  var ObservableRange = {
    /**
            Method: O.ObservableRange#rangeDidChange
    
            Notifies observers that are observing a range which intersects the range
            that has changed. Also notifies any observers observing an individual
            number (via <O.ObservableProps#addObserverForKey>) and any observers
            looking out for a change to `[]` (enumerable content did change).
    
            Parameters:
                start - {Number} The index of the first value in the range to have
                        changed (indexed from 0).
                end   - {Number} The index of one past the last value in the range
                        to have changed.
    
            Returns:
                {O.ObservableRange} Returns self.
        */
    rangeDidChange(start, end) {
      if (end === void 0) {
        end = start + 1;
      }
      const metadata = meta(this);
      const observers = metadata.observers;
      for (const key in observers) {
        if (observers[key]) {
          const index = parseInt(key, 10);
          if (start <= index && index < end) {
            this.propertyDidChange(key);
          }
        }
      }
      const enumerableLength = this.get("length") || 0;
      const rangeObservers = metadata.rangeObservers;
      const l = rangeObservers ? rangeObservers.length : 0;
      for (let i = 0; i < l; i += 1) {
        const observer = rangeObservers[i];
        const range = observer.range;
        let observerStart = range.start || 0;
        let observerEnd = "end" in range ? range.end : Math.max(enumerableLength, end);
        if (observerStart < 0) {
          observerStart += enumerableLength;
        }
        if (observerEnd < 0) {
          observerEnd += enumerableLength;
        }
        if (observerStart < end && observerEnd > start) {
          observer.object[observer.method](this, start, end);
        }
      }
      this.computedPropertyDidChange("[]");
      return this;
    },
    /**
            Method: O.ObservableRange#addObserverForRange
    
            Registers an object and a method to be called on that object whenever an
            integer-referenced property in the given range changes. Note, the range
            is 'live'; you can change the start/end values in the object at any time
            and immediately receive notifications of updates in the new range.
            Negative values for start or end are allowed, and are treated as offsets
            from the end of the current length of this object, with -1 being the
            last item.
    
            Parameters:
                range  - {Object} The range to observe. May have either, both or
                         none of start and end properties. These are numerical
                         values, indexed from 0, negative values index from the end
                         of the enumerable object. If start is omitted it is taken
                         to be 0 (the first element in the enumerable). If end is
                         omitted it is taken to be the length of the enumerable.
                         start is inclusive and end is exclusive, e.g. {start: 1,
                         end: 2} will only fire if index 1 changes.
                object - {Object} The object on which to call the callback method.
                method - {String} The name of the callback method.
    
            Returns:
                {O.ObservableRange} Returns self.
        */
    addObserverForRange(range, object, method) {
      const metadata = meta(this);
      (metadata.rangeObservers || (metadata.rangeObservers = [])).push({
        range,
        object,
        method
      });
      return this;
    },
    /**
            Method: O.ObservableRange#removeObserverForRange
    
            Stops callbacks to an object/method when content changes occur within
            the range. Note, the range object passed must be the same as that passed
            for addObserverForRange, not just have the same properties (these could
            have changed due to the support for live updating of the observed range.
            See <O.ObservableRange#addObserverForRange> description).
    
            Parameters:
                range  - {Object} The range which is being observed.
                object - {Object} The object which is observing it.
                method - {String} The name of the callback method on the observer
                         object.
    
            Returns:
                {O.ObservableRange} Returns self.
        */
    removeObserverForRange(range, object, method) {
      const metadata = meta(this);
      const rangeObservers = metadata.rangeObservers;
      const newObservers = rangeObservers ? rangeObservers.filter(
        (item) => item.range !== range || item.object !== object || item.method !== method
      ) : [];
      if (!newObservers.length) {
        metadata.rangeObservers = null;
      } else if (newObservers.length !== rangeObservers.length) {
        metadata.rangeObservers = newObservers;
      }
      return this;
    },
    /**
            Method: O.ObservableRange#hasRangeObservers
    
            Returns true a range is being observed on the object by another object.
    
            Returns:
                {Boolean} Does the object have any range observers?
        */
    hasRangeObservers() {
      const rangeObservers = meta(this).rangeObservers;
      const length = rangeObservers ? rangeObservers.length : 0;
      for (let i = length - 1; i >= 0; i -= 1) {
        const object = rangeObservers[i].object;
        if (object && object !== this) {
          return true;
        }
      }
      return false;
    }
  };

  // source/foundation/ObservableArray.js
  var ARRAY_PROPERTY = "[]";
  var ObservableArray = Class({
    Name: "ObservableArray",
    Extends: Obj,
    Mixin: [ObservableRange, Enumerable, MutableEnumerable],
    /**
            Constructor: O.ObservableArray
    
            Parameters:
                array   - {Array} (optional) The initial contents of the array.
                ...mixins - {Object} (optional)
        */
    init: function(array, ...mixins) {
      this._array = array || [];
      this._length = this._array.length;
      ObservableArray.parent.constructor.apply(this, mixins);
    },
    /**
            Property: O.ObservableArray#[]
            Type: Array
    
            The standard array underlying the object. Observers of this property
            will be notified any time any content changes in the array. Setting this
            property changes the entire contents of the array at once. The contents
            of the new array is checked for equality with that of the old array to
            ensure accurate notification of the changed range.
        */
    [ARRAY_PROPERTY]: function(array) {
      if (array) {
        const oldArray = this._array;
        const oldLength = this._length;
        const newLength = array.length;
        let start = 0;
        let end = newLength;
        this._array = array;
        this._length = newLength;
        while (start < newLength && array[start] === oldArray[start]) {
          start += 1;
        }
        if (newLength === oldLength) {
          let last = end - 1;
          while (end > start && array[last] === oldArray[last]) {
            end = last;
            last -= 1;
          }
        } else {
          end = Math.max(oldLength, newLength);
          this.propertyDidChange("length", oldLength, newLength);
        }
        if (start !== end) {
          this.rangeDidChange(start, end);
        }
      }
      return this._array.slice();
    }.property(),
    /**
            Method: O.ObservableArray#getObjectAt
    
            Returns the value at the index given in the array.
    
            Parameters:
                index - {Number} The index of the value to return.
    
            Returns:
                {*} The value at index i in this array.
        */
    getObjectAt(index) {
      return this._array[index];
    },
    /**
            Property: O.ObservableArray#length
            Type: Number
    
            The length of the array.
        */
    length: function(value) {
      let length = this._length;
      if (typeof value === "number" && value !== length) {
        this._array.length = value;
        this._length = value;
        if (value < length) {
          this.rangeDidChange(value, length);
        }
        length = value;
      }
      return length;
    }.property().nocache(),
    /**
            Method: O.ObservableArray#setObjectAt
    
            Sets the value at a given index in the array.
    
            Parameters:
                index - {Number} The index at which to set the value.
                value - {*} The value to set it to.
    
            Returns:
                {O.ObservableArray} Returns self.
        */
    setObjectAt(index, value) {
      this._array[index] = value;
      const length = this._length;
      if (length <= index) {
        this._length = index + 1;
        this.propertyDidChange("length", length, index + 1);
      }
      this.rangeDidChange(index);
      return this;
    },
    /**
            Method: O.ObservableArray#replaceObjectsAt
    
            Removes a given number of objects from the array, starting at the index
            given, and inserts a number of objects in their place.
    
            Parameters:
                index         - {Number} The index at which to remove/add objects.
                numberRemoved - {Number} The number of objects to remove.
                newItems      - {Array} (optional) The objects to insert.
    
            Returns:
                {Array} Returns an array of the removed objects.
        */
    replaceObjectsAt(index, numberRemoved, newItems) {
      const oldLength = this._length;
      const array = this._array;
      let removed;
      newItems = newItems ? Array.from(newItems) : [];
      if (oldLength <= index) {
        const l = newItems.length;
        for (let i = 0; i < l; i += 1) {
          array[index + i] = newItems[i];
        }
      } else {
        removed = array.splice(index, numberRemoved, ...newItems);
      }
      const newLength = array.length;
      if (oldLength !== newLength) {
        this._length = newLength;
        this.propertyDidChange("length", oldLength, newLength);
        this.rangeDidChange(index, Math.max(oldLength, newLength));
      } else {
        this.rangeDidChange(index, index + numberRemoved);
      }
      return removed || [];
    },
    // :: Mutation methods =====================================================
    /**
            Method: O.ObservableArray#sort
    
            ECMAScript Array#sort.
    
            Parameters:
                comparefn - {Function} (optional) The function to use to compare two
                            items in the array.
    
            Returns:
                {O.ObservableArray} Returns self.
        */
    sort(comparefn) {
      this._array.sort(comparefn);
      this.rangeDidChange(0, this._length);
      return this;
    },
    /**
            Method: O.ObservableArray#reverse
    
            ECMAScript Array#reverse.
    
            Returns:
                {O.ObservableArray} Returns self.
        */
    reverse() {
      this._array.reverse();
      this.rangeDidChange(0, this._length);
      return this;
    },
    /**
            Method: O.ObservableArray#include
    
            Adds an item to the end of the array if it is not already present (as
            determined by strict '===' equality).
    
            Parameters:
                item - {*} The item to add to the array.
    
            Returns:
                {O.ObservableArray} Returns self.
        */
    include(item) {
      if (!this.includes(item)) {
        this.push(item);
      }
      return this;
    },
    /**
            Method: O.ObservableArray#erase
    
            Removes all occurrences (as determined by strict '===' equality) of the
            item from the array.
    
            Parameters:
                item - {*} The item to be removed from the array.
    
            Returns:
                {O.ObservableArray} Returns self.
        */
    erase(item) {
      let index = 0;
      while ((index = this.indexOf(item, index)) > -1) {
        this.replaceObjectsAt(index, 1);
      }
      return this;
    },
    // :: Accessor methods =====================================================
    /**
            Method: O.ObservableArray#concat
    
            ECMAScript Array#concat.
    
            Parameters:
                var_args - {...Array} The arrays to concatenate with this array.
    
            Returns:
                {Array} Returns new concatenated array.
        */
    concat() {
      const args = [];
      const l = arguments.length;
      for (let i = 0; i < l; i += 1) {
        const item = arguments[i];
        args[i] = item instanceof ObservableArray ? item._array : item;
      }
      return Array.prototype.concat.apply(this._array, args);
    },
    /**
            Method: O.ObservableArray#join
    
            ECMAScript Array#join.
    
            Parameters:
                separator - {String} (optional) The string to insert between each
                            item (defaults to ',').
    
            Returns:
                {String} Concatenated string of all items joined by separator
                string.
        */
    join(separator) {
      return this._array.join(separator);
    },
    /**
            Method: O.ObservableArray#slice
    
            ECMAScript Array#slice.
    
            Parameters:
                start - {Number} (optional) The index of the first item to include.
                end   - {Number} (optional) One past the index of the last item to
                        include.
    
            Returns:
                {Array} Shallow copy of the underlying array between the given
                indexes.
        */
    slice(start, end) {
      return this._array.slice(start, end);
    }
  });

  // source/selection/OptionsController.js
  var OptionsController = Class({
    Name: "OptionsController",
    Extends: Obj,
    init: function() {
      this.isFiltering = false;
      this.focused = null;
      this.selected = null;
      OptionsController.parent.constructor.apply(this, arguments);
      this.setOptions();
    },
    // ---
    search: "",
    resetSearch() {
      this.set("search", "");
    },
    // ---
    setOptions() {
      const options = this.get("options");
      const content = this.get("content");
      const search = this.get("search");
      const isFiltering = this.get("isFiltering");
      const results = this.filterOptions(content, search, isFiltering);
      if (options instanceof ObservableArray) {
        options.set("[]", results);
      } else {
        this.set("options", results);
      }
      this.checkFocus();
    },
    optionsWillChange: function() {
      this.setOptions();
    }.queue("before").observes("content", "search", "isFiltering"),
    filterOptions(content, search) {
      const patterns = search ? search.split(/\s+/).map(makeSearchRegExp) : null;
      return patterns ? content.filter((option) => {
        const name = option.get("name");
        return patterns.every((pattern) => {
          return pattern.test(name);
        });
      }) : Array.isArray(content) ? content : content.get("[]");
    },
    // ---
    getAdjacent(step) {
      const options = this.get("options");
      const l = options.get("length");
      let i = options.indexOf(this.get("focused"));
      if (!l) {
        return void 0;
      }
      if (i < 0 && step < 0) {
        i = l;
      }
      const current = mod(i, l);
      do {
        i = mod(i + step, l);
      } while (!this.mayFocus(options.getObjectAt(i)) && i !== current);
      return options.getObjectAt(i);
    },
    focusPrevious() {
      return this.focus(this.getAdjacent(-1));
    },
    focusNext() {
      return this.focus(this.getAdjacent(1));
    },
    mayFocus(option) {
      return !option.get("isDisabled");
    },
    focus(option) {
      const current = this.get("focused");
      if (current !== option) {
        if (option && !this.mayFocus(option)) {
          option = null;
        }
        this.set("focused", option);
      }
      return this;
    },
    checkFocus: function() {
      const focused = this.get("focused");
      if (!this.get("isFiltering")) {
        this.focus(null);
      } else if (!focused || !this.mayFocus(focused) || !this.get("options").includes(focused)) {
        this.focus(null).focusNext();
      }
    }.observes("isFiltering"),
    // ---
    collapseFocused() {
    },
    expandFocused() {
    },
    selectFocused() {
      const focused = this.get("focused");
      if (focused) {
        this.select(focused);
        this.resetSearch();
      }
    },
    // ---
    select() {
    },
    done: function() {
      this.set("isFiltering", false).fire("done");
    }.observes("selected")
  });

  // source/datastore/record/Status.js
  var Status_exports = {};
  __export(Status_exports, {
    COMMITTING: () => COMMITTING,
    DESTROYED: () => DESTROYED,
    DIRTY: () => DIRTY,
    EMPTY: () => EMPTY,
    LOADING: () => LOADING,
    NEW: () => NEW,
    NON_EXISTENT: () => NON_EXISTENT,
    OBSOLETE: () => OBSOLETE,
    READY: () => READY,
    UNSAVED: () => UNSAVED
  });
  var EMPTY = 1 << 0;
  var READY = 1 << 1;
  var DESTROYED = 1 << 2;
  var NON_EXISTENT = 1 << 3;
  var LOADING = 1 << 4;
  var COMMITTING = 1 << 5;
  var NEW = 1 << 6;
  var DIRTY = 1 << 7;
  var OBSOLETE = 1 << 8;
  var UNSAVED = READY | NEW | DIRTY;

  // source/views/collections/ListView.js
  var isFirefox = browser === "firefox";
  var byIndex = function(a, b) {
    return a.get("index") - b.get("index");
  };
  var addToTable = function(array, table) {
    for (let i = 0, l = array.length; i < l; i += 1) {
      table[array[i]] = true;
    }
    return table;
  };
  var getNextViewIndex = function(childViews, newRendered, fromIndex) {
    const length = childViews.length;
    while (fromIndex < length) {
      const view2 = childViews[fromIndex];
      const item = view2.get("content");
      if (item && newRendered[guid(item)]) {
        break;
      }
      fromIndex += 1;
    }
    return fromIndex;
  };
  var ListView = Class({
    Name: "ListView",
    Extends: View2,
    content: null,
    contentLength: bind("content.length"),
    ItemView: null,
    itemHeight: 0,
    init: function() {
      this._added = null;
      this._removed = null;
      this._rendered = {};
      this._renderRange = {
        start: 0,
        end: 2147483647
        // Max positive signed 32bit int: 2^31 - 1
      };
      this.controller = null;
      this.focused = null;
      this.selection = null;
      this.itemLayout = 0;
      ListView.parent.constructor.apply(this, arguments);
      const focused = this.get("focused");
      if (focused) {
        focused.addObserverForKey("record", this, "redrawFocused");
      }
      const selection = this.get("selection");
      if (selection) {
        selection.addObserverForKey(
          "selectedStoreKeys",
          this,
          "redrawSelection"
        );
      }
    },
    destroy() {
      const selection = this.get("selection");
      if (selection) {
        selection.removeObserverForKey(
          "selectedStoreKeys",
          this,
          "redrawSelection"
        );
      }
      const focused = this.get("focused");
      if (focused) {
        focused.removeObserverForKey("record", this, "redrawFocused");
      }
      if (this.get("isRendered")) {
        const content = this.get("content");
        if (content) {
          content.removeObserverForRange(
            this._renderRange,
            this,
            "viewNeedsRedraw"
          );
          content.off("query:updated", this, "contentWasUpdated");
        }
      }
      ListView.parent.destroy.call(this);
    },
    contentDidChange: function(_, __, oldVal, newVal) {
      if (this.get("isRendered")) {
        const range = this._renderRange;
        if (oldVal) {
          oldVal.removeObserverForRange(range, this, "viewNeedsRedraw");
          oldVal.off("query:updated", this, "contentWasUpdated");
        }
        if (newVal) {
          newVal.addObserverForRange(range, this, "viewNeedsRedraw");
          newVal.on("query:updated", this, "contentWasUpdated");
        }
        this.viewNeedsRedraw();
      }
    }.observes("content"),
    contentWasUpdated(event) {
      if (this.get("isInDocument")) {
        this._added = addToTable(event.added, this._added || {});
        this._removed = addToTable(event.removed, this._removed || {});
      }
    },
    layout: function() {
      const length = this.get("contentLength") || 0;
      const itemHeight = this.get("itemHeight");
      let height = length ? this.indexToOffset(length - 1) + itemHeight : 0;
      if (isFirefox && height > 17895697) {
        height = 17895697;
      }
      return itemHeight ? { height } : {};
    }.property("itemLayout", "contentLength"),
    itemLayoutDidChange: function() {
      this.increment("itemLayout");
    }.observes("itemHeight"),
    draw(layer) {
      const children = ListView.parent.draw.call(this, layer);
      const content = this.get("content");
      if (children) {
        appendChildren(layer, children);
      }
      if (content) {
        content.addObserverForRange(
          this._renderRange,
          this,
          "viewNeedsRedraw"
        );
        content.on("query:updated", this, "contentWasUpdated");
        this.redrawLayer(layer);
      }
    },
    viewNeedsRedraw: function() {
      this.propertyNeedsRedraw(this, "layer");
    }.observes("itemLayout"),
    offsetToIndex(yOffsetInPx) {
      return Math.floor(yOffsetInPx / this.get("itemHeight"));
    },
    indexToOffset(index) {
      return index * this.get("itemHeight");
    },
    // -----------------------------------------------------------------------
    isCorrectItemView() {
      return true;
    },
    createItemView(content, index, list, isAdded) {
      const ItemView = this.get("ItemView");
      const focused = this.get("focused");
      const view2 = new ItemView({
        controller: this.get("controller"),
        selection: this.get("selection"),
        parentView: this,
        itemLayout: this.get("itemLayout"),
        content,
        index,
        list,
        isAdded,
        focused
      });
      if (focused) {
        view2.set("isFocused", content === focused.get("record"));
      }
      return view2;
    },
    destroyItemView(view2) {
      view2.destroy();
    },
    redrawLayer(layer) {
      const list = this.get("content") || [];
      const childViews = this.get("childViews");
      const isInDocument = this.get("isInDocument");
      const renderRange = this._renderRange;
      const start = Math.max(0, renderRange.start);
      const end = Math.min(list.get("length"), renderRange.end);
      const rendered = this._rendered;
      const newRendered = this._rendered = {};
      const added = this._added;
      const removed = this._removed;
      const viewsDidEnterDoc = [];
      const moved = /* @__PURE__ */ new Set();
      let frag = null;
      let currentViewIndex;
      for (let i = start, l = end; i < l; i += 1) {
        const item = list.getObjectAt(i);
        const id = item ? guid(item) : "null:" + i;
        const view2 = rendered[id];
        if (view2 && this.isCorrectItemView(view2, item, i)) {
          newRendered[id] = view2;
        }
      }
      this.beginPropertyChanges();
      for (const id in rendered) {
        if (!newRendered[id]) {
          const view2 = rendered[id];
          const item = removed ? view2.get("content") : null;
          const isRemoved = item ? removed[item.get("storeKey")] : false;
          view2.detach(isRemoved);
          this.destroyItemView(view2);
        }
      }
      currentViewIndex = getNextViewIndex(childViews, newRendered, 0);
      const itemLayout = this.get("itemLayout");
      for (let i = start, l = end; i < l; i += 1) {
        const item = list.getObjectAt(i);
        const id = item ? guid(item) : "null:" + i;
        let view2 = newRendered[id];
        if (view2) {
          const viewIsInCorrectPosition = childViews[currentViewIndex] === view2;
          if (!viewIsInCorrectPosition) {
            if (isInDocument) {
              moved.add(view2);
              view2.beginPropertyChanges();
              view2.willLeaveDocument();
            }
            layer.removeChild(view2.get("layer"));
            if (isInDocument) {
              view2.didLeaveDocument();
            }
          }
          view2.set("itemLayout", itemLayout).set("index", i).set("list", list);
          if (viewIsInCorrectPosition) {
            if (frag) {
              layer.insertBefore(frag, view2.get("layer"));
              frag = null;
            }
            currentViewIndex = getNextViewIndex(
              childViews,
              newRendered,
              currentViewIndex + 1
            );
            continue;
          }
        } else {
          const isAdded = added && item ? added[item.get("storeKey")] : false;
          view2 = this.createItemView(item, i, list, isAdded);
          if (!view2) {
            continue;
          }
          newRendered[id] = view2;
          childViews.push(view2);
        }
        if (!frag) {
          frag = layer.ownerDocument.createDocumentFragment();
        }
        frag.appendChild(view2.render().get("layer"));
        if (isInDocument) {
          view2.willEnterDocument();
          viewsDidEnterDoc.push(view2);
        }
      }
      if (frag) {
        layer.appendChild(frag);
      }
      if (isInDocument && viewsDidEnterDoc.length) {
        for (let i = 0, l = viewsDidEnterDoc.length; i < l; i += 1) {
          const view2 = viewsDidEnterDoc[i];
          view2.didEnterDocument();
          if (moved.has(view2)) {
            view2.endPropertyChanges();
          }
        }
      }
      childViews.sort(byIndex);
      this._added = null;
      this._removed = null;
      this.propertyDidChange("childViews");
      this.endPropertyChanges();
    },
    redrawFocused(_, __, oldRecord) {
      const rendered = this._rendered;
      const newRecord = this.get("focused").get("record");
      if (oldRecord) {
        const view2 = rendered[guid(oldRecord)];
        if (view2) {
          view2.set("isFocused", false);
        }
      }
      if (newRecord) {
        const view2 = rendered[guid(newRecord)];
        if (view2) {
          view2.set("isFocused", true);
        }
      }
    },
    redrawSelection() {
      const selection = this.get("selection");
      const itemViews = this.get("childViews");
      for (let i = itemViews.length - 1; i >= 0; i -= 1) {
        const view2 = itemViews[i];
        const storeKey = view2.getFromPath("content.storeKey");
        if (storeKey) {
          view2.set("isSelected", selection.isStoreKeySelected(storeKey));
        }
      }
    },
    // --- Can't add views by hand; just bound to content ---
    insertView: null,
    replaceView: null
  });

  // source/views/collections/OptionsListView.js
  var OptionsListView = Class({
    Name: "OptionsListView",
    Extends: ListView,
    init: function() {
      this._focusedOption = null;
      this._selectedOption = null;
      this._views = {};
      OptionsListView.parent.constructor.apply(this, arguments);
    },
    layerTag: "ul",
    // ---
    autoScroll: true,
    focusedOption: bind("controller*focused"),
    selectedOption: bind("controller*selected"),
    createItemView(item, index, list) {
      const id = guid(item);
      const View3 = this.getViewTypeForItem(item);
      let view2 = this._views[id];
      const itemLayout = this.get("itemLayout");
      if (view2) {
        view2.set("itemLayout", itemLayout).set("index", index).set("list", list).set("parentView", this);
      } else {
        const isFocused = item === this.get("focusedOption");
        const isSelected = item === this.get("selectedOption");
        view2 = this._views[id] = new View3({
          controller: this.get("controller"),
          parentView: this,
          itemLayout,
          content: item,
          index,
          list,
          isFocused,
          isSelected
        });
        if (isFocused) {
          this._focusedOption = view2;
        }
        if (isSelected) {
          this._selectedOption = view2;
        }
      }
      return view2;
    },
    destroyItemView(view2) {
      const item = view2.get("content");
      if (isDestroyed(item) || item.is && item.is(DESTROYED)) {
        view2.destroy();
        delete this._views[guid(item)];
      }
    },
    getView(item) {
      return this._views[guid(item)] || null;
    },
    redrawFocused: function() {
      const item = this.get("focusedOption");
      const oldView = this._focusedOption;
      const newView = item && this.getView(item);
      if (oldView !== newView) {
        if (oldView) {
          oldView.set("isFocused", false);
        }
        if (newView) {
          newView.set("isFocused", true);
          if (this.get("autoScroll")) {
            this.scrollIntoView();
          }
        }
        this._focusedOption = newView;
      }
    }.observes("focusedOption"),
    redrawSelected: function() {
      const item = this.get("selectedOption");
      const oldView = this._selectedOption;
      const newView = item && this.getView(item);
      if (oldView !== newView) {
        if (oldView) {
          oldView.set("isSelected", false);
        }
        if (newView) {
          newView.set("isSelected", true);
          if (this.get("autoScroll")) {
            this.scrollIntoView();
          }
        }
        this._selectedOption = newView;
      }
    }.observes("selectedOption"),
    // 1. after    => Trigger after the list redraws, which sets new index on
    //                ListItemView.
    // 2. nextLoop => Trigger after ListItemView#layoutWillChange, which happens
    //                in the next loop after the item's index changes.
    // 3. after    => Trigger after that ListItemView has redrawn in its new
    //                position so we scroll to the right place.
    scrollIntoView: function() {
      const item = this.get("focusedOption") || this.get("selectedOption");
      const view2 = item && this.getView(item);
      const scrollView = this.getParent(ScrollView);
      if (!view2 || !scrollView || !this.get("isInDocument")) {
        return;
      }
      const top = view2.getPositionRelativeTo(scrollView).top;
      const height = view2.get("pxHeight");
      const scrollTop = scrollView.get("scrollTop");
      const scrollHeight = scrollView.get("pxHeight");
      if (top < scrollTop) {
        scrollView.scrollTo(0, top - (height >> 1), true);
      } else if (top + height > scrollTop + scrollHeight) {
        scrollView.scrollTo(
          0,
          top + height - scrollHeight + (height >> 1),
          true
        );
      }
    }.queue("after").nextLoop().queue("after")
  });

  // source/views/menu/MenuView.js
  var MenuOption = Class({
    Name: "MenuOption",
    Extends: Obj,
    init: function(button, controller, showAll) {
      this.button = button;
      this.controller = controller;
      this.showAll = showAll;
    },
    isDisabled: function() {
      return this.get("button").get("isDisabled");
    }.property().nocache(),
    name: function() {
      const button = this.get("button");
      return button.get("filterName") || button.get("label");
    }.property().nocache()
  });
  var MenuController = Class({
    Name: "MenuController",
    Extends: OptionsController,
    init: function(view2, content, isFiltering, showAllButton) {
      this.options = new ObservableArray();
      this.view = view2;
      this.content = function(_content) {
        return _content.filter(toBoolean).map((button) => new MenuOption(button, this));
      }.property();
      this.set("content", content);
      this.showAllButton = function(_showAllButton) {
        return _showAllButton ? new MenuOption(_showAllButton, this, true) : null;
      }.property();
      this.set("showAllButton", showAllButton);
      MenuController.parent.constructor.call(this, {
        isFiltering
      });
    },
    optionsWillChange: function() {
      this.setOptions();
    }.queue("before").observes("content", "search", "isFiltering", "showAllButton"),
    filterOptions(content, search) {
      const patterns = search ? search.split(/\s+/).map(makeSearchRegExp) : null;
      const results = patterns ? content.filter((option) => {
        const name = option.get("name");
        return patterns.every((pattern) => {
          return pattern.test(name);
        });
      }) : Array.isArray(content) ? content : content.get("[]");
      const showAllButton = this.get("showAllButton");
      if (showAllButton && results.last() !== showAllButton) {
        results.push(showAllButton);
      }
      return results;
    },
    selectFocused() {
      const focused = this.get("focused");
      if (focused) {
        this.select(focused);
        if (!focused.get("showAll")) {
          this.resetSearch();
        }
      }
    },
    collapseFocused() {
      const view2 = this.get("view");
      let popOverView;
      if (!view2.get("showFilter") && (popOverView = view2.getParent(PopOverView)) && popOverView.get("parentPopOverView")) {
        view2.hide();
      }
    },
    expandFocused() {
      const focused = this.get("focused");
      const button = focused ? focused.get("button") : null;
      if (button && button.get("activateOnMenuFocus")) {
        this.selectFocused();
      }
    },
    select(item) {
      const button = item.get("button");
      if (button.activate) {
        button.activate();
      }
    },
    done() {
      this.get("view").hide();
    },
    // ---
    viewMayHaveResized: function() {
      this.get("view").parentViewDidResize();
    }.queue("after").observes("search", "content")
  });
  var MenuView = Class({
    Name: "MenuView",
    Extends: View2,
    className: "v-Menu",
    isMenuView: true,
    showFilter: false,
    filterPlaceholder: null,
    closeOnActivate: true,
    controller: function() {
      return new MenuController(
        this,
        this.get("options"),
        this.get("showFilter"),
        this.get("showAllButton")
      );
    }.property(),
    didEnterDocument() {
      MenuView.parent.didEnterDocument.call(this);
      const layer = this.get("layer");
      layer.addEventListener("pointermove", this, false);
      layer.addEventListener("pointerout", this, false);
      if (!this.showFilter) {
        const scrollView = this.scrollView;
        queueFn("after", scrollView.focus, scrollView);
      }
      return this;
    },
    didLeaveDocument() {
      const controller = this.get("controller");
      const layer = this.get("layer");
      if (this.get("showFilter")) {
        controller.set("search", "");
      } else {
        controller.focus(null);
      }
      layer.removeEventListener("pointerout", this, false);
      layer.removeEventListener("pointermove", this, false);
      return MenuView.parent.didLeaveDocument.call(this);
    },
    ItemView: MenuOptionView,
    draw() {
      const controller = this.get("controller");
      return [
        this.filterView = this.get("showFilter") ? new MenuFilterView({
          placeholder: this.get("filterPlaceholder"),
          controller
        }) : null,
        this.scrollView = new ScrollView({
          positioning: "relative",
          layout: {},
          childViews: [
            new OptionsListView({
              controller,
              layerTag: "ul",
              content: bind(controller, "options"),
              getViewTypeForItem: () => this.get("ItemView")
            })
          ]
        })
      ];
    },
    hide() {
      const parent = this.get("parentView");
      if (parent) {
        invokeInNextFrame(parent.hide, parent);
      }
    },
    buttonDidActivate: function() {
      var _a;
      if (this.get("closeOnActivate")) {
        let popOverView = this.getParent(PopOverView) || this.get("parentView");
        let parent;
        if (popOverView) {
          while (parent = popOverView.get("parentPopOverView")) {
            popOverView = parent;
          }
          (_a = popOverView.hide) == null ? void 0 : _a.call(popOverView);
        }
      }
    }.nextFrame().on("button:activate"),
    _shortcutHandler(event) {
      if (!this.get("showFilter")) {
        const kbShortcuts = ViewEventsController.kbShortcuts;
        const isMenuChild = (handler) => {
          const object = handler[0];
          if (object instanceof View2) {
            let parent = object;
            while (parent && parent !== this) {
              parent = parent.get("parentView");
            }
            if (parent) {
              event.preventDefault();
              event.stopPropagation();
              return true;
            }
          }
          return false;
        };
        kbShortcuts.trigger(event, isMenuChild);
      }
    },
    keydown: function(event) {
      const key = lookupKey(event);
      const controller = this.get("controller");
      ViewEventsController.kbShortcuts.set("inKBMode", true);
      switch (key) {
        case "Enter":
          controller.selectFocused();
          break;
        case "Ctrl-k":
        case "ArrowUp":
          controller.focusPrevious();
          break;
        case "Ctrl-j":
        case "ArrowDown":
          controller.focusNext();
          break;
        case "ArrowLeft":
          if (!controller.collapseFocused()) {
            return;
          }
          break;
        case "ArrowRight":
          if (!controller.expandFocused()) {
            return;
          }
          break;
        default:
          this._shortcutHandler(event);
          return;
      }
      event.preventDefault();
      event.stopPropagation();
    }.on("keydown"),
    keypress: function(event) {
      this._shortcutHandler(event);
    }.on("keypress"),
    contextmenu: function(event) {
      event.preventDefault();
    }.on("contextmenu")
  });

  // source/views/collections/ToolbarView.js
  var toView = function(name) {
    return name === "-" ? create("span.v-Toolbar-divider") : name === "*" ? null : this._views[name];
  };
  var OverflowMenuView = Class({
    Name: "OverflowMenuView",
    Extends: MenuButtonView,
    didEnterDocument() {
      OverflowMenuView.parent.didEnterDocument.call(this);
      this.setShortcuts(null, "", {}, this.get("shortcuts"));
      return this;
    },
    willLeaveDocument() {
      this.setShortcuts(null, "", this.get("shortcuts"), {});
      return OverflowMenuView.parent.willLeaveDocument.call(this);
    },
    shortcuts: function() {
      const views = this.getFromPath("menuView.options");
      return views ? views.reduce((acc, view2) => {
        const shortcut = view2.get("shortcut");
        if (shortcut) {
          shortcut.split(" ").forEach((key) => {
            acc[key] = view2;
          });
        }
        return acc;
      }, {}) : {};
    }.property("menuView"),
    setShortcuts: function(_, __, oldShortcuts, shortcuts) {
      if (this.get("isInDocument")) {
        const kbShortcuts = ViewEventsController.kbShortcuts;
        if (!shortcuts) {
          shortcuts = this.get("shortcuts");
        }
        for (const key in oldShortcuts) {
          kbShortcuts.deregister(key, this, "activateButton");
        }
        for (const key in shortcuts) {
          kbShortcuts.register(key, this, "activateButton");
        }
      }
    }.observes("shortcuts"),
    activateButton(event) {
      const key = lookupKey(event);
      const button = this.get("shortcuts")[key];
      if (button instanceof MenuButtonView) {
        this.activate(event);
      }
      button.activate(event);
    }
  });
  var viewIsBeforeFlex = function(view2, flex) {
    const layer = view2.get("layer");
    const childNodes = flex.parentNode.childNodes;
    for (let i = childNodes.length - 1; i >= 0; i -= 1) {
      const node = childNodes[i];
      if (node === layer) {
        return false;
      }
      if (node === flex) {
        return true;
      }
    }
    return true;
  };
  var ToolbarView = Class({
    Name: "ToolbarView",
    Extends: View2,
    className: "v-Toolbar",
    config: "standard",
    minimumGap: 20,
    preventOverlap: false,
    popOverOptions: null,
    overflowMenuType: "",
    init: function() {
      ToolbarView.parent.constructor.apply(this, arguments);
      const config = {
        type: this.get("overflowMenuType"),
        label: localise("More"),
        shortcut: ".",
        popOverView: this.popOverView || new PopOverView()
      };
      const popOverOptions = this.get("popOverOptions");
      if (popOverOptions) {
        config.popOverOptions = popOverOptions;
      }
      this._views = {
        overflow: new OverflowMenuView(config)
      };
      this._configs = {
        standard: {
          left: [],
          right: []
        }
      };
      this._widths = {};
      this._flex = null;
    },
    destroy() {
      const views = this._views;
      for (const name in views) {
        const view2 = views[name];
        if (!view2.get("parentView")) {
          view2.destroy();
        }
      }
      ToolbarView.parent.destroy.call(this);
    },
    registerView(name, view2, _dontMeasure) {
      this._views[name] = view2;
      if (!_dontMeasure && this.get("isInDocument") && this.get("preventOverlap")) {
        this.measureViews();
      }
      return this;
    },
    registerViews(views) {
      for (const name in views) {
        this.registerView(name, views[name], true);
      }
      if (this.get("isInDocument") && this.get("preventOverlap")) {
        this.measureViews();
      }
      return this;
    },
    registerConfig(name, config) {
      this._configs[name] = config;
      if (this.get("config") === name) {
        this.computedPropertyDidChange("config");
      }
      return this;
    },
    registerConfigs(configs) {
      for (const name in configs) {
        this.registerConfig(name, configs[name]);
      }
      return this;
    },
    getView(name) {
      return this._views[name];
    },
    getConfig(config) {
      return this._configs[config] || null;
    },
    // ---
    leftConfig: function() {
      const configs = this._configs;
      const config = configs[this.get("config")];
      return config && config.left || configs.standard.left;
    }.property("config"),
    rightConfig: function() {
      const configs = this._configs;
      const config = configs[this.get("config")];
      return config && config.right || configs.standard.right;
    }.property("config"),
    left: function() {
      let leftConfig = this.get("leftConfig");
      let overflowConfig = null;
      if (this.get("preventOverlap")) {
        const rightConfig = this.get("rightConfig");
        const widths = this._widths;
        const computedWidth = window.getComputedStyle(
          this.get("layer")
        ).width;
        let pxWidth = computedWidth.endsWith("px") ? parseInt(computedWidth, 10) : 0;
        if (!pxWidth) {
          const rootView = this.getParent(RootView);
          pxWidth = rootView ? rootView.get("pxWidth") : 1024;
        }
        pxWidth -= this.get("minimumGap");
        let i;
        let l;
        for (i = 0, l = rightConfig.length; i < l; i += 1) {
          pxWidth -= widths[rightConfig[i]];
        }
        for (i = 0, l = leftConfig.length; i < l; i += 1) {
          const config = leftConfig[i];
          if (config === "*") {
            break;
          } else {
            pxWidth -= widths[config];
          }
        }
        if (pxWidth < 0 || i < l) {
          pxWidth -= widths.overflow;
          while (pxWidth < 0 && i > 0) {
            i -= 1;
            pxWidth += widths[leftConfig[i]];
          }
          if (leftConfig[i] === "-") {
            i -= 1;
          }
          if (i > 0) {
            overflowConfig = leftConfig.slice(i);
            leftConfig = leftConfig.slice(0, i);
            leftConfig.push("overflow");
          } else {
            overflowConfig = leftConfig;
            leftConfig = ["overflow"];
          }
        }
      } else {
        const i = leftConfig.indexOf("*");
        if (i > -1) {
          overflowConfig = leftConfig.slice(i);
          leftConfig = leftConfig.slice(0, i);
          leftConfig.push("overflow");
        }
      }
      if (overflowConfig && !isEqual(this._oldOverflowConfig, overflowConfig)) {
        const overflowMenuButton = this._views.overflow;
        if (overflowMenuButton.get("isActive")) {
          overflowMenuButton.get("popOverView").hide();
        }
        overflowMenuButton.set(
          "menuView",
          new MenuView({
            showFilter: false,
            options: overflowConfig.map(toView, this).filter((view2) => view2 instanceof View2)
          })
        );
      }
      this._oldOverflowConfig = overflowConfig;
      return leftConfig.map(toView, this);
    }.property("leftConfig", "rightConfig", "pxWidth"),
    right: function() {
      return this.get("rightConfig").map(toView, this);
    }.property("rightConfig"),
    measureViews() {
      const widths = this._widths;
      const views = this._views;
      const measureView = new View2({
        className: "v-Toolbar-measure",
        layerStyles: {},
        childViews: Object.values(views).filter(
          (view2) => !view2.get("parentView")
        ),
        draw(layer) {
          return [
            create("span.v-Toolbar-divider"),
            View2.prototype.draw.call(this, layer)
          ];
        }
      });
      this.insertView(measureView, null, "top");
      const unused = measureView.get("childViews");
      const container = measureView.get("layer");
      const containerBoundingClientRect = getRawBoundingClientRect(container);
      const firstButton = unused.length ? unused[0].get("layer") : null;
      for (const name in views) {
        widths[name] = views[name].get("pxWidth") || widths[name];
      }
      widths["-"] = (firstButton ? getRawBoundingClientRect(firstButton).left : containerBoundingClientRect.right) - containerBoundingClientRect.left;
      this.removeView(measureView);
      for (let i = unused.length - 1; i >= 0; i -= 1) {
        measureView.removeView(unused[i]);
      }
      measureView.destroy();
      return this;
    },
    didEnterDocument() {
      ToolbarView.parent.didEnterDocument.call(this);
      if (this.get("preventOverlap")) {
        this.measureViews();
      }
      return this;
    },
    draw() {
      return [
        this.get("left"),
        this._flex = create("div.v-Toolbar-flex"),
        this.get("right")
      ];
    },
    toolbarNeedsRedraw: function(self, property, oldValue) {
      if (oldValue) {
        this.propertyNeedsRedraw(self, property, oldValue);
      }
    }.observes("left", "right"),
    redrawLeft(layer, oldViews) {
      this.redrawSide(layer, true, oldViews, this.get("left"));
    },
    redrawRight(layer, oldViews) {
      this.redrawSide(layer, false, oldViews, this.get("right"));
    },
    redrawSide(layer, isLeft, oldViews, newViews) {
      let start = 0;
      let isSideEqual = true;
      const flex = this._flex;
      for (let i = start, l = oldViews.length; i < l; i += 1) {
        const view2 = oldViews[i];
        const newView = newViews[i];
        if (view2 instanceof View2) {
          if (isSideEqual && view2 === newView) {
            start += 1;
          } else {
            isSideEqual = false;
            if (viewIsBeforeFlex(view2, flex) === isLeft) {
              this.removeView(view2);
            }
          }
        } else {
          if (isSideEqual && newView && !(newView instanceof View2)) {
            start += 1;
            newViews[i] = view2;
          } else {
            layer.removeChild(view2);
          }
        }
      }
      for (let i = start, l = newViews.length; i < l; i += 1) {
        const view2 = newViews[i];
        if (view2 instanceof View2) {
          const parent = view2.get("parentView");
          if (parent) {
            parent.removeView(view2);
          }
          this.insertView(
            view2,
            isLeft ? flex : layer,
            isLeft ? "before" : "bottom"
          );
        } else if (view2) {
          layer.insertBefore(view2, isLeft ? flex : null);
        }
      }
    },
    preventOverlapDidChange: function() {
      if (this.get("preventOverlap") && this.get("isInDocument")) {
        this.measureViews().computedPropertyDidChange("left");
      }
    }.queue("after").observes("preventOverlap").on("button:resize")
  });
  ToolbarView.OverflowMenuView = OverflowMenuView;

  // source/views/controls/RichTextView.js
  var execCommand = function(command) {
    return function(arg) {
      var _a;
      (_a = this.get("editor")) == null ? void 0 : _a[command](arg);
      return this;
    };
  };
  var queryCommandState = function(tag) {
    const regexp = new RegExp("(?:^|>)" + tag + "\\b");
    return function() {
      const path = this.get("path");
      return path === "(selection)" ? this.get("editor").hasFormat(tag) : regexp.test(path);
    }.property("path");
  };
  var urlRegExp = /^(?:https?:\/\/)?[\w.]+[.][a-z]{2,4}(?:\/[^\s()<>]+|\([^\s()<>]+\))*/i;
  var TOOLBAR_HIDDEN = 0;
  var TOOLBAR_AT_TOP = 1;
  var TOOLBAR_ABOVE_KEYBOARD = 2;
  var URLPickerView = Class({
    Name: "URLPickerView",
    Extends: View2,
    prompt: "",
    placeholder: "",
    confirm: "",
    value: "",
    className: "v-UrlPicker u-p-5 u-space-y-4",
    draw() {
      return [
        this._input = new TextInputView({
          inputAttributes: {
            autocapitalize: "off",
            autocomplete: "off",
            autocorrect: "off",
            spellcheck: "false"
          },
          label: this.get("prompt"),
          value: bindTwoWay(this, "value"),
          placeholder: this.get("placeholder")
        }),
        create("p.u-flex.u-space-x-2", [
          new ButtonView({
            type: "v-Button--cta v-Button--sizeM",
            label: this.get("confirm"),
            target: this,
            method: "add"
          }),
          new ButtonView({
            type: "v-Button--standard v-Button--sizeM",
            label: localise("Cancel"),
            target: this.get("popOver"),
            method: "hide"
          })
        ])
      ];
    },
    // ---
    autoFocus: function() {
      if (this.get("isInDocument")) {
        this._input.set("selection", {
          start: 0,
          end: this.get("value").length
        }).focus();
      }
    }.nextFrame().observes("isInDocument"),
    addOnEnter: function(event) {
      if (lookupKey(event) === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        this.add();
      }
    }.on("keypress")
  });
  var RichTextView = Class({
    Name: "RichTextView",
    Extends: View2,
    Mixin: DropTarget,
    isFocused: false,
    isDisabled: false,
    tabIndex: void 0,
    label: void 0,
    isToolbarShown: false,
    checkToolbarShown() {
      this.set(
        "isToolbarShown",
        this.get("isFocused") || this.get("popOver").get("isVisible")
      );
    },
    popOver: function() {
      return new PopOverView();
    }.property(),
    // ---
    savedSelection: null,
    isTextSelected: false,
    setIsTextSelected: function(event) {
      this.set("isTextSelected", event.type === "select");
    }.on("cursor", "select"),
    // ---
    showToolbar: isIOS || isAndroid ? TOOLBAR_ABOVE_KEYBOARD : TOOLBAR_AT_TOP,
    fontFaceOptions: function() {
      return [
        [localise("Default"), null],
        ["Arial", "arial, sans-serif"],
        ["Georgia", "georgia, serif"],
        ["Helvetica", "helvetica, arial, sans-serif"],
        ["Monospace", "menlo, consolas, monospace"],
        ["Tahoma", "tahoma, sans-serif"],
        ["Times New Roman", '"Times New Roman", times, serif'],
        ["Trebuchet MS", '"Trebuchet MS", sans-serif'],
        ["Verdana", "verdana, sans-serif"]
      ];
    }.property(),
    fontSizeOptions: function() {
      return [
        [localise("Small"), "10px"],
        [localise("Medium"), null],
        [localise("Large"), "16px"],
        [localise("Huge"), "22px"]
      ];
    }.property(),
    editor: null,
    editorId: void 0,
    editorClassName: "",
    editorConfig: null,
    styles: null,
    _value: "",
    value: function(html) {
      const editor = this.get("editor");
      if (editor) {
        if (html !== void 0) {
          editor.setHTML(html);
        } else {
          html = editor.getHTML();
        }
      } else {
        if (html !== void 0) {
          this._value = html;
        } else {
          html = this._value;
        }
      }
      return html;
    }.property().nocache(),
    destroy() {
      const editor = this.get("editor");
      if (editor) {
        editor.destroy();
      }
      const popOver = meta(this).cache.popOver;
      if (popOver) {
        popOver.hide().destroy();
      }
      RichTextView.parent.destroy.call(this);
    },
    // --- Render ---
    willEnterDocument() {
      this.set("path", "");
      RichTextView.parent.willEnterDocument.call(this);
      this.get("layer").appendChild(this._editingLayer);
      return this;
    },
    didEnterDocument() {
      RichTextView.parent.didEnterDocument.call(this);
      const selection = this.get("savedSelection");
      const editor = this.get("editor");
      if (selection) {
        const range = document.createRange();
        range.setStart(selection.sc, selection.so);
        range.setEnd(selection.ec, selection.eo);
        editor.setSelection(range).focus();
        this.set("savedSelection", null);
      } else {
        editor.moveCursorToStart();
      }
      return this;
    },
    willLeaveDocument() {
      if (this.get("isFocused")) {
        const selection = this.get("editor").getSelection();
        this.set("savedSelection", {
          sc: selection.startContainer,
          so: selection.startOffset,
          ec: selection.endContainer,
          eo: selection.endOffset
        });
        this.blur();
      }
      return RichTextView.parent.willLeaveDocument.call(this);
    },
    didLeaveDocument() {
      document.createDocumentFragment().appendChild(this._editingLayer);
      return RichTextView.parent.didLeaveDocument.call(this);
    },
    // ---
    className: function() {
      return "v-RichText" + (this.get("isFocused") ? " is-focused" : "") + (this.get("isDisabled") ? " is-disabled" : "") + (this.get("showToolbar") === TOOLBAR_HIDDEN ? " v-RichText--noToolbar" : "");
    }.property("isFocused", "isDisabled"),
    createEditor(root, options) {
      return new Squire(root, options);
    },
    draw() {
      const editorClassName = this.get("editorClassName");
      const editingLayer = this._editingLayer = create("div", {
        "id": this.get("editorId"),
        "role": "textbox",
        "aria-multiline": "true",
        "aria-label": this.get("label"),
        "tabIndex": this.get("tabIndex"),
        "className": "v-RichText-input" + (editorClassName ? " " + editorClassName : "")
      });
      document.createDocumentFragment().appendChild(editingLayer);
      const editor = this.createEditor(
        editingLayer,
        this.get("editorConfig")
      );
      editor.setHTML(this._value).addEventListener("input", this).addEventListener("select", this).addEventListener("cursor", this).addEventListener("pathChange", this).addEventListener("undoStateChange", this).addEventListener("pasteImage", this);
      this.set("editor", editor).set("path", editor.getPath());
      if (this.get("isDisabled")) {
        this.redrawIsDisabled();
      }
      const showToolbar = this.get("showToolbar");
      let toolbarView = null;
      if (showToolbar === TOOLBAR_AT_TOP) {
        toolbarView = this.get("toolbarView");
      } else if (showToolbar === TOOLBAR_ABOVE_KEYBOARD) {
        toolbarView = when(this, "isToolbarShown").show([this.get("toolbarView")]).end();
      }
      return [
        create("style", { type: "text/css" }, [this.get("styles")]),
        toolbarView
      ];
    },
    viewNeedsRedraw: function(self, property, oldValue) {
      this.propertyNeedsRedraw(self, property, oldValue);
    }.observes("isDisabled", "tabIndex"),
    redrawIsDisabled() {
      this._editingLayer.setAttribute(
        "contenteditable",
        this.get("isDisabled") ? "false" : "true"
      );
    },
    redrawTabIndex() {
      this._editingLayer.set("tabIndex", this.get("tabIndex"));
    },
    // ---
    scrollIntoView: function() {
      if (!this.get("isFocused") || !this.get("isInDocument")) {
        return;
      }
      const scrollView = this.getParent(ScrollView);
      if (!scrollView) {
        return;
      }
      const editor = this.get("editor");
      const cursorPosition = editor && editor.getCursorPosition();
      if (!cursorPosition) {
        return;
      }
      const scrollViewOffsetTop = getRawBoundingClientRect(
        scrollView.get("layer")
      ).top;
      const offsetTop = cursorPosition.top - scrollViewOffsetTop;
      const offsetBottom = cursorPosition.bottom - scrollViewOffsetTop;
      const scrollViewHeight = scrollView.get("pxHeight") - scrollView.getParent(RootView).get("safeAreaInsetBottom");
      const showToolbar = this.get("showToolbar");
      const toolbarView = showToolbar !== TOOLBAR_HIDDEN ? this.get("toolbarView") : null;
      const toolbarHeight = (toolbarView == null ? void 0 : toolbarView.get("pxHeight")) || 0;
      const topToolbarHeight = showToolbar === TOOLBAR_AT_TOP ? toolbarHeight : 0;
      const bottomToolbarHeight = showToolbar === TOOLBAR_ABOVE_KEYBOARD ? toolbarHeight + (toolbarView.get("isInDocument") ? parseInt(
        getStyle(toolbarView.get("layer"), "margin-bottom"),
        10
      ) || 0 : 0) : 0;
      let scrollBy = 0;
      const minimumGapToScrollEdge = 16;
      if (offsetTop < topToolbarHeight + minimumGapToScrollEdge) {
        scrollBy = offsetTop - topToolbarHeight - minimumGapToScrollEdge;
      } else if (offsetBottom > scrollViewHeight - bottomToolbarHeight - minimumGapToScrollEdge) {
        scrollBy = offsetBottom + bottomToolbarHeight + minimumGapToScrollEdge - scrollViewHeight;
      }
      if (scrollBy) {
        scrollView.scrollBy(0, Math.round(scrollBy), true);
      }
    }.queue("after").on("cursor"),
    // ---
    getIcon() {
      return null;
    },
    toolbarConfig: {
      left: [
        "bold",
        "italic",
        "underline",
        "strikethrough",
        "-",
        "font",
        "size",
        "-",
        "color",
        "bgcolor",
        "-",
        "image",
        "-",
        "link",
        "-",
        "ul",
        "ol",
        "-",
        "quote",
        "unquote",
        "-",
        "left",
        "centre",
        "right",
        "justify",
        "-",
        "ltr",
        "rtl",
        "-",
        "unformat"
      ],
      right: []
    },
    toolbarView: function() {
      const richTextView = this;
      const rootView = this.getParent(RootView);
      const showToolbar = this.get("showToolbar");
      return new ToolbarView(__spreadValues({
        className: "v-Toolbar v-Toolbar--preventOverlap v-RichText-toolbar",
        overflowMenuType: "",
        positioning: showToolbar === TOOLBAR_ABOVE_KEYBOARD ? "fixed" : "sticky",
        preventOverlap: showToolbar === TOOLBAR_AT_TOP
      }, showToolbar === TOOLBAR_ABOVE_KEYBOARD ? {
        layout: bind(
          rootView,
          "safeAreaInsetBottom",
          (bottom) => ({ bottom })
        ),
        mousedown: function(event) {
          event.preventDefault();
        }.on(POINTER_DOWN)
      } : {})).registerViews({
        bold: new ButtonView({
          tabIndex: -1,
          type: "v-Button--iconOnly",
          icon: this.getIcon("bold"),
          isActive: bind(this, "isBold"),
          label: localise("Bold"),
          tooltip: localise("Bold") + "\n" + formatKeyForPlatform("Cmd-b"),
          activate() {
            if (richTextView.get("isBold")) {
              richTextView.removeBold();
            } else {
              richTextView.bold();
            }
            this.fire("button:activate");
          }
        }),
        italic: new ButtonView({
          tabIndex: -1,
          type: "v-Button--iconOnly",
          icon: this.getIcon("italic"),
          isActive: bind(this, "isItalic"),
          label: localise("Italic"),
          tooltip: localise("Italic") + "\n" + formatKeyForPlatform("Cmd-i"),
          activate() {
            if (richTextView.get("isItalic")) {
              richTextView.removeItalic();
            } else {
              richTextView.italic();
            }
            this.fire("button:activate");
          }
        }),
        underline: new ButtonView({
          tabIndex: -1,
          type: "v-Button--iconOnly",
          icon: this.getIcon("underline"),
          isActive: bind(this, "isUnderlined"),
          label: localise("Underline"),
          tooltip: localise("Underline") + "\n" + formatKeyForPlatform("Cmd-u"),
          activate() {
            if (richTextView.get("isUnderlined")) {
              richTextView.removeUnderline();
            } else {
              richTextView.underline();
            }
            this.fire("button:activate");
          }
        }),
        strikethrough: new ButtonView({
          tabIndex: -1,
          type: "v-Button--iconOnly",
          icon: this.getIcon("strikethrough"),
          isActive: bind(this, "isStriked"),
          label: localise("Strikethrough"),
          tooltip: localise("Strikethrough") + "\n" + formatKeyForPlatform("Cmd-Shift-7"),
          activate() {
            if (richTextView.get("isStriked")) {
              richTextView.removeStrikethrough();
            } else {
              richTextView.strikethrough();
            }
            this.fire("button:activate");
          }
        }),
        size: new ButtonView({
          tabIndex: -1,
          type: "v-Button--iconOnly",
          icon: this.getIcon("size"),
          label: localise("Text size"),
          tooltip: localise("Text size"),
          target: this,
          method: "showFontSizeMenu"
        }),
        font: new ButtonView({
          tabIndex: -1,
          type: "v-Button--iconOnly",
          icon: this.getIcon("font"),
          label: localise("Font face"),
          tooltip: localise("Font face"),
          target: this,
          method: "showFontFaceMenu"
        }),
        color: new ButtonView({
          tabIndex: -1,
          type: "v-Button--iconOnly",
          icon: this.getIcon("color"),
          label: localise("Text color"),
          tooltip: localise("Text color"),
          target: this,
          method: "showTextColorMenu"
        }),
        bgcolor: new ButtonView({
          tabIndex: -1,
          type: "v-Button--iconOnly",
          icon: this.getIcon("bgcolor"),
          label: localise("Text highlight"),
          tooltip: localise("Text highlight"),
          target: this,
          method: "showTextHighlightColorMenu"
        }),
        link: new ButtonView({
          tabIndex: -1,
          type: "v-Button--iconOnly",
          icon: this.getIcon("link"),
          isActive: bind(this, "isLink"),
          label: localise("Link"),
          tooltip: localise("Link") + "\n" + formatKeyForPlatform("Cmd-k"),
          activate() {
            if (richTextView.get("isLink")) {
              richTextView.removeLink();
            } else {
              richTextView.showLinkOverlay(this);
            }
            this.fire("button:activate");
          }
        }),
        code: new ButtonView({
          tabIndex: -1,
          type: "v-Button--iconOnly",
          icon: this.getIcon("code"),
          isActive: bind(this, "isCode"),
          label: localise("Preformatted text"),
          tooltip: localise("Preformatted text") + "\n" + formatKeyForPlatform("Cmd-d"),
          activate() {
            if (richTextView.get("isCode")) {
              richTextView.removeCode();
            } else {
              richTextView.code();
            }
            this.fire("button:activate");
          }
        }),
        image: new FileButtonView({
          tabIndex: -1,
          type: "v-FileButton v-Button--iconOnly",
          icon: this.getIcon("image"),
          label: localise("Insert image"),
          tooltip: localise("Insert image"),
          acceptMultiple: true,
          acceptOnlyTypes: "image/jpeg, image/png, image/gif",
          target: this,
          method: "insertImagesFromFiles"
        }),
        remoteImage: new ButtonView({
          tabIndex: -1,
          type: "v-Button--iconOnly",
          icon: this.getIcon("image"),
          label: localise("Insert image"),
          tooltip: localise("Insert image"),
          target: this,
          method: "showInsertImageOverlay"
        }),
        left: new ButtonView({
          tabIndex: -1,
          type: "v-Button--iconOnly",
          icon: this.getIcon("left"),
          isActive: bind(this, "alignment", isEqualToValue("left")),
          label: localise("Left"),
          tooltip: localise("Left"),
          activate() {
            richTextView.setTextAlignment("left");
            this.fire("button:activate");
          }
        }),
        centre: new ButtonView({
          tabIndex: -1,
          type: "v-Button--iconOnly",
          icon: this.getIcon("centre"),
          isActive: bind(this, "alignment", isEqualToValue("center")),
          label: localise("Center"),
          tooltip: localise("Center"),
          activate() {
            richTextView.setTextAlignment("center");
            this.fire("button:activate");
          }
        }),
        right: new ButtonView({
          tabIndex: -1,
          type: "v-Button--iconOnly",
          icon: this.getIcon("right"),
          isActive: bind(this, "alignment", isEqualToValue("right")),
          label: localise("Right"),
          tooltip: localise("Right"),
          activate() {
            richTextView.setTextAlignment("right");
            this.fire("button:activate");
          }
        }),
        justify: new ButtonView({
          tabIndex: -1,
          type: "v-Button--iconOnly",
          icon: this.getIcon("justify"),
          isActive: bind(
            this,
            "alignment",
            isEqualToValue("justify")
          ),
          label: localise("Justify"),
          tooltip: localise("Justify"),
          activate() {
            richTextView.setTextAlignment("justify");
            this.fire("button:activate");
          }
        }),
        ltr: new ButtonView({
          tabIndex: -1,
          type: "v-Button--iconOnly",
          icon: this.getIcon("ltr"),
          isActive: bind(this, "direction", isEqualToValue("ltr")),
          label: localise("Text direction: left to right"),
          tooltip: localise("Text direction: left to right"),
          activate() {
            richTextView.setTextDirection("ltr");
            this.fire("button:activate");
          }
        }),
        rtl: new ButtonView({
          tabIndex: -1,
          type: "v-Button--iconOnly",
          icon: this.getIcon("rtl"),
          isActive: bind(this, "direction", isEqualToValue("rtl")),
          label: localise("Text direction: right to left"),
          tooltip: localise("Text direction: right to left"),
          activate() {
            richTextView.setTextDirection("rtl");
            this.fire("button:activate");
          }
        }),
        quote: new ButtonView({
          tabIndex: -1,
          type: "v-Button--iconOnly",
          icon: this.getIcon("quote"),
          label: localise("Quote"),
          tooltip: localise("Quote") + "\n" + formatKeyForPlatform("Cmd-]"),
          activate() {
            richTextView.increaseQuoteLevel();
            this.fire("button:activate");
          }
        }),
        unquote: new ButtonView({
          tabIndex: -1,
          type: "v-Button--iconOnly",
          icon: this.getIcon("unquote"),
          label: localise("Unquote"),
          tooltip: localise("Unquote") + "\n" + formatKeyForPlatform("Cmd-["),
          activate() {
            richTextView.decreaseQuoteLevel();
            this.fire("button:activate");
          }
        }),
        ul: new ButtonView({
          tabIndex: -1,
          type: "v-Button--iconOnly",
          icon: this.getIcon("ul"),
          isActive: bind(this, "isUnorderedList"),
          label: localise("Unordered list"),
          tooltip: localise("Unordered list") + "\n" + formatKeyForPlatform("Cmd-Shift-8"),
          activate() {
            if (richTextView.get("isUnorderedList")) {
              richTextView.removeList();
            } else {
              richTextView.makeUnorderedList();
            }
            this.fire("button:activate");
          }
        }),
        ol: new ButtonView({
          tabIndex: -1,
          type: "v-Button--iconOnly",
          icon: this.getIcon("ol"),
          isActive: bind(this, "isOrderedList"),
          label: localise("Ordered list"),
          tooltip: localise("Ordered list") + "\n" + formatKeyForPlatform("Cmd-Shift-9"),
          activate() {
            if (richTextView.get("isOrderedList")) {
              richTextView.removeList();
            } else {
              richTextView.makeOrderedList();
            }
            this.fire("button:activate");
          }
        }),
        undo: new ButtonView({
          tabIndex: -1,
          isDisabled: bind(this, "canUndo", invert),
          type: "v-Button--iconOnly",
          icon: this.getIcon("undo"),
          label: localise("Undo"),
          tooltip: localise("Undo"),
          target: this,
          method: "undo"
        }),
        redo: new ButtonView({
          tabIndex: -1,
          isDisabled: bind(this, "canRedo", invert),
          type: "v-Button--iconOnly",
          icon: this.getIcon("redo"),
          label: localise("Redo"),
          tooltip: localise("Redo"),
          target: this,
          method: "redo"
        }),
        unformat: new ButtonView({
          tabIndex: -1,
          type: "v-Button--iconOnly",
          icon: this.getIcon("unformat"),
          label: localise("Clear formatting"),
          tooltip: localise("Clear formatting"),
          activate() {
            richTextView.removeAllFormatting();
            this.fire("button:activate");
          }
        })
      }).registerConfig("standard", this.get("toolbarConfig"));
    }.property(),
    fontSizeMenuView: function() {
      const richTextView = this;
      return new MenuView({
        showFilter: false,
        options: this.get("fontSizeOptions").map(
          ([label, fontSize]) => new ButtonView({
            layout: fontSize ? {
              fontSize
            } : null,
            label,
            method: "setFontSize",
            setFontSize() {
              richTextView.setFontSize(fontSize);
            }
          })
        )
      });
    }.property(),
    showFontSizeMenu(buttonView) {
      this.showOverlay(this.get("fontSizeMenuView"), buttonView);
    },
    fontFaceMenuView: function() {
      const richTextView = this;
      return new MenuView({
        showFilter: false,
        options: this.get("fontFaceOptions").map(
          ([label, fontFace]) => new ButtonView({
            layout: fontFace ? {
              fontFamily: fontFace
            } : null,
            label,
            method: "setFontFace",
            setFontFace() {
              richTextView.setFontFace(fontFace);
            }
          })
        )
      });
    }.property(),
    showFontFaceMenu(buttonView) {
      this.showOverlay(this.get("fontFaceMenuView"), buttonView);
    },
    _colorText: true,
    textColorMenuView: function() {
      const richTextView = this;
      return new MenuView({
        className: "v-ColorMenu",
        showFilter: false,
        options: [
          "#000000",
          "#b22222",
          "#ff0000",
          "#ffa07a",
          "#fff0f5",
          "#800000",
          "#a52a2a",
          "#ff8c00",
          "#ffa500",
          "#faebd7",
          "#8b4513",
          "#daa520",
          "#ffd700",
          "#ffff00",
          "#ffffe0",
          "#2f4f4f",
          "#006400",
          "#008000",
          "#00ff00",
          "#f0fff0",
          "#008080",
          "#40e0d0",
          "#00ffff",
          "#afeeee",
          "#f0ffff",
          "#000080",
          "#0000cd",
          "#0000ff",
          "#add8e6",
          "#f0f8ff",
          "#4b0082",
          "#800080",
          "#ee82ee",
          "#dda0dd",
          "#e6e6fa",
          "#696969",
          "#808080",
          "#a9a9a9",
          "#d3d3d3",
          "#ffffff"
        ].map(
          (color) => new ButtonView({
            layout: {
              backgroundColor: color
            },
            label: color,
            method: "setColor",
            setColor() {
              if (richTextView._colorText) {
                richTextView.setTextColor(color);
              } else {
                richTextView.setHighlightColor(color);
              }
            }
          })
        )
      });
    }.property(),
    showTextColorMenu(buttonView) {
      this._colorText = true;
      this.showOverlay(this.get("textColorMenuView"), buttonView);
    },
    showTextHighlightColorMenu(buttonView) {
      this._colorText = false;
      this.showOverlay(this.get("textColorMenuView"), buttonView);
    },
    linkOverlayView: function() {
      const richTextView = this;
      return new URLPickerView({
        prompt: localise("Add a link to the following URL or email:"),
        placeholder: "e.g. www.example.com",
        confirm: localise("Add link"),
        popOver: richTextView.get("popOver"),
        add() {
          let url2 = this.get("value").trim();
          let email2;
          if (/^(?:javascript|data):/i.test(url2)) {
            return;
          }
          if (!/[a-z][\w-]+:/i.test(url2)) {
            email2 = email.exec(url2);
            if (email2 && email2[0].length === url2.length) {
              url2 = "mailto:" + encodeURIComponent(email2[0]).replace(/%40/g, "@");
            } else {
              url2 = "http://" + url2;
            }
          }
          richTextView.makeLink(url2);
          this.get("popOver").hide();
        }
      });
    }.property(),
    showLinkOverlay(buttonView) {
      const view2 = this.get("linkOverlayView");
      let value = this.getSelectedText().trim();
      if (!urlRegExp.test(value) && !email.test(value)) {
        value = "";
      }
      view2.set("value", value);
      this.showOverlay(view2, buttonView);
    },
    insertImageOverlayView: function() {
      const richTextView = this;
      return new URLPickerView({
        prompt: localise("Insert an image from the following URL:"),
        placeholder: "e.g. https://example.com/path/to/image.jpg",
        confirm: localise("Insert image"),
        popOver: richTextView.get("popOver"),
        add() {
          let url2 = this.get("value").trim();
          if (!/^(?:https?|data):/i.test(url2)) {
            if (/^[a-z]+:/i.test(url2)) {
              return;
            }
            url2 = "http://" + url2;
          }
          richTextView.insertImage(url2);
          this.get("popOver").hide();
        }
      });
    }.property(),
    showInsertImageOverlay(buttonView) {
      const view2 = this.get("insertImageOverlayView");
      view2.set("value", "");
      this.showOverlay(view2, buttonView);
    },
    showOverlay(view2, buttonView) {
      const aboveKeyboard = this.get("showToolbar") === TOOLBAR_ABOVE_KEYBOARD;
      if (buttonView.getParent(MenuView)) {
        buttonView = this.get("toolbarView").getView("overflow");
      }
      const richTextView = this;
      this.get("popOver").show({
        view: view2,
        positionToThe: aboveKeyboard ? "top" : "bottom",
        alignWithView: buttonView,
        alignEdge: !aboveKeyboard && view2 instanceof URLPickerView ? "left" : "centre",
        showCallout: true,
        offsetTop: aboveKeyboard ? 0 : 2,
        offsetLeft: aboveKeyboard ? 0 : -4,
        onHide() {
          richTextView.focus();
          invokeInNextEventLoop(
            richTextView.checkToolbarShown,
            richTextView
          );
        }
      });
    },
    // --- Commands ---
    focus() {
      var _a;
      (_a = this.get("editor")) == null ? void 0 : _a.focus();
      return this;
    },
    blur() {
      var _a;
      (_a = this.get("editor")) == null ? void 0 : _a.blur();
      return this;
    },
    undo() {
      var _a;
      (_a = this.get("editor")) == null ? void 0 : _a.undo().focus();
      return this;
    },
    redo() {
      var _a;
      (_a = this.get("editor")) == null ? void 0 : _a.redo().focus();
      return this;
    },
    bold: execCommand("bold"),
    italic: execCommand("italic"),
    underline: execCommand("underline"),
    strikethrough: execCommand("strikethrough"),
    removeBold: execCommand("removeBold"),
    removeItalic: execCommand("removeItalic"),
    removeUnderline: execCommand("removeUnderline"),
    removeStrikethrough: execCommand("removeStrikethrough"),
    makeLink: execCommand("makeLink"),
    removeLink: execCommand("removeLink"),
    setFontFace: execCommand("setFontFace"),
    setFontSize: execCommand("setFontSize"),
    setTextColor: execCommand("setTextColor"),
    setHighlightColor: execCommand("setHighlightColor"),
    setTextAlignment: execCommand("setTextAlignment"),
    setTextDirection: execCommand("setTextDirection"),
    increaseQuoteLevel: execCommand("increaseQuoteLevel"),
    decreaseQuoteLevel: execCommand("decreaseQuoteLevel"),
    makeUnorderedList: execCommand("makeUnorderedList"),
    makeOrderedList: execCommand("makeOrderedList"),
    removeList: execCommand("removeList"),
    increaseListLevel: execCommand("increaseListLevel"),
    decreaseListLevel: execCommand("decreaseListLevel"),
    code: execCommand("code"),
    removeCode: execCommand("removeCode"),
    removeAllFormatting: execCommand("removeAllFormatting"),
    insertImage: execCommand("insertImage"),
    insertImagesFromFiles(files) {
      if (window.FileReader) {
        files.forEach((file) => {
          const img = this.get("editor").insertImage();
          const reader = new FileReader();
          reader.onload = () => {
            img.src = reader.result;
            reader.onload = null;
          };
          reader.readAsDataURL(file);
        });
      }
    },
    getSelectedText() {
      const editor = this.get("editor");
      return editor ? editor.getSelectedText() : "";
    },
    kbShortcuts: function(event) {
      switch (lookupKey(event)) {
        case (isApple ? "Meta-k" : "Ctrl-k"):
          event.preventDefault();
          if (this.get("isLink")) {
            this.removeLink();
          } else {
            this.showLinkOverlay(
              this.get("toolbarView").getView("link")
            );
          }
          break;
        case "PageDown":
          if (!isApple) {
            const scrollView = this.getParent(ScrollView);
            if (scrollView) {
              scrollView.scrollToView(
                this,
                {
                  y: 32 + this.get("pxHeight") - scrollView.get("pxHeight")
                },
                true
              );
            }
          }
          break;
      }
    }.on("keydown"),
    // Low level commands
    _forEachBlock: execCommand("forEachBlock"),
    // --- Command state ---
    canUndo: false,
    canRedo: false,
    setUndoState: function(event) {
      const detail = event.detail;
      this.set("canUndo", detail.canUndo).set("canRedo", detail.canRedo);
      event.stopPropagation();
    }.on("undoStateChange"),
    path: "",
    setPath: function(event) {
      this.set("path", event.detail.path);
      event.stopPropagation();
    }.on("pathChange"),
    onSelect: function() {
      this.propertyDidChange("path");
    }.on("select"),
    isBold: queryCommandState("B"),
    isItalic: queryCommandState("I"),
    isUnderlined: queryCommandState("U"),
    isStriked: queryCommandState("S"),
    isLink: queryCommandState("A"),
    isCode: function() {
      const regexp = /(?:^|>)(?:PRE|CODE)\b/;
      const editor = this.get("editor");
      const path = this.get("path");
      return path === "(selection)" ? editor.hasFormat("PRE") || editor.hasFormat("CODE") : regexp.test(path);
    }.property("path"),
    alignment: function() {
      const path = this.get("path");
      const results = /\.align-(\w+)/.exec(path);
      let alignment;
      if (path === "(selection)") {
        alignment = "";
        this._forEachBlock((block) => {
          const align = block.style.textAlign || "left";
          if (alignment && align !== alignment) {
            alignment = "";
            return true;
          }
          alignment = align;
          return false;
        });
      } else {
        alignment = results ? results[1] : "left";
      }
      return alignment;
    }.property("path"),
    direction: function() {
      const path = this.get("path");
      const results = /\[dir=(\w+)\]/.exec(path);
      let dir;
      if (path === "(selection)") {
        dir = "";
        this._forEachBlock((block) => {
          const blockDir = block.dir || "ltr";
          if (dir && blockDir !== dir) {
            dir = "";
            return true;
          }
          dir = blockDir;
          return false;
        });
      } else {
        dir = results ? results[1] : "ltr";
      }
      return dir;
    }.property("path"),
    isUnorderedList: queryCommandState("UL"),
    isOrderedList: queryCommandState("OL"),
    // --- Keep state in sync with render ---
    handleEvent(event) {
      ViewEventsController.handleEvent(event, this);
    },
    _onFocus: function() {
      this.set("isFocused", true);
      this.set("isToolbarShown", true);
    }.on("focus"),
    _onBlur: function() {
      this.set("isFocused", false);
      invokeInNextEventLoop(this.checkToolbarShown, this);
    }.on("blur"),
    blurOnEsc: function(event) {
      if ((event.keyCode || event.which) === 27) {
        this.blur();
      }
    }.on("keydown"),
    // Chrome (and Opera) as of 2018-09-24 have a bug where if an image is
    // inside a link, clicking the image actually loads the link, even though
    // it's inside a content editable area.
    click: function(event) {
      const target = event.target;
      if (!isClickModified(event) && target.nodeName === "IMG" && nearest(target, "A", this.get("layer"))) {
        event.preventDefault();
      }
    }.on("click"),
    // --- Page image ---
    pasteImage: function(event) {
      const dropAcceptedDataTypes = this.get("dropAcceptedDataTypes");
      const images = Array.from(event.detail.clipboardData.items).filter((item) => dropAcceptedDataTypes[item.type]).map((item) => item.getAsFile()).filter(toBoolean);
      if (images.length) {
        this.insertImagesFromFiles(images);
      }
    }.on("pasteImage"),
    // -- Drag and drop ---
    dropAcceptedDataTypes: {
      "image/gif": true,
      "image/jpeg": true,
      "image/png": true,
      "image/tiff": true
    },
    dropEffect: COPY,
    drop(drag) {
      const types = this.get("dropAcceptedDataTypes");
      for (const type in types) {
        if (drag.hasDataType(type)) {
          this.insertImagesFromFiles(drag.getFiles(/^image\/.*/));
          break;
        }
      }
    }
  });

  // source/application/GlobalKeyboardShortcuts.js
  var allowedInputs = /* @__PURE__ */ new Set(["checkbox", "radio", "file", "submit"]);
  var handleOnDown = /* @__PURE__ */ new Set();
  var GlobalKeyboardShortcuts = Class({
    Name: "GlobalKeyboardShortcuts",
    Extends: Obj,
    /**
            Property: O.GlobalKeyboardShortcuts#isEnabled
            Type: Boolean
            Default: true
    
            Callbacks will only fire if this property is true when the instance
            handles the event.
        */
    /**
            Property (private): O.GlobalKeyboardShortcuts#_shortcuts
            Type: Object
    
            The map of shortcut key to an array of `[object, method]` tuples.
        */
    /**
        Constructor: O.GlobalKeyboardShortcuts
    */
    init: function() {
      this.isEnabled = true;
      this.inKBMode = false;
      this._shortcuts = {};
      GlobalKeyboardShortcuts.parent.constructor.apply(this, arguments);
      ViewEventsController.kbShortcuts = this;
      ViewEventsController.addEventTarget(this, -10);
    },
    /**
            Method: O.GlobalKeyboardShortcuts#destroy
    
            Destructor.
        */
    destroy() {
      if (ViewEventsController.kbShortcuts === this) {
        delete ViewEventsController.kbShortcuts;
      }
      ViewEventsController.removeEventTarget(this);
      GlobalKeyboardShortcuts.parent.destroy.call(this);
    },
    /**
            Method: O.GlobalKeyboardShortcuts#register
    
            Add a global keyboard shortcut. If a shortcut has already been
            registered for this key, it will be replaced, but will be restored when
            the new handler is removed.
    
            Parameters:
                key     - {String} The key to trigger the callback on. Modifier keys
                          (Alt, Ctrl, Meta, Shift) should be prefixed in
                          alphabetical order and with a hypen after each one.
                          Letters should be lower case. e.g. `Ctrl-f`.
    
                          The special modifier "Cmd-" may be used, which will map
                          to "Meta-" on a Mac (the command key) and "Ctrl-"
                          elsewhere.
                object  - {Object} The object to trigger the callback on.
                method  - {String} The name of the method to trigger.
                ifInput - {Number} Determines whether the shortcut is active when
                          focused inside an <input> or equivalent. Defaults to
                          active if and only if Meta or Ctrl are part of the
                          shortcut. The value must be one of:
    
                          * DEFAULT_IN_INPUT (Use the default)
                          * ACTIVE_IN_INPUT (Active when input is focused)
                          * DISABLE_IN_INPUT (Not active when input is focused)
    
            Returns:
                {O.GlobalKeyboardShortcuts} Returns self.
        */
    register(key, object, method, ifInput) {
      key = toPlatformKey(key);
      const shortcuts = this._shortcuts;
      (shortcuts[key] || (shortcuts[key] = [])).push([
        object,
        method,
        ifInput || DEFAULT_IN_INPUT
      ]);
      return this;
    },
    /**
            Method: O.GlobalKeyboardShortcuts#deregister
    
            Remove a global keyboard shortcut. Must use identical arguments to those
            which were used in the call to <O.GlobalKeyboardShortcuts#register>.
    
            Parameters:
                key    - {String} The key on which the callback was triggered.
                object - {Object} The object on which the callback was triggered.
                method - {String} The name of the method that was being triggered.
    
            Returns:
                {O.GlobalKeyboardShortcuts} Returns self.
        */
    deregister(key, object, method) {
      key = toPlatformKey(key);
      const current = this._shortcuts[key];
      const length = current ? current.length : 0;
      for (let i = length - 1; i >= 0; i -= 1) {
        const item = current[i];
        if (item[0] === object && item[1] === method) {
          if (length === 1) {
            delete this._shortcuts[key];
          } else {
            current.splice(i, 1);
            break;
          }
        }
      }
      return this;
    },
    /**
            Method: O.GlobalKeyboardShortcuts#getHandlerForKey
    
            Get the keyboard shortcut to be triggered by a key combo, represented as
            a string, as output by <O.DOMEvent#lookupKey>.
    
            Parameters:
                key - {String} The key combo to get the handler for.
    
            Returns:
                {Array|null} Returns the [ object, method ] tuple to be triggered by
                the event, or null if nothing is registered for this key press or if
                isEnabled is false.
        */
    getHandlerForKey(key) {
      const shortcuts = this._shortcuts[key];
      if (shortcuts) {
        return shortcuts[shortcuts.length - 1];
      }
      return null;
    },
    /**
            Method: O.GlobalKeyboardShortcuts#trigger
    
            Keypress event handler. Triggers any registered callback.
    
            Parameters:
                event - {DOMEvent} The keydown/keypress event.
                accept - {Function} (optional) A function that returns a Boolean to determine whether the handler should be run for the event.
        */
    trigger: function(event, accept) {
      const target = event.target;
      const nodeName = target.nodeName;
      const key = lookupKey(event);
      const allowedInInput = (isApple ? event.metaKey : event.ctrlKey) && (event.altKey || /-(?:.|Enter)$/.test(key));
      const inputIsFocused = nodeName === "TEXTAREA" || nodeName === "SELECT" || nodeName === "INPUT" && !allowedInputs.has(target.type) || event.targetView instanceof RichTextView;
      if (event.type === "keydown") {
        handleOnDown.add(key);
      } else if (handleOnDown.has(key)) {
        return;
      }
      if (!this.get("isEnabled")) {
        return;
      }
      const handler = this.getHandlerForKey(key);
      if (handler) {
        const accepted = accept ? accept(handler) : true;
        if (!accepted) {
          return;
        }
        const ifInput = handler[2];
        if (inputIsFocused && ifInput !== ACTIVE_IN_INPUT && (!allowedInInput || ifInput === DISABLE_IN_INPUT)) {
          return;
        }
        this.set("inKBMode", true);
        handler[0][handler[1]](event);
        if (!event.doDefault) {
          event.preventDefault();
        }
      }
    }.on("keydown", "keypress"),
    mousemove: function() {
      this.set("inKBMode", false);
    }.on(POINTER_MOVE),
    handleEvent(event) {
      this.fire(event.type, event);
    },
    setupMouseMove: function() {
      if (this.get("inKBMode")) {
        document.addEventListener(POINTER_MOVE, this, false);
      } else {
        document.removeEventListener(POINTER_MOVE, this, false);
      }
    }.observes("inKBMode"),
    activateKey(key) {
      const handler = this.getHandlerForKey(key);
      if (handler) {
        handler[0][handler[1]]({ type: "activateKey" });
      }
    }
  });

  // source/datastore/query/Query.js
  var AUTO_REFRESH_NEVER = 0;
  var AUTO_REFRESH_IF_OBSERVED = 1;
  var AUTO_REFRESH_ALWAYS = 2;
  var ARRAY_PROPERTY2 = "[]";
  var Query = Class({
    Name: "Query",
    Extends: Obj,
    Mixin: [Enumerable, ObservableRange],
    /**
        Property: O.Query#store
        Type: O.Store
    */
    /**
            Property: O.Query#Type
            Type: O.Class
    
            The type of records this query contains.
        */
    /**
            Property: O.Query#where
            Type: *
    
            Any filter to apply to the query. This MUST NOT change after init.
        */
    /**
            Property: O.Query#sort
            Type: *
    
            The sort order to use for this query. This MUST NOT change after init.
        */
    /**
            Property: O.Query#queryState
            Type: String
    
            A state string from the server to allow the query to fetch updates and
            to determine if its list is invalid.
        */
    /**
            Property: O.Query#status
            Type: O.Status
    
            The status of the query. Initially EMPTY, will be READY once it knows
            the number of records contained in the query and DESTROYED after you've
            finished with the query and called <O.Query#destroy>. It may also
            have OBSOLETE and LOADING bits set as appropriate.
        */
    /**
            Property: O.Query#length
            Type: (Number|null)
    
            The length of the list of records matching the query, or null if
            unknown.
        */
    autoRefresh: AUTO_REFRESH_NEVER,
    /**
            Constructor: O.Query
    
            Parameters:
                mixin - {Object} (optional) Any properties in this object will be
                        added to the new O.Query instance before
                        initialisation (so you can pass it getter/setter functions
                        or observing methods).
        */
    init: function() {
      this._storeKeys = [];
      this._awaitingIdFetch = [];
      this._refresh = false;
      this.id = guid(this);
      this.source = null;
      this.store = null;
      this.accountId = null;
      this.where = null;
      this.sort = null;
      this.queryState = "";
      this.status = EMPTY;
      this.length = null;
      this.lastAccess = Date.now();
      Query.parent.constructor.apply(this, arguments);
      this.get("store").addQuery(this);
      this.monitorForChanges();
      this.fetch();
    },
    /**
            Method: O.Query#destroy
    
            Sets the status to DESTROYED, deregisters the query with the store and
            removes bindings and path observers so the object may be garbage
            collected.
        */
    destroy() {
      this.unmonitorForChanges();
      this.set("status", this.is(EMPTY) ? NON_EXISTENT : DESTROYED);
      this.get("store").removeQuery(this);
      Query.parent.destroy.call(this);
    },
    monitorForChanges() {
      const store = this.get("store");
      const typeId = guid(this.get("Type"));
      const accountId = this.get("accountId");
      store.on(typeId + ":server:" + accountId, this, "setObsolete");
    },
    unmonitorForChanges() {
      const store = this.get("store");
      const typeId = guid(this.get("Type"));
      const accountId = this.get("accountId");
      store.off(typeId + ":server:" + accountId, this, "setObsolete");
    },
    // ---
    /**
            Method: O.Query#is
    
            Checks whether the query has a particular status. You can also supply a
            union of statuses (e.g. `query.is(O.Status.OBSOLETE|O.Status.DIRTY)`),
            in which case it will return true if the query has *any* of these status
            bits set.
    
            Parameters:
                status - {O.Status} The status to check.
    
            Returns:
                {Boolean} True if the record has the queried status.
        */
    is(status) {
      return !!(this.get("status") & status);
    },
    /**
            Method: O.Query#setObsolete
    
            Sets the OBSOLETE bit on the query's status value.
    
            Returns:
                {O.Query} Returns self.
        */
    setObsolete() {
      this.set("status", this.get("status") | OBSOLETE);
      switch (this.get("autoRefresh")) {
        case AUTO_REFRESH_IF_OBSERVED: {
          const metadata = meta(this);
          const observers = metadata.observers;
          const rangeObservers = metadata.rangeObservers;
          if (!observers.length && !observers[ARRAY_PROPERTY2] && !(rangeObservers && rangeObservers.length)) {
            break;
          }
        }
        /* falls through */
        case AUTO_REFRESH_ALWAYS:
          this.fetch();
      }
      return this;
    },
    /**
            Method: O.Query#setLoading
    
            Sets the LOADING bit on the query's status value.
    
            Returns:
                {O.Query} Returns self.
        */
    setLoading() {
      return this.set("status", this.get("status") | LOADING);
    },
    // ---
    /**
            Method: O.Query#refresh
    
            Fetch the query or refresh if needed.
    
            Parameters:
                force        - {Boolean} (optional) Unless this is true, the remote
                               query will only ask the source to fetch updates if it
                               is marked EMPTY or OBSOLETE.
                callback     - {Function} (optional) A callback to be made
                               when the fetch finishes.
    
            Returns:
                {O.Query} Returns self.
        */
    fetch(force, callback) {
      const status = this.get("status");
      if (force || status === EMPTY || status & OBSOLETE) {
        if (status !== EMPTY) {
          this._refresh = true;
        }
        this.get("source").fetchQuery(this, callback);
      } else if (callback) {
        callback();
      }
      return this;
    },
    /**
            Method: O.Query#reset
    
            Resets the list, throwing away the id list, resetting the queryState
            string and setting the status to EMPTY.
    
            Returns:
                {O.Query} Returns self.
        */
    reset() {
      const length = this.get("length");
      this._storeKeys.length = 0;
      this._refresh = false;
      return this.set("queryState", "").set("status", EMPTY).set("length", null).rangeDidChange(0, length).fire("query:reset");
    },
    // ---
    /**
            Property: O.Query#[]
            Type: Array
    
            A standard array of record objects for the records in this query.
        */
    [ARRAY_PROPERTY2]: function() {
      const store = this.get("store");
      return this._storeKeys.map(
        (storeKey) => storeKey ? store.getRecordFromStoreKey(storeKey) : null
      );
    }.property(),
    /**
            Method: O.Query#getStoreKeys
    
            Returns:
                {String[]} The store keys. You MUST NOT modify this.
        */
    getStoreKeys() {
      return this._storeKeys;
    },
    /**
            Method: O.Query#getObjectAt
    
            Returns the record at the index given in the array, if loaded. It will
            also ensure the entire window that index is contained in is loaded and
            that the ids for the windows either side are loaded. If the index is in
            triggerPoint range of the end of the window, the adjacent window will
            be fully loaded, not just its ids.
    
            Parameters:
                index      - {Number} The index to return the record at.
                doNotFetch - {Boolean} (optional) If true, the
                             <fetchDataForObjectAt> method will not be called.
    
            Returns:
                {(O.Record|null|undefined)} If the requested index is negative or
                past the end of the array, undefined will be returned. Otherwise the
                record will be returned, or null if the id is not yet loaded.
        */
    getObjectAt(index, doNotFetch) {
      const length = this.get("length");
      if (length === null || index < 0 || index >= length) {
        return void 0;
      }
      if (!doNotFetch) {
        doNotFetch = this.fetchDataForObjectAt(index);
      }
      const storeKey = this._storeKeys[index];
      return storeKey ? this.get("store").getRecordFromStoreKey(storeKey, doNotFetch) : null;
    },
    /**
            Method: O.Query#fetchDataForObjectAt
    
            This method is called by <getObjectAt> before getting the id of the
            index given from the internal list and fetching the record from the
            store. By default this method does nothing, but subclasses may wish to
            override it to (pre)fetch certain data.
    
            Parameters:
                index - {Number} The index of the record being requested.
    
            Returns:
                {Boolean} Has the data for the object been fetched? If true, the
                store will be explicitly told not to fetch the data, as the fetching
                is being handled by the query.
        */
    fetchDataForObjectAt() {
      return false;
    },
    /**
            Method: O.Query#indexOfStoreKey
    
            Finds the index of a store key in the query. Since the entire list may
            not be loaded, this data may have to be loaded from the server so you
            should rely on the callback if you need an accurate result. If the id
            is not found, the index returned will be -1.
    
            Parameters:
                storeKey - {String} The record store key to find.
                from     - {Number} The first index to start the search from.
                           Specify 0 to search the whole list.
                callback - {Function} (optional) A callback to make with the store
                           key when found.
    
            Returns:
                {Number} The index of the store key, or -1 if not found.
        */
    indexOfStoreKey(storeKey, from, callback) {
      const index = this._storeKeys.indexOf(storeKey, from);
      if (callback) {
        if (this.get("length") === null) {
          this.fetch(false, () => {
            callback(this._storeKeys.indexOf(storeKey, from));
          });
        } else {
          callback(index);
        }
      }
      return index;
    },
    /**
            Method: O.Query#getStoreKeysForObjectsInRange
    
            Makes a callback with a subset of the ids for records in this query.
    
            The start and end values will be constrained to be inside the bounds of
            the array. If length is not yet known or is 0, the callback will be made
            with an empty list and it will immediately return false. Otherwise it
            will attempt to fetch the ids and make the callback when they are
            fetched. If the callback happened before the function returns, false
            will be returned. Otherwise true will be returned. (i.e. the return
            value indicates whether we are still waiting for data).
    
            Parameters:
                start    - {Number} The index of the first record whose id is to be
                           returned.
                end      - {Number} One past the index of the last record to be
                           returned.
                callback - {Function} This will be called with the array of ids as
                           the first argument, the index of the first returned
                           result as the second argument, and one past the index
                           of the last result as the third argument.
    
            Returns:
                {Boolean} Is the data still loading? (i.e. this is true if the
                callback was not fired synchronously, but rather will be called
                asynchronously at a later point.)
        */
    getStoreKeysForObjectsInRange(start, end, callback) {
      const length = this.get("length");
      if (length === null) {
        this._awaitingIdFetch.push([start, end, callback]);
        this.fetch();
        return true;
      }
      if (start < 0) {
        start = 0;
      }
      if (end > length) {
        end = length;
      }
      callback(this._storeKeys.slice(start, end), start, end);
      return false;
    },
    /**
            Method: O.Query#getStoreKeysForAllObjects
    
            Get a callback with an array of the store keys for all records in the
            query.
    
            Parameters:
                callback - {Function} This will be called with the array of store
                           keys as the first argument, the index of the first
                           returned result as the second argument, and one past the
                           index of the last result as the third argument.
    
            Returns:
                {Boolean} Is the data still loading? (i.e. this is true if the
                callback was not fired synchronously, but rather will be called
                asynchronously at a later point.)
        */
    getStoreKeysForAllObjects(callback) {
      return this.getStoreKeysForObjectsInRange(0, 2147483647, callback);
    },
    // ---
    /**
            Method (private): O.Query#_adjustIdFetches
    
            Modifies the id range to be returned in the callback to
            <O.Query#getStoreKeysForObjectsInRange> in response to an update
            from the server.
    
            We adjust the range being fetched mainly so that new records that are
            inserted at the top of the list during a selection are not selected.
            Otherwise you may hit select all then hit delete as soon as it's
            selected, but in the meantime a new record arrives at the top of the
            list; if this were included in the selection it may be accidentally
            deleted.
    
            Parameters:
                removed - {Number[]} The list of indexes which were removed.
                added   - {Number[]} The list of indexes where new records
                           were addded.
        */
    _adjustIdFetches: function(event) {
      const added = event.addedIndexes;
      const removed = event.removedIndexes;
      const awaitingIdFetch = this._awaitingIdFetch;
      for (let i = 0, l = awaitingIdFetch.length; i < l; i += 1) {
        const call = awaitingIdFetch[i];
        let start = call[0];
        let end = call[1];
        for (let j = 0, ll = removed.length; j < ll; j += 1) {
          const index = removed[j];
          if (index < start) {
            start -= 1;
          }
          if (index < end) {
            end -= 1;
          }
        }
        for (let j = 0, ll = added.length; j < ll; j += 1) {
          const index = added[j];
          if (index <= start) {
            start += 1;
          }
          if (index < end) {
            end += 1;
          }
        }
        call[0] = start;
        call[1] = end;
      }
    }.on("query:updated"),
    /**
            Method (private): O.Query#_idsWereFetched
    
            This processes any waiting callbacks after a fetch has completed. There
            may be multiple packets arriving so this method is only invoked once per
            runloop, before bindings sync (which will be after all data packets have
            been delivered).
        */
    _idsWereFetched: function() {
      const awaitingIdFetch = this._awaitingIdFetch;
      if (awaitingIdFetch.length) {
        this._awaitingIdFetch = [];
        awaitingIdFetch.forEach((call) => {
          this.getStoreKeysForObjectsInRange(call[0], call[1], call[2]);
        });
      }
    }.queue("before").on("query:idsLoaded"),
    // ---
    /**
            Method: O.Query#sourceWillFetchQuery
    
            The source should call this method just before it fetches the query. By
            default this function just sets the loading flag on the query, but
            subclasses may like to return an object reflecting exactly the what the
            source should fetch (see <O.WindowedQuery#sourceWillFetchQuery)
            for example.
    
            Returns:
                {Boolean} Does the list need refreshing or just fetching (the two
                cases may be the same, but can be handled separately if the server
                has an efficient way of calculating changes from the queryState).
        */
    sourceWillFetchQuery() {
      const refresh = this._refresh;
      this._refresh = false;
      this.set("status", (this.get("status") | LOADING) & ~OBSOLETE);
      return refresh;
    },
    /**
            Method: O.Query#sourceDidFetchQuery
    
            The source should call this method with the data returned from fetching
            the query.
    
            Parameters:
                storeKeys  - {String[]} The store keys of the records represented by
                             this query.
                queryState - {String} (optional) A string representing the state of
                             the query on the server at the time of the fetch.
    
            Returns:
                {Query} Returns self.
        */
    sourceDidFetchQuery(storeKeys, queryState) {
      const oldStoreKeys = this._storeKeys;
      const oldTotal = this.get("length");
      const total = storeKeys.length;
      const minTotal = Math.min(total, oldTotal || 0);
      const index = {};
      const removedIndexes = [];
      const removedStoreKeys = [];
      const addedIndexes = [];
      const addedStoreKeys = [];
      let firstChange = 0;
      let lastChangeNew = total - 1;
      let lastChangeOld = (oldTotal || 0) - 1;
      if (oldTotal !== null) {
        while (firstChange < minTotal && storeKeys[firstChange] === oldStoreKeys[firstChange]) {
          firstChange += 1;
        }
        while (lastChangeNew >= 0 && lastChangeOld >= 0 && storeKeys[lastChangeNew] === oldStoreKeys[lastChangeOld]) {
          lastChangeNew -= 1;
          lastChangeOld -= 1;
        }
        for (let i = firstChange; i <= lastChangeOld; i += 1) {
          const storeKey = oldStoreKeys[i];
          index[storeKey] = i;
        }
        for (let i = firstChange; i <= lastChangeNew; i += 1) {
          const storeKey = storeKeys[i];
          if (index[storeKey] === i) {
            index[storeKey] = -1;
          } else {
            addedIndexes.push(i);
            addedStoreKeys.push(storeKey);
          }
        }
        for (let i = firstChange; i <= lastChangeOld; i += 1) {
          const storeKey = oldStoreKeys[i];
          if (index[storeKey] !== -1) {
            removedIndexes.push(i);
            removedStoreKeys.push(storeKey);
          }
        }
      }
      lastChangeNew = total === oldTotal ? lastChangeNew + 1 : Math.max(oldTotal || 0, total);
      this._storeKeys = storeKeys;
      this.beginPropertyChanges().set("queryState", queryState || "").set("status", READY | (this.is(OBSOLETE) ? OBSOLETE : 0)).set("length", total);
      if (firstChange < lastChangeNew) {
        this.rangeDidChange(firstChange, lastChangeNew);
      }
      this.endPropertyChanges();
      if (oldTotal !== null && firstChange < lastChangeNew) {
        this.fire("query:updated", {
          query: this,
          removed: removedStoreKeys,
          removedIndexes,
          added: addedStoreKeys,
          addedIndexes
        });
      }
      return this.fire("query:idsLoaded");
    }
  });

  // source/datastore/record/attr.js
  var instanceOf = function(value, Type) {
    switch (typeof value) {
      case "string":
        return Type === String;
      case "boolean":
        return Type === Boolean;
      case "number":
        return Type === Number;
    }
    return value instanceof Type;
  };
  var attributeErrorsObserver = {
    object: null,
    method: "notifyAttributeErrors"
  };
  var RecordAttribute = class {
    __setupProperty__(metadata, propKey, object) {
      const constructor = object.constructor;
      let attrs = metadata.attrs;
      if (!metadata.hasOwnProperty("attrs")) {
        attrs = metadata.attrs = attrs ? Object.create(attrs) : {};
      }
      if (this.isPrimaryKey) {
        constructor.primaryKey = propKey;
        let dependents = metadata.dependents;
        if (!metadata.hasOwnProperty("dependents")) {
          dependents = metadata.dependents = clone(dependents);
          metadata.allDependents = {};
        }
        (dependents[propKey] || (dependents[propKey] = [])).push("id");
      }
      attrs[this.key || propKey] = propKey;
      constructor.clientSettableAttributes = null;
      if (this.validate) {
        if (!metadata.hasObserver(propKey, attributeErrorsObserver)) {
          metadata.addObserver(propKey, attributeErrorsObserver);
        }
        const dependencies = this.validityDependencies;
        let dependents;
        if (dependencies) {
          let AttributeErrorsType = object.AttributeErrorsType;
          if (AttributeErrorsType.forRecordType !== constructor) {
            AttributeErrorsType = object.AttributeErrorsType = Class({
              Name: "AttributeErrorsType",
              Extends: AttributeErrorsType
            });
            AttributeErrorsType.forRecordType = constructor;
            const attrErrorsMetadata = meta(
              AttributeErrorsType.prototype
            );
            dependents = attrErrorsMetadata.dependents = clone(
              attrErrorsMetadata.dependents
            );
          } else {
            const attrErrorsMetadata = meta(
              AttributeErrorsType.prototype
            );
            dependents = attrErrorsMetadata.dependents;
          }
          for (let i = dependencies.length - 1; i >= 0; i -= 1) {
            const key = dependencies[i];
            if (!dependents[key]) {
              dependents[key] = [];
              if (!metadata.hasObserver(key, attributeErrorsObserver)) {
                metadata.addObserver(key, attributeErrorsObserver);
              }
            }
            dependents[key].push(propKey);
          }
        }
      }
    }
    __teardownProperty__(metadata, propKey, object) {
      let attrs = metadata.attrs;
      if (!metadata.hasOwnProperty("attrs")) {
        attrs = metadata.attrs = Object.create(attrs);
      }
      attrs[this.key || propKey] = null;
      object.constructor.clientSettableAttributes = null;
    }
    /**
            Constructor: O.RecordAttribute
    
            Parameters:
                mixin - {Object} (optional) Override the default properties.
        */
    constructor(mixin2) {
      Object.assign(this, mixin2);
    }
  };
  Object.assign(RecordAttribute.prototype, {
    /**
            Property (private): O.RecordAttribute#isProperty
            Type: Boolean
            Default: true
    
            Record attributes are computed properties.
        */
    isProperty: true,
    /**
            Property (private): O.RecordAttribute#isVolatile
            Type: Boolean
            Default: false
    
            Record attributes should be cached.
        */
    isVolatile: false,
    /**
            Property (private): O.RecordAttribute#isSilent
            Type: Boolean
            Default: true
    
            Store will handle firing computedPropertyIsChanged on record.
        */
    isSilent: true,
    /**
            Property: O.RecordAttribute#noSync
            Type: Boolean
            Default: false
    
            If set to true, changes will not be propagated back to the source.
        */
    noSync: false,
    /**
            Property: O.RecordAttribute#Type
            Type: Constructor
            Default: null
    
            If a type is set and it has a fromJSON method, this will be used to
            convert values from the underlying data object when the attribute is
            fetched.
        */
    Type: null,
    /**
            Property: O.RecordAttribute#isNullable
            Type: Boolean
            Default: true
    
            If false, attempts to set null for the value will throw an error.
        */
    isNullable: true,
    /**
            Property: O.RecordAttribute#key
            Type: {String|null}
            Default: null
    
            The key to use on the JSON object for this attribute. If not set, will
            use the same key as the property name on the record.
        */
    key: null,
    /**
            Property: O.RecordAttribute#isPrimaryKey
            Type: Boolean
            Default: true
    
            If true, this is the primary key for the record.
        */
    isPrimaryKey: false,
    /**
            Method: O.RecordAttribute#willSet
    
            This function is used to check the value being set is permissible. By
            default, it checks that the value is not null (or the <#isNullable>
            property is true), and that the value is of the correct type (if the
            <#Type> property is set). An error is thrown if the value is of a
            different type.
    
            You could override this function to, for example, only allow values that
            pass a strict validation to be set.
    
            Parameters:
                propValue - {*} The value being set.
                propKey   - {String} The name of the attribute.
    
            Returns:
                {Boolean} May the value be set?
        */
    willSet(propValue, propKey, record) {
      if (!record.get("isEditable")) {
        return false;
      }
      if (propValue === null) {
        if (!this.isNullable) {
          return false;
        }
      } else if (this.Type && !instanceOf(propValue, this.Type)) {
        throw new Error(
          "Incorrect value type for record attribute: \nkey: " + propKey + "\nvalue: " + propValue
        );
      }
      return true;
    },
    /**
            Property: O.RecordAttribute#toJSON
            Type: *
            Default: null|(*,String,O.Record)->*
    
            If set, this function will be used to convert the property to a
            JSON-compatible representation. The function will be called as a method
            on the RecordAttribute object, and passed the following arguments:
    
            propValue - {*} The value to convert.
            propKey   - {String} The name of the attribute.
            record    - {O.Record} The record the attribute is being set on or
                        got from.
        */
    toJSON: null,
    /**
            Property: O.RecordAttribute#defaultValue
            Type: *
            Default: undefined
    
            If the attribute is not set on the underlying data object, the
            defaultValue will be used as the attribute instead. This will also be
            used to add this attribute to the data object if a new record is
            created and the attribute is not set.
    
            The value should be the JSON encoding of the type specified in
            <O.RecordAttribute#Type>.
        */
    defaultValue: void 0,
    /**
            Method: O.RecordAttribute#validate
    
            Tests whether the value to be set is valid.
    
            Parameters:
                propValue   - {*} The value being set. This is the real value, not
                              the serialised version for JSON (if different).
                propKey     - {String} The name of the attribute on the record.
                record      - {O.Record} The record on which the value is being set.
    
            Returns:
                {O.ValidationError} An object describing the error if this is not a
                valid value for the attribute. Otherwise, returns null if the value
                is valid.
        */
    validate: null,
    /**
            Property: O.RecordAttribute#validityDependencies
            Type: String[]|null
            Default: null
    
            Other properties the validity depends on. The attribute will be
            revalidated if any of these properties change. Note, chained
            dependencies are not automatically calculated; you must explicitly state
            all dependencies.
    
            NB. This is a list of the names of the properties as used on the
            objects, not necessarily that of the underlying keys used in the JSON
            data object.
        */
    validityDependencies: null,
    /**
            Method: O.RecordAttribute#call
    
            Gets/sets the attribute.
    
            Parameters:
                record    - {O.Record} The record the attribute is being set on or
                            got from.
                propValue - {*} The value being set (undefined if just a 'get').
                propKey   - {String} The name of the attribute on the record.
    
            Returns:
                {*} The attribute.
        */
    call(record, propValue, propKey) {
      const store = record.get("store");
      let storeKey = record.get("storeKey");
      const data = storeKey ? store.getData(storeKey) : record._data;
      const attrKey = this.key || propKey;
      const Type = this.Type;
      let currentAttrValue;
      if (data) {
        currentAttrValue = data[attrKey];
        if (currentAttrValue === void 0) {
          currentAttrValue = this.defaultValue;
        }
        if (propValue !== void 0 && this.willSet(propValue, propKey, record)) {
          const attrValue = this.toJSON ? this.toJSON(propValue, propKey, record) : propValue && propValue.toJSON ? propValue.toJSON() : propValue;
          if (!isEqual(attrValue, currentAttrValue)) {
            storeKey = record.get("storeKey");
            if (storeKey) {
              const update = {};
              update[attrKey] = attrValue;
              store.updateData(storeKey, update, !record._noSync);
              store.fire("record:user:update", { record: this });
            } else {
              data[attrKey] = attrValue;
              record.computedPropertyDidChange(propKey);
            }
          }
          return propValue;
        }
      } else {
        currentAttrValue = this.defaultValue;
      }
      return currentAttrValue !== null && currentAttrValue !== void 0 && Type && Type.fromJSON ? Type.fromJSON(currentAttrValue) : currentAttrValue;
    }
  });
  var attr = function(Type, mixin2) {
    if (!mixin2) {
      mixin2 = {};
    }
    if (Type && !mixin2.Type) {
      mixin2.Type = Type;
    }
    return new RecordAttribute(mixin2);
  };

  // source/datastore/record/AttributeErrors.js
  var AttributeErrors = Class({
    Name: "AttributeErrors",
    Extends: Obj,
    /**
            Property: O.AttributeErrors#errorCount
            Type: Number
    
            The number of attributes on the record in an error state.
        */
    /**
            Constructor: O.AttributeErrors
    
            Parameters:
                record - {O.Record} The record to manage attribute errors for.
        */
    init: function(record) {
      AttributeErrors.parent.constructor.call(this);
      const attrs = meta(record).attrs;
      let errorCount = 0;
      for (const attrKey in attrs) {
        const propKey = attrs[attrKey];
        if (propKey) {
          const attribute = record[propKey];
          const error = this[propKey] = attribute.validate ? attribute.validate(record.get(propKey), propKey, record) : null;
          if (error) {
            errorCount += 1;
          }
        }
      }
      this.errorCount = errorCount;
      this._record = record;
    },
    /**
            Method: O.AttributeErrors#recordPropertyDidChange
    
            Called when a property changes which affects the validation
            of an attribute.
    
            Parameters:
                _    - {*} Unused.
                property - {String} The name of the property which has changed.
        */
    recordPropertyDidChange(_, property) {
      const metadata = meta(this);
      const changed = metadata.changed = {};
      const dependents = metadata.dependents[property];
      const l = dependents ? dependents.length : 0;
      const record = this._record;
      this.beginPropertyChanges();
      for (let i = 0; i <= l; i += 1) {
        const propKey = i === l ? property : dependents[i];
        const attribute = record[propKey];
        if (changed[propKey] || !(attribute instanceof RecordAttribute)) {
          continue;
        }
        changed[propKey] = {
          oldValue: this[propKey],
          newValue: this[propKey] = attribute.validate ? attribute.validate(record.get(propKey), propKey, record) : null
        };
      }
      this.endPropertyChanges();
    },
    /**
            Method: O.AttributeErrors#setRecordValidity
    
            Updates the internal count of how many attributes are invalid and sets
            the <O.Record#isValid> property. Called automatically whenever a
            validity error string changes.
    
            Parameters:
                _       - {*} Unused.
                changed - {Object} A map of validity string changes.
        */
    setRecordValidity: function(_, changed) {
      let errorCount = this.get("errorCount");
      for (const key in changed) {
        if (key !== "errorCount") {
          const vals = changed[key];
          const wasValid = !vals.oldValue;
          const isValid = !vals.newValue;
          if (wasValid && !isValid) {
            errorCount += 1;
          } else if (isValid && !wasValid) {
            errorCount -= 1;
          }
        }
      }
      this.set("errorCount", errorCount)._record.set("isValid", !errorCount);
    }.observes("*")
  });

  // source/datastore/record/RecordResult.js
  var HANDLE_ALL_ERRORS = [];
  var HANDLE_NO_ERRORS = [];
  var RecordResult = class {
    /**
            Property: O.RecordResult#error
            Type: {O.Event|null}
    
            Set for any commit error that occurs (whether a handled error or not).
        */
    /**
            Property: O.RecordResult#record
            Type: {O.Record}
    
            The record being observed
        */
    constructor(record, callback, mixin2) {
      this._callback = callback;
      this.record = record;
      this.error = null;
      record.on("record:commit:error", this, "onError").addObserverForKey("status", this, "statusDidChange");
      Object.assign(this, mixin2);
      this.statusDidChange(record, "status", 0, record.get("status"));
    }
    done() {
      this.record.removeObserverForKey("status", this, "statusDidChange").off("record:commit:error", this, "onError");
      this._callback(this);
    }
    statusDidChange(record, key, _, newStatus) {
      if (!(newStatus & (EMPTY | NEW | DIRTY | COMMITTING))) {
        this.done();
      }
    }
    onError(event) {
      this.error = event;
      if (this.shouldStopErrorPropagation(event)) {
        event.stopPropagation();
      }
      this.done();
    }
    /**
            Method: O.RecordResult#shouldStopErrorPropagation
    
            When an error occurs, should its propagation be stopped? If propagation
            is stopped, the changes will not be reverted in the store, and the
            crafter of the RecordResult is responsible for resolving the state in
            the store.
    
            Instances should normally be able to set `handledErrorTypes`, but if
            more complex requirements come up this method can also be overridden.
    
            Parameters:
                event - {O.Event} The commit error object.
    
            Returns:
                {Boolean} Stop propagation of the event?
        */
    shouldStopErrorPropagation(event) {
      const handledErrorTypes = this.handledErrorTypes;
      return handledErrorTypes !== HANDLE_NO_ERRORS && (handledErrorTypes === HANDLE_ALL_ERRORS || handledErrorTypes.indexOf(event.type) !== -1);
    }
  };
  RecordResult.prototype.handledErrorTypes = HANDLE_NO_ERRORS;

  // source/datastore/record/toOne.js
  var ToOneAttribute = class extends RecordAttribute {
    willSet(propValue, propKey, record) {
      if (super.willSet(propValue, propKey, record)) {
        if (record.get("storeKey") && propValue && !propValue.get("storeKey")) {
          throw new Error(
            "O.ToOneAttribute: Cannot set connection to record not saved to store."
          );
        }
        return true;
      }
      return false;
    }
    call(record, propValue, propKey) {
      let result = super.call(record, propValue, propKey);
      if (result && typeof result === "string") {
        result = record.get("store").getRecordFromStoreKey(result);
      }
      return result || null;
    }
  };
  ToOneAttribute.prototype.isVolatile = true;
  var toOne = function(mixin2) {
    return new ToOneAttribute(mixin2);
  };

  // source/datastore/record/Record.js
  var READY_NEW_DIRTY = READY | NEW | DIRTY;
  var Record = Class({
    Name: "Record",
    Extends: Obj,
    /**
            Constructor: O.Record
    
            Parameters:
                store    - {Store} The store to link to this record.
                storeKey - {String} (optional) The unique id for this record in the
                           store. If ommitted, a new record will be created, which
                           can then be committed to the store using the
                           <O.Record#saveToStore> method.
        */
    init: function(store, storeKey) {
      this._noSync = false;
      this._data = storeKey ? null : store ? {
        accountId: store.getPrimaryAccountIdForType(
          this.constructor
        )
      } : {};
      this.store = store;
      this.storeKey = storeKey;
      Record.parent.constructor.call(this);
    },
    nextEventTarget: function() {
      return this.get("store");
    }.property().nocache(),
    /**
            Method: O.Record#clone
    
            Creates a new instance of the record with the same attributes. Does
            not call <O.Record#saveToStore>.
    
            Parameters:
                store - {O.Store} The store to create the record in.
    
            Returns:
                {O.Record} The new record.
        */
    clone(store) {
      const Type = this.constructor;
      const prototype = Type.prototype;
      const recordClone = new Type(store);
      const attrs = meta(this).attrs;
      recordClone.set("accountId", this.get("accountId"));
      for (const attrKey in attrs) {
        const propKey = attrs[attrKey];
        if (prototype[propKey].noSync) {
          continue;
        }
        let value = this.get(propKey);
        if (value instanceof Record) {
          value = value.getDoppelganger(store);
        }
        if (value !== void 0) {
          recordClone.set(propKey, value);
        }
      }
      return recordClone;
    },
    /**
            Property: O.Record#store
            Type: O.Store
    
            The store this record is associated with.
        */
    /**
            Property: O.Record#storeKey
            Type: (String|undefined)
    
            The record store key; will be unique amonsgst all loaded records, even
            across those of different types.
        */
    // ---
    /**
            Property: O.Record#status
            Type: O.Status
    
            The status of this Record. A Record goes through three primary phases:
            EMPTY -> READY -> DESTROYED. Alternatively it may go EMPTY ->
            NON_EXISTENT. Whilst in these phases it may acquire other properties:
            LOADING, NEW, DIRTY, OBSOLETE. Each of the primary phases as well as the
            secondary properties are different bits in the status bitarray. You
            should check the condition by using bitwise operators with the constants
            defined in <O.Status>.
        */
    status: function() {
      const storeKey = this.get("storeKey");
      return storeKey ? this.get("store").getStatus(storeKey) : READY_NEW_DIRTY;
    }.property().nocache(),
    /**
            Method: O.Record#is
    
            Checks whether record has a particular status. You can also supply a
            union of statuses (e.g. `record.is(O.Status.OBSOLETE|O.Status.DIRTY)`),
            in which case it will return true if the record has *any* of these
            status bits set.
    
            Parameters:
                state - {O.Status} The status to check.
    
            Returns:
                {Boolean} True if the record has the queried status.
        */
    is(state) {
      return !!(this.get("status") & state);
    },
    /**
            Method: O.Record#setObsolete
    
            Adds <O.Status.OBSOLETE> to the current status value.
    
            Returns:
                {O.Record} Returns self.
        */
    setObsolete() {
      const storeKey = this.get("storeKey");
      const status = this.get("status");
      if (storeKey) {
        this.get("store").setStatus(storeKey, status | OBSOLETE);
      }
      return this;
    },
    /**
            Method: O.Record#setLoading
    
            Adds <O.Status.LOADING> to the current status value.
    
            Returns:
                {O.Record} Returns self.
        */
    setLoading() {
      const storeKey = this.get("storeKey");
      const status = this.get("status");
      if (storeKey) {
        this.get("store").setStatus(storeKey, status | LOADING);
      }
      return this;
    },
    // ---
    /**
            Property: O.Record#id
            Type: String
    
            The record id. It's fine to override this with an attribute, provided it
            is the primary key. If the primary key for the record is not called
            'id', you must not override this property.
        */
    id: function(id) {
      const storeKey = this.get("storeKey");
      const primaryKey = this.constructor.primaryKey || "id";
      if (id !== void 0) {
        if (storeKey) {
          didError({
            name: "O.Record#id",
            message: "Cannot change immutable property"
          });
        } else if (primaryKey === "id") {
          this._data.id = id;
        } else {
          this.set(primaryKey, id);
        }
      }
      return storeKey ? this.get("store").getIdFromStoreKey(storeKey) : this._data[primaryKey];
    }.property("accountId"),
    toJSON() {
      return this.get("storeKey") || this;
    },
    toIdOrStoreKey() {
      return this.get("id") || "#" + this.get("storeKey");
    },
    accountId: function(toAccountId) {
      const storeKey = this.get("storeKey");
      const store = this.get("store");
      let accountId = storeKey ? store.getAccountIdFromStoreKey(storeKey) : this._data.accountId;
      if (toAccountId !== void 0 && toAccountId !== accountId) {
        if (this.get("status") === READY_NEW_DIRTY) {
          if (storeKey) {
            store.updateData(
              storeKey,
              {
                accountId: toAccountId
              },
              true
            );
          } else {
            this._data.accountId = toAccountId;
          }
        } else {
          store.moveRecord(storeKey, toAccountId);
        }
        accountId = toAccountId;
        store.fire("record:user:update", { record: this });
      }
      return accountId;
    }.property(),
    /**
            Method: O.Record#saveToStore
    
            Saves the record to the store. Will then be committed back by the store
            according to the store's policy. Note, only a record not currently
            created in its store can do this; an error will be thrown if this method
            is called for a record already created in the store.
    
            Returns:
                {O.Record} Returns self.
        */
    saveToStore() {
      if (this.get("storeKey")) {
        throw new Error("Record already created in store.");
      }
      const Type = this.constructor;
      const data = this._data;
      const store = this.get("store");
      const accountId = this.get("accountId");
      const idPropKey = Type.primaryKey || "id";
      const idAttrKey = this[idPropKey].key || idPropKey;
      const storeKey = store.getStoreKey(accountId, Type, data[idAttrKey]);
      const attrs = meta(this).attrs;
      this._data = null;
      for (const attrKey in attrs) {
        const propKey = attrs[attrKey];
        if (propKey) {
          const attribute = this[propKey];
          if (!(attrKey in data)) {
            const defaultValue2 = attribute.defaultValue;
            if (defaultValue2 !== void 0) {
              data[attrKey] = clone(defaultValue2);
            }
          } else if (attribute instanceof ToOneAttribute && data[attrKey] instanceof Record) {
            data[attrKey] = data[attrKey].toJSON();
          }
        }
      }
      store.createRecord(storeKey, data).setRecordForStoreKey(storeKey, this);
      this.set("storeKey", storeKey);
      store.fire("record:user:create", { record: this });
      return this;
    },
    /**
            Method: O.Record#discardChanges
    
            Reverts the attributes in the record to the last committed state. If
            the record has never been committed, this will destroy the record.
    
            Returns:
                {O.Record} Returns self.
        */
    discardChanges() {
      if (this.get("status") === READY_NEW_DIRTY) {
        this.destroy();
      } else {
        const storeKey = this.get("storeKey");
        if (storeKey) {
          this.get("store").revertData(storeKey);
        }
      }
      return this;
    },
    /**
            Method: O.Record#fetch
    
            Fetch/refetch the data from the source. Will have no effect if the
            record is new or already loading.
    
            Returns:
                {O.Record} Returns self.
        */
    fetch() {
      const storeKey = this.get("storeKey");
      if (storeKey) {
        this.get("store").fetchData(storeKey);
      }
      return this;
    },
    /**
            Method: O.Record#destroy
    
            Destroy the record. This will inform the store, which will commit it to
            the source.
        */
    destroy() {
      const storeKey = this.get("storeKey");
      if (storeKey && this.get("isEditable")) {
        this.get("store").destroyRecord(storeKey).fire("record:user:destroy", { record: this });
      } else if (!storeKey) {
        this.storeWillUnload();
      }
    },
    /**
            Method: O.Record#getDoppelganger
    
            Parameters:
                store - {O.Store} A store to get this event in.
    
            Returns:
                {O.Record} Returns the record instance for the same record in the
                given store.
        */
    getDoppelganger(store) {
      if (this.get("store") === store) {
        return this;
      }
      return store.materialiseRecord(this.get("storeKey"));
    },
    /**
            Method: O.Record#getData
    
            Returns:
                {Object} The raw data hash in the store for this object.
        */
    getData() {
      return this._data || this.get("store").getData(this.get("storeKey"));
    },
    /**
            Method: O.Record#storeWillUnload
    
            This should only be called by the store, when it unloads the record's
            data to free up memory.
        */
    storeWillUnload() {
      Record.parent.destroy.call(this);
    },
    /**
            Property (private): O.Record#_noSync
            Type: Boolean
    
            If true, any changes to the record will not be committed to the source.
        */
    /**
            Method: O.Record#stopSync
    
            Any changes after this has been invoked will not by synced to the
            source.
    
            Returns:
                {O.Record} Returns self.
        */
    stopSync() {
      this._noSync = true;
      return this;
    },
    /**
            Method: O.Record#startSync
    
            If syncing has been stopped by a call to <O.Record#stopSync>, this
            will then enable it again for any *future* changes.
    
            Returns:
                {O.Record} Returns self.
        */
    startSync() {
      this._noSync = false;
      return this;
    },
    /**
            Property: O.Record#isEditable
            Type: Boolean
            Default: True
    
            May the record be edited/deleted?
        */
    isEditable: true,
    // ---
    AttributeErrorsType: AttributeErrors,
    /**
            Property: O.Record#isValid
            Type: Boolean
    
            Are all the attributes are in a valid state?
        */
    isValid: function(value) {
      return value !== void 0 ? value : !this.get("errorForAttribute").get("errorCount");
    }.property(),
    /**
            Method: O.Record#errorToSet
    
            Checks whether it will be an error to set the attribute with the given
            key to the given value. If it will be an error, the string describing
            the error is returned, otherwise an empty string is returned.
    
            Parameters:
                key   - {String} The name of the attribute.
                value - {*} The proposed value to set it to.
    
            Returns:
                {O.ValidationError|null} The error, or null if the assignment would
                be valid.
        */
    errorToSet(key, value) {
      const attr2 = this[key];
      return attr2.validate ? attr2.validate(value, key, this) : null;
    },
    /**
            Property: O.Record#errorForAttribute
            Type: O.Object
    
            Calling get() with the key for an attribute on this record will return
            an error string if the currently set value is invalid, or an empty
            string if the attribute is currently valid. You can bind to the
            properties on this object.
        */
    errorForAttribute: function() {
      const AttributeErrorsType = this.get("AttributeErrorsType");
      return new AttributeErrorsType(this);
    }.property(),
    /**
        Method: O.Record#notifyAttributeErrors
    */
    notifyAttributeErrors(_, propKey) {
      const attributeErrors = meta(this).cache.errorForAttribute;
      if (attributeErrors) {
        attributeErrors.recordPropertyDidChange(this, propKey);
      }
    },
    // ---
    /**
            Method: O.Record#getResult
            Returns: {Promise<O.RecordResult>}
    
            The promise it returns will resolve to a RecordResult which has two
            notable properties, `record` and `error`.
    
            Normally, <O.Record#ifSuccess> will be easier to use, but if you’re
            working with batch processing of objects and Promise.all(), then you’ll
            want to use getResult rather than ifSuccess, because Promise.all() will
            reject with the first error it receives, whereas in such a situation
            you’ll want instead to produce an array of errors.
    
            Usage:
    
                record
                    .set( … )  // Or anything that makes it commit changes.
                    .getResult({
                        handledErrorTypes: [ 'somethingWrong' ],
                    })
                    .then( result => {
                        if ( result.error ) {
                            // Do something with the somethingWrong error
                        }
                    });
        */
    getResult(mixin2) {
      return new Promise((resolve) => new RecordResult(this, resolve, mixin2));
    },
    /**
            Method: O.Record#ifSuccess
            Returns: {Promise<O.Record, O.RecordResult>}
    
            The promise it returns will either resolve to the record, or be rejected
            with a RecordResult, which is an object containing two properties to
            care about, `record` and `error`.
    
            (Why the name ifSuccess? Read it as “set this field; if success, then do
            such-and-such, otherwise catch so-and-so.)
    
            Usage for catching failed commits:
    
                record
                    .set( … )  // Or anything that makes it commit changes.
                    .ifSuccess({
                        handledErrorTypes: [ 'somethingWrong' ],
                    })
                    .then( record => {
                        // Do something after the commit has finished
                    })
                    .catch( ({ record, error }) => {
                        // Do something with the somethingWrong error
                    });
    
            Or for loading a record that may or may not exist:
    
                store
                    .getRecord( null, Foo, 'id' )
                    .ifSuccess()
                        .then( record => {
                            // record loaded
                        })
                        .catch( ({ record }) => {
                            // record didn't load
                        })
    
        */
    ifSuccess(mixin2) {
      return promisifyResult(this, mixin2);
    },
    /**
            Method: O.Record#ifLoaded
            Returns: {Promise<O.Record|O.RecordResult>}
    
            The promise returned will either resolve to the record when it has
            finished loading, or be rejected with a RecordResult, which is an object 
            containing two properties to care about, `record` and `error`.
    
            This is useful when calling <O.Record#fetch> on an <O.Record> that has
            already been marked `READY` and are expecting changes as a result of the
            fetch request.
         */
    ifLoaded(mixin2) {
      return promisifyResult(this, __spreadValues({
        statusDidChange(_, __, ___, newStatus) {
          if (!(newStatus & LOADING)) {
            this.done();
          }
        }
      }, mixin2));
    }
  });
  function promisifyResult(record, mixin2) {
    return new Promise(
      (resolve, reject) => new RecordResult(
        record,
        (result) => {
          const _record = result.record;
          if (result.error || _record.is(NON_EXISTENT)) {
            reject(result);
          } else {
            resolve(_record);
          }
        },
        mixin2
      )
    );
  }
  Record.getClientSettableAttributes = function(Type) {
    let clientSettableAttributes = Type.clientSettableAttributes;
    if (!clientSettableAttributes) {
      const prototype = Type.prototype;
      const attrs = meta(prototype).attrs;
      clientSettableAttributes = {};
      for (const attrKey in attrs) {
        const propKey = attrs[attrKey];
        if (propKey) {
          const attribute = prototype[propKey];
          if (!attribute.noSync) {
            clientSettableAttributes[attrKey] = true;
          }
        }
      }
      Type.clientSettableAttributes = clientSettableAttributes;
    }
    return clientSettableAttributes;
  };

  // source/datastore/record/toMany.js
  Record.prototype.notifyRecordArray = function(_, propKey) {
    const recordArray = this["_" + propKey + "RecordArray"];
    const isInCache = propKey in meta(this).cache;
    if (recordArray && !isInCache) {
      recordArray.updateFromRecord();
    }
  };
  var mapToTrue = function(result, key) {
    result[key] = true;
    return result;
  };
  var ARRAY_PROPERTY3 = "[]";
  var ToManyRecordArray = Class({
    Name: "ToManyRecordArray",
    Extends: ObservableArray,
    init: function(record, propKey, Type) {
      this.record = record;
      this.propKey = propKey;
      this.Type = Type;
      this.store = record.get("store");
      this._updatingStore = false;
      ToManyRecordArray.parent.constructor.call(this);
    },
    toJSON() {
      return this._array.slice();
    },
    updateFromRecord() {
      if (!this._updatingStore) {
        const record = this.get("record");
        const propKey = this.get("propKey");
        let list = record[propKey].getRaw(record, propKey);
        if (!list) {
          list = [];
        } else if (record[propKey].Type === Object) {
          list = Object.keys(list);
          list.sort();
        } else {
          list = list.slice();
        }
        ToManyRecordArray.parent[ARRAY_PROPERTY3].call(this, list);
      }
    },
    updateRecord() {
      const record = this.get("record");
      const propKey = this.get("propKey");
      const attr2 = record[propKey];
      let value = this._array;
      this._updatingStore = true;
      if (!value.length && attr2.isNullable) {
        value = null;
      } else if (attr2.Type === Object) {
        value = value.reduce(mapToTrue, {});
      } else {
        value = value.slice();
      }
      record[propKey].setRaw(record, propKey, value);
      this._updatingStore = false;
    },
    [ARRAY_PROPERTY3]: function(array) {
      if (array) {
        ToManyRecordArray.parent[ARRAY_PROPERTY3].call(
          this,
          array.map((x) => x.get("storeKey"))
        );
        this.updateRecord();
      } else {
        array = this.map((x) => x);
      }
      return array;
    }.property(),
    getObjectAt(index) {
      const storeKey = ToManyRecordArray.parent.getObjectAt.call(this, index);
      return storeKey ? this.get("store").getRecordFromStoreKey(storeKey) : null;
    },
    setObjectAt(index, value) {
      this.replaceObjectsAt(index, 1, [value]);
      return this;
    },
    replaceObjectsAt(index, numberRemoved, newItems) {
      newItems = newItems ? Array.from(newItems) : [];
      const store = this.get("store");
      const oldItems = ToManyRecordArray.parent.replaceObjectsAt.call(
        this,
        index,
        numberRemoved,
        newItems.map((x) => x.get("storeKey"))
      ).map((storeKey) => store.getRecordFromStoreKey(storeKey));
      this.updateRecord();
      return oldItems;
    },
    add(record) {
      const index = this._array.indexOf(record.get("storeKey"));
      if (index === -1) {
        this.replaceObjectsAt(this.get("length"), 0, [record]);
      }
      return this;
    },
    remove(record) {
      const index = this._array.indexOf(record.get("storeKey"));
      if (index > -1) {
        this.replaceObjectsAt(index, 1);
      }
      return this;
    }
  });
  var notifyRecordArrayObserver = {
    object: null,
    method: "notifyRecordArray"
  };
  var ToManyAttribute = class extends RecordAttribute {
    __setupProperty__(metadata, propKey, object) {
      super.__setupProperty__(metadata, propKey, object);
      metadata.addObserver(propKey, notifyRecordArrayObserver);
    }
    __teardownProperty__(metadata, propKey, object) {
      super.__teardownProperty__(metadata, propKey, object);
      metadata.removeObserver(propKey, notifyRecordArrayObserver);
    }
    call(record, propValue, propKey) {
      const arrayKey = "_" + propKey + "RecordArray";
      let recordArray = record[arrayKey];
      if (!recordArray) {
        recordArray = record[arrayKey] = new ToManyRecordArray(
          record,
          propKey,
          this.recordType
        );
      }
      recordArray.updateFromRecord();
      if (propValue !== void 0) {
        recordArray.replaceObjectsAt(
          0,
          recordArray.get("length"),
          propValue.map((x) => x)
        );
      }
      return recordArray;
    }
    getRaw(record, propKey) {
      return super.call(record, void 0, propKey);
    }
    setRaw(record, propKey, data) {
      return super.call(record, data, propKey);
    }
  };
  ToManyAttribute.prototype.Type = Array;
  ToManyAttribute.prototype.recordType = null;
  var toMany = function(mixin2) {
    return new ToManyAttribute(mixin2);
  };

  // source/dom/Stylesheet.js
  var Stylesheet_exports = {};
  __export(Stylesheet_exports, {
    create: () => create2
  });
  var create2 = function(id, css) {
    const style = create("style", {
      type: "text/css",
      id,
      text: css
    });
    document.head.appendChild(style);
    return style;
  };

  // source/io/IOQueue.js
  var QUEUE = 1;
  var IGNORE = 2;
  var ABORT = 3;
  var IOQueue = Class({
    Name: "IOQueue",
    Extends: Obj,
    /**
            Property (private): O.IOQueue#_queue
            Type: Array
    
            Queue of request objects waiting for current transactions to finish.
        */
    /**
            Property: O.IOQueue#_recent
            Type: (O.HttpRequest|null)
    
            A reference to the most recent request.
        */
    /**
            Property: O.IOQueue#activeConnections
            Type: Number
    
            The number of active connections
        */
    /**
            Property: O.IOQueue#link
            Type: Number
            Default: O.IOQueue.QUEUE
    
            The property is used to determine what to do if a request is made and
            there are already the maximum allowed number of connections. Accepted
            values are the constants IOQueue.QUEUE, IOQueue.IGNORE and
            IOQueue.ABORT.
    
            * QUEUE: adds the request to a queue and then waits for the next active
              connection to finish before dispatching the oldest waiting request
              and so on until the queue is empty.
            * IGNORE: ignores the request if there are no free connections.
            * ABORT: aborts the most recent active request and immediately
              dispatches the new request.
        */
    link: QUEUE,
    /**
            Property: O.IOQueue#maxConnections
            Type: Number
            Default: 1
    
            The maximum number of concurrent connections to make with this IOQueue
            object. Note, this is a per-instance value; each IOQueue instance may
            make up to maxConnections to the server as defined on that object.
        */
    maxConnections: 1,
    /**
            Constructor: O.IOQueue
    
            Parameters:
                ...mixins - {Object} An object containing new defaults for any of
                            the public properties defined on the object. Can also
                            contain methods to override the normal methods to create
                            an anonymous subclass.
        */
    init: function() {
      this._queue = [];
      this._recent = null;
      this.activeConnections = 0;
      IOQueue.parent.constructor.apply(this, arguments);
    },
    /**
            Method: O.IOQueue#send
    
            If the number of active requests is equal to the maximum allowed number
            of concurrent connections, the request will be queued, ignored or cause
            the most recent active request to abort as specified in the
            <O.IOQueue#link> property.
    
            Parameters:
                request - {O.HttpRequest}
    
            Returns:
                {O.IOQueue} Returns self.
        */
    send(request) {
      if (this.get("activeConnections") >= this.get("maxConnections")) {
        switch (this.get("link")) {
          case QUEUE:
            this._queue.push(request);
          /* falls through */
          case IGNORE:
            return this;
          case ABORT:
            this._recent.abort();
            break;
          default:
            throw new Error("Invalid O.IOQueue link type.");
        }
      }
      this.increment("activeConnections", 1);
      if (!request.get("nextEventTarget")) {
        request.set("nextEventTarget", this);
      }
      this._recent = request.send();
      return this;
    },
    /**
            Method: O.IOQueue#abort
    
            Abort the request if it is currently running, or remove it from the
            waiting queue if it has not yet run.
    
            Parameters:
                request - {O.HttpRequest}
    
            Returns:
                {O.IOQueue} Returns self.
        */
    abort(request) {
      this._queue.erase(request);
      request.abort();
      return this;
    },
    /**
            Method (private): O.IOQueue#_complete
    
            Cleans up any state set by the IOQueue methods on the Transport object
            and starts the next request in the queue, if any.
    
            Parameters:
                transport - {Transport} The transport object.
        */
    _complete: function(event) {
      const request = event.target;
      if (this._recent === request) {
        this._recent = null;
      }
      if (request.get("nextEventTarget") === this) {
        request.set("nextEventTarget", null);
      }
      this.increment("activeConnections", -1);
      if (this._queue.length) {
        this.send(this._queue.shift());
      }
    }.on("io:end")
  });

  // source/parse/DateParser.js
  var DateParser_exports = {};
  __export(DateParser_exports, {
    DATE_AND_TIME: () => DATE_AND_TIME,
    FUTURE: () => FUTURE,
    JUST_DATE: () => JUST_DATE,
    JUST_TIME: () => JUST_TIME,
    NOW: () => NOW,
    PAST: () => PAST,
    PREFER_LAST_DAY_OF_MONTH: () => PREFER_LAST_DAY_OF_MONTH,
    date: () => date,
    dateTime: () => dateTime,
    interpretDateTime: () => interpretDateTime,
    time: () => time,
    tokeniseDateTime: () => parseDateTime
  });

  // source/parse/Parse.js
  var Parse_exports = {};
  __export(Parse_exports, {
    ParseResult: () => ParseResult,
    define: () => define,
    firstMatch: () => firstMatch,
    longestMatch: () => longestMatch,
    not: () => not,
    optional: () => optional,
    repeat: () => repeat,
    sequence: () => sequence
  });
  var define = function(name, regexp, context) {
    return function(parse) {
      const string = parse.string;
      const result = regexp.exec(string);
      if (result) {
        const part = result[0];
        parse.tokens.push([name, part, context || null]);
        parse.string = string.slice(part.length);
      }
      return !!result;
    };
  };
  var optional = function(pattern) {
    return function(parse) {
      pattern(parse);
      return true;
    };
  };
  var not = function(pattern) {
    return function(parse) {
      const newParse = parse.clone();
      return !pattern(newParse);
    };
  };
  var repeat = function(pattern, min, max) {
    if (!max) {
      max = 2147483647;
    }
    return function(parse) {
      const newParse = parse.clone();
      let i = 0;
      do {
        if (pattern(newParse)) {
          i += 1;
        } else {
          break;
        }
      } while (i < max);
      if (i >= min) {
        if (i) {
          parse.assimilate(newParse);
        }
        return true;
      }
      return false;
    };
  };
  var sequence = function(patterns) {
    return function(parse) {
      const newParse = parse.clone();
      for (let i = 0, l = patterns.length; i < l; i += 1) {
        if (!patterns[i](newParse)) {
          return false;
        }
      }
      parse.assimilate(newParse);
      return true;
    };
  };
  var firstMatch = function(patterns) {
    return function(parse) {
      for (let i = 0, l = patterns.length; i < l; i += 1) {
        if (patterns[i](parse)) {
          return true;
        }
      }
      return false;
    };
  };
  var longestMatch = function(patterns) {
    return function(parse) {
      const parses = [];
      const length = patterns.length;
      for (let i = 0; i < length; i += 1) {
        const newParse = parse.clone();
        if (patterns[i](newParse)) {
          parses.push(newParse);
          if (!newParse.string) {
            break;
          }
        }
      }
      const parsesLength = parses.length;
      if (parsesLength) {
        let newParse = parses[parsesLength - 1];
        for (let j = parsesLength - 2; j >= 0; j -= 1) {
          if (parses[j].string.length <= newParse.string.length) {
            newParse = parses[j];
          }
        }
        parse.assimilate(newParse);
        return true;
      }
      return false;
    };
  };
  var ParseResult = class _ParseResult {
    constructor(string, tokens) {
      this.string = string;
      this.tokens = tokens || [];
    }
    clone() {
      return new _ParseResult(this.string, this.tokens.slice());
    }
    assimilate(parse) {
      this.string = parse.string;
      this.tokens = parse.tokens;
    }
  };

  // source/parse/DateParser.js
  var JUST_TIME = 1;
  var JUST_DATE = 2;
  var DATE_AND_TIME = 3;
  var generateLocalisedDateParser = function(locale, mode) {
    const datePatterns = locale.datePatterns;
    const anyInLocale = function(type, names) {
      return firstMatch(
        names.split(" ").map((name) => define(type, datePatterns[name], name))
      );
    };
    const whitespace = define("whitespace", /^(?:[\s"'()]+|$)/);
    const hours = define("hour", /^(?:2[0-3]|[01]?\d)/);
    const shorthours = define("hour", /^[12]/);
    const minutes = define("minute", /^[0-5][0-9]/);
    const seconds = define("second", /^[0-5][0-9]/);
    const meridian = firstMatch([
      define("am", datePatterns.am),
      define("pm", datePatterns.pm)
    ]);
    const timeSuffix = sequence([optional(whitespace), meridian]);
    const timeDelimiter = define("timeDelimiter", /^[:.]/);
    const timeContext = define("timeContext", datePatterns.timeContext);
    const time2 = firstMatch([
      sequence([
        hours,
        optional(
          sequence([
            timeDelimiter,
            minutes,
            optional(sequence([timeDelimiter, seconds]))
          ])
        ),
        optional(timeSuffix),
        whitespace
      ]),
      sequence([
        firstMatch([
          sequence([hours, minutes]),
          sequence([shorthours, minutes])
        ]),
        optional(timeSuffix),
        whitespace
      ])
    ]);
    if (mode === JUST_TIME) {
      return firstMatch([time2, whitespace]);
    }
    const ordinalSuffix = define("ordinalSuffix", datePatterns.ordinalSuffix);
    const weekday = anyInLocale("weekday", "sun mon tue wed thu fri sat");
    const day = sequence([
      define("day", /^(?:[0-2]\d|3[0-1]|\d)/),
      optional(ordinalSuffix),
      not(timeContext)
    ]);
    const monthnumber = sequence([
      define("month", /^(?:1[0-2]|0\d|\d)/),
      not(firstMatch([timeContext, ordinalSuffix]))
    ]);
    const monthname = anyInLocale(
      "monthname",
      "jan feb mar apr may jun jul aug sep oct nov dec"
    );
    const month = firstMatch([monthnumber, monthname]);
    const fullyear = define("year", /^\d{4}/);
    const year = sequence([
      define("year", /^\d\d(?:\d\d)?/),
      not(firstMatch([timeContext, ordinalSuffix]))
    ]);
    const searchMethod = anyInLocale("searchMethod", "past future");
    const format = localise("%A, %B %d, %Y %X");
    const delimiters = /* @__PURE__ */ new Set(["-", ".", ",", "'", "/"]);
    for (let i = 0, l = format.length; i < l; i += 1) {
      const char = format.charAt(i);
      if (char === "%") {
        i += 1;
        if (format.charAt(i) === "-") {
          i += 1;
        }
        continue;
      }
      delimiters.add(char);
    }
    const dateDelimiter = define(
      "dateDelimiter",
      new RegExp(
        "^(?:[\\s" + escapeRegExp([...delimiters].join("")) + "]|of)+"
      )
    );
    const relativeDate = anyInLocale(
      "relativeDate",
      "yesterday tomorrow today now"
    );
    const adjustSign = define("adjustSign", /^[+-]/);
    const adjustUnit = define(
      "adjustUnit",
      /^(?:day|week|month|year)|[dwmy](?!\w)/i
    );
    const adjustNumber = define("adjustNumber", /^\d+/);
    const adjust = sequence([
      optional(adjustSign),
      adjustNumber,
      optional(whitespace),
      adjustUnit
    ]);
    const standardDate = sequence(
      locale.dateFormats.date.split(/%-?([dmbY])/).map((part, i) => {
        if (i & 1) {
          switch (part) {
            case "d":
              return day;
            case "m":
              return monthnumber;
            case "b":
              return monthname;
            case "Y":
              return year;
          }
        } else if (part) {
          return define(
            "dateDelimiter",
            new RegExp("^" + escapeRegExp(part))
          );
        }
        return null;
      }).filter((x) => x)
    );
    const dayMonthYear = sequence([
      day,
      dateDelimiter,
      month,
      dateDelimiter,
      year
    ]);
    const dayMonth = sequence([day, dateDelimiter, month]);
    const monthYear = sequence([month, dateDelimiter, year, not(timeContext)]);
    const monthDayYear = sequence([
      month,
      dateDelimiter,
      day,
      dateDelimiter,
      year
    ]);
    const monthDay = sequence([month, dateDelimiter, day]);
    const yearMonthDay = sequence([
      year,
      dateDelimiter,
      month,
      dateDelimiter,
      day
    ]);
    const yearMonth = sequence([year, dateDelimiter, month]);
    const date2 = sequence([
      firstMatch([
        standardDate,
        longestMatch(
          locale.dateElementOrder === "dmy" ? [
            dayMonthYear,
            dayMonth,
            monthYear,
            monthDayYear,
            monthDay,
            yearMonthDay,
            yearMonth
          ] : locale.dateElementOrder === "mdy" ? [
            monthDayYear,
            monthDay,
            monthYear,
            dayMonthYear,
            dayMonth,
            yearMonthDay,
            yearMonth
          ] : [
            yearMonthDay,
            yearMonth,
            dayMonthYear,
            dayMonth,
            monthYear,
            monthDayYear,
            monthDay
          ]
        )
      ]),
      not(define("", /^\d/))
    ]);
    if (mode === JUST_DATE) {
      return firstMatch([
        date2,
        weekday,
        fullyear,
        monthname,
        relativeDate,
        adjust,
        day,
        searchMethod,
        whitespace
      ]);
    }
    return firstMatch([
      date2,
      weekday,
      fullyear,
      monthname,
      relativeDate,
      adjust,
      day,
      time2,
      searchMethod,
      whitespace
    ]);
  };
  var monthNameToIndex = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11
  };
  var dayNameToIndex = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6
  };
  var letterToUnit = {
    d: "day",
    w: "week",
    m: "month",
    y: "year"
  };
  var isLeapYear = Date.isLeapYear;
  var getDaysInMonth = Date.getDaysInMonth;
  var NOW = 0;
  var PAST = 1;
  var FUTURE = 2;
  var PREFER_LAST_DAY_OF_MONTH = 4;
  var interpreter = {
    interpret(tokens, expectedTense) {
      const date2 = {};
      const l = tokens.length;
      for (let i = 0; i < l; i += 1) {
        const token = tokens[i];
        const name = token[0];
        if (this[name]) {
          this[name](date2, token[1], token[2], tokens);
        }
      }
      return this.findDate(date2, date2.searchMethod || expectedTense);
    },
    findDate(constraints, searchMethod) {
      const keys2 = Object.keys(constraints);
      if (!keys2.length) {
        return null;
      }
      const date2 = /* @__PURE__ */ new Date();
      const currentDay = date2.getDate();
      date2.setDate(1);
      date2.setHours(constraints.hour || 0);
      date2.setMinutes(constraints.minute || 0);
      date2.setSeconds(constraints.second || 0);
      date2.setMilliseconds(0);
      let day = constraints.day;
      let month = constraints.month;
      let year = constraints.year;
      const weekday = constraints.weekday;
      const adjust = constraints.adjust;
      const hasMonth = !!(month || month === 0);
      const hasWeekday = !!(weekday || weekday === 0);
      const dayInMs = 864e5;
      if (day && hasMonth && year) {
        const daysInMonth = getDaysInMonth(month, year);
        if (day > daysInMonth) {
          day = daysInMonth;
        }
        date2.setFullYear(year);
        date2.setMonth(month);
        date2.setDate(day);
      } else if (hasMonth && year) {
        date2.setFullYear(year);
        date2.setMonth(month);
        if (hasWeekday) {
          if (!(searchMethod & PAST)) {
            day = mod(weekday - date2.getDay(), 7) + 1;
          } else {
            date2.setDate(day = getDaysInMonth(month, year));
            day = day - mod(date2.getDay() - weekday, 7);
          }
        } else if (searchMethod & PREFER_LAST_DAY_OF_MONTH) {
          day = getDaysInMonth(month, year);
        } else {
          day = 1;
        }
        date2.setDate(day);
      } else if (day && hasMonth) {
        const currentMonth = date2.getMonth();
        year = date2.getFullYear();
        if (searchMethod & FUTURE) {
          if (month < currentMonth || month === currentMonth && day <= currentDay) {
            year += 1;
          }
        }
        if (searchMethod & PAST) {
          if (month > currentMonth || month === currentMonth && day >= currentDay) {
            year -= 1;
          }
        }
        date2.setFullYear(year);
        date2.setMonth(month);
        date2.setDate(day);
        if (hasWeekday) {
          const isFeb29 = day === 29 && month === 1;
          if (isFeb29) {
            while (!isLeapYear(year)) {
              year += searchMethod || 1;
            }
            date2.setFullYear(year);
          }
          const delta2 = (isFeb29 ? 4 : 1) * (searchMethod || 1);
          while (date2.getDay() !== weekday) {
            do {
              year += delta2;
            } while (isFeb29 && !isLeapYear(year));
            date2.setFullYear(year);
          }
        }
      } else if (day) {
        year = date2.getFullYear();
        month = date2.getMonth();
        date2.setDate(day);
        if (hasWeekday) {
          while (date2.getDay() !== weekday || date2.getDate() !== day) {
            if (searchMethod & PAST) {
              if (month) {
                month -= 1;
              } else {
                year -= 1;
                month = 11;
              }
            } else {
              if (month < 11) {
                month += 1;
              } else {
                year += 1;
                month = 0;
              }
            }
            date2.setFullYear(year);
            date2.setMonth(month);
            date2.setDate(day);
          }
        } else if (searchMethod & PAST && day > currentDay) {
          date2.setMonth(month - 1);
        } else if (searchMethod & FUTURE && day < currentDay) {
          date2.setMonth(month + 1);
        }
      } else if (hasMonth) {
        year = date2.getFullYear();
        const currentMonth = date2.getMonth();
        if (searchMethod & FUTURE && month <= currentMonth) {
          year += 1;
        }
        if (searchMethod & PAST && month > currentMonth) {
          year -= 1;
        }
        date2.setFullYear(year);
        date2.setMonth(month);
        if (hasWeekday) {
          if (!(searchMethod & PAST)) {
            day = mod(weekday - date2.getDay(), 7) + 1;
          } else {
            date2.setDate(day = getDaysInMonth(month, year));
            day = day - mod(date2.getDay() - weekday, 7);
          }
          date2.setDate(day);
        } else if (searchMethod & PREFER_LAST_DAY_OF_MONTH) {
          date2.setDate(getDaysInMonth(month, year));
        }
      } else if (year) {
        date2.setFullYear(year);
        date2.setMonth(0);
        if (hasWeekday) {
          if (!(searchMethod & PAST)) {
            day = mod(weekday - date2.getDay(), 7) + 1;
          } else {
            date2.setMonth(11);
            date2.setDate(day = getDaysInMonth(11, year));
            day = day - mod(date2.getDay() - weekday, 7);
          }
          date2.setDate(day);
        }
      } else if (hasWeekday) {
        date2.setDate(currentDay);
        if (searchMethod & PAST) {
          date2.setTime(date2.getTime() - dayInMs);
          date2.setTime(
            date2.getTime() - dayInMs * mod(date2.getDay() - weekday, 7)
          );
        } else {
          date2.setTime(date2.getTime() + dayInMs);
          date2.setTime(
            date2.getTime() + dayInMs * mod(weekday - date2.getDay(), 7)
          );
        }
      } else {
        date2.setDate(currentDay);
      }
      if (adjust) {
        for (let i = 0, l = adjust.length; i < l; i += 1) {
          date2.add(adjust[i][0], adjust[i][1], false);
        }
      }
      return date2;
    },
    weekday(date2, string, weekday) {
      date2.weekday = dayNameToIndex[weekday];
    },
    day(date2, string) {
      date2.day = +string;
    },
    month(date2, string) {
      date2.month = +string - 1;
    },
    monthname(date2, string, name) {
      date2.month = monthNameToIndex[name];
    },
    year(date2, string) {
      let year = +string;
      if (string.length === 2) {
        year += 2e3;
        if (year > (/* @__PURE__ */ new Date()).getFullYear() + 30) {
          year -= 100;
        }
      }
      date2.year = year;
    },
    hour(date2, string) {
      date2.hour = +string;
      const meridian = date2.meridian;
      if (meridian) {
        this[meridian](date2);
      }
    },
    minute(date2, string) {
      date2.minute = +string;
    },
    second(date2, string) {
      date2.second = +string;
    },
    am(date2) {
      date2.meridian = "am";
      const hour = date2.hour;
      if (hour && hour === 12) {
        date2.hour = 0;
      }
    },
    pm(date2) {
      date2.meridian = "pm";
      const hour = date2.hour;
      if (hour && hour < 12) {
        date2.hour = hour + 12;
      }
    },
    searchMethod(date2, string, pastOrFuture) {
      date2.searchMethod = pastOrFuture === "past" ? PAST : FUTURE;
    },
    relativeDate(date2, string, context) {
      const now = /* @__PURE__ */ new Date();
      const dayInMs = 864e5;
      switch (context) {
        case "yesterday":
          now.setTime(now.getTime() - dayInMs);
          break;
        case "tomorrow":
          now.setTime(now.getTime() + dayInMs);
          break;
      }
      date2.day = now.getDate();
      date2.month = now.getMonth();
      date2.year = now.getFullYear();
    },
    adjustSign(date2, sign) {
      if (!date2.adjust) {
        date2.adjust = [];
      }
      date2.adjust.push([sign === "+" ? 1 : -1, "day"]);
    },
    adjustNumber(date2, number) {
      if (!date2.adjust) {
        date2.adjust = [[-1, "day"]];
      }
      date2.adjust.last()[0] *= number;
    },
    adjustUnit(date2, unit) {
      unit = unit.toLowerCase();
      unit = letterToUnit[unit] || unit;
      date2.adjust.last()[1] = unit;
    }
  };
  var unknown = define("unknown", /^[^\s]+/);
  var dateParsers = {};
  var parseDateTime = function(string, locale, mode) {
    if (!locale) {
      locale = getLocale();
    }
    string = string.trim().replace(
      /[０-９]/g,
      (wideNum) => String.fromCharCode(wideNum.charCodeAt(0) - 65248)
    );
    const code = locale.code + mode;
    const dateParser = dateParsers[code] || (dateParsers[code] = generateLocalisedDateParser(locale, mode));
    const parse = new ParseResult(string);
    while (parse.string.length) {
      if (!dateParser(parse)) {
        unknown(parse);
      }
    }
    return parse.tokens;
  };
  var interpretDateTime = function(tokens, expectedTense) {
    return interpreter.interpret(tokens, expectedTense || NOW);
  };
  var time = function(string, locale) {
    const tokens = parseDateTime(string, locale, JUST_TIME);
    return interpreter.interpret(tokens);
  };
  var date = function(string, expectedTense, locale) {
    const tokens = parseDateTime(string, locale, JUST_DATE);
    return interpreter.interpret(tokens, expectedTense || NOW);
  };
  var dateTime = function(string, expectedTense, locale) {
    const tokens = parseDateTime(string, locale, DATE_AND_TIME);
    return interpreter.interpret(tokens, expectedTense || NOW);
  };

  // source/views/containers/SplitViewController.js
  var VERTICAL = 1;
  var HORIZONTAL = 2;
  var TOP_LEFT = 4;
  var BOTTOM_RIGHT = 8;
  var auto = "auto";
  var SplitViewController = Class({
    Name: "SplitViewController",
    Extends: Obj,
    init: function() {
      this.isResizing = false;
      SplitViewController.parent.init.apply(this, arguments);
    },
    /**
            Property: O.SplitViewController#direction
            Type: Number
            Default: O.SplitViewController.VERTICAL
    
            The direction to split the view, either `O.SplitViewController.VERTICAL`
            (the default) or `O.SplitViewController.HORIZONTAL`.
        */
    direction: VERTICAL,
    /**
            Property: O.SplitViewController#flex
            Type: Number
            Default: O.SplitViewController.TOP_LEFT
    
            Which of the two panes should be the flexible one. Must be either
            `O.SplitViewController.TOP_LEFT` (default - the top pane is flexible if
            horizontally split, or the left pane is flexible if vertically split) or
            `O.SplitViewController.BOTTOM_RIGHT` (the right or bottom pane is
            flexible).
        */
    flex: TOP_LEFT,
    /**
            Property: O.SplitViewController#flex
            Type: Number
            Default: 200
    
            The number of pixels the static pane is wide/tall (depending on split
            direction).
        */
    staticPaneLength: 200,
    /**
            Property: O.SplitViewController#minStaticPaneLength
            Type: Number
            Default: 0
    
            The minimum width/height (in pixels) that the static pane may be resized
            to.
        */
    minStaticPaneLength: 0,
    /**
            Property: O.SplitViewController#maxStaticPaneLength
            Type: Number
            Default: 32767
    
            The maximum width/height (in pixels) that the static pane may be resized
            to.
        */
    maxStaticPaneLength: 32767,
    /**
            Property: O.SplitViewController#topLeftLayout
            Type: Object
    
            The layout properties to use to position the top/left pane.
        */
    topLeftLayout: function(layout) {
      const flexDir = this.get("direction");
      const flexPane = this.get("flex");
      const staticLength = this.get("staticPaneLength");
      return layout || {
        top: 0,
        left: 0,
        right: flexDir === VERTICAL && flexPane === TOP_LEFT ? staticLength : auto,
        width: flexDir === HORIZONTAL ? "100%" : flexPane === TOP_LEFT ? auto : staticLength,
        bottom: flexDir === HORIZONTAL && flexPane === TOP_LEFT ? staticLength : auto,
        height: flexDir === VERTICAL ? "100%" : flexPane === TOP_LEFT ? auto : staticLength
      };
    }.property("flex", "direction", "staticPaneLength"),
    /**
            Property: O.SplitViewController#bottomRightLayout
            Type: Object
    
            The layout properties to use to position the bottom/right pane.
        */
    bottomRightLayout: function(layout) {
      const flexDir = this.get("direction");
      const flexPane = this.get("flex");
      const staticLength = this.get("staticPaneLength");
      return layout || {
        bottom: 0,
        right: 0,
        left: flexDir === VERTICAL && flexPane === BOTTOM_RIGHT ? staticLength : auto,
        width: flexDir === HORIZONTAL ? "100%" : flexPane === BOTTOM_RIGHT ? auto : staticLength,
        top: flexDir === HORIZONTAL && flexPane === BOTTOM_RIGHT ? staticLength : auto,
        height: flexDir === VERTICAL ? "100%" : flexPane === BOTTOM_RIGHT ? auto : staticLength
      };
    }.property("flex", "direction", "staticPaneLength"),
    /**
            Method: O.SplitViewController#userDidResize
            Type: Object
    
            Called when the user drags to resize the split.
    
            Parameters:
                staticPaneLength - {Number} The new pane width.
    
            Returns:
                {O.SplitViewController} Returns self.
        */
    userDidResize(staticPaneLength) {
      return this.set("staticPaneLength", staticPaneLength);
    }
  });

  // source/core/Date.js
  var isLeapYear2 = function(year) {
    return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
  };
  var daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  var dateFormat = /^(\d{4}|[+-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:Z|(?:([+-])(\d{2})(?::(\d{2}))?)?)?)?$/;
  Object.assign(Date, {
    fromJSON(value) {
      const results = value ? dateFormat.exec(value) : null;
      return results ? new Date(
        Date.UTC(
          +results[1] || 0,
          // Year
          (+results[2] || 1) - 1,
          // Month
          +results[3] || 1,
          // Day
          +results[4] || 0,
          // Hours
          +results[5] || 0,
          // Minutes
          +results[6] || 0,
          // Seconds
          +results[7] || 0
          // MS
        ) + (results[8] ? (
          // +- 1 minute in ms
          (results[8] === "+" ? -1 : 1) * 6e4 * // Offset in minutes
          ((+results[9] || 0) * 60 + (+results[10] || 0))
        ) : (
          // No offset
          0
        ))
      ) : null;
    },
    getDaysInMonth(month, year) {
      return month === 1 && isLeapYear2(year) ? 29 : daysInMonths[month];
    },
    getDaysInYear(year) {
      return isLeapYear2(year) ? 366 : 365;
    },
    isLeapYear: isLeapYear2
  });
  var pad = function(num, nopad, character) {
    return (nopad || num > 9 ? "" : character || "0") + num;
  };
  var aDay = 864e5;
  var duration = {
    second: 1e3,
    minute: 6e4,
    hour: 36e5,
    day: aDay
  };
  Object.assign(Date.prototype, {
    /**
            Method: Date#isToday
    
            Determines if the point of time represented by the date object is today
            in the current time zone.
    
            Returns:
                {Boolean} Is the date today?
        */
    isToday(utc) {
      const now = /* @__PURE__ */ new Date();
      const date2 = now.getDate();
      const month = now.getMonth();
      const year = now.getFullYear();
      return utc ? this.getUTCFullYear() === year && this.getUTCMonth() === month && this.getUTCDate() === date2 : this.getFullYear() === year && this.getMonth() === month && this.getDate() === date2;
    },
    /**
            Method: Date#isOnSameDayAs
    
            Determines if the two points of time are on the same day. Each date is
            considered in its local time zone, e.g. 10pm GMT on 1/1/2010 would be
            considered the same day as 10pm EST on 1/1/2010, although these are
            different dates if the dates are first converted to the same timezone.
    
            Parameters:
                date - {Date} Date to compare it to.
    
            Returns:
                {Boolean} Are the dates on the same day?
        */
    isOnSameDayAs(date2, utc) {
      return utc ? date2.getUTCFullYear() === this.getUTCFullYear() && date2.getUTCMonth() === this.getUTCMonth() && date2.getUTCDate() === this.getUTCDate() : date2.getFullYear() === this.getFullYear() && date2.getMonth() === this.getMonth() && date2.getDate() === this.getDate();
    },
    /**
            Method: Date#getDayName
    
            Returns the day of the week for this date in the currently active
            locale, provided the Localisation module is loaded. If this isn't
            loaded, it returns the same as Date#getDay().
    
            Parameters:
                abbreviate - {Boolean} (optional) If true, the method returns an
                             abbreviated day name instead of the full day name.
                utc        - {Boolean} (optional) If true, the UTC time of this date
                             object will be used when determining the day.
    
            Returns:
                {String} Localised day name.
        */
    getDayName(abbreviate, utc) {
      const names = get(
        (abbreviate ? "abbreviatedD" : "d") + "ayNames"
      );
      const day = utc ? this.getUTCDay() : this.getDay();
      return names[day];
    },
    /**
            Method: Date#getMonthName
    
            Returns the month of the year for this date in the currently active
            locale, provided the Localisation module is loaded. If this isn't
            loaded, it returns the same as Date::getMonth().
    
            Parameters:
                abbreviate - {Boolean} (optional) If true, the method returns an
                             abbreviated month name instead of the full month name.
                utc        - {Boolean} (optional) If true, the UTC time of this date
                             object will be used when determining the day.
    
            Returns:
                {String} Localised month name.
        */
    getMonthName(abbreviate, utc) {
      const names = get(
        (abbreviate ? "abbreviatedM" : "m") + "onthNames"
      );
      const day = utc ? this.getUTCMonth() : this.getMonth();
      return names[day];
    },
    /**
            Method: Date#getDayOfYear
    
            Returns the day of the year for this date, where 1 is the 1st January.
    
            Parameters:
                utc - {Boolean} (optional) If true, the UTC time of this date object
                      will be used when determining the day.
    
            Returns:
                {Number} The day of the year (1--366).
        */
    getDayOfYear(utc) {
      const beginningOfYear = utc ? Date.UTC(this.getUTCFullYear(), 0, 1) : +new Date(this.getFullYear(), 0, 1);
      return ~~((this.getTime() - beginningOfYear) / aDay) + 1;
    },
    /**
            Method: Date#getWeekNumber
    
            Returns the week of the year for this date, in the range [01,54], given
            the day of the week on which a week starts (default -> Sunday). The
            1st January is always in week 1.
    
            References:
            https://en.wikipedia.org/wiki/Week#Week_numbering
            https://devblogs.microsoft.com/oldnewthing/20160311-00/?p=93144
    
            Parameters:
                firstDayOfWeek - {Number} (optional) The day of the week that should
                                 be considered the first day of the week.
                                 `0` => Sunday (default if none supplied),
                                 `1` => Monday etc.
                utc            - {Boolean} (optional) If true, the UTC time of this
                                 date object will be used when determining the day.
    
            Returns:
                {Number} The week of the year (1--54).
        */
    getWeekNumber(firstDayOfWeek, utc) {
      const day = utc ? this.getUTCDay() : this.getDay();
      const dayOfYear = this.getDayOfYear(utc);
      const daysUntilEndOfWeek = mod(6 - day + firstDayOfWeek, 7);
      return Math.ceil((dayOfYear + daysUntilEndOfWeek) / 7);
    },
    /**
            Method: Date#getISOWeekNumber
    
            Returns the week number of the year (Monday as the first day of the
            week) as a number in the range [01,53]. If the week containing 1 January
            has four or more days in the new year, then it is considered week 1.
            Otherwise, it is the last week of the previous year, and the next week
            is week 1.
    
            This is how week numbers are defined in ISO 8601.
    
            Parameters:
                firstDayOfWeek - {Number} (optional) The day of the week that should
                                 be considered the first day of the week.
                                 `1` => Monday (default if none supplied)
                                 `0` => Sunday
                                 `6` => Saturday etc.
                utc            - {Boolean} (optional) If true, the UTC time of this
                                 date object will be used when determining the day.
    
            Returns:
                {Number} The week of the year (1--53).
        */
    getISOWeekNumber(firstDayOfWeek, utc) {
      if (firstDayOfWeek == null) {
        firstDayOfWeek = 1;
      }
      const jan4 = utc ? new Date(Date.UTC(this.getUTCFullYear(), 0, 4)) : new Date(this.getFullYear(), 0, 4);
      const jan4WeekDay = utc ? jan4.getUTCDay() : jan4.getDay();
      const wk1Start = jan4 - mod(jan4WeekDay - firstDayOfWeek, 7) * aDay;
      let week = Math.floor((this - wk1Start) / 6048e5) + 1;
      if (week === 53) {
        const date2 = utc ? this.getUTCDate() : this.getDate();
        const day = utc ? this.getUTCDay() : this.getDay();
        if (date2 - mod(day - firstDayOfWeek, 7) > 28) {
          week = 1;
        }
      }
      return week || new Date(
        (utc ? this.getUTCFullYear() : this.getFullYear()) - 1,
        11,
        31,
        12
      ).getISOWeekNumber(firstDayOfWeek, false);
    },
    /**
            Method: Date#add
    
            Moves the date object forward in time by the given delta.
    
            Parameters:
                number - {Number} How many days/weeks etc. to move forward.
                unit   - {String} (optional) The unit of the first argument. Must be
                         one of 'second'/minute'/'hour'/'day'/'week'/'month'/'year'.
                         If not supplied, defaults to 'day'.
                utc    - {Boolean} (optional) If true, the delta will be applied to
                         the UTC time of this date object.
    
            Returns:
                {Date} Returns self.
        */
    add(number, unit, utc) {
      if (!unit) {
        unit = "day";
      } else if (unit === "week") {
        unit = "day";
        number *= 7;
      }
      if (unit === "year") {
        if (utc) {
          this.setUTCFullYear(this.getUTCFullYear() + number);
        } else {
          this.setFullYear(this.getFullYear() + number);
        }
      } else if (unit === "month") {
        if (utc) {
          this.setUTCMonth(this.getUTCMonth() + number);
        } else {
          this.setMonth(this.getMonth() + number);
        }
      } else if (!utc && unit === "day") {
        this.setDate(this.getDate() + number);
      } else {
        this.setTime(this.getTime() + number * (duration[unit] || 0));
      }
      return this;
    },
    /**
            Method: Date#subtract
    
            Moves the date object backwards in time by the given delta.
    
            Parameters:
                number - {Number} How many days/weeks etc. to move backwards.
                unit   - {String} (optional) The unit of the first argument. Must be
                         one of 'second'/minute'/'hour'/'day'/'week'/'month'/'year'.
                         If not supplied, defaults to 'day'.
                utc    - {Boolean} (optional) If true, the delta will be applied to
                         the UTC time of this date object.
    
            Returns:
                {Date} Returns self.
        */
    subtract(number, unit, utc) {
      return this.add(-number, unit, utc);
    },
    /**
            Method: Date#format
    
            Formats the date as a string, according to the format pattern given.
            A variable to be substituted starts with a %, then optionally a '-'
            to stop it from being 0-padded to a fixed length (if applicable),
            then a character to indicate the desired part of the date. All patterns
            defined in strftime format are supported
            (http://pubs.opengroup.org/onlinepubs/007908799/xsh/strftime.html).
    
            a - Abbreviated day of the week, e.g. 'Mon'.
            A - Full day of the week, e.g. 'Monday'.
            b - Abbreviated month name, e.g. 'Jan'.
            B - Full month name, e.g. 'January'.
            c - The locale's appropriate date and time representation.
            C - Century number (00-99).
            d - Day of the month (01-31).
            D - Same as '%m/%d/%y'.
            e - Day of the month (' 1'-'31'), padded with a space if single digit.
            h - Same as '%b'.
            H - Hour of the day in 24h clock (00-23).
            I - Hour of the day in 12h clock (01-12).
            j - Day of the year as a decimal number (001-366).
            k - Hour of the day in 12h clock (0-23), padded with a space if single
                digit.
            l - Hour of the day in 12h clock (1-12), padded with a space if single
                digit.
            m - Month of the year (01-12).
            M - Minute of the hour (00-59).
            n - Newline character.
            p - Localised equivalent of AM or PM.
            r - The time in AM/PM notation: '%I:%M:%S %p'.
            R - The time in 24h notation: '%H:%M'.
            S - The second of the minute (00-61).
            t - Tab character.
            T - The time: '%H:%M:%S'.
            u - Weekday (1-7) where Monday is 1.
            U - The week number of the year (Sunday as the first day of the week) as
                a decimal number (00-53). The first Sunday in the year is the start
                of week 1, any day before this in the year is in week 0.
            V - The week number of the year (Monday as the first day of the week) as
                a decimal number (01-53). If the week containing 1 January has four
                or more days in the new year, then it is considered week 1.
                Otherwise, it is the last week of the previous year, and the next
                week is week 1.
            w - Weekday (0-6) where Sunday is 0.
            W - The week number of the year (Monday as the first day of the week) as
                a decimal number (00-53). All days in a new year preceding the first
                Monday are considered to be in week 0.
            x - The locale's appropriate date representation.
            X - The locale's appropriate time representation.
            y - Year without century (00-99).
            Y - Year with century (0-9999)
            z - Timezone offset
            Z - Timezone name or abbreviation.
            % - A '%' character.
    
            Parameters:
                format - {String} The pattern to use as a template for the string.
                utc    - {Boolean} Use UTC time.
    
            Returns:
                {String} The formatted date string.
        */
    format(format, utc) {
      const date2 = this;
      return format ? format.replace(
        /%(-)?([%A-Za-z])/g,
        function(string, nopad, character) {
          switch (character) {
            case "a":
              return date2.getDayName(true, utc);
            case "A":
              return date2.getDayName(false, utc);
            case "b":
              return date2.getMonthName(true, utc);
            case "B":
              return date2.getMonthName(false, utc);
            case "c":
              return localiseDate(date2, "fullDateAndTime");
            case "C":
              return pad(
                ~~((utc ? date2.getUTCFullYear() : date2.getFullYear()) / 100),
                nopad
              );
            case "d":
              return pad(
                utc ? date2.getUTCDate() : date2.getDate(),
                nopad
              );
            case "D":
              return date2.format("%m/%d/%y", utc);
            case "e":
              return pad(
                utc ? date2.getUTCDate() : date2.getDate(),
                nopad,
                " "
              );
            case "h":
              return date2.getMonthName(true, utc);
            case "H":
              return pad(
                utc ? date2.getUTCHours() : date2.getHours(),
                nopad
              );
            case "I": {
              const num = utc ? date2.getUTCHours() : date2.getHours();
              return num ? pad(num < 13 ? num : num - 12, nopad) : "12";
            }
            case "j": {
              const num = date2.getDayOfYear(utc);
              return nopad ? num + "" : num < 100 ? "0" + pad(num) : pad(num);
            }
            case "k":
              return pad(
                utc ? date2.getUTCHours() : date2.getHours(),
                nopad,
                " "
              );
            case "l": {
              const num = utc ? date2.getUTCHours() : date2.getHours();
              return num ? pad(num < 13 ? num : num - 12, nopad, " ") : "12";
            }
            case "m":
              return pad(
                (utc ? date2.getUTCMonth() : date2.getMonth()) + 1,
                nopad
              );
            case "M":
              return pad(
                utc ? date2.getUTCMinutes() : date2.getMinutes(),
                nopad
              );
            case "n":
              return "\n";
            case "p": {
              const str = (utc ? date2.getUTCHours() : date2.getHours()) < 12 ? "am" : "pm";
              return get(str + "Designator");
            }
            case "r":
              return date2.format("%I:%M:%S %p", utc);
            case "R":
              return date2.format("%H:%M", utc);
            case "S":
              return pad(
                utc ? date2.getUTCSeconds() : date2.getSeconds(),
                nopad
              );
            case "t":
              return "	";
            case "T":
              return date2.format("%H:%M:%S", utc);
            case "u":
              return (utc ? date2.getUTCDay() : date2.getDay()) || 7;
            case "U":
              return pad(this.getWeekNumber(0, utc), nopad);
            case "V":
              return pad(this.getISOWeekNumber(1, utc), nopad);
            case "w":
              return utc ? date2.getUTCDay() : date2.getDay();
            case "W":
              return pad(this.getWeekNumber(1, utc), nopad);
            case "x":
              return localiseDate(date2, "date");
            case "X":
              return localiseDate(date2, "time");
            case "y":
              return (utc ? date2.getUTCFullYear() : date2.getFullYear()).toString().slice(2);
            case "Y":
              return utc ? date2.getUTCFullYear() : date2.getFullYear();
            case "z": {
              let offset = Math.round(date2.getTimezoneOffset());
              const sign = offset > 0 ? "-" : "+";
              offset = Math.abs(offset);
              const hoursOffset = ~~(offset / 60);
              const minutesOffset = offset - 60 * hoursOffset;
              return sign + formatString("%'02n", hoursOffset) + formatString(":%'02n", minutesOffset);
            }
            case "Z":
              return (/\((.*)\)/.exec(date2.toString()) || [""]).pop();
            case "%":
              return character;
            default:
              return string;
          }
        }
      ) : this.toString();
    }
  });

  // source/localisation/RelativeDate.js
  var formatDuration = function(durationInMS, approx) {
    const durationInSeconds = Math.abs(Math.floor(durationInMS / 1e3));
    let time2;
    if (durationInSeconds < 60) {
      if (approx) {
        time2 = localise("less than a minute");
      } else {
        time2 = localise(
          "{value1, plural, one {# second} other {# seconds}}",
          durationInSeconds
        );
      }
    } else if (durationInSeconds < 60 * 60) {
      time2 = localise(
        "{value1, plural, one {# minute} other {# minutes}}",
        ~~(durationInSeconds / 60)
      );
    } else if (durationInSeconds < 60 * 60 * 24) {
      let hours;
      let minutes;
      if (approx) {
        hours = Math.round(durationInSeconds / (60 * 60));
        minutes = 0;
      } else {
        hours = ~~(durationInSeconds / (60 * 60));
        minutes = ~~(durationInSeconds / 60 % 60);
      }
      time2 = localise(
        "{value1, plural, one {# hour} other {# hours} =0 {}} {value2, plural, one {# minute} other {# minutes} =0 {}}",
        hours,
        minutes
      );
    } else if (approx ? durationInSeconds < 60 * 60 * 24 * 21 : durationInSeconds < 60 * 60 * 24 * 7) {
      let days;
      let hours;
      if (approx) {
        days = Math.round(durationInSeconds / (60 * 60 * 24));
        hours = 0;
      } else {
        days = ~~(durationInSeconds / (60 * 60 * 24));
        hours = ~~(durationInSeconds / (60 * 60) % 24);
      }
      time2 = localise(
        "{value1, plural, one {# day} other {# days} =0 {}} {value2, plural, one {# hour} other {# hours} =0 {}}",
        days,
        hours
      );
    } else {
      let weeks;
      let days;
      if (approx) {
        weeks = Math.round(durationInSeconds / (60 * 60 * 24 * 7));
        days = 0;
      } else {
        weeks = ~~(durationInSeconds / (60 * 60 * 24 * 7));
        days = ~~(durationInSeconds / (60 * 60 * 24)) % 7;
      }
      time2 = localise(
        "{value1, plural, one {# week} other {# weeks} =0 {}} {value2, plural, one {# day} other {# days} =0 {}}",
        weeks,
        days
      );
    }
    return time2.trim();
  };
  Date.formatDuration = formatDuration;
  Date.prototype.relativeTo = function(date2, approx, mustNotBeFuture) {
    if (!date2) {
      date2 = /* @__PURE__ */ new Date();
    }
    let duration2 = date2 - this;
    const isFuture = duration2 < 0;
    let time2;
    if (isFuture) {
      duration2 = -duration2;
    }
    if (!duration2 || isFuture && mustNotBeFuture) {
      return localise("just now");
    } else if (duration2 < 1e3 * 60 * 60 * 24) {
      time2 = formatDuration(duration2, approx);
    } else if (duration2 < 1e3 * 60 * 60 * 24 * 7 * 6) {
      if (approx) {
        duration2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate()) - new Date(this.getFullYear(), this.getMonth(), this.getDate());
      }
      time2 = formatDuration(duration2, approx);
    } else {
      let years = date2.getFullYear() - this.getFullYear();
      let months = date2.getMonth() - this.getMonth();
      if (isFuture) {
        years = -years;
        months = -months;
      }
      if (months < 0) {
        years -= 1;
        months += 12;
      }
      time2 = localise(
        "{value1, plural, one {# year} other {# years} =0 {}} {value2, plural, one {# month} other {# months} =0 {}}",
        years,
        months
      ).trim();
    }
    return isFuture ? localise("In {value1}", time2) : localise("{value1} ago", time2);
  };
  Date.prototype.relativeToByDay = function(date2) {
    if (!date2) {
      date2 = /* @__PURE__ */ new Date();
    }
    const duration2 = date2 - this;
    if (duration2 < 1e3 * 60 * 60 * 24) {
      return localise("Today").toLocaleLowerCase();
    }
    return this.relativeTo(date2, true, true);
  };

  // source/Global.js
  window.Promise = Promise;

  // source/color/Color.js
  var cssColorNames = {
    aliceblue: 15792383,
    antiquewhite: 16444375,
    aqua: 65535,
    aquamarine: 8388564,
    azure: 15794175,
    beige: 16119260,
    bisque: 16770244,
    black: 0,
    blanchedalmond: 16772045,
    blue: 255,
    blueviolet: 9055202,
    brown: 10824234,
    burlywood: 14596231,
    cadetblue: 6266528,
    chartreuse: 8388352,
    chocolate: 13789470,
    coral: 16744272,
    cornflowerblue: 6591981,
    cornsilk: 16775388,
    crimson: 14423100,
    cyan: 65535,
    darkblue: 139,
    darkcyan: 35723,
    darkgoldenrod: 12092939,
    darkgray: 11119017,
    darkgreen: 25600,
    darkgrey: 11119017,
    darkkhaki: 12433259,
    darkmagenta: 9109643,
    darkolivegreen: 5597999,
    darkorange: 16747520,
    darkorchid: 10040012,
    darkred: 9109504,
    darksalmon: 15308410,
    darkseagreen: 9419919,
    darkslateblue: 4734347,
    darkslategray: 3100495,
    darkslategrey: 3100495,
    darkturquoise: 52945,
    darkviolet: 9699539,
    deeppink: 16716947,
    deepskyblue: 49151,
    dimgray: 6908265,
    dimgrey: 6908265,
    dodgerblue: 2003199,
    firebrick: 11674146,
    floralwhite: 16775920,
    forestgreen: 2263842,
    fuchsia: 16711935,
    gainsboro: 14474460,
    ghostwhite: 16316671,
    gold: 16766720,
    goldenrod: 14329120,
    gray: 8421504,
    green: 32768,
    greenyellow: 11403055,
    grey: 8421504,
    honeydew: 15794160,
    hotpink: 16738740,
    indianred: 13458524,
    indigo: 4915330,
    ivory: 16777200,
    khaki: 15787660,
    lavender: 15132410,
    lavenderblush: 16773365,
    lawngreen: 8190976,
    lemonchiffon: 16775885,
    lightblue: 11393254,
    lightcoral: 15761536,
    lightcyan: 14745599,
    lightgoldenrodyellow: 16448210,
    lightgray: 13882323,
    lightgreen: 9498256,
    lightgrey: 13882323,
    lightpink: 16758465,
    lightsalmon: 16752762,
    lightseagreen: 2142890,
    lightskyblue: 8900346,
    lightslategray: 7833753,
    lightslategrey: 7833753,
    lightsteelblue: 11584734,
    lightyellow: 16777184,
    lime: 65280,
    limegreen: 3329330,
    linen: 16445670,
    magenta: 16711935,
    maroon: 8388608,
    mediumaquamarine: 6737322,
    mediumblue: 205,
    mediumorchid: 12211667,
    mediumpurple: 9662683,
    mediumseagreen: 3978097,
    mediumslateblue: 8087790,
    mediumspringgreen: 64154,
    mediumturquoise: 4772300,
    mediumvioletred: 13047173,
    midnightblue: 1644912,
    mintcream: 16121850,
    mistyrose: 16770273,
    moccasin: 16770229,
    navajowhite: 16768685,
    navy: 128,
    oldlace: 16643558,
    olive: 8421376,
    olivedrab: 7048739,
    orange: 16753920,
    orangered: 16729344,
    orchid: 14315734,
    palegoldenrod: 15657130,
    palegreen: 10025880,
    paleturquoise: 11529966,
    palevioletred: 14381203,
    papayawhip: 16773077,
    peachpuff: 16767673,
    peru: 13468991,
    pink: 16761035,
    plum: 14524637,
    powderblue: 11591910,
    purple: 8388736,
    rebeccapurple: 6697881,
    red: 16711680,
    rosybrown: 12357519,
    royalblue: 4286945,
    saddlebrown: 9127187,
    salmon: 16416882,
    sandybrown: 16032864,
    seagreen: 3050327,
    seashell: 16774638,
    sienna: 10506797,
    silver: 12632256,
    skyblue: 8900331,
    slateblue: 6970061,
    slategray: 7372944,
    slategrey: 7372944,
    snow: 16775930,
    springgreen: 65407,
    steelblue: 4620980,
    tan: 13808780,
    teal: 32896,
    thistle: 14204888,
    tomato: 16737095,
    turquoise: 4251856,
    violet: 15631086,
    wheat: 16113331,
    white: 16777215,
    whitesmoke: 16119285,
    yellow: 16776960,
    yellowgreen: 10145074,
    // System colors
    // https://developer.mozilla.org/en-US/docs/Web/CSS/color_value
    // Values taken from Chrome on macOS, but probably pretty standard
    activetext: 16711680,
    buttonface: 14540253,
    buttontext: 0,
    canvas: 16777215,
    canvastext: 0,
    field: 16777215,
    fieldtext: 0,
    graytext: 8421504,
    highlight: 11916799,
    highlighttext: 0,
    linktext: 238,
    visitedtext: 5577355,
    // Deprecated system colors
    // https://developer.mozilla.org/en-US/docs/Web/CSS/color_value
    // Values taken from Chrome on macOS, but probably pretty standard
    activeborder: 16777215,
    activecaption: 13421772,
    appworkspace: 16777215,
    background: 6513614,
    buttonhighlight: 14540253,
    buttonshadow: 8947848,
    captiontext: 0,
    inactiveborder: 16777215,
    inactivecaption: 16777215,
    inactivecaptiontext: 8355711,
    infobackground: 16514245,
    infotext: 0,
    menu: 16250871,
    menutext: 0,
    scrollbar: 16777215,
    threeddarkshadow: 6710886,
    threedface: 12632256,
    threedhighlight: 14540253,
    threedlightshadow: 12632256,
    threedshadow: 8947848,
    window: 16777215,
    windowframe: 13421772,
    windowtext: 0
  };
  var cssColorRegEx = new RegExp(
    "#(?:[0-9a-f]{3,4}){1,2}|(?:rgb|hsl)a?\\(.*?\\)|\\b(?:" + Object.keys(cssColorNames).join("|") + ")\\b",
    "ig"
  );
  var getByteDoubled = (number, offsetFromEnd) => {
    offsetFromEnd <<= 2;
    const byte = number >> offsetFromEnd & 15;
    return byte << 4 | byte;
  };
  var getDoubleByte = (number, offsetFromEnd) => {
    offsetFromEnd <<= 3;
    return number >> offsetFromEnd & 255;
  };
  var splitColor = (color) => {
    const first = color.indexOf("(") + 1;
    const last = color.lastIndexOf(")");
    const parts = color.slice(first, last).trim().split(/[, /]+/);
    return parts.length >= 3 ? parts : null;
  };
  var parseNumber = (string, max) => {
    let number = parseFloat(string);
    if (string.charAt(string.length - 1) === "%") {
      number = number * max / 100;
    }
    return number < 0 ? 0 : number > max ? max : number || 0;
  };
  var Color = class _Color {
    constructor(opacity) {
      this.opacity = opacity;
    }
    // Helper method to get JSON representation of a color.
    toJSON() {
      return this.toString();
    }
    // Creates a new Color object from a CSS color value.
    static fromCSSColorValue(color) {
      let opacity = 1;
      let r;
      let g;
      let b;
      let parts;
      color = color.toLowerCase();
      const startsWithOcto = color.charAt(0) === "#";
      if (cssColorNames.hasOwnProperty(color)) {
        const number = cssColorNames[color];
        r = getDoubleByte(number, 2);
        g = getDoubleByte(number, 1);
        b = getDoubleByte(number, 0);
      } else if (startsWithOcto || /^(?:[0-9a-f]{3}){1,2}$/i.test(color)) {
        const number = parseInt(startsWithOcto ? color.slice(1) : color, 16) || 0;
        const size = color.length;
        const getChannel = size < 6 ? getByteDoubled : getDoubleByte;
        let alphaOffset = 0;
        if (size === 5 || size === 9) {
          opacity = getChannel(number, 0) / 255;
          alphaOffset = 1;
        }
        r = getChannel(number, alphaOffset + 2);
        g = getChannel(number, alphaOffset + 1);
        b = getChannel(number, alphaOffset + 0);
      } else if (/^rgb/i.test(color) && (parts = splitColor(color))) {
        r = parseNumber(parts[0], 255);
        g = parseNumber(parts[1], 255);
        b = parseNumber(parts[2], 255);
        if (parts.length > 3) {
          opacity = parseNumber(parts[3], 1);
        }
      } else if (/^hsl/i.test(color) && (parts = splitColor(color))) {
        const h = parseNumber(parts[0], 360);
        const s = parseNumber(parts[1], 1);
        const l = parseNumber(parts[2], 1);
        if (parts.length > 3) {
          opacity = parseNumber(parts[3], 1);
        }
        return new HSL(h, s, l, opacity);
      } else {
        return null;
      }
      return new RGB(r, g, b, opacity);
    }
    // Creates a Color object from a JSON representation of a color.
    static fromJSON(color) {
      return color ? _Color.fromCSSColorValue(color) : null;
    }
  };
  var rgbToLRGB = function(x) {
    x /= 255;
    return x > 0.04045 ? Math.pow((x + 0.055) / 1.055, 2.4) : x / 12.92;
  };
  var lrgbToRGB = function(x) {
    x = x > 31308e-7 ? 1.055 * Math.pow(x, 1 / 2.4) - 0.055 : 12.92 * x;
    x *= 255;
    return x < 0 ? 0 : x > 255 ? 255 : x;
  };
  var fourOverTwentyNine = 4 / 29;
  var delta = 6 / 29;
  var deltaCubed = delta * delta * delta;
  var threeDeltaSquared = 3 * delta * delta;
  var f = function(t) {
    return t > deltaCubed ? Math.pow(t, 1 / 3) : t / threeDeltaSquared + fourOverTwentyNine;
  };
  var f1 = function(t) {
    return t > delta ? t * t * t : threeDeltaSquared * (t - fourOverTwentyNine);
  };
  var printHex = function(number) {
    number = Math.round(number);
    let string = number.toString(16);
    if (number < 16) {
      string = "0" + string;
    }
    return string;
  };
  var RGB = class extends Color {
    constructor(r, g, b, opacity) {
      super(opacity);
      this.r = r;
      this.g = g;
      this.b = b;
    }
    toString() {
      const opacity = this.opacity;
      if (opacity < 1) {
        return "rgba(" + Math.round(this.r) + ", " + Math.round(this.g) + ", " + Math.round(this.b) + ", " + opacity + ")";
      }
      return "#" + printHex(this.r) + printHex(this.g) + printHex(this.b);
    }
    toRGB() {
      return this;
    }
    // Algorithm from
    // http://www.niwa.nu/2013/05/math-behind-colorspace-conversions-rgb-hsl/
    toHSL() {
      const r = this.r / 255;
      const g = this.g / 255;
      const b = this.b / 255;
      const min = Math.min(r, g, b);
      const max = Math.max(r, g, b);
      const l = (min + max) / 2;
      let h = 0;
      let s = 0;
      if (min !== max) {
        const d = max - min;
        s = d / (l <= 0.5 ? max + min : 2 - max - min);
        h = r === max ? (g - b) / d : g === max ? (b - r) / d + 2 : (r - g) / d + 4;
        if (h < 0) {
          h += 6;
        }
        h = h * 60;
      }
      return new HSL(h, s, l, this.opacity);
    }
    // Algorithm from https://observablehq.com/@mbostock/lab-and-rgb
    toLAB() {
      const r = rgbToLRGB(this.r);
      const g = rgbToLRGB(this.g);
      const b = rgbToLRGB(this.b);
      const x = 0.4360747 * r + 0.3850649 * g + 0.1430804 * b;
      const y = 0.2225045 * r + 0.7168786 * g + 0.0606169 * b;
      const z = 0.0139322 * r + 0.0971045 * g + 0.7141733 * b;
      const fx = f(x / 0.96422);
      const fy = f(y);
      const fz = f(z / 0.82521);
      return new LAB(
        116 * fy - 16,
        500 * (fx - fy),
        200 * (fy - fz),
        this.opacity
      );
    }
  };
  var HSL = class extends Color {
    constructor(h, s, l, opacity) {
      super(opacity);
      this.h = h;
      this.s = s;
      this.l = l;
    }
    toString() {
      const hsl = this.h + ", " + 100 * this.s + "%, " + 100 * this.l + "%";
      const opacity = this.opacity;
      return opacity < 1 ? "hsla(" + hsl + ", " + opacity + ")" : "hsl(" + hsl + ")";
    }
    // Algorithm from https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_RGB
    toRGB() {
      const h = this.h;
      const s = this.s;
      const l = this.l;
      const x = s * Math.min(l, 1 - l);
      const t = (n) => {
        const k = (n + h / 30) % 12;
        return 255 * (l - x * Math.max(Math.min(k - 3, 9 - k, 1), -1));
      };
      return new RGB(t(0), t(8), t(4), this.opacity);
    }
    toHSL() {
      return this;
    }
    toLAB() {
      return this.toRGB().toLAB();
    }
  };
  var LAB = class extends Color {
    constructor(l, a, b, opacity) {
      super(opacity);
      this.l = l;
      this.a = a;
      this.b = b;
    }
    // Algorithm from https://observablehq.com/@mbostock/lab-and-rgb
    toRGB() {
      const dl = (this.l + 16) / 116;
      const da = this.a / 500;
      const db = this.b / 200;
      const x = 0.96422 * f1(dl + da);
      const y = f1(dl);
      const z = 0.82521 * f1(dl - db);
      const r = 3.1338561 * x - 1.6168667 * y - 0.4906146 * z;
      const g = -0.9787684 * x + 1.9161415 * y + 0.033454 * z;
      const b = 0.0719453 * x - 0.2289914 * y + 1.4052427 * z;
      return new RGB(lrgbToRGB(r), lrgbToRGB(g), lrgbToRGB(b), this.opacity);
    }
    toHSL() {
      return this.toRGB().toHSL();
    }
    toLAB() {
      return this;
    }
  };

  // source/animation/StyleAnimation.js
  var numbersRe = /[.\-\d]+/g;
  var splitTransform = function(transform) {
    const result = [];
    const l = transform.length;
    let last = 0;
    let inFn = false;
    let inNumber = false;
    for (let i = 0; i < l; i += 1) {
      const character = transform.charAt(i);
      if ((inNumber || inFn) && inNumber !== /^[.\-\d]/.test(character)) {
        const part = transform.slice(last, i);
        result.push(inNumber ? parseFloat(part) : part);
        last = i;
        inNumber = !inNumber;
      } else if (character === "(") {
        inFn = true;
      } else if (character === ")") {
        inFn = false;
      }
    }
    result.push(transform.slice(last));
    return result;
  };
  var zeroTransform = function(parts) {
    parts = parts.slice();
    for (let i = 1, l = parts.length; i < l; i += 2) {
      parts[i] = 0;
    }
    return parts;
  };
  var styleAnimators = {
    display: {
      calcDelta(startValue, endValue) {
        return endValue === "none" ? startValue : endValue;
      },
      calcValue(position, deltaValue, startValue) {
        return position ? deltaValue : startValue;
      }
    },
    overflow: {
      calcDelta(startValue, endValue) {
        return endValue === "hidden" ? endValue : startValue;
      },
      calcValue(position, deltaValue, startValue) {
        return position ? deltaValue : startValue;
      }
    },
    transform: {
      calcDelta(startValue, endValue) {
        let start = splitTransform(startValue || "");
        let end = splitTransform(endValue || "");
        if (!endValue || endValue === "none") {
          end = zeroTransform(start);
        }
        if (!startValue || startValue === "none") {
          start = zeroTransform(end);
        }
        if (start.length !== end.length) {
          start = [startValue];
          end = [endValue];
        }
        for (let i = 0, l = start.length; i < l; i += 1) {
          if (start[i] === 0 && /^[,)]/.test(start[i + 1])) {
            start[i + 1] = end[i + 1].replace(/[,)].*/g, "") + start[i + 1];
          }
        }
        return {
          start,
          delta: end.map(
            (value, index) => index & 1 ? value - start[index] : 0
          )
        };
      },
      calcValue(position, deltaValue, _, end) {
        if (!deltaValue) {
          return end;
        }
        const start = deltaValue.start;
        const delta2 = deltaValue.delta;
        let transform = start[0];
        for (let i = 1, l = start.length; i < l; i += 2) {
          transform += start[i] + position * delta2[i];
          transform += start[i + 1];
        }
        return transform;
      }
    }
  };
  var supported = {
    display: 1,
    overflow: 1,
    top: 1,
    right: 1,
    bottom: 1,
    left: 1,
    marginTop: 1,
    marginRight: 1,
    marginBottom: 1,
    marginLeft: 1,
    paddingTop: 1,
    paddingRight: 1,
    paddingBottom: 1,
    paddingLeft: 1,
    width: 1,
    height: 1,
    transform: 1,
    opacity: 1
  };
  var StyleAnimation = class extends Animation {
    /**
            Method (protected): O.StyleAnimation#prepare
    
            Goes through the new styles for the element, works out which of these
            can be animated, and caches the delta value (difference between end and
            start value) for each one to save duplicated calculation when drawing a
            frame.
    
            Parameters:
                styles - {Object} A map of style name to desired value.
    
            Returns:
                {Boolean} True if any of the styles are going to be animated.
        */
    prepare(styles) {
      let animated = this.animated = [];
      const from = this.startValue = this.current;
      const current = this.current = clone(from);
      const delta2 = this.deltaValue = {};
      const units = this.units = {};
      const element = this.element;
      this.endValue = styles;
      for (const property in styles) {
        let start = from[property];
        const end = styles[property];
        if (start !== end) {
          if (supported[property]) {
            animated.push(property);
            const animator = styleAnimators[property];
            if (animator) {
              delta2[property] = animator.calcDelta(start, end);
            } else {
              units[property] = typeof start === "string" && start.replace(numbersRe, "") || typeof end === "string" && end.replace(numbersRe, "") || // If no unit specified, using 0 will ensure
              // the value passed to setStyle is a number, so
              // it will add 'px' if appropriate.
              0;
              start = from[property] = parseFloat(start);
              delta2[property] = parseFloat(end) - start;
            }
          } else {
            current[property] = end;
            setStyle(element, property, end);
          }
        }
      }
      if (delta2.top && (!units.top || units.top === "px")) {
        let transform = styles.transform || "";
        if (transform === "none") {
          transform = "";
        }
        if (transform === "" || /^translate3d\([^,]+,|\d+(?:px)?,0\)$/.test(transform)) {
          if (!delta2.transform) {
            animated.push("transform");
          }
          if (transform === "") {
            styles.transform = "none";
            transform = "translate3d(0," + delta2.top + "px,0)";
          } else {
            const parts = transform.split(",");
            parts[1] = parseInt(parts[1], 10) + delta2.top + "px";
            transform = parts.join(",");
          }
          delta2.tt = styleAnimators.transform.calcDelta(
            from.transform || "",
            transform
          );
          animated.push("tt");
          animated = animated.filter((x) => x !== "top" && x !== "tt");
        }
      }
      if (animated.length) {
        setStyle(element, "will-change", animated.join(", "));
        return true;
      }
      return false;
    }
    /**
            Method (protected): O.StyleAnimation#drawFrame
    
            Updates the animating styles on the element to the interpolated values
            at the position given.
    
            Parameters:
                position - {Number} The position in the animation.
        */
    drawFrame(position) {
      const isRunning = position < 1;
      const {
        startValue,
        endValue,
        deltaValue,
        units,
        current,
        animated,
        element
      } = this;
      for (let i = animated.length - 1; i >= 0; i -= 1) {
        let property = animated[i];
        const delta2 = deltaValue[property];
        const isTopTransform = property === "tt";
        if (isTopTransform) {
          property = "transform";
        }
        const start = startValue[property];
        const end = endValue[property];
        const unit = units[property];
        const animator = styleAnimators[property];
        const value = isRunning ? animator ? animator.calcValue(position, delta2, start, end) : start + position * delta2 + unit : end;
        if (isTopTransform) {
          if (!isRunning) {
            continue;
          }
        } else {
          current[property] = value;
          if (isRunning && deltaValue.tt && (property === "top" || property === "transform")) {
            continue;
          }
        }
        setStyle(element, property, value);
      }
    }
    stop() {
      if (this.isRunning) {
        const element = this.element;
        if (this.deltaValue.tt) {
          const current = this.current;
          setStyle(element, "top", current.top);
          setStyle(element, "transform", current.transform);
        }
        setStyle(element, "will-change", "auto");
      }
      return super.stop();
    }
  };

  // source/animation/AnimatableView.js
  var AnimatableView = {
    /**
            Property: O.AnimatableView#animateLayer
            Type: Boolean
            Default: true
    
            If true, changes to the view's <O.View#layerStyles> property will be
            animated. If false, the changes will be set without animation.
        */
    animateLayer: true,
    /**
            Property: O.AnimatableView#animateLayerDuration
            Type: Number
            Default: 300
    
            The length of time in milliseconds to animate changes to the view's
            layer styles.
        */
    animateLayerDuration: 300,
    /**
            Property: O.AnimatableView#animateLayerEasing
            Type: Function
            Default: O.Easing.ease
    
            The easing function to use for the animation of the view's layer styles.
        */
    animateLayerEasing: ease,
    /**
            Property: O.AnimatableView#animating
            Type: Number
    
            The number of properties on the view currently being animated. Note,
            <O.View#layerStyles> counts as a single property.
        */
    animating: 0,
    /**
            Method: O.AnimatableView#willAnimate
    
            This method is called by the <O.Animation> class when it begins
            animating a property on the object. Increments the <#animating>
            property.
        */
    willAnimate() {
      this.increment("animating", 1);
    },
    /**
            Method: O.AnimatableView#didAnimate
    
            This method is called by the <O.Animation> class when it finishes
            animating a property on the object. Decrements the <#animating>
            property.
        */
    didAnimate(animation) {
      this.increment("animating", -1);
      if (!this.get("animating") && animation instanceof StyleAnimation && animation.animated.some(
        (property) => property !== "opacity" && property !== "transform"
      )) {
        this.parentViewDidResize();
      }
    },
    /**
            Property: O.AnimatableView#layerAnimation
            Type: O.StyleAnimation
    
            An appropriate animation object (depending on browser support) to
            animate the layer styles. Automatically generated when first accessed.
        */
    layerAnimation: function() {
      return new StyleAnimation({
        object: this,
        element: this.get("layer")
      });
    }.property(),
    /**
            Method: O.AnimatableView#redrawLayerStyles
    
            Overrides <O.View#redrawLayerStyles> to animate the change in styles
            instead of setting them immediately.
    
            Parameters:
                layer     - {Element} The view's layer.
                oldStyles - {Object|null} The previous layer styles for the view.
        */
    redrawLayerStyles(layer, oldStyles) {
      const newStyles = this.get("layerStyles");
      const layerAnimation = this.get("layerAnimation");
      if (this.get("animateLayer") && this.get("isInDocument")) {
        if (!layerAnimation.current) {
          layerAnimation.current = oldStyles || newStyles;
        }
        layerAnimation.animate(
          newStyles,
          this.get("animateLayerDuration"),
          this.get("animateLayerEasing")
        );
        if (!layerAnimation.isRunning) {
          this.willAnimate(layerAnimation);
          this.didAnimate(layerAnimation);
        }
      } else {
        layerAnimation.stop();
        if (layerAnimation.current) {
          oldStyles = layerAnimation.current;
        }
        layerAnimation.current = newStyles;
        for (const property in newStyles) {
          const value = newStyles[property];
          if (value !== oldStyles[property]) {
            setStyle(layer, property, value);
          }
        }
        this.parentViewDidResize();
      }
      for (const property in oldStyles) {
        if (!(property in newStyles)) {
          setStyle(layer, property, null);
          if (layerAnimation.current) {
            delete layerAnimation.current[property];
          }
        }
      }
    },
    /**
            Method: O.AnimatableView#resetAnimation
    
            Restores the view's animation to its initial position.
         */
    resetAnimation() {
      this.get("layerAnimation").reset();
    }
  };

  // source/application/Router.js
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var doRouting;
  var globalQueryStringPart = function() {
    const { knownGlobalQueryParams } = this;
    let returnValue = "";
    for (const property in knownGlobalQueryParams) {
      if (hasOwnProperty.call(knownGlobalQueryParams, property)) {
        const value = this.get(property);
        if (value !== null) {
          if (returnValue) {
            returnValue += "&";
          }
          returnValue += knownGlobalQueryParams[property] + "=" + encodeURIComponent(value);
        }
      }
    }
    return returnValue;
  };
  var Router = Class({
    Name: "Router",
    Extends: Obj,
    /**
            Property: O.Router#title
            Type: String
    
            The last title for the page window.
        */
    title: document.title,
    /**
            Property: O.Router#baseUrl
            Type: String
            Default: the origin, plus a trailing slash.
    
            The path to the base of the URL space that maps to application state.
            There’s also a different default for the file: scheme, using the hash,
            but realise that it may have issues if you have links that use the hash,
            or if you try loading the page without “#/” added on the end.
    
            This property must not be modified after router construction time.
        */
    baseUrl: location.protocol === "file:" ? location.href.replace(/#.*/, "") + "#/" : location.protocol + "//" + location.host + "/",
    /**
            Property: O.Router#knownGlobalQueryParams
            Type: {[String]: String}
            Default: {}
    
            An object containing any query string parameters that are known to be
            global, and not part of router state; for example, a debug flag.
    
            This should be set at construction time (it’s read-only after that) to
            an object with one entry per global query string parameter.
    
            • The key will be used as the property name in this Router object (it is
              thereby observable), and MUST NOT contain "."; take care to avoid
              collisions with other properties on the router.
            • The value will be the name of the query string item, and MUST contain
              only URL-safe characters, and definitely no ampersands.
    
            (The distinction between key and value is made to avoid collisions
            between object or router properties and query string parameters;
            otherwise, an array would have been suitable.)
    
            Although this knownGlobalQueryParams property is read-only after
            construction, the properties it causes to exist may be modified,
            and the URL will be updated when that happens. But beware: any links
            generated will be not be updated unless they depend on
            globalQueryStringPart. (They also depend on baseUrl, but it’s not
            permitted to change after construction time.)
    
            Example:
    
                knownGlobalQueryParams: {
                    debug: 'debug',
                    titleParam: 'title',
                },
    
            This will cause the Router to have two observable properties `debug` and
            `titleParam`, which will have values like these:
    
                ======================================== =========== ===============
                URL                                      this.debug  this.titleParam
                ======================================== =========== ===============
                https://www.example.com/                 null        null
                https://www.example.com/?debug=1         "1"         null
                https://www.example.com/?debug=0&title=  "0"         ""
                https://www.example.com/?title=foo%3Dbar null        "foo=bar"
                ======================================== =========== ===============
        */
    knownGlobalQueryParams: {},
    /**
            Property: O.Router#globalQueryStringPart
            Type: String
    
            The current values of the global query parameters, encoded for inclusion
            in the query string by such methods as getUrlForEncodedState. This value
            will be of little direct value to you, but if you have links that must
            contain the current values of global query parameters, create a binding
            to this as in this example:
    
                el(
                    'a',
                    {
                        href: bind(router, 'globalQueryStringPart', () =>
                            router.getUrlForEncodedState('foo'),
                        ),
                    },
                    ['Foo'],
                );
    
            If the URL needs to depend on other properties, I’m sure you can figure
            it out from here.
    
            This property is read-only to user code. To effect change in it, modify
            the underlying global parameter values directly instead.
        */
    // Constructor replaces this with a property with the correct dependencies.
    globalQueryStringPart: "",
    /**
            Property: O.Router#encodedState
            Type: String
    
            The encoded version of your application's current state. Whenever this
            changes, the URL will automatically be updated to match, therefore it
            should not contain any characters which are illegal in URLs. It may be a
            computed property with dependencies or set manually when state changes.
        */
    encodedState: "",
    /**
            Property: O.Router#replaceState
            Type: Boolean
            Default: false
    
            If set to true, the next change of encodedState will cause the current
            history entry to be replaced, rather than appending a new history entry.
            The property will then automatically be set back to false. Set this to
            true if you decode an invalid URL path to ensure it doesn't remain in
            the browser history.
        */
    replaceState: false,
    /**
            Property: O.Router#routes
            Type: Array
    
            A collection of regular expressions for matching against URLs and
            functions for decoding the state from the match. Entries will be tried
            in order. Each entry should be an object with two properties:
    
            url    - {RegExp} The regular expression to execute on the encoded
                     state.
            handle - {Function} The handler for decoding the state if the regular
                     expression matches. This will be given the full encoded state
                     minus any query string as the first parameter, the query string
                     decoded as an object for the second parameter, followed by any
                     capturing groups in the regular expression. Concerning the
                     query string object: if there is no query string, that second
                     parameter will be an empty object, not null. Also, global query
                     string parameters, which correspond to properties on the Router
                     instance, are excluded from the object.
    
            Handlers SHOULD be idempotent.
        */
    routes: [],
    init: function(mixin2, win) {
      if (!win) {
        win = window;
      }
      const knownGlobalQueryParams = mixin2.knownGlobalQueryParams || Router.prototype.knownGlobalQueryParams;
      const globalQueryPropsByName = {};
      const globalQueryProps = Object.keys(knownGlobalQueryParams);
      const globalQueryNames = new Set(Object.values(knownGlobalQueryParams));
      const globalQueryMixin = {
        globalQueryStringPart: function() {
          return globalQueryStringPart.call(this);
        }.property(...globalQueryProps),
        _knownGlobalQueryParamNames: globalQueryNames
      };
      for (let i = globalQueryProps.length - 1; i >= 0; i -= 1) {
        const prop = globalQueryProps[i];
        globalQueryPropsByName[knownGlobalQueryParams[prop]] = prop;
        globalQueryMixin[prop] = null;
      }
      const queryString = win.location.search;
      if (queryString) {
        queryString.slice(1).replace(/\+/g, " ").split("&").map((entry) => entry.split("=", 2).map(decodeURIComponent)).forEach(([name, value]) => {
          if (globalQueryNames.has(name)) {
            globalQueryMixin[globalQueryPropsByName[name]] = value;
          }
        });
      }
      Router.parent.constructor.call(this, mixin2, globalQueryMixin);
      this._win = win;
      this.doRouting();
      win.addEventListener("popstate", this, false);
    },
    /**
            Method (private): O.Router#_setTitle
    
            Sets the window title. Called automatically whenever the
            <O.Router#title> property changes.
        */
    _setTitle: function() {
      document.title = this.get("title");
    }.observes("title"),
    /**
            Method: O.Router#doRouting
    
            Reruns the routing. This method is called automatically when
            <O.Router#routes> changes. This is designed so that, for example, you
            can block routes when login is required.
    
            (This method would more naturally be called “route”, the verb, but that
            may lead to confusion with the noun “route”, referring to the current
            route. Hence the clumsy name doRouting.)
        */
    doRouting: doRouting = function() {
      const baseUrl = this.baseUrl;
      const href = this._win.location.href;
      if (!href.startsWith(baseUrl)) {
        const error = new Error("Bad Router.baseUrl");
        error.details = { href, baseUrl };
        throw error;
      }
      this.restoreEncodedState(href.slice(baseUrl.length), null);
    }.observes("routes"),
    /**
            Method: O.Router#handleEvent
    
            Called automatically whenever the URL changes. Will compare to the last
            set value and if different, invoke <O.Router#restoreEncodedState> with
            the new URL.
        */
    handleEvent: doRouting.invokeInRunLoop(),
    /**
            Method: O.Router#restoreEncodedState
    
            Iterates through the <O.Router#routes> until it finds a match, then
            uses that to decode the state. Called automatically whenever the URL
            changes, via <O.Router#doRouting>.
    
            The parameter queryParams is for the purpose of nested routers: routes
            on this router can take the path and parsed query parameters, and pass
            them on to a sub-router, which may just borrow this restoreEncodedState
            method.
    
            Parameters:
                encodedState - {String} The encodedState to restore state from, with
                               or without query string
                queryParams - {(Object|null)} (optional) The already-decoded query
                              string; passing a value for this requires that
                              encodedState not contain a query string
    
            Returns:
                {O.Router} Returns self.
        */
    restoreEncodedState(encodedState, queryParams) {
      this.beginPropertyChanges();
      if (!queryParams) {
        queryParams = {};
        const queryStringStart = encodedState.indexOf("?");
        if (queryStringStart !== -1) {
          const globalNames = this._knownGlobalQueryParamNames;
          encodedState.slice(queryStringStart + 1).replace(/\+/g, " ").split("&").map((entry) => entry.split("=", 2).map(decodeURIComponent)).forEach(([name, value]) => {
            if (!globalNames || !globalNames.has(name)) {
              queryParams[name] = value;
            }
          });
          encodedState = encodedState.slice(0, queryStringStart);
        }
      }
      const routes = this.get("routes");
      for (let i = 0, l = routes.length; i < l; i += 1) {
        const route = routes[i];
        const match = route.url.exec(encodedState);
        if (match) {
          route.handle.call(
            this,
            encodedState,
            queryParams,
            ...match.slice(1)
          );
          break;
        }
      }
      this.endPropertyChanges();
      return this;
    },
    stripGlobalParams(encodedState) {
      const globalNames = this._knownGlobalQueryParamNames;
      const match = /^([^?#]*)(?:\?([^#]*))?(#.*)?$/.exec(encodedState);
      let queryString = match[2];
      if (queryString) {
        queryString = queryString.split("&").filter(
          (entry) => !globalNames.has(
            decodeURIComponent(entry.split("=", 1)[0])
          )
        ).join("&");
        if (queryString) {
          queryString = "?" + queryString;
        }
      }
      return match[1] + (queryString || "") + (match[3] || "");
    },
    /**
            Method (private): O.Router#_encodeStateToUrl
    
            Sets the current URL to match the <O.Router#encodedState> property.
            This method is called automatically once, at the end of the run loop,
            whenever this property changes.
        */
    _encodeStateToUrl: function() {
      const state = this.get("encodedState");
      const replaceState = this.get("replaceState");
      const win = this._win;
      const url2 = this.getUrlForEncodedState(state);
      const currentHref = win.location.href;
      if (currentHref === url2 || currentHref.startsWith(url2) && currentHref.charAt(url2.length) === "#") {
        return;
      }
      const history = win.history;
      const title = this.get("title");
      if (replaceState) {
        history.replaceState(null, title, url2);
        this.set("replaceState", false);
      } else {
        history.pushState(null, title, url2);
      }
    }.queue("after").observes("encodedState", "globalQueryStringPart"),
    // This method allows a hash to be in state, purely because in Fastmail we
    // have a few places where we want it so—we’re not quite dealing with
    // “encoded state” there, but rather partial URLs. Still, it’s kinda nice to
    // do it here. The rest of the router doesn’t really cope with a hash at
    // present. I’d like it to, but there are some interesting considerations,
    // like whether this.encodedState should include it, and whether it should
    // be part of routing (i.e. trigger the theoretically idempotent
    // restoreEncodedState on every hash change), and if so whether this means
    // yet another new argument to the handler or whether we stow it somewhere
    // else, or maybe we do the whole thing with events, and… and… yeah. I guess
    // I have another TODO. Lots of interesting things to consider.
    getUrlForEncodedState(state) {
      let url2 = this.baseUrl;
      const hashIndex = state.indexOf("#");
      let hash2;
      if (hashIndex > -1) {
        hash2 = state.slice(hashIndex);
        url2 += state.slice(0, hashIndex);
      } else {
        url2 += state;
      }
      const globalQueryPart = this.get("globalQueryStringPart");
      if (globalQueryPart) {
        url2 += (state.includes("?") ? "&" : "?") + globalQueryPart;
      }
      if (hash2) {
        url2 += hash2;
      }
      return url2;
    }
  });

  // source/application/ThemeManager.js
  var ThemeManager = Class({
    Name: "ThemeManager",
    Extends: Obj,
    init: function() {
      this._images = { all: {} };
      this._styles = { all: {} };
      this._activeStylesheets = {};
      this.theme = "";
      ThemeManager.parent.constructor.apply(this, arguments);
    },
    /**
            Property: O.ThemeManager#theme
            Type: String
    
            The name of the currently active theme.
        */
    /**
            Method: O.ThemeManager#changeTheme
    
            Replaces the stylesheets in the document from the old theme with
            equivalents from the new one.
    
            Parameters:
                oldTheme - {String} The name of the theme being deactivated.
                newTheme - {String} The name of the newly active theme.
        */
    changeTheme(oldTheme, newTheme) {
      const active2 = this._activeStylesheets;
      for (const id in active2) {
        if (active2[id]) {
          this.addStylesheet(id, newTheme);
          this.removeStylesheet(id, oldTheme);
        }
      }
    },
    /**
            Method: O.ThemeManager#imageDidLoad
    
            Registers an image with the theme manager, making it available via
            <#getImageSrc> or in any stylesheets injected later into the page.
    
            Parameters:
                theme - {String} The name of the theme this image belongs to.
                        If applicable to all themes, use the string 'all'.
                id    - {String} An id for the image.
                data  - {String} The base64 encoded data for the image.
        */
    imageDidLoad(theme, id, data) {
      const themeImages = this._images[theme] || (this._images[theme] = {});
      themeImages[id] = data;
      return this;
    },
    /**
            Method: O.ThemeManager#stylesheetDidLoad
    
            Registers an stylesheet with the theme manager, making it available to
            be injected by a call to <#addStylesheet>.
    
            Parameters:
                theme - {String} The name of the theme this image belongs to.
                        If applicable to all themes, use the string 'all'.
                id    - {String} An id for the image.
                data  - {String} The base64 encoded data for the image.
        */
    stylesheetDidLoad(theme, id, data) {
      const themeStyles = this._styles[theme] || (this._styles[theme] = {});
      themeStyles[id] = data;
      return this;
    },
    /**
            Method: O.ThemeManager#addStylesheet
    
            Injects a new stylesheet into the page. Will first substitute in the
            data for all images it has loaded into memory.
    
            Parameters:
                id    - {String} The id to give the stylesheet.
                theme - {String} (optional) The theme to choose; defaults to the
                        currently set theme.
    
            Returns:
                {O.ThemeManager} Returns self.
        */
    addStylesheet(id, theme) {
      if (!theme) {
        theme = this.get("theme");
      }
      const styles = this._styles[theme] || {};
      const images = this._images[theme] || {};
      const themeIndependentImages = this._images.all;
      let data = styles[id] || this._styles.all[id] || "";
      const active2 = this._activeStylesheets;
      if (data) {
        data = data.replace(/url\("?([^)"]+)"?\)/g, (url2, src) => {
          const colon = src.indexOf(":");
          let currentColor = "";
          if (colon > -1 && src.slice(colon - 4, colon) === ".svg") {
            currentColor = src.slice(colon + 1);
            src = src.slice(0, colon);
          }
          let imageData = images[src] || themeIndependentImages[src] || localise(src);
          if (imageData && /\.svg$/.test(src)) {
            if (currentColor) {
              imageData = imageData.replace(
                /currentColor/g,
                currentColor
              );
            }
            imageData = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(imageData);
          }
          return "url(" + (imageData || src) + ")";
        });
      }
      create2(theme + "-" + id, data);
      active2[id] = (active2[id] || 0) + 1;
      return this;
    },
    /**
            Method: O.ThemeManager#removeStylesheet
    
            Removes a previously added stylesheet from the page.
    
            Parameters:
                id   - {String} The id of the stylesheet to remove.
    
            Returns:
                {O.ThemeManager} Returns self.
        */
    removeStylesheet(id, theme) {
      if (!theme) {
        theme = this.get("theme");
      }
      const sheet = document.getElementById(theme + "-" + id);
      if (sheet) {
        sheet.remove();
        this._activeStylesheets[id] -= 1;
      }
      return this;
    },
    /**
            Method: O.ThemeManager#getImageSrc
    
            Gets the (data) url for a loaded image.
    
            Parameters:
                id - {String} The id of the image.
    
            Returns:
                {(String|null)} A data URI for the requested image if the data is
                available, otherwise null.
        */
    getImageSrc(id) {
      const _images = this._images;
      const themeImages = _images[this.get("theme")] || {};
      const themeIndependentImages = _images.all;
      return themeImages[id] || themeIndependentImages[id] || null;
    }
  });

  // source/application/WindowController.js
  var WindowController = Class({
    Name: "WindowController",
    Extends: Obj,
    /**
            Property: O.WindowController#broadcastKey
            Type: String
            Default: "owm:broadcast"
    
            The key to use for the local storage property that will be set to
            broadcast messages to other tabs.
        */
    broadcastKey: "owm:broadcast",
    /**
            Property: O.WindowController#isMaster
            Type: Boolean
    
            Is this tab/window the elected "master"? If multiple windows with the
            application are open, they will coordinate between themselves so only
            one has the isMaster property set to true. Note, in some circumstances,
            this may not happen instantly and there may be a short while when there
            is no master or more than one master. However, it will quickly resolve
            itself.
        */
    /**
            Property: O.WindowController#isFocused
            Type: Boolean
    
            Is the tab/window currently focused?
        */
    /**
            Property: O.WindowController#id
            Type: String
    
            A unique id for the window, guaranteed to be different than for any
            other open window.
        */
    init: function() {
      this.id = (/* @__PURE__ */ new Date()).format("%y%m%d%H%M%S") + Math.random();
      this.isMaster = false;
      this.isFocused = document.hasFocus ? document.hasFocus() : true;
      this._seenWCs = {};
      WindowController.parent.constructor.apply(this, arguments);
      window.addEventListener("storage", this, false);
      window.addEventListener("unload", this, false);
      window.addEventListener("focus", this, false);
      window.addEventListener("blur", this, false);
      invokeInNextEventLoop(this.checkMaster, this);
      this.start();
    },
    destroy() {
      this.end(this.get("broadcastKey"));
      window.removeEventListener("storage", this, false);
      window.removeEventListener("unload", this, false);
      window.removeEventListener("focus", this, false);
      window.removeEventListener("blur", this, false);
      WindowController.parent.destroy.call(this);
    },
    /**
            Method: O.WindowController#start
    
            Sends a message to let other windows know a new one has been created.
        */
    start() {
      this.broadcast("wc:hello");
    },
    /**
            Method: O.WindowController#end
    
            Sends a message to let other windows know this one has been destroyed.
    
            Parameters:
                broadcastKey - {String} The broadcast key.
        */
    end(broadcastKey) {
      this.broadcast("wc:bye", null, broadcastKey);
    },
    /**
            Method: O.WindowController#broadcastKeyDidChange
    
            Observes changes to the broadcastKey and synchronizes with other
            windows.
    
            Parameters:
                oldBroadcastKey - {String} The previous broadcast key.
        */
    broadcastKeyDidChange: function(_, __, oldBroadcastKey) {
      this.end(oldBroadcastKey);
      this.start();
    }.observes("broadcastKey"),
    /**
            Method (protected): O.WindowController#handleEvent
    
            Handles storage, unload, focus and blur events.
    
            Parameters:
                event - {Event} The event object.
        */
    handleEvent: function(event) {
      switch (event.type) {
        case "storage":
          if (event.key === this.get("broadcastKey")) {
            try {
              const data = JSON.parse(event.newValue);
              if (data.wcId !== this.id) {
                this.fire(data.type, data);
              }
            } catch (error) {
            }
          }
          break;
        case "unload":
          this.destroy();
          break;
        case "focus":
          this.set("isFocused", true);
          break;
        case "blur":
          this.set("isFocused", false);
          break;
      }
    }.invokeInRunLoop(),
    /**
            Method (protected): O.WindowController#sendPing
    
            Sends a ping to let other windows know about the existence of this one.
        */
    sendPing() {
      this.broadcast("wc:ping");
    },
    /**
            Method (private): O.WindowController#_hello
    
            Handles the arrival of a new window.
    
            Parameters:
                event - {Event} An event object containing the window id.
        */
    _hello: function(event) {
      this._ping(event);
      this.sendPing();
    }.on("wc:hello"),
    /**
            Method (private): O.WindowController#_ping
    
            Handles a ping from another window.
    
            Parameters:
                event - {Event} An event object containing the window id.
        */
    _ping: function(event) {
      const wcId = event.wcId;
      this._seenWCs[wcId] = true;
      if (wcId < this.id) {
        this.checkMaster();
      }
    }.on("wc:ping"),
    /**
            Method (private): O.WindowController#_bye
    
            Handles the departure of another window.
    
            Parameters:
                event - {Event} An event object containing the window id.
        */
    _bye: function(event) {
      delete this._seenWCs[event.wcId];
      this.checkMaster();
    }.on("wc:bye"),
    /**
            Method: O.WindowController#checkMaster
    
            Looks at the set of other windows it knows about and sets the isMaster
            property based on whether this window has the lowest ordered id.
        */
    checkMaster() {
      let isMaster = true;
      const ourId = this.id;
      for (const id in this._seenWCs) {
        if (id < ourId) {
          isMaster = false;
        }
      }
      this.set("isMaster", isMaster);
    },
    /**
            Method: O.WindowController#broadcast
    
            Broadcast an event with JSON-serialisable data to other tabs.
    
            Parameters:
                type         - {String} The name of the event being broadcast.
                data         - {Object} (optional). The data to broadcast.
                broadcastKey - {String} (optional). The key to use; otherwise the
                               key will be taken from the broadcastKey property.
        */
    broadcast(type, data, broadcastKey) {
      try {
        localStorage.setItem(
          broadcastKey || this.get("broadcastKey"),
          JSON.stringify(
            Object.assign(
              {
                wcId: this.id,
                type
              },
              data
            )
          )
        );
      } catch (error) {
      }
    }
  });

  // source/datastore/query/RecordArray.js
  var RecordArray = Class({
    Name: "RecordArray",
    Extends: Obj,
    Mixin: Enumerable,
    init: function(store, Type, storeKeys) {
      this.store = store;
      this.Type = Type;
      this.storeKeys = storeKeys;
      RecordArray.parent.constructor.call(this);
    },
    /**
            Property: O.RecordArray#length
            Type: Number
    
            The number of records in the array.
        */
    length: function() {
      return this.get("storeKeys").length;
    }.property("storeKeys"),
    /**
            Method: O.RecordArray#getObjectAt
    
            Returns the record at the index given in the array.
    
            Parameters:
                index - {Number} The index of the record to return.
    
            Returns:
                {O.Record} The record at index i in this array.
        */
    getObjectAt(index) {
      const storeKey = this.get("storeKeys")[index];
      if (storeKey) {
        return this.get("store").materialiseRecord(storeKey);
      }
      return void 0;
    }
  });

  // source/datastore/query/LocalQuery.js
  var LocalQuery = Class({
    Name: "LocalQuery",
    Extends: Query,
    autoRefresh: AUTO_REFRESH_ALWAYS,
    /**
            Constructor: O.LocalQuery
    
            The following properties should be configured:
    
            store - {O.Store} The store to query for records.
            Type  - {O.Class} The constructor for the record type this query is a
                    collection of.
            where - {Function} (optional) If supplied, only records which this
                    function returns a truthy value for are included in the
                    results.
            sort  - {(String|String[]|Function)} (optional) The records in
                    the local query are sorted according to this named property. If
                    an array is supplied, in the case of a tie the next property in
                    the array will be consulted. If a function is supplied, this is
                    used as the sort function directly on the records. If nothing
                    is supplied, the results are not guaranteed to be in any
                    particular order.
    
            Parameters:
                mixin - {Object} The properties for the query.
        */
    init: function(mixin2) {
      this.dependsOn = null;
      this.where = null;
      this.sort = null;
      const sort = mixin2.sort;
      if (sort && typeof sort !== "function") {
        mixin2.sort = sortByProperties(sort);
      }
      LocalQuery.parent.constructor.apply(this, arguments);
    },
    monitorForChanges() {
      const store = this.get("store");
      const types = this.get("dependsOn") || [this.get("Type")];
      types.forEach(function(Type) {
        store.on(Type, this, "setObsolete");
      }, this);
    },
    unmonitorForChanges() {
      const store = this.get("store");
      const types = this.get("dependsOn") || [this.get("Type")];
      types.forEach(function(Type) {
        store.off(Type, this, "setObsolete");
      }, this);
    },
    fetch(force, callback) {
      const status = this.get("status");
      if (force || status === EMPTY || status & OBSOLETE) {
        const Type = this.get("Type");
        const store = this.get("store");
        if (store.getTypeStatus(Type) & READY) {
          this.sourceWillFetchQuery();
          this.sourceDidFetchQuery(
            store.findAll(Type, this.get("where"), this.get("sort"))
          );
        }
      }
      if (callback) {
        callback();
      }
      return this;
    }
  });

  // source/datastore/query/WindowedQuery.js
  var WINDOW_EMPTY = 0;
  var WINDOW_REQUESTED = 1;
  var WINDOW_LOADING = 2;
  var WINDOW_READY = 4;
  var WINDOW_RECORDS_REQUESTED = 8;
  var WINDOW_RECORDS_LOADING = 16;
  var WINDOW_RECORDS_READY = 32;
  var sortLinkedArrays = function(a1, a2) {
    const zipped = a1.map((item, i) => [item, a2[i]]);
    zipped.sort((a, b) => a[0] - b[0]);
    zipped.forEach((item, i) => {
      a1[i] = item[0];
      a2[i] = item[1];
    });
  };
  var mapIndexes = function(list, storeKeys) {
    const indexOf = {};
    const indexes = [];
    const listLength = list.length;
    const storeKeysLength = storeKeys.length;
    if (storeKeysLength < ~~Math.log(listLength) + 1) {
      for (let i = 0; i < storeKeysLength; i += 1) {
        indexes.push(list.indexOf(storeKeys[i]));
      }
    } else {
      for (let i = 0; i < listLength; i += 1) {
        const id = list[i];
        if (id) {
          indexOf[id] = i;
        }
      }
      for (let i = 0; i < storeKeysLength; i += 1) {
        const index = indexOf[storeKeys[i]];
        indexes.push(index === void 0 ? -1 : index);
      }
    }
    return indexes;
  };
  var mergeSortedLinkedArrays = function(a1, a2, b1, b2) {
    const rA = [];
    const rB = [];
    let i = 0;
    let j = 0;
    const l1 = a1.length;
    const l2 = a2.length;
    while (i < l1 || j < l2) {
      if (j >= l2 || i < l1 && a1[i] < a2[j]) {
        rA.push(a1[i]);
        rB.push(b1[i]);
        i += 1;
      } else {
        rA.push(a2[j]);
        rB.push(b2[j]);
        j += 1;
      }
    }
    return [rA, rB];
  };
  var adjustIndexes = function(removed, added, removedBefore, storeKeys, removedBeforeStoreKeys) {
    const resultIndexes = [];
    const resultStoreKeys = [];
    for (let i = 0, l = removed.length; i < l; i += 1) {
      let index = removed[i];
      const position = added.binarySearch(index);
      if (index === added[position]) {
        continue;
      }
      index -= position;
      for (let j = 0, ll = removedBefore.length; j < ll && index >= removedBefore[j]; j += 1) {
        index += 1;
      }
      resultIndexes.push(index);
      resultStoreKeys.push(storeKeys[i]);
    }
    return mergeSortedLinkedArrays(
      removedBefore,
      resultIndexes,
      removedBeforeStoreKeys,
      resultStoreKeys
    );
  };
  var composeUpdates = function(u1, u2) {
    const removed = adjustIndexes(
      u2.removedIndexes,
      u1.addedIndexes,
      u1.removedIndexes,
      u2.removedStoreKeys,
      u1.removedStoreKeys
    );
    const added = adjustIndexes(
      u1.addedIndexes,
      u2.removedIndexes,
      u2.addedIndexes,
      u1.addedStoreKeys,
      u2.addedStoreKeys
    );
    return {
      removedIndexes: removed[0],
      removedStoreKeys: removed[1],
      addedIndexes: added[0],
      addedStoreKeys: added[1],
      truncateAtFirstGap: u1.truncateAtFirstGap || u2.truncateAtFirstGap,
      total: u2.total,
      upToId: u2.upToId
    };
  };
  var invertUpdate = function(u) {
    let array = u.removedIndexes;
    u.removedIndexes = u.addedIndexes;
    u.addedIndexes = array;
    array = u.removedStoreKeys;
    u.removedStoreKeys = u.addedStoreKeys;
    u.addedStoreKeys = array;
    u.total = u.total + u.addedStoreKeys.length - u.removedStoreKeys.length;
    return u;
  };
  var intersect = function(a, b, c, d) {
    return a < c ? c < b : a < d;
  };
  var updateIsEqual = function(u1, u2) {
    return u1.total === u2.total && isEqual(u1.addedIndexes, u2.addedIndexes) && isEqual(u1.addedStoreKeys, u2.addedStoreKeys) && isEqual(u1.removedIndexes, u2.removedIndexes) && isEqual(u1.removedStoreKeys, u2.removedStoreKeys);
  };
  var windowIsStillInUse = function(index, windowSize, prefetch, ranges) {
    const start = index * windowSize;
    const margin = prefetch * windowSize;
    for (let i = ranges.length - 1; i >= 0; i -= 1) {
      const range = ranges[i];
      const rangeStart = range.start || 0;
      if (!("end" in range)) {
        return true;
      }
      const rangeEnd = range.end;
      const rangeIntersectsWindow = intersect(
        start,
        start + windowSize,
        rangeStart - margin,
        rangeEnd + margin
      );
      if (rangeIntersectsWindow) {
        return true;
      }
    }
    return false;
  };
  var WindowedQuery = Class({
    Name: "WindowedQuery",
    Extends: Query,
    /**
            Property: O.WindowedQuery#windowSize
            Type: Number
    
            The number of records that make up one window.
        */
    windowSize: 30,
    windowCount: function() {
      const length = this.get("length");
      return length === null ? length : Math.floor((length - 1) / this.get("windowSize")) + 1;
    }.property("length"),
    /**
            Property: O.WindowedQuery#triggerPoint
            Type: Number
    
            If the record at an index less than this far from the end of a window is
            requested, the adjacent window will also be loaded (prefetching based on
            locality)
        */
    triggerPoint: 10,
    /**
            Property: O.WindowedQuery#optimiseFetching
            Type: Boolean
    
            If true, if a requested window is no longer either observed or adjacent
            to an observed window at the time <sourceWillFetchQuery> is called, the
            window is not actually requested.
        */
    optimiseFetching: false,
    /**
            Property: O.WindowedQuery#prefetch
            Type: Number
    
            The number of windows either side of an explicitly requested window, for
            which ids should be fetched.
        */
    prefetch: 1,
    /**
            Property: O.WindowedQuery#canGetDeltaUpdates
            Type: Boolean
    
            If the state is out of date, can the source fetch the delta of exactly
            what has changed, or does it just need to throw out the current list and
            refetch?
        */
    canGetDeltaUpdates: true,
    /**
            Property (private): O.WindowedQuery#_isAnExplicitIdFetch
            Type: Boolean
    
            This is set to true when an explicit request is made to fetch ids (e.g.
            through <O.Query#getStoreKeysForObjectsInRange>). This prevents
            the query from optimising away the request when it corresponds to a
            non-observed range in the query.
        */
    /**
            Property: O.WindowedQuery#allIdsAreLoaded
            Type: Boolean
    
            Do we have the complete list of ids for this query in memory?
            This is *not* currently observable.
        */
    allIdsAreLoaded: function() {
      const windowCount = this.get("windowCount");
      const windows = this._windows;
      if (windowCount === null) {
        return false;
      }
      for (let i = windowCount - 1; i >= 0; i -= 1) {
        if (!(windows[i] & WINDOW_READY)) {
          return false;
        }
      }
      return true;
    }.property().nocache(),
    init: function() {
      this._windows = [];
      this._indexOfRequested = [];
      this._waitingPackets = [];
      this._preemptiveUpdates = [];
      this._isAnExplicitIdFetch = false;
      WindowedQuery.parent.constructor.apply(this, arguments);
    },
    reset() {
      this._windows.length = 0;
      this._indexOfRequested.length = 0;
      this._waitingPackets.length = 0;
      this._preemptiveUpdates.length = 0;
      this._isAnExplicitIdFetch = false;
      WindowedQuery.parent.reset.call(this);
    },
    _toStoreKey: function() {
      const store = this.get("store");
      const accountId = this.get("accountId");
      const Type = this.get("Type");
      return (id) => store.getStoreKey(accountId, Type, id);
    }.property(),
    indexOfStoreKey(storeKey, from, callback) {
      const index = this._storeKeys.indexOf(storeKey, from);
      if (callback) {
        if (index < 0) {
          if (this.get("allIdsAreLoaded")) {
            callback(index);
            return index;
          }
          const store = this.get("store");
          const id = store.getIdFromStoreKey(storeKey);
          this._indexOfRequested.push([
            id,
            () => {
              callback(this._storeKeys.indexOf(storeKey, from));
            }
          ]);
          this.get("source").fetchQuery(this);
        } else {
          callback(index);
        }
      }
      return index;
    },
    getStoreKeysForObjectsInRange(start, end, callback) {
      const length = this.get("length");
      let isComplete = true;
      if (length !== null) {
        if (start < 0) {
          start = 0;
        }
        if (end > length) {
          end = length;
        }
        const windows = this._windows;
        const windowSize = this.get("windowSize");
        let i = Math.floor(start / windowSize);
        const l = Math.floor((end - 1) / windowSize) + 1;
        for (; i < l; i += 1) {
          if (!(windows[i] & WINDOW_READY)) {
            isComplete = false;
            this._isAnExplicitIdFetch = true;
            this.fetchWindow(i, false, 0);
          }
        }
      } else {
        isComplete = false;
      }
      if (isComplete) {
        callback(this._storeKeys.slice(start, end), start, end);
      } else {
        this._awaitingIdFetch.push([start, end, callback]);
      }
      return !isComplete;
    },
    // Fetches all ids and records in window.
    // If within trigger distance of window edge, fetches adjacent window as
    // well.
    fetchDataForObjectAt(index) {
      const windowSize = this.get("windowSize");
      const trigger = this.get("triggerPoint");
      const windowIndex = Math.floor(index / windowSize);
      const withinWindowIndex = index % windowSize;
      this.fetchWindow(windowIndex, true);
      if (withinWindowIndex < trigger) {
        this.fetchWindow(windowIndex - 1, true);
      }
      if (withinWindowIndex + trigger >= windowSize) {
        this.fetchWindow(windowIndex + 1, true);
      }
      return true;
    },
    /**
            Method: O.WindowedQuery#fetchWindow
    
            Fetches all records in the window with the index given. e.g. if the
            window size is 30, calling this with index 1 will load all records
            between positions 30 and 59 (everything 0-indexed).
    
            Also fetches the ids for all records in the window either side.
    
            Parameters:
                index        - {Number} The index of the window to load.
                fetchRecords - {Boolean}
                prefetch     - {Number} (optional)
    
            Returns:
                {O.WindowedQuery} Returns self.
        */
    fetchWindow(index, fetchRecords, prefetch) {
      let status = this.get("status");
      const windows = this._windows;
      let doFetch = false;
      if (status & OBSOLETE) {
        this.fetch();
      }
      if (prefetch === void 0) {
        prefetch = this.get("prefetch");
      }
      let i = Math.max(0, index - prefetch);
      const l = Math.min(index + prefetch + 1, this.get("windowCount") || 0);
      for (; i < l; i += 1) {
        status = windows[i] || 0;
        if (status === WINDOW_EMPTY) {
          status = WINDOW_REQUESTED;
          doFetch = true;
        }
        if (i === index && fetchRecords && status < WINDOW_RECORDS_REQUESTED) {
          if (status & WINDOW_READY && this.checkIfWindowIsFetched(i)) {
            status = WINDOW_READY | WINDOW_RECORDS_READY;
          } else {
            status = status | WINDOW_RECORDS_REQUESTED;
            doFetch = true;
          }
        }
        windows[i] = status;
      }
      if (doFetch) {
        this.get("source").fetchQuery(this);
      }
      return this;
    },
    // Precondition: all ids are known
    checkIfWindowIsFetched(index) {
      const store = this.get("store");
      const windowSize = this.get("windowSize");
      const list = this._storeKeys;
      let i = index * windowSize;
      const l = Math.min(i + windowSize, this.get("length"));
      let status;
      for (; i < l; i += 1) {
        status = store.getStatus(list[i]);
        if (!(status & READY) || status & OBSOLETE && !(status & LOADING)) {
          return false;
        }
      }
      return true;
    },
    /**
            Method: O.WindowedQuery#recalculateFetchedWindows
    
            Recalculates whether the ids and records are fetched for windows,
            for all windows with an index equal or greater than that of the window
            containing the start index given.
    
            Although the information on whether the records for a window are loaded
            is reset, it is not recalculated; this will be done on demand when a
            fetch is made for the window.
    
            Parameters:
                start - {Number} The index of the first record to have changed (i.e.
                        invalidate all window information starting from the window
                        containing this index).
                length - {Number} The new length of the list.
        */
    recalculateFetchedWindows(start, length) {
      if (!start) {
        start = 0;
      }
      if (length === void 0) {
        length = this.get("length");
      }
      const windowSize = this.get("windowSize");
      const windows = this._windows;
      const list = this._storeKeys;
      let windowIndex = Math.floor((length - 1) / windowSize);
      let listIndex = length - 1;
      start = Math.floor(start / windowSize);
      windows.length = windowIndex + 1;
      while (windowIndex >= start) {
        const target = windowIndex * windowSize;
        let status = (windows[windowIndex] || 0) & ~WINDOW_RECORDS_READY;
        status |= WINDOW_READY;
        while (listIndex >= target) {
          if (!list[listIndex]) {
            status = status & ~WINDOW_READY;
            break;
          }
          listIndex -= 1;
        }
        windows[windowIndex] = status;
        listIndex = target - 1;
        windowIndex -= 1;
      }
      return this;
    },
    // ---- Updates ---
    _normaliseUpdate(update) {
      const list = this._storeKeys;
      let removedStoreKeys = update.removed;
      let removedIndexes = mapIndexes(list, removedStoreKeys);
      const addedStoreKeys = [];
      const addedIndexes = [];
      const added = update.added;
      let i;
      let l;
      sortLinkedArrays(removedIndexes, removedStoreKeys);
      for (i = 0; removedIndexes[i] === -1; i += 1) {
      }
      if (i) {
        removedIndexes = removedIndexes.slice(i);
        removedStoreKeys = removedStoreKeys.slice(i);
      }
      const truncateAtFirstGap = !!i;
      for (i = 0, l = added.length; i < l; i += 1) {
        const { index, storeKey } = added[i];
        const j = removedStoreKeys.indexOf(storeKey);
        if (j > -1 && removedIndexes[j] - j + addedIndexes.length === index) {
          removedIndexes.splice(j, 1);
          removedStoreKeys.splice(j, 1);
        } else {
          addedIndexes.push(index);
          addedStoreKeys.push(storeKey);
        }
      }
      return {
        removedIndexes,
        removedStoreKeys,
        addedIndexes,
        addedStoreKeys,
        truncateAtFirstGap,
        total: update.total !== void 0 ? update.total : this.get("length") - removedIndexes.length + addedIndexes.length,
        upToId: update.upToId
      };
    },
    _applyUpdate(args) {
      const removedIndexes = args.removedIndexes;
      const removedStoreKeys = args.removedStoreKeys;
      const removedLength = removedStoreKeys.length;
      const addedIndexes = args.addedIndexes;
      const addedStoreKeys = args.addedStoreKeys;
      const addedLength = addedStoreKeys.length;
      const list = this._storeKeys;
      let recalculateFetchedWindows = !!(addedLength || removedLength);
      const oldLength = this.get("length");
      const newLength = args.total;
      let firstChange = oldLength;
      let listLength = list.length;
      if (args.upToId) {
        const index = list.lastIndexOf(args.upToId) + 1;
        if (index) {
          if (index !== listLength) {
            recalculateFetchedWindows = true;
            list.length = listLength = index;
            if (index < firstChange) {
              firstChange = index;
            }
          }
        } else {
          return this.reset();
        }
      }
      for (let i = removedLength - 1; i >= 0; i -= 1) {
        const index = removedIndexes[i];
        list.splice(index, 1);
        if (index < firstChange) {
          firstChange = index;
        }
      }
      if (args.truncateAtFirstGap) {
        let i = 0;
        while (list[i]) {
          i += 1;
        }
        list.length = listLength = i;
        if (i < firstChange) {
          firstChange = i;
        }
      }
      for (let i = 0, l = addedLength; i < l; i += 1) {
        const index = addedIndexes[i];
        const storeKey = addedStoreKeys[i];
        if (index >= listLength) {
          list[index] = storeKey;
          listLength = index + 1;
        } else {
          list.splice(index, 0, storeKey);
          listLength += 1;
        }
        if (index < firstChange) {
          firstChange = index;
        }
      }
      if (recalculateFetchedWindows) {
        this.recalculateFetchedWindows(firstChange, newLength);
      }
      this.set("length", newLength).rangeDidChange(
        firstChange,
        Math.max(oldLength, newLength)
      );
      this.fire("query:updated", {
        query: this,
        removed: removedStoreKeys,
        removedIndexes,
        added: addedStoreKeys,
        addedIndexes
      });
      this._applyWaitingPackets();
      return this;
    },
    _applyWaitingPackets() {
      let didDropPackets = false;
      const waitingPackets = this._waitingPackets;
      const queryState = this.get("queryState");
      let packet;
      for (let i = waitingPackets.length - 1; i >= 0; i -= 1) {
        packet = waitingPackets.shift();
        if (packet.queryState !== queryState) {
          didDropPackets = true;
        } else {
          this.sourceDidFetchIds(packet);
        }
      }
      if (didDropPackets) {
        this._fetchObservedWindows();
      }
    },
    _fetchObservedWindows() {
      const ranges = meta(this).rangeObservers;
      const length = this.get("length");
      const windowSize = this.get("windowSize");
      if (ranges) {
        for (let i = ranges.length - 1; i >= 0; i -= 1) {
          const range = ranges[i].range;
          let observerStart = range.start || 0;
          let observerEnd = "end" in range ? range.end : length;
          if (observerStart < 0) {
            observerStart += length;
          }
          if (observerEnd < 0) {
            observerEnd += length;
          }
          let firstWindow = Math.floor(observerStart / windowSize);
          const lastWindow = Math.floor((observerEnd - 1) / windowSize);
          for (; firstWindow <= lastWindow; firstWindow += 1) {
            this.fetchWindow(firstWindow, true);
          }
        }
      }
    },
    /**
            Method: O.WindowedQuery#clientDidGenerateUpdate
    
            Call this to update the list with what you think the server will do
            after an action has committed. The change will be applied immediately,
            making the UI more responsive, and be checked against what actually
            happened next time an update arrives. If it turns out to be wrong the
            list will be reset, but in most cases it should appear more efficient.
    
            removed - {String[]} The store keys of all records to delete.
            added   - {Object[]} A list of objects with index and storeKey
                      properties, in ascending order of index, for all records to be
                      inserted.
    
            Parameters:
                update - {Object} The removed/added updates to make.
    
            Returns:
                {O.WindowedQuery} Returns self.
        */
    clientDidGenerateUpdate(update) {
      update = this._normaliseUpdate(update);
      update.truncateAtFirstGap = false;
      this._applyUpdate(update);
      this._preemptiveUpdates.push(update);
      this.set("status", this.get("status") | DIRTY);
      this.setObsolete();
      return this;
    },
    /**
            Method: O.WindowedQuery#sourceDidFetchUpdate
    
            The source should call this when it fetches a delta update for the
            query. The args object should contain the following properties:
    
            newQueryState - {String} The state this delta updates the remote query
                            to.
            oldQueryState - {String} The state this delta updates the remote query
                            from.
            removed  - {String[]} The ids of all records removed since
                       oldQueryState.
            added    - {{index: Number, id: String}[]} A list of { index, id }
                       objects, in ascending order of index, for all records added
                       since oldQueryState.
            upToId   - {String} (optional) As an optimisation, updates may only be
                       for the first portion of a list, up to a certain id. This is
                       the last id which is included in the range covered by the
                       updates; any information past this id must be discarded, and
                       if the id can't be found the list must be reset.
            total    - {Number} (optional) The total number of records in the list.
    
            Parameters:
                update - {Object} The delta update (see description above).
    
            Returns:
                {O.WindowedQuery} Returns self.
        */
    sourceDidFetchUpdate(update) {
      const queryState = this.get("queryState");
      const status = this.get("status");
      const preemptives = this._preemptiveUpdates;
      const preemptivesLength = preemptives.length;
      this.set("status", status & ~LOADING);
      if (queryState === update.newQueryState) {
        if (preemptivesLength && !(status & DIRTY)) {
          const allPreemptives = preemptives.reduce(composeUpdates);
          this._applyUpdate(invertUpdate(allPreemptives));
          preemptives.length = 0;
        }
        return this;
      }
      if (queryState !== update.oldQueryState) {
        return this.setObsolete();
      }
      this.set("queryState", update.newQueryState || "");
      const toStoreKey = this.get("_toStoreKey");
      const added = update.added.map((item) => ({
        index: item.index,
        storeKey: toStoreKey(item.id)
      }));
      const seenStorekey = {};
      const removed = update.removed.reduce((_removed, id) => {
        const storeKey = toStoreKey(id);
        if (!seenStorekey[storeKey]) {
          seenStorekey[storeKey] = true;
          _removed.push(storeKey);
        }
        return _removed;
      }, []);
      const upToId = update.upToId && toStoreKey(update.upToId);
      const total = update.total;
      if (!preemptivesLength) {
        this._applyUpdate(
          this._normaliseUpdate({
            removed,
            added,
            total,
            upToId
          })
        );
      } else {
        const composed = [preemptives[0]];
        for (let i = 1; i < preemptivesLength; i += 1) {
          composed[i] = composeUpdates(composed[i - 1], preemptives[i]);
        }
        const removedIndexes = [];
        const removedStoreKeys = [];
        const normalisedUpdate = {
          removedIndexes,
          removedStoreKeys,
          addedIndexes: added.map((item) => item.index),
          addedStoreKeys: added.map((item) => item.storeKey),
          truncateAtFirstGap: false,
          total,
          upToId
        };
        const list = this._storeKeys;
        const indexesToRemove = [];
        const storeKeysToRemove = [];
        let wasSuccessfulPreemptive = false;
        let allPreemptives = composed[preemptivesLength - 1];
        for (let i = 0, l = removed.length; i < l; i += 1) {
          const storeKey = removed[i];
          let index = allPreemptives.removedStoreKeys.indexOf(storeKey);
          if (index > -1) {
            removedIndexes.push(allPreemptives.removedIndexes[index]);
            removedStoreKeys.push(storeKey);
          } else {
            index = list.indexOf(storeKey);
            if (index > -1) {
              indexesToRemove.push(index);
              storeKeysToRemove.push(storeKey);
            } else {
              normalisedUpdate.truncateAtFirstGap = true;
            }
          }
        }
        if (storeKeysToRemove.length) {
          const composedUpdate = composeUpdates(allPreemptives, {
            removedIndexes: indexesToRemove,
            removedStoreKeys: storeKeysToRemove,
            addedIndexes: [],
            addedStoreKeys: []
          });
          const composedRemovedSKs = composedUpdate.removedStoreKeys;
          const composedRemovedIndexes = composedUpdate.removedIndexes;
          for (let i = 0, l = storeKeysToRemove.length; i < l; i += 1) {
            const storeKey = storeKeysToRemove[i];
            const index = composedRemovedSKs.indexOf(storeKey);
            if (index > -1) {
              removedIndexes.push(composedRemovedIndexes[index]);
              removedStoreKeys.push(storeKey);
            } else {
              normalisedUpdate.truncateAtFirstGap = true;
            }
          }
        }
        sortLinkedArrays(removedIndexes, removedStoreKeys);
        const addedIndexes = normalisedUpdate.addedIndexes;
        const addedStoreKeys = normalisedUpdate.addedStoreKeys;
        for (let i = addedIndexes.length - 1; i >= 0; i -= 1) {
          const storeKey = addedStoreKeys[i];
          const j = removedStoreKeys.indexOf(storeKey);
          if (j > -1 && removedIndexes[j] - j + i === addedIndexes[i]) {
            removedIndexes.splice(j, 1);
            removedStoreKeys.splice(j, 1);
            addedIndexes.splice(i, 1);
            addedStoreKeys.splice(i, 1);
          }
        }
        if (!removedStoreKeys.length && !addedStoreKeys.length) {
          wasSuccessfulPreemptive = true;
        } else {
          for (let i = composed.length - 1; i >= 0; i -= 1) {
            if (updateIsEqual(normalisedUpdate, composed[i])) {
              preemptives.splice(0, i + 1);
              wasSuccessfulPreemptive = true;
              break;
            }
          }
        }
        if (wasSuccessfulPreemptive) {
          if (normalisedUpdate.truncateAtFirstGap) {
            let i = 0;
            while (list[i]) {
              i += 1;
            }
            if (list.length !== i) {
              list.length = i;
              this.recalculateFetchedWindows(i);
            }
          }
          if (!(status & DIRTY) && preemptives.length) {
            allPreemptives = preemptives.reduce(composeUpdates);
            this._applyUpdate(invertUpdate(allPreemptives));
            preemptives.length = 0;
          } else {
            this._applyWaitingPackets();
          }
        } else {
          preemptives.length = 0;
          this._applyUpdate(
            composeUpdates(
              invertUpdate(allPreemptives),
              normalisedUpdate
            )
          );
        }
      }
      return this;
    },
    /**
            Method: O.WindowedQuery#sourceDidFetchIds
    
            The source should call this when it fetches a portion of the id list for
            this query. The args object should contain:
    
            queryState - {String} The queryState of the server when this slice was
                         taken.
            ids        - {String[]} The list of ids.
            position   - {Number} The index in the query of the first id in ids.
            total      - {Number} The total number of records in the query.
    
            Parameters:
                args - {Object} The portion of the overall id list. See above for
                       details.
    
            Returns:
                {O.WindowedQuery} Returns self.
        */
    sourceDidFetchIds(args) {
      const queryState = this.get("queryState");
      const status = this.get("status");
      const oldLength = this.get("length") || 0;
      const canGetDeltaUpdates = this.get("canGetDeltaUpdates");
      let position = args.position;
      let total = args.total;
      const ids = args.ids;
      let length = ids.length;
      const list = this._storeKeys;
      const windows = this._windows;
      const preemptives = this._preemptiveUpdates;
      let informAllRangeObservers = false;
      let beginningOfWindowIsFetched = true;
      if (queryState && queryState !== args.queryState) {
        if (canGetDeltaUpdates) {
          this._waitingPackets.push(args);
          return this.setObsolete().fetch();
        } else {
          list.length = windows.length = preemptives.length = 0;
          informAllRangeObservers = true;
        }
      }
      this.set("queryState", args.queryState || "");
      const toStoreKey = this.get("_toStoreKey");
      const storeKeys = ids.map(toStoreKey);
      if (preemptives.length) {
        const allPreemptives = preemptives.reduce(composeUpdates);
        const addedIndexes = allPreemptives.addedIndexes;
        const addedStoreKeys = allPreemptives.addedStoreKeys;
        const removedIndexes = allPreemptives.removedIndexes;
        if (canGetDeltaUpdates) {
          for (let i = removedIndexes.length - 1; i >= 0; i -= 1) {
            const index = removedIndexes[i] - position;
            if (index < length) {
              if (index >= 0) {
                storeKeys.splice(index, 1);
                length -= 1;
              } else {
                position -= 1;
              }
            }
          }
          for (let i = 0, l = addedIndexes.length; i < l; i += 1) {
            const index = addedIndexes[i] - position;
            if (index <= 0) {
              position += 1;
            } else if (index < length) {
              storeKeys.splice(index, 0, addedStoreKeys[i]);
              length += 1;
            } else {
              break;
            }
          }
          total = allPreemptives.total;
        } else {
          this._applyUpdate(invertUpdate(allPreemptives));
          preemptives.length = 0;
        }
      }
      const end = position + length;
      for (let i = 0; i < length; i += 1) {
        list[position + i] = storeKeys[i];
      }
      const windowSize = this.get("windowSize");
      let windowIndex = Math.floor(position / windowSize);
      const withinWindowIndex = position % windowSize;
      if (withinWindowIndex) {
        for (let i = windowIndex * windowSize, l = i + withinWindowIndex; i < l; i += 1) {
          if (!list[i]) {
            beginningOfWindowIsFetched = false;
            break;
          }
        }
        if (beginningOfWindowIsFetched) {
          length += withinWindowIndex;
        } else {
          windowIndex += 1;
          length -= windowSize - withinWindowIndex;
        }
      }
      while ((length -= windowSize) >= 0) {
        windows[windowIndex] |= WINDOW_READY;
        windowIndex += 1;
      }
      length += windowSize;
      if (length && end === total && length === total % windowSize) {
        windows[windowIndex] |= WINDOW_READY;
      }
      return this.beginPropertyChanges().set("length", total).set("status", READY | status & (DIRTY | LOADING | OBSOLETE)).endPropertyChanges().rangeDidChange(
        informAllRangeObservers ? 0 : position,
        informAllRangeObservers ? Math.max(oldLength, end) : end
      ).fire("query:idsLoaded");
    },
    sourceWillFetchQuery() {
      const windowSize = this.get("windowSize");
      const windows = this._windows;
      const isAnExplicitIdFetch = this._isAnExplicitIdFetch;
      const indexOfRequested = this._indexOfRequested;
      const refreshRequested = this._refresh;
      const recordRequests = [];
      const idRequests = [];
      const optimiseFetching = this.get("optimiseFetching");
      const ranges = (meta(this).rangeObservers || []).map(
        (observer) => observer.range
      );
      const fetchAllObservedIds = refreshRequested && !this.get("canGetDeltaUpdates");
      const prefetch = this.get("prefetch");
      this._isAnExplicitIdFetch = false;
      this._indexOfRequested = [];
      this._refresh = false;
      let rPrev;
      let iPrev;
      for (let i = 0, l = windows.length; i < l; i += 1) {
        let status = windows[i];
        if (status & (WINDOW_REQUESTED | WINDOW_RECORDS_REQUESTED)) {
          const inUse = !optimiseFetching || windowIsStillInUse(i, windowSize, prefetch, ranges);
          if (status & WINDOW_RECORDS_REQUESTED) {
            status &= ~WINDOW_RECORDS_REQUESTED;
            if (inUse) {
              const start = i * windowSize;
              if (rPrev && rPrev.start + rPrev.count === start) {
                rPrev.count += windowSize;
              } else {
                recordRequests.push(
                  rPrev = {
                    start,
                    count: windowSize
                  }
                );
              }
              status |= WINDOW_LOADING;
              status |= WINDOW_RECORDS_LOADING;
            }
            if (inUse || !isAnExplicitIdFetch) {
              status &= ~WINDOW_REQUESTED;
            } else {
              status |= WINDOW_REQUESTED;
            }
          }
          if (status & WINDOW_REQUESTED) {
            if (inUse || isAnExplicitIdFetch) {
              const start = i * windowSize;
              if (iPrev && iPrev.start + iPrev.count === start) {
                iPrev.count += windowSize;
              } else {
                idRequests.push(
                  iPrev = {
                    start,
                    count: windowSize
                  }
                );
              }
              status |= WINDOW_LOADING;
            }
            status &= ~WINDOW_REQUESTED;
          }
        } else if (fetchAllObservedIds) {
          const inUse = windowIsStillInUse(
            i,
            windowSize,
            prefetch,
            ranges
          );
          if (inUse) {
            const start = i * windowSize;
            if (iPrev && iPrev.start + iPrev.count === start) {
              iPrev.count += windowSize;
            } else {
              idRequests.push(
                iPrev = {
                  start,
                  count: windowSize
                }
              );
            }
          }
        }
        windows[i] = status;
      }
      if (refreshRequested || this.is(EMPTY)) {
        let status = this.get("status");
        status |= LOADING;
        status &= ~OBSOLETE;
        if (status & DIRTY && !this.get("store").hasChangesForType(this.get("Type"))) {
          status &= ~DIRTY;
        }
        this.set("status", status);
      }
      return {
        ids: idRequests,
        records: recordRequests,
        indexOf: indexOfRequested,
        refresh: refreshRequested,
        callback: () => {
          this._windows = this._windows.map(
            (status) => status & ~(WINDOW_LOADING | WINDOW_RECORDS_LOADING)
          );
          this.set("status", this.get("status") & ~LOADING);
          if (this.is(DIRTY) && !this.is(OBSOLETE)) {
            this.setObsolete();
          }
        }
      };
    }
  });

  // source/datastore/source/Source.js
  var Source = Class({
    Name: "Source",
    Extends: Obj,
    // ---
    /**
            Method: O.Source#fetchRecord
    
            Fetches a particular record from the source
    
            Parameters:
                accountId - {String} The account id.
                Type      - {O.Class} The record type.
                id        - {String} The record id.
                callback  - {Function} (optional) A callback to make after the
                           record fetch completes (successfully or unsuccessfully).
    
            Returns:
                {Boolean} Returns true if the source handled the fetch.
        */
    fetchRecord() {
      return false;
    },
    /**
            Method: O.Source#fetchAllRecords
    
            Fetches all records of a particular type from the source. If a state
            token is supplied, the server may, if it is able to, only return the
            changes since that state.
    
            Parameters:
                accountId - {String} The account id.
                Type      - {O.Class} The record type.
                state     - {(String|undefined)} The current state in the store.
                callback  - {Function} (optional) A callback to make after the
                            record fetch completes (successfully or unsuccessfully).
    
            Returns:
                {Boolean} Returns true if the source handled the fetch.
        */
    fetchAllRecords() {
      return false;
    },
    /**
            Method: O.Source#refreshRecord
    
            Fetches any new data for a previously fetched record. If not overridden,
            this method just calls <O.Source#fetchRecord>.
    
            Parameters:
                accountId - {String} The account id.
                Type      - {O.Class} The record type.
                id        - {String} The record id.
                callback  - {Function} (optional) A callback to make after the
                            record refresh completes (successfully or
                            unsuccessfully).
    
            Returns:
                {Boolean} Returns true if the source handled the refresh.
        */
    refreshRecord(accountId, Type, id, callback) {
      return this.fetchRecord(accountId, Type, id, callback);
    },
    /**
            Method: O.Source#fetchQuery
    
            Fetches the data for a remote query from the source.
    
            Parameters:
                query - {O.Query} The query to fetch.
    
            Returns:
                {Boolean} Returns true if the source handled the fetch.
        */
    fetchQuery() {
      return false;
    },
    /**
            Method: O.Source#commitChanges
    
            Commits a set of creates/updates/destroys to the source. These are
            specified in a single object, which has record type names as keys and an
            object with create/update/destroy properties as values.
    
            A changedMap, is a map of attribute names to a boolean value indicating
            whether that value has actually changed. Any properties in the data
            which are not in the changed map are presumed unchanged.
    
            An example call might look like:
    
                source.commitChanges({
                    MyType: {
                        Type,
                        accountId,
                        primaryKey,
                        create: {
                            storeKeys: [ "sk1", "sk2" ],
                            records: [{ attr: val, attr2: val2 ...}, {...}]
                        },
                        update: {
                            storeKeys: [ "sk3", "sk4", ... ],
                            records: [{ id: "id3", attr: val ... }, {...}],
                            changes: [{ attr: true }, ... ]
                        },
                        moveFromAccount: {
                            previousAccountId: ... same as update ...
                            ...
                        },
                        destroy: {
                            storeKeys: [ "sk5", "sk6" ],
                            ids: [ "id5", "id6" ]
                        },
                        state: "i425m515233"
                    },
                    MyOtherType: {
                        ...
                    }
                });
    
            Parameters:
                changes  - {Object} The creates/updates/destroys to commit.
                callback - {Function} (optional) A callback to make after the
                           changes have been committed.
    
            Returns:
                {Boolean} Returns true if any of the types were handled. The
                callback will only be called if the source is handling at least one
                of the types being committed.
        */
    commitChanges() {
      return false;
    }
  });

  // source/datastore/source/AggregateSource.js
  var AggregateSource = Class({
    Name: "AggregateSource",
    Extends: Source,
    init: function() {
      this.sources = [];
      AggregateSource.parent.constructor.apply(this, arguments);
    },
    /**
            Property: O.AggregateSource#sources
            Type: O.Source[]
    
            List of sources to pass requests to. Will be tried in order.
        */
    /**
            Method: O.AggregateSource#addSource
    
            Parameters:
                source - {O.Source} The source to add to the end of the list of
                         aggregated sources.
    
            Returns:
                {O.AggregateSource} Returns self.
        */
    addSource(source) {
      source.set("store", this.get("store"));
      this.get("sources").push(source);
      return this;
    },
    /**
            Method: O.AggregateSource#removeSource
    
            Parameters:
                source - {O.Source} The source to remove from the list of aggregated
                         sources.
    
            Returns:
                {O.AggregateSource} Returns self.
        */
    removeSource(source) {
      this.get("sources").erase(source);
      return this;
    },
    storeWasSet: function() {
      const store = this.get("store");
      this.sources.forEach((source) => {
        source.set("store", store);
      });
    }.observes("store"),
    fetchRecord(accountId, Type, id, callback) {
      return this.get("sources").some((source) => {
        return source.fetchRecord(accountId, Type, id, callback);
      });
    },
    fetchAllRecords(accountId, Type, state, callback) {
      return this.get("sources").some((source) => {
        return source.fetchAllRecords(accountId, Type, state, callback);
      });
    },
    refreshRecord(accountId, Type, id, callback) {
      return this.get("sources").some((source) => {
        return source.refreshRecord(accountId, Type, id, callback);
      });
    },
    commitChanges(changes, callback) {
      let waiting = 0;
      let callbackAfterAll;
      if (callback) {
        callbackAfterAll = function() {
          if (!(waiting -= 1)) {
            callback();
          }
        };
      }
      this.get("sources").forEach((source) => {
        if (source.commitChanges(changes, callbackAfterAll)) {
          waiting += 1;
        }
      });
      return this;
    },
    fetchQuery(query, callback) {
      return this.get("sources").some((source) => {
        return source.fetchQuery(query, callback);
      });
    }
  });

  // source/datastore/store/MemoryManager.js
  var MemoryManager = class {
    /**
            Property (private): O.MemoryManager#_index
            Type: Number
    
            Keeps track of which record type we need to examine next.
        */
    /**
            Property (private): O.MemoryManager#_store
            Type: O.Store
    
            The store where the records are stored.
        */
    /**
            Property (private): O.MemoryManager#_restrictions
            Type: Array
    
            An array of objects, each containing the properties:
            - Type: The constructor for the Record or Query subclass.
            - max: The maximum number allowed.
            - afterCleanup: An optional callback after cleanup, which will be given
              an array of removed objects of the given type, every time some are
              removed from the store.
        */
    /**
            Property: O.MemoryManager#timeout
            Type: Number
            Default: 30000 (30 seconds)
    
            The time in milliseconds between running the cleanup function.
        */
    /**
            Constructor: O.MemoryManager
    
            Parameters:
                store        - {Store} The store to be memory managed.
                restrictions - {Array} An array of objects, each containing the
                               properties:
                               * Type: The constructor for the Record or Query
                                 subclass.
                               * max: The maximum number allowed.
                               * afterCleanup: An optional callback after cleanup,
                                 which will be given an array of removed objects of
                                 the given type, every time some are removed from
                                 the store.
                timeout      - {Number} (optional) How long after a change the
                               cleanup function is called in milliseconds. Default
                               is 30000.
        */
    constructor(store, restrictions, timeout) {
      this._index = 0;
      this._store = store;
      this._restrictions = restrictions;
      this._timer = null;
      this._isRunning = false;
      this.isPaused = false;
      this.timeout = timeout || 3e4;
      restrictions.forEach(({ Type }) => {
        if (Type.prototype instanceof Record) {
          store.on(Type, this, "needsCleanup");
        }
      });
    }
    /**
            Method: O.MemoryManager#addRestriction
    
            Parameters:
                restriction - {Object} An object describing the restriction for a
                              type (see constructor for format).
    
            Adds a restriction for a new type after initialisation.
    
            Returns:
                {O.MemoryManager} Returns self.
        */
    addRestriction(restriction) {
      this._restrictions.push(restriction);
      return this;
    }
    needsCleanup() {
      if (!this._timer && !this._isRunning) {
        this._timer = invokeAfterDelay(this.cleanup, this.timeout, this);
      }
    }
    /**
            Method: O.MemoryManager#cleanup
    
            Examines the store to see how many entries of each record type are
            present and removes references to the least recently accessed records
            until the number is under the set limit for that type. This is
            automatically called periodically by the memory manager.
        */
    cleanup() {
      this._timer = null;
      let index = this._index;
      const restrictions = this._restrictions[index];
      const Type = restrictions.Type;
      let ParentType = Type;
      const max = restrictions.max;
      const afterFn = restrictions.afterCleanup;
      let deleted;
      if (!this._isRunning && this.isPaused) {
        this.needsCleanup();
        return;
      }
      this._isRunning = true;
      do {
        if (ParentType === Record) {
          deleted = this.cleanupRecordType(Type, max);
          break;
        } else if (ParentType === Query) {
          deleted = this.cleanupQueryType(Type, max);
          break;
        }
      } while (ParentType = ParentType.parent.constructor);
      if (afterFn) {
        afterFn(deleted);
      }
      this._index = index = (index + 1) % this._restrictions.length;
      if (index) {
        invokeInNextEventLoop(this.cleanup, this);
      } else {
        this._isRunning = false;
      }
    }
    /**
            Method: O.MemoryManager#cleanupRecordType
    
            Parameters:
                Type - {O.Class} The record type.
                max  - {Number} The maximum number allowed.
    
            Removes excess records from the store.
        */
    cleanupRecordType(Type, max) {
      const store = this._store;
      const _skToLastAccess = store._skToLastAccess;
      const _skToData = store._skToData;
      const storeKeys = Object.keys(store._typeToSKToId[guid(Type)] || {});
      const length = storeKeys.length;
      let numberToDelete = length - max;
      const deleted = [];
      storeKeys.sort((a, b) => {
        return _skToLastAccess[b] - _skToLastAccess[a];
      });
      for (let i = length - 1; numberToDelete > 0 && i >= 0; i -= 1) {
        const storeKey = storeKeys[i];
        const data = _skToData[storeKey];
        if (store.unloadRecord(storeKey)) {
          numberToDelete -= 1;
          if (data) {
            deleted.push(data);
          }
        }
      }
      return deleted;
    }
    /**
            Method: O.MemoryManager#cleanupQueryType
    
            Parameters:
                Type - {O.Class} The query type.
                max  - {Number} The maximum number allowed.
    
            Removes excess remote queries from the store.
        */
    cleanupQueryType(Type, max) {
      const queries = this._store.getAllQueries().filter((query) => {
        return query instanceof Type;
      });
      const length = queries.length;
      let numberToDelete = length - max;
      const deleted = [];
      queries.sort((a, b) => {
        return b.lastAccess - a.lastAccess;
      });
      for (let i = length - 1; numberToDelete > 0 && i >= 0; i -= 1) {
        const query = queries[i];
        if (!query.hasObservers() && !query.hasRangeObservers()) {
          query.destroy();
          deleted.push(query);
          numberToDelete -= 1;
        }
      }
      return deleted;
    }
  };

  // source/datastore/store/Store.js
  var CANNOT_CREATE_EXISTING_RECORD_ERROR = "O.Store Error: Cannot create existing record";
  var CANNOT_WRITE_TO_UNREADY_RECORD_ERROR = "O.Store Error: Cannot write to unready record";
  var SOURCE_COMMIT_CREATE_MISMATCH_ERROR = "O.Store Error: Source committed a create on a record not marked new";
  var SOURCE_COMMIT_DESTROY_MISMATCH_ERROR = "O.Store Error: Source commited a destroy on a record not marked destroyed";
  var nextStoreKey = 1;
  var generateStoreKey = function() {
    const current = "k" + nextStoreKey;
    nextStoreKey += 1;
    return current;
  };
  var mayHaveChanges = function(store) {
    queueFn("before", store.checkForChanges, store);
    return store;
  };
  var acceptStoreKey = function(accept, storeKey) {
    return accept(this._skToData[storeKey], this, storeKey);
  };
  var compareStoreKeys = function(compare2, a, b) {
    const { _skToData } = this;
    const aIsFirst = compare2(_skToData[a], _skToData[b], this, a, b);
    return aIsFirst || ~~a.slice(1) - ~~b.slice(1);
  };
  var STRING_ID = 0;
  var ARRAY_IDS = 1;
  var SET_IDS = 2;
  var typeToForeignRefAttrs = {};
  var getForeignRefAttrs = function(Type) {
    const typeId = guid(Type);
    let foreignRefAttrs = typeToForeignRefAttrs[typeId];
    if (!foreignRefAttrs) {
      const proto = Type.prototype;
      const attrs = meta(proto).attrs;
      foreignRefAttrs = [];
      for (const attrKey in attrs) {
        const propKey = attrs[attrKey];
        const attribute = propKey && proto[propKey];
        if (attribute instanceof ToOneAttribute) {
          foreignRefAttrs.push([attrKey, STRING_ID, attribute.Type]);
        }
        if (attribute instanceof ToManyAttribute) {
          foreignRefAttrs.push([
            attrKey,
            attribute.Type === Object ? SET_IDS : ARRAY_IDS,
            attribute.recordType
          ]);
        }
      }
      typeToForeignRefAttrs[typeId] = foreignRefAttrs;
    }
    return foreignRefAttrs;
  };
  var convertForeignKeysToSK = function(store, foreignRefAttrs, data, accountId) {
    const l = foreignRefAttrs.length;
    for (let i = 0; i < l; i += 1) {
      const foreignRef = foreignRefAttrs[i];
      const attrKey = foreignRef[0];
      const AttrType = foreignRef[2];
      const idType = foreignRef[1];
      if (attrKey in data) {
        const value = data[attrKey];
        data[attrKey] = value && (idType === STRING_ID ? store.getStoreKey(accountId, AttrType, value) : idType === ARRAY_IDS ? value.map(
          store.getStoreKey.bind(store, accountId, AttrType)
        ) : (
          // idType === SET_IDS ?
          zip(
            Object.keys(value).map(
              store.getStoreKey.bind(
                store,
                accountId,
                AttrType
              )
            ),
            Object.values(value)
          )
        ));
      }
    }
  };
  var toId = function(store, storeKey) {
    return store.getIdFromStoreKey(storeKey) || "#" + storeKey;
  };
  var convertForeignKeysToId = function(store, Type, data) {
    const foreignRefAttrs = getForeignRefAttrs(Type);
    let result = data;
    const l = foreignRefAttrs.length;
    for (let i = 0; i < l; i += 1) {
      const foreignRef = foreignRefAttrs[i];
      const attrKey = foreignRef[0];
      const idType = foreignRef[1];
      if (attrKey in data) {
        if (result === data) {
          result = clone(data);
        }
        const value = data[attrKey];
        result[attrKey] = value && (idType === STRING_ID ? toId(store, value) : idType === ARRAY_IDS ? value.map(toId.bind(null, store)) : (
          // idType === SET_IDS ?
          zip(
            Object.keys(value).map(toId.bind(null, store)),
            Object.values(value)
          )
        ));
      }
    }
    return result;
  };
  var getChanged = function(Type, a, b) {
    const changed = {};
    const clientSettable = Record.getClientSettableAttributes(Type);
    let hasChanges = false;
    for (const key in a) {
      if (clientSettable[key] && !isEqual(a[key], b[key])) {
        changed[key] = true;
        hasChanges = true;
      }
    }
    return hasChanges ? changed : null;
  };
  var getDelta = function(Type, data, changed) {
    const proto = Type.prototype;
    const attrs = meta(proto).attrs;
    const delta2 = {};
    for (const attrKey in changed) {
      if (changed[attrKey]) {
        let value = data[attrKey];
        if (value === void 0) {
          value = proto[attrs[attrKey]].defaultValue;
        }
        delta2[attrKey] = value;
      }
    }
    return delta2;
  };
  var Store = Class({
    Name: "Store",
    Extends: Obj,
    /**
            Property: O.Store#autoCommit
            Type: Boolean
            Default: true
    
            If true, the store will automatically commit any changes at the end of
            the RunLoop in which they are made.
        */
    autoCommit: true,
    /**
            Property: O.Store#rebaseConflicts
            Type: Boolean
            Default: true
    
            If true, in the event that new data is loaded for a dirty record, the
            store will apply the changes made to the previous committed state on top
            of the current committed state, rather than just discarding the changes.
        */
    rebaseConflicts: true,
    /**
            Property: O.Store#isNested
            Type: Boolean
    
            Is this a nested store?
        */
    isNested: false,
    /**
            Property: O.Store#hasChanges
            Type: Boolean
    
            Are there any changes in the store?
        */
    /**
            Constructor: O.Store
    
            Parameters:
                ...mixins - {Object} Objects to mix in, which must include a
                            parameter named `source` of type {O.Source}, the source
                            for this store.
        */
    init: function() {
      this._typeToSKToId = {};
      this._skToAccountId = {};
      this._skToType = {};
      this._skToStatus = {};
      this._skToData = {};
      this._skToChanged = {};
      this._skToCommitted = {};
      this._skToRollback = {};
      this._skToRecord = {};
      this._skToLastAccess = {};
      this.hasChanges = false;
      this.isCommitting = false;
      this._created = {};
      this._destroyed = {};
      this._idToQuery = {};
      this._changedTypes = {};
      this._nestedStores = [];
      this._accounts = {};
      Store.parent.constructor.apply(this, arguments);
      if (!this.get("isNested")) {
        this.source.set("store", this);
      }
    },
    // === Nested Stores =======================================================
    /**
            Method: O.Store#addNested
    
            Registers a new nested store. Automatically called by the
            <O.NestedStore> constructor; there should be no need to do it manually.
    
            Parameters:
                store - {O.NestedStore} The new nested store.
    
            Returns:
                {O.Store} Returns self.
        */
    addNested(store) {
      this._nestedStores.push(store);
      return this;
    },
    /**
            Method: O.Store#removeNested
    
            Deregisters a nested store previously registered with addNested.
            Automatically called by <O.NestedStore#destroy>; there should be no need
            to call this method manually.
    
            Parameters:
                store - {O.NestedStore} The nested store to deregister.
    
            Returns:
                {O.Store} Returns self.
    
        */
    removeNested(store) {
      this._nestedStores.erase(store);
      return this;
    },
    // === Accounts ============================================================
    /**
            Method: O.Store#getPrimaryAccountIdForType
    
            Get the default account ID for the specified type.
    
            The default implementation of this method basically doesn’t support the
            concept of a default accountId; accountId must always be specified, or
            this method will be called and throw a TypeError. This method is
            designed to be overridden, straight on the O.Store prototype. (Yes,
            that’s nasty. Sorry; c’est la vie.)
    
            Parameters:
                Type - {class extending O.Record}
    
            Returns:
                {string} Returns the primary accountId for data of that type.
        */
    getPrimaryAccountIdForType() {
      throw new TypeError("accountId cannot be inferred");
    },
    /**
            Method: O.Store#getAccount
    
            Get the account for the given account ID, or if it is not specified, the
            primary account for the given type.
    
            Parameters:
                accountId - {(string|undefined|null)}
                Type - {(class extending O.Record|undefined)}
    
            Returns:
                {(Object|undefined)} Returns the account data, or undefined if
                                     there’s not enough to go by or the details
                                     given don’t resolve to an account.
        */
    getAccount(accountId, Type) {
      if (!accountId) {
        accountId = this.getPrimaryAccountIdForType(Type);
      }
      return this._accounts[accountId];
    },
    addAccount(accountId, data) {
      const _accounts = this._accounts;
      const replaceAccountId = data.replaceAccountId;
      let account;
      if (replaceAccountId && (account = _accounts[replaceAccountId])) {
        if (data.accountCapabilities) {
          account.accountCapabilities = data.accountCapabilities;
        }
        const skToAccountId = this._skToAccountId;
        for (const sk in skToAccountId) {
          if (skToAccountId[sk] === replaceAccountId) {
            skToAccountId[sk] = accountId;
          }
        }
        delete _accounts[replaceAccountId];
      } else if (!(account = _accounts[accountId])) {
        account = {
          accountCapabilities: data.accountCapabilities,
          // Type -> status
          // READY      - Some records of type loaded
          // LOADING    - Loading or refreshing ALL records of type
          // COMMITTING - Committing some records of type
          status: {},
          // Type -> Promise. Resolved (and cleared) when
          // type becomes READY.
          awaitingReadyPromise: {},
          // Type -> Function (promise resolver). Called when
          // type becomes READY.
          awaitingReadyResolve: {},
          // Type -> state string for type in client
          clientState: {},
          // Type -> latest known state string for type on server
          // If committing or loading type, wait until finish to check
          serverState: {},
          // Type -> id -> store key
          typeToIdToSK: {},
          // Clients can set this to true while doing a batch of changes
          // to avoid fetching updates to related types during the process
          ignoreServerState: false
        };
      }
      _accounts[accountId] = account;
      return this;
    },
    // === Get/set Ids =========================================================
    /**
            Method: O.Store#getStoreKey
    
            Returns the store key for a particular record type and record id. This
            is guaranteed to be the same for that tuple until the record is unloaded
            from the store. If no id is supplied, a new store key is always
            returned.
    
            Parameters:
                accountId - {String|null} The account to use, or null for default.
                Type      - {O.Class} The constructor for the record type.
                id        - {String} (optional) The id of the record.
    
            Returns:
                {String} Returns the store key for that record type and id.
        */
    getStoreKey(accountId, Type, id) {
      if (!accountId) {
        accountId = this.getPrimaryAccountIdForType(Type);
      }
      const account = this._accounts[accountId];
      const typeId = guid(Type);
      const typeToIdToSK = account.typeToIdToSK;
      const idToSk = typeToIdToSK[typeId] || (typeToIdToSK[typeId] = {});
      let storeKey;
      if (id) {
        storeKey = idToSk[id];
      }
      if (!storeKey) {
        storeKey = generateStoreKey();
        this._skToType[storeKey] = Type;
        this._skToAccountId[storeKey] = accountId;
        const { _typeToSKToId } = this;
        const skToId = _typeToSKToId[typeId] || (_typeToSKToId[typeId] = {});
        skToId[storeKey] = id;
        if (id) {
          idToSk[id] = storeKey;
        }
      }
      return storeKey;
    },
    /**
            Method: O.Store#getIdFromStoreKey
    
            Get the record id for a given store key.
    
            Parameters:
                storeKey - {String} The store key to get the record id for.
    
            Returns:
                {(String|null)} Returns the id for the record, or null if the store
                key was not found or does not have an id (normally because the
                server assigns ids and the record has not yet been committed).
        */
    getIdFromStoreKey(storeKey) {
      const status = this._skToStatus[storeKey];
      const Type = this._skToType[storeKey];
      const skToId = this._typeToSKToId[guid(Type)];
      return !(status & NEW) && skToId && skToId[storeKey] || null;
    },
    /**
            Method: O.Store#getAccountIdFromStoreKey
    
            Get the account id for a given store key.
    
            Parameters:
                storeKey - {String} The store key to get the account id for.
    
            Returns:
                {(String)} Returns the id of the account the record belongs to.
        */
    getAccountIdFromStoreKey(storeKey) {
      const data = this._skToData[storeKey];
      return data ? data.accountId : this._skToAccountId[storeKey];
    },
    // === Client API ==========================================================
    /**
            Method: O.Store#getRecordStatus
    
            Returns the status value for a given record type and id.
    
            Parameters:
                accountId - {String|null} The account id.
                Type      - {O.Class} The record type.
                id        - {String} The record id.
    
            Returns:
                {O.Status} The status in this store of the given record.
        */
    getRecordStatus(accountId, Type, id) {
      const idToSk = this.getAccount(accountId, Type).typeToIdToSK[guid(Type)];
      return idToSk ? this.getStatus(idToSk[id]) : EMPTY;
    },
    /**
            Method: O.Store#getRecord
    
            Returns a record object for a particular type and id, creating it if it
            does not already exist and fetching its value if not already loaded in
            memory, unless the doNotFetch parameter is set.
    
            Parameters:
                accountId  - {String|null} The account id.
                Type       - {O.Class} The record type.
                id         - {String} The record id, or the store key prefixed with
                             a '#'.
                doNotFetch - {Boolean} (optional) If true, the record data will not
                             be fetched from the server if it is not already loaded.
    
            Returns:
                {O.Record|null} Returns the requested record, or null if no type or
                no id given.
        */
    getRecord(accountId, Type, id, doNotFetch) {
      let storeKey;
      if (!Type || !id) {
        return null;
      }
      if (id.charAt(0) === "#") {
        storeKey = id.slice(1);
        if (this._skToType[storeKey] !== Type) {
          return null;
        }
      } else {
        storeKey = this.getStoreKey(accountId, Type, id);
      }
      return this.getRecordFromStoreKey(storeKey, doNotFetch);
    },
    /**
            Method: O.Store#getOne
    
            Returns the first loaded record that matches an acceptance function.
    
            Parameters:
                Type   - {O.Class} The constructor for the record type to find.
                filter - {Function} (optional) An acceptance function. This will be
                         passed the raw data object (*not* a record instance) and
                         should return true if the record is the desired one, or
                         false otherwise.
    
            Returns:
                {(O.Record|null)} The matching record, or null if none found.
        */
    getOne(Type, filter2) {
      const storeKey = this.findOne(Type, filter2);
      return storeKey ? this.materialiseRecord(storeKey) : null;
    },
    /**
            Method: O.Store#getAll
    
            Returns a record array of records with data loaded for a particular
            type, optionally filtered and/or sorted.
    
            Parameters:
                Type   - {O.Class} The constructor for the record type being
                         queried.
                filter - {Function} (optional) An acceptance function. This will be
                         passed the raw data object (*not* a record instance) and
                         should return true if the record should be included, or
                         false otherwise.
                sort   - {Function} (optional) A comparator function. This will be
                         passed the raw data objects (*not* record instances) for
                         two records. It should return -1 if the first record should
                         come before the second, 1 if the inverse is true, or 0 if
                         they should have the same position.
    
            Returns:
                {O.RecordArray} A record array of results.
        */
    getAll(Type, filter2, sort) {
      const storeKeys = this.findAll(Type, filter2, sort);
      return new RecordArray(this, Type, storeKeys);
    },
    checkForChanges() {
      let storeKey;
      for (storeKey in this._created) {
        return this.set("hasChanges", true);
      }
      for (storeKey in this._skToChanged) {
        return this.set("hasChanges", true);
      }
      for (storeKey in this._destroyed) {
        return this.set("hasChanges", true);
      }
      return this.set("hasChanges", false);
    },
    hasChangesForType(Type) {
      const { _created, _destroyed, _skToChanged, _skToType } = this;
      for (const storeKey in _created) {
        if (Type === _skToType[storeKey]) {
          return true;
        }
      }
      for (const storeKey in _skToChanged) {
        if (Type === _skToType[storeKey]) {
          return true;
        }
      }
      for (const storeKey in _destroyed) {
        if (Type === _skToType[storeKey]) {
          return true;
        }
      }
      return false;
    },
    /**
            Method: O.Store#commitChanges
    
            Commits any outstanding changes (created/updated/deleted records) to the
            source. Will only invoke once per run loop, even if called multiple
            times.
    
            Returns:
                {O.Store} Returns self.
        */
    commitChanges: function() {
      if (this.get("isCommitting")) {
        return;
      }
      this.set("isCommitting", true);
      this.fire("willCommit");
      const {
        _typeToSKToId,
        _skToData,
        _skToStatus,
        _skToType,
        _skToChanged,
        _skToCommitted,
        _skToRollback,
        _created,
        _destroyed,
        _accounts
      } = this;
      const changes = {};
      let hasChanges = false;
      const getEntry = function(Type, accountId) {
        const typeId = guid(Type);
        let entry = changes[typeId + accountId];
        if (!entry) {
          const account = _accounts[accountId];
          const idPropKey = Type.primaryKey || "id";
          const idAttrKey = Type.prototype[idPropKey].key || idPropKey;
          entry = changes[typeId + accountId] = {
            Type,
            typeId,
            accountId,
            primaryKey: idAttrKey,
            create: { storeKeys: [], records: [] },
            update: {
              storeKeys: [],
              records: [],
              committed: [],
              changes: []
            },
            moveFromAccount: {},
            destroy: { storeKeys: [], ids: [] },
            state: account.clientState[typeId]
          };
          account.status[typeId] |= COMMITTING;
          hasChanges = true;
        }
        return entry;
      };
      for (const storeKey in _created) {
        const isCopyOfStoreKey = _created[storeKey];
        const status = _skToStatus[storeKey];
        const Type = _skToType[storeKey];
        let data = _skToData[storeKey];
        const accountId = data.accountId;
        const entry = getEntry(Type, accountId);
        let create3;
        if (isCopyOfStoreKey) {
          const changed = getChanged(
            Type,
            data,
            _skToData[isCopyOfStoreKey]
          );
          data = convertForeignKeysToId(this, Type, data);
          const previousAccountId = this.getAccountIdFromStoreKey(isCopyOfStoreKey);
          create3 = entry.moveFromAccount[previousAccountId] || (entry.moveFromAccount[previousAccountId] = {
            copyFromIds: [],
            storeKeys: [],
            records: [],
            changes: []
          });
          create3.copyFromIds.push(
            this.getIdFromStoreKey(isCopyOfStoreKey)
          );
          create3.changes.push(changed);
        } else {
          data = filter(
            convertForeignKeysToId(this, Type, data),
            Record.getClientSettableAttributes(Type)
          );
          create3 = entry.create;
        }
        create3.storeKeys.push(storeKey);
        create3.records.push(data);
        this.setStatus(storeKey, status & ~DIRTY | COMMITTING);
      }
      for (const storeKey in _skToChanged) {
        const status = _skToStatus[storeKey];
        const Type = _skToType[storeKey];
        const changed = filter(
          _skToChanged[storeKey],
          Record.getClientSettableAttributes(Type)
        );
        let previous = _skToCommitted[storeKey];
        delete _skToCommitted[storeKey];
        if (!Object.keys(changed).length) {
          this.setStatus(storeKey, status & ~DIRTY);
          continue;
        }
        let data = _skToData[storeKey];
        const accountId = data.accountId;
        const update = getEntry(Type, accountId).update;
        _skToRollback[storeKey] = previous;
        previous = convertForeignKeysToId(this, Type, previous);
        data = convertForeignKeysToId(this, Type, data);
        update.storeKeys.push(storeKey);
        update.records.push(data);
        update.committed.push(previous);
        update.changes.push(changed);
        this.setStatus(storeKey, status & ~DIRTY | COMMITTING);
      }
      for (const storeKey in _destroyed) {
        const status = _skToStatus[storeKey];
        const ifCopiedStoreKey = _destroyed[storeKey];
        if (!ifCopiedStoreKey || !_created[ifCopiedStoreKey]) {
          const Type = _skToType[storeKey];
          const accountId = _skToData[storeKey].accountId;
          const id = _typeToSKToId[guid(Type)][storeKey];
          const destroy = getEntry(Type, accountId).destroy;
          destroy.storeKeys.push(storeKey);
          destroy.ids.push(id);
        }
        this.setStatus(storeKey, status & ~DIRTY | COMMITTING);
      }
      this._skToChanged = {};
      this._created = {};
      this._destroyed = {};
      if (hasChanges) {
        this.source.commitChanges(changes, () => {
          for (const id in changes) {
            const entry = changes[id];
            const Type = entry.Type;
            const typeId = entry.typeId;
            const accountId = entry.accountId;
            _accounts[accountId].status[typeId] &= ~COMMITTING;
            this.checkServerState(accountId, Type);
          }
          this.set("isCommitting", false);
          if (this.get("autoCommit") && this.checkForChanges().get("hasChanges")) {
            this.commitChanges();
          }
        });
      } else {
        this.set("isCommitting", false);
      }
      this.set("hasChanges", false);
      this.fire("didCommit");
    }.queue("middle"),
    /**
            Method: O.Store#discardChanges
    
            Discards any outstanding changes (created/updated/deleted records),
            reverting the store to the last known committed state.
    
            Returns:
                {O.Store} Returns self.
        */
    discardChanges() {
      const {
        _created,
        _destroyed,
        _skToChanged,
        _skToCommitted,
        _skToType,
        _skToData
      } = this;
      for (const storeKey in _created) {
        this.destroyRecord(storeKey);
      }
      for (const storeKey in _skToChanged) {
        this.updateData(storeKey, _skToCommitted[storeKey], true);
      }
      for (const storeKey in _destroyed) {
        this.undestroyRecord(
          storeKey,
          _skToType[storeKey],
          _skToData[storeKey]
        );
      }
      this._created = {};
      this._destroyed = {};
      return this.set("hasChanges", false);
    },
    getInverseChanges() {
      const {
        _created,
        _destroyed,
        _skToType,
        _skToData,
        _skToChanged,
        _skToCommitted
      } = this;
      const inverse = {
        create: [],
        update: [],
        destroy: [],
        move: []
      };
      for (const storeKey in _created) {
        if (!_created[storeKey]) {
          inverse.destroy.push(storeKey);
        } else {
          const previousStoreKey = _created[storeKey];
          inverse.move.push([
            storeKey,
            this.getAccountIdFromStoreKey(previousStoreKey),
            previousStoreKey
          ]);
          inverse.update.push([
            previousStoreKey,
            getDelta(
              _skToType[storeKey],
              _skToData[previousStoreKey],
              getChanged(
                _skToType[storeKey],
                _skToData[previousStoreKey],
                _skToData[storeKey]
              )
            )
          ]);
        }
      }
      for (const storeKey in _skToChanged) {
        const committed = _skToCommitted[storeKey];
        const changed = _skToChanged[storeKey];
        const Type = _skToType[storeKey];
        const update = getDelta(Type, committed, changed);
        inverse.update.push([storeKey, update]);
      }
      for (const storeKey in _destroyed) {
        if (!_destroyed[storeKey]) {
          const Type = _skToType[storeKey];
          inverse.create.push([
            storeKey,
            Type,
            clone(_skToData[storeKey])
          ]);
        }
      }
      return inverse;
    },
    applyChanges(changes) {
      const create3 = changes.create;
      const update = changes.update;
      const destroy = changes.destroy;
      const move = changes.move;
      for (let i = 0, l = create3.length; i < l; i += 1) {
        const createObj = create3[i];
        const storeKey = createObj[0];
        const Type = createObj[1];
        const data = createObj[2];
        this.undestroyRecord(storeKey, Type, data);
      }
      for (let i = 0, l = move.length; i < l; i += 1) {
        const moveObj = move[i];
        const storeKey = moveObj[0];
        const toAccountId = moveObj[1];
        const previousStoreKey = moveObj[2];
        this.moveRecord(storeKey, toAccountId, previousStoreKey);
      }
      for (let i = 0, l = update.length; i < l; i += 1) {
        const updateObj = update[i];
        const storeKey = updateObj[0];
        const data = updateObj[1];
        this.updateData(storeKey, data, true);
      }
      for (let i = 0, l = destroy.length; i < l; i += 1) {
        const storeKey = destroy[i];
        this.destroyRecord(storeKey);
      }
    },
    // === Low level (primarily internal) API: uses storeKey ===================
    /**
            Method: O.Store#getTypeStatus
    
            Get the status of a type
    
            Parameters:
                accountId - {String|null} The account id.
                Type      - {O.Class} The record type.
    
            Returns:
                {O.Status} The status of the type in the store.
        */
    getTypeStatus(accountId, Type) {
      if (!Type) {
        const _accounts = this._accounts;
        let status = 0;
        Type = accountId;
        for (accountId in _accounts) {
          status |= this.getTypeStatus(accountId, Type);
        }
        return status;
      }
      return this.getAccount(accountId, Type).status[guid(Type)] || EMPTY;
    },
    whenTypeReady(accountId, Type) {
      if (!Type) {
        Type = accountId;
        accountId = this.getPrimaryAccountIdForType(Type);
      }
      if (this.getTypeStatus(accountId, Type) & READY) {
        return Promise.resolve();
      } else {
        const account = this._accounts[accountId];
        const awaitingReadyPromise = account.awaitingReadyPromise;
        const typeId = guid(Type);
        return awaitingReadyPromise[typeId] || (awaitingReadyPromise[typeId] = new Promise((resolve) => {
          account.awaitingReadyResolve[typeId] = resolve;
        }));
      }
    },
    /**
            Method: O.Store#getTypeState
    
            Get the current client state token for a type.
    
            Parameters:
                accountId - {String|null} The account id.
                Type      - {O.Class} The record type.
    
            Returns:
                {String|null} The client's current state token for the type.
        */
    getTypeState(accountId, Type) {
      return this.getAccount(accountId, Type).clientState[guid(Type)] || null;
    },
    /**
            Method: O.Store#getStatus
    
            Get the status of a record with a given store key.
    
            Parameters:
                storeKey - {String} The store key of the record.
    
            Returns:
                {O.Status} The status of the record with that store key.
        */
    getStatus(storeKey) {
      return this._skToStatus[storeKey] || EMPTY;
    },
    /**
            Method: O.Store#setStatus
    
            Set the status of a record with a given store key.
    
            Parameters:
                storeKey - {String} The store key of the record.
                status   - {O.Status} The new status for the record.
    
            Returns:
                {O.Store} Returns self.
        */
    setStatus(storeKey, status) {
      const previousStatus = this.getStatus(storeKey);
      const record = this._skToRecord[storeKey];
      if (previousStatus !== status) {
        this._skToStatus[storeKey] = status;
        if ((previousStatus ^ status) & READY) {
          this._recordDidChange(storeKey);
        }
        if (record) {
          record.propertyDidChange("status", previousStatus, status);
        }
        this._nestedStores.forEach((store) => {
          store.parentDidChangeStatus(storeKey, previousStatus, status);
        });
      }
      return this;
    },
    /**
            Method: O.Store#getRecordFromStoreKey
    
            Returns a record object for a particular store key, creating it if it
            does not already exist and fetching its value if not already loaded in
            memory, unless the doNotFetch parameter is set.
    
            Parameters:
                storeKey   - {String} The record store key.
                doNotFetch - {Boolean} (optional) If true, the record data will not
                             be fetched from the server if it is not already loaded.
    
            Returns:
                {O.Record} Returns the requested record.
        */
    getRecordFromStoreKey(storeKey, doNotFetch) {
      const record = this.materialiseRecord(storeKey);
      if (!doNotFetch && this.getStatus(storeKey) === EMPTY) {
        this.fetchData(storeKey);
      }
      this._skToLastAccess[storeKey] = Date.now();
      return record;
    },
    /**
            Method: O.Store#setRecordForStoreKey
    
            Sets the record instance for a store key.
    
            Parameters:
                storeKey - {String} The store key of the record.
                record   - {O.Record} The record.
    
            Returns:
                {O.Store} Returns self.
        */
    setRecordForStoreKey(storeKey, record) {
      this._skToRecord[storeKey] = record;
      return this;
    },
    /**
            Method: O.Store#materialiseRecord
    
            Returns the record object for a given store key, creating it if this is
            the first time it has been requested.
    
            Parameters:
                storeKey - {String} The store key of the record.
    
            Returns:
                {O.Record} Returns the requested record.
        */
    materialiseRecord(storeKey) {
      return this._skToRecord[storeKey] || (this._skToRecord[storeKey] = new this._skToType[storeKey](
        this,
        storeKey
      ));
    },
    // ---
    /**
            Method: O.Store#mayUnloadRecord
    
            Called before unloading a record from memory. Checks the record is in a
            clean state and does not have any observers and that every nested store
            also has no objection to unloading the record.
    
            Parameters:
                storeKey - {String} The store key of the record.
    
            Returns:
                {Boolean} True if the store may unload the record.
        */
    mayUnloadRecord(storeKey) {
      const record = this._skToRecord[storeKey];
      const status = this.getStatus(storeKey);
      if (status & (COMMITTING | NEW | DIRTY) || record && record.hasObservers()) {
        return false;
      }
      return this._nestedStores.every((store) => {
        return store.mayUnloadRecord(storeKey);
      });
    },
    /**
            Method: O.Store#willUnloadRecord
    
            Called just before the record is removed from memory. If the record has
            been instantiated it will call <O.Record#storeWillUnload>. The method is
            then recursively called on nested stores.
    
            Parameters:
                storeKey - {String} The store key of the record being unloaded.
    
            Returns:
                {O.Store} Returns self.
        */
    willUnloadRecord(storeKey) {
      const record = this._skToRecord[storeKey];
      if (record) {
        record.storeWillUnload();
      }
      this._nestedStores.forEach((store) => {
        store.willUnloadRecord(storeKey);
      });
      return this;
    },
    /**
            Method: O.Store#unloadRecord
    
            Unloads everything about a record from the store, freeing up memory,
            providing it is safe to do so. Will have no effect if
            <O.Store#mayUnloadRecord> returns false for the given store key.
    
            Parameters:
                storeKey - {String} The store key of the record to be unloaded.
    
            Returns:
                {Boolean} Was the record unloaded?
        */
    unloadRecord(storeKey) {
      if (!this.mayUnloadRecord(storeKey)) {
        return false;
      }
      this.willUnloadRecord(storeKey);
      delete this._skToLastAccess[storeKey];
      delete this._skToRecord[storeKey];
      delete this._skToRollback[storeKey];
      delete this._skToData[storeKey];
      delete this._skToStatus[storeKey];
      return true;
    },
    // ---
    /**
            Method: O.Store#createRecord
    
            Creates a new record with the given store key. The existing status for
            the store key must be <O.Status.EMPTY>. An initial data object may be
            passed as a second argument. The new record will be committed back to
            the server the next time <O.Store#commitChanges> runs.
    
            You will not normally use this method; instead just create a new record
            using `new ORecordSubclass()` and then call <O.Record#saveToStore>.
    
            Parameters:
                storeKey - {String} The store key of the new record.
                data     - {Object} (optional) The initial data for the record.
    
            Returns:
                {O.Store} Returns self.
        */
    createRecord(storeKey, data, _isCopyOfStoreKey) {
      const status = this.getStatus(storeKey);
      if (status !== EMPTY && status !== DESTROYED) {
        didError({
          name: CANNOT_CREATE_EXISTING_RECORD_ERROR,
          message: "\nStatus: " + (keyOf(Status_exports, status) || status) + "\nData: " + JSON.stringify(data)
        });
        return this;
      }
      if (!data) {
        data = {};
      }
      data.accountId = this.getAccountIdFromStoreKey(storeKey);
      this._created[storeKey] = _isCopyOfStoreKey || "";
      this._skToData[storeKey] = data;
      this.setStatus(storeKey, READY | NEW | DIRTY);
      if (this.autoCommit) {
        this.commitChanges();
      }
      return this.set("hasChanges", true);
    },
    /**
            Method: O.Store#moveRecord
    
            Creates a copy of a record with the given store key in a different
            account and destroys the original.
    
            Parameters:
                storeKey    - {String} The store key of the record to copy
                toAccountId - {String} The id of the account to copy to
    
            Returns:
                {String} The store key of the copy.
        */
    moveRecord(storeKey, toAccountId, copyStoreKey) {
      const Type = this._skToType[storeKey];
      const copyData = clone(this._skToData[storeKey]);
      copyStoreKey = copyStoreKey || this._created[storeKey];
      if (copyStoreKey) {
        this.undestroyRecord(copyStoreKey, Type, copyData, storeKey);
      } else {
        copyStoreKey = this.getStoreKey(toAccountId, Type);
        this.createRecord(copyStoreKey, copyData, storeKey);
      }
      this._changeRecordStoreKey(storeKey, copyStoreKey);
      this.revertData(storeKey);
      this.destroyRecord(storeKey, copyStoreKey);
      return copyStoreKey;
    },
    _changeRecordStoreKey(oldStoreKey, newStoreKey) {
      const { _skToRecord } = this;
      const record = _skToRecord[oldStoreKey];
      if (record) {
        delete _skToRecord[oldStoreKey];
        _skToRecord[newStoreKey] = record;
        record.set("storeKey", newStoreKey).computedPropertyDidChange("accountId");
      }
      this._nestedStores.forEach((store) => {
        store._changeRecordStoreKey(oldStoreKey, newStoreKey);
      });
    },
    /**
            Method: O.Store#destroyRecord
    
            Marks a record as destroyed and commits this back to the server when
            O.Store#commitChanges next runs. If the record is new it is immediately
            unloaded from memory, otherwise the store waits until the destroy has
            been committed.
    
            You will not normally use this method; instead just call
            <O.Record#destroy> on the record object itself.
    
            Parameters:
                storeKey - {String} The store key of the record to be destroyed.
    
            Returns:
                {O.Store} Returns self.
        */
    destroyRecord(storeKey, _ifCopiedStoreKey) {
      const status = this.getStatus(storeKey);
      if (status === (READY | NEW | DIRTY)) {
        delete this._created[storeKey];
        this.setStatus(storeKey, DESTROYED);
        this.unloadRecord(storeKey);
      } else if (status & READY) {
        if (status & DIRTY) {
          this.setData(storeKey, this._skToCommitted[storeKey]);
          delete this._skToCommitted[storeKey];
          delete this._skToChanged[storeKey];
          if (this.isNested) {
            delete this._skToData[storeKey];
          }
        }
        this._destroyed[storeKey] = _ifCopiedStoreKey || "";
        this.setStatus(
          storeKey,
          DESTROYED | DIRTY | status & (COMMITTING | NEW | OBSOLETE)
        );
        if (this.autoCommit) {
          this.commitChanges();
        }
      }
      return mayHaveChanges(this);
    },
    undestroyRecord(storeKey, Type, data, _isCopyOfStoreKey) {
      const status = this.getStatus(storeKey);
      if (data) {
        data = filter(data, Record.getClientSettableAttributes(Type));
      }
      if (status === EMPTY || status === DESTROYED) {
        this.createRecord(storeKey, data, _isCopyOfStoreKey);
      } else {
        if ((status & ~(OBSOLETE | LOADING)) === (DESTROYED | COMMITTING)) {
          this.setStatus(storeKey, READY | NEW | COMMITTING);
          this._created[storeKey] = _isCopyOfStoreKey || "";
        } else if (status & DESTROYED) {
          this.setStatus(
            storeKey,
            status & ~(DESTROYED | DIRTY) | READY
          );
          delete this._destroyed[storeKey];
        }
        if (data) {
          this.updateData(storeKey, data, true);
        }
      }
      return mayHaveChanges(this);
    },
    // ---
    /**
            Method: O.Store#checkServerState
    
            Called internally when a type finishes loading or committing, to check
            if there's a server state update to process.
    
            Parameters:
                accountId - {String|null} The account id.
                Type      - {O.Class} The record type.
        */
    checkServerState(accountId, Type) {
      if (!accountId) {
        accountId = this.getPrimaryAccountIdForType(Type);
      }
      const typeToServerState = this._accounts[accountId].serverState;
      const typeId = guid(Type);
      const serverState = typeToServerState[typeId];
      if (serverState) {
        typeToServerState[typeId] = "";
        this.sourceStateDidChange(accountId, Type, serverState);
      }
    },
    /**
            Method: O.Store#fetchAll
    
            Fetches all records of a given type from the server, or if already
            fetched updates the set of records.
    
            Parameters:
                accountId - {String|null} (optional) The account id. Omit to fetch
                            for all accounts.
                Type  - {O.Class} The type of records to fetch.
                force - {Boolean} (optional) Fetch even if we have a state string.
    
            Returns:
                {O.Store} Returns self.
        */
    fetchAll(accountId, Type, force) {
      if (typeof accountId === "function") {
        force = Type;
        Type = accountId;
        const _accounts = this._accounts;
        for (accountId in _accounts) {
          if (accountId && Type.dataGroup in _accounts[accountId].accountCapabilities) {
            this.fetchAll(accountId, Type, force);
          }
        }
        return this;
      }
      if (!accountId) {
        accountId = this.getPrimaryAccountIdForType(Type);
      }
      const account = this._accounts[accountId];
      const typeId = guid(Type);
      const typeToStatus = account.status;
      const status = typeToStatus[typeId];
      const state = account.clientState[typeId];
      if (!(status & LOADING) && (!(status & READY) || force)) {
        this.source.fetchAllRecords(accountId, Type, state, () => {
          typeToStatus[typeId] &= ~LOADING;
          this.checkServerState(accountId, Type);
        });
        typeToStatus[typeId] |= LOADING;
      }
      return this;
    },
    // ---
    /**
            Method: O.Store#fetchData
    
            Fetches the data for a given record from the server.
    
            Parameters:
                storeKey - {String} The store key of the record to fetch.
    
            Returns:
                {O.Store} Returns self.
        */
    fetchData(storeKey) {
      const status = this.getStatus(storeKey);
      if (status & (LOADING | NEW | DESTROYED | NON_EXISTENT)) {
        return this;
      }
      const Type = this._skToType[storeKey];
      if (!Type) {
        return this;
      }
      const typeId = guid(Type);
      const id = this._typeToSKToId[typeId][storeKey];
      if (!id) {
        return this;
      }
      const accountId = this.getAccountIdFromStoreKey(storeKey);
      let callback;
      if (id === "singleton") {
        const typeToStatus = this._accounts[accountId].status;
        typeToStatus[typeId] |= LOADING;
        callback = () => {
          typeToStatus[typeId] &= ~LOADING;
          this.checkServerState(accountId, Type);
        };
      }
      if (status & EMPTY) {
        this.source.fetchRecord(accountId, Type, id, callback);
        this.setStatus(storeKey, EMPTY | LOADING);
      } else {
        this.source.refreshRecord(accountId, Type, id, callback);
        this.setStatus(storeKey, status | LOADING);
      }
      return this;
    },
    /**
            Method: O.Store#getData
    
            Returns the current data object in memory for the given record
    
            Parameters:
                storeKey - {String} The store key for the record.
    
            Returns:
                {Object|undefined} The record data, if loaded.
        */
    getData(storeKey) {
      return this._skToData[storeKey];
    },
    /**
            Method: O.Store#setData
    
            Sets the data object for a given record.
    
            Parameters:
                storeKey      - {String} The store key for the record.
                data          - {Object} The new data object for the record.
    
            Returns:
                {O.Store} Returns self.
        */
    setData(storeKey, data) {
      if (this.getStatus(storeKey) & READY) {
        this.updateData(storeKey, data, false);
      } else {
        const changedKeys = Object.keys(data);
        this._skToData[storeKey] = data;
        this._notifyRecordOfChanges(storeKey, changedKeys);
        this._nestedStores.forEach((store) => {
          store.parentDidSetData(storeKey, changedKeys);
        });
      }
      return this;
    },
    /**
            Method: O.Store#updateData
    
            Updates the data object for a given record with the supplied attributes.
    
            Parameters:
                storeKey      - {String} The store key for the record.
                data          - {Object} An object of new attribute values for the
                                record.
                changeIsDirty - {Boolean} Should any of the change be committed back
                                to the server? noSync attributes are filtered out of
                                commits to the server in the commitChanges method.
    
            Returns:
                {Boolean} Was the data actually written? Will be false if the
                changeIsDirty flag is set but the current data is not yet loaded
                into memory.
        */
    updateData(storeKey, data, changeIsDirty) {
      const status = this.getStatus(storeKey);
      const { _skToData, _skToCommitted, _skToChanged, isNested } = this;
      let current = _skToData[storeKey];
      const changedKeys = [];
      let seenChange = false;
      if (!current || changeIsDirty && !(status & READY)) {
        didError({
          name: CANNOT_WRITE_TO_UNREADY_RECORD_ERROR,
          message: "\nStatus: " + (keyOf(Status_exports, status) || status) + "\nData: " + JSON.stringify(data)
        });
        return false;
      }
      if (isNested && !_skToData.hasOwnProperty(storeKey)) {
        _skToData[storeKey] = current = clone(current);
      }
      if (changeIsDirty && status !== (READY | NEW | DIRTY)) {
        const committed = _skToCommitted[storeKey] || (_skToCommitted[storeKey] = clone(current));
        const changed = _skToChanged[storeKey] || (_skToChanged[storeKey] = {});
        for (const key in data) {
          const value = data[key];
          const oldValue = current[key];
          if (!isEqual(value, oldValue)) {
            current[key] = value;
            changedKeys.push(key);
            changed[key] = !isEqual(value, committed[key]);
            seenChange = seenChange || changed[key];
          }
        }
        if (!seenChange) {
          for (const key in changed) {
            if (changed[key]) {
              seenChange = true;
              break;
            }
          }
        }
        if (seenChange) {
          this.setStatus(storeKey, status | DIRTY);
          if (this.autoCommit) {
            this.commitChanges();
          }
        } else {
          this.setStatus(storeKey, status & ~DIRTY);
          delete _skToCommitted[storeKey];
          delete _skToChanged[storeKey];
          if (isNested) {
            delete _skToData[storeKey];
          }
        }
        mayHaveChanges(this);
      } else {
        for (const key in data) {
          const value = data[key];
          const oldValue = current[key];
          if (!isEqual(value, oldValue)) {
            current[key] = value;
            changedKeys.push(key);
          }
        }
      }
      const accountId = data.accountId;
      if (status === (READY | NEW | DIRTY) && accountId) {
        this._skToAccountId[storeKey] = accountId;
      }
      this._notifyRecordOfChanges(storeKey, changedKeys);
      this._nestedStores.forEach((store) => {
        store.parentDidUpdateData(storeKey, changedKeys);
      });
      this._recordDidChange(storeKey);
      return true;
    },
    /**
            Method: O.Store#revertData
    
            Reverts the data object for a given record to the last committed state.
    
            Parameters:
                storeKey - {String} The store key for the record.
    
            Returns:
                {O.Store} Returns self.
        */
    revertData(storeKey) {
      const Type = this._skToType[storeKey];
      const committed = this._skToCommitted[storeKey];
      const changed = this._skToChanged[storeKey];
      if (committed) {
        const proto = Type.prototype;
        const attrs = meta(proto).attrs;
        let defaultValue2;
        for (const attrKey in changed) {
          if (committed[attrKey] === void 0) {
            defaultValue2 = proto[attrs[attrKey]].defaultValue;
            if (defaultValue2 === void 0) {
              defaultValue2 = null;
            }
            committed[attrKey] = defaultValue2;
          }
        }
        this.updateData(storeKey, committed, true);
      }
      return this;
    },
    /**
            Method (private): O.Store#_notifyRecordOfChanges
    
            Triggers change notifications if this record has an instantiated
            instance, and informs nested stores so they can do likewise.
    
            Parameters:
                storeKey    - {String} The store key of the record with changes.
                changedKeys - {Array} A list of the properties which have changed.
    
            Returns:
                {O.Store} Returns self.
        */
    _notifyRecordOfChanges(storeKey, changedKeys) {
      const record = this._skToRecord[storeKey];
      if (record) {
        let errorForAttribute;
        const attrs = meta(record).attrs;
        record.beginPropertyChanges();
        for (let i = changedKeys.length - 1; i >= 0; i -= 1) {
          const attrKey = changedKeys[i];
          let propKey = attrs[attrKey];
          if (!propKey) {
            if (attrKey === "id" || attrKey === "accountId") {
              propKey = attrKey;
            } else {
              continue;
            }
          }
          const attribute = record[propKey];
          record.computedPropertyDidChange(propKey);
          if (attribute.validate) {
            if (!errorForAttribute) {
              errorForAttribute = record.get("errorForAttribute");
            }
            errorForAttribute.set(
              propKey,
              attribute.validate(
                record.get(propKey),
                propKey,
                record
              )
            );
          }
        }
        record.endPropertyChanges();
      }
      return this;
    },
    /**
            Method: O.Store#_recordDidChange
    
            Called when the status and/or data for a record changes.
    
            Parameters:
                storeKey - {String} The store key of the record.
        */
    _recordDidChange(storeKey) {
      const typeId = guid(this._skToType[storeKey]);
      this._changedTypes[typeId] = true;
      queueFn("middle", this._fireTypeChanges, this);
    },
    /**
        Method: O.Store#_fireTypeChanges
    */
    _fireTypeChanges() {
      const { _changedTypes } = this;
      this._changedTypes = {};
      for (const typeId in _changedTypes) {
        this.fire(typeId);
      }
      return this;
    },
    // === Queries =============================================================
    /**
            Method: O.Store#findAll
    
            Returns the list of store keys with data loaded for a particular type,
            optionally filtered and/or sorted.
    
            Parameters:
                Type   - {O.Class} The constructor for the record type being
                         queried.
                filter - {Function} (optional) An acceptance function. This will be
                         passed the raw data object (*not* a record instance) and
                         should return true if the record should be included, or
                         false otherwise.
                sort   - {Function} (optional) A comparator function. This will be
                         passed the raw data objects (*not* record instances) for
                         two records. It should return -1 if the first record should
                         come before the second, 1 if the inverse is true, or 0 if
                         they should have the same position.
    
            Returns:
                {String[]} An array of store keys.
        */
    findAll(Type, accept, compare2) {
      const skToId = this._typeToSKToId[guid(Type)] || {};
      const { _skToStatus } = this;
      let results = [];
      for (const storeKey in skToId) {
        if (_skToStatus[storeKey] & READY) {
          results.push(storeKey);
        }
      }
      if (accept) {
        const filterFn = acceptStoreKey.bind(this, accept);
        results = results.filter(filterFn);
        results.filterFn = filterFn;
      }
      if (compare2) {
        const sortFn = compareStoreKeys.bind(this, compare2);
        results.sort(sortFn);
        results.sortFn = sortFn;
      }
      return results;
    },
    /**
            Method: O.Store#findOne
    
            Returns the store key of the first loaded record that matches an
            acceptance function.
    
            Parameters:
                Type   - {O.Class} The constructor for the record type to find.
                filter - {Function} (optional) An acceptance function. This will be
                         passed the raw data object (*not* a record instance) and
                         should return true if the record is the desired one, or
                         false otherwise.
    
            Returns:
                {(String|null)} The store key for a matching record, or null if none
                found.
        */
    findOne(Type, accept) {
      const _skToId = this._typeToSKToId[guid(Type)] || {};
      const { _skToStatus } = this;
      const filterFn = accept && acceptStoreKey.bind(this, accept);
      for (const storeKey in _skToId) {
        if (_skToStatus[storeKey] & READY && (!filterFn || filterFn(storeKey))) {
          return storeKey;
        }
      }
      return null;
    },
    /**
            Method: O.Store#addQuery
    
            Registers a query with the store. This is automatically called by the
            query constructor function. You should never need to call this
            manually.
    
            Parameters:
                query - {O.Query} The query object.
    
            Returns:
                {O.Store} Returns self.
        */
    addQuery(query) {
      this._idToQuery[query.get("id")] = query;
      return this;
    },
    /**
            Method: O.Store#removeQuery
    
            Deregisters a query with the store. This is automatically called when
            you call destroy() on a query. You should never need to call this
            manually.
    
            Parameters:
                query - {O.Query} The query object.
    
            Returns:
                {O.Store} Returns self.
        */
    removeQuery(query) {
      delete this._idToQuery[query.get("id")];
      return this;
    },
    /**
            Method: O.Store#getQuery
    
            Get a named query. When the same query is used in different places in
            the code, use this method to get the query rather than directly calling
            new Query(...). If the query is already created it will be returned,
            otherwise it will be created and returned. If no QueryClass is supplied
            and the id does not correspond to an existing query then `null` will be
            returned.
    
            Parameters:
                id         - {String} The id of the requested query.
                QueryClass - {O.Class} (optional) The query class to use if the
                             query is not already created.
                mixin      - {(Object|null)} (optional) Properties to pass to the
                             QueryClass constructor.
    
            Returns:
                {(O.Query|null)} The requested query.
        */
    getQuery(id, QueryClass, mixin2) {
      let query = id && this._idToQuery[id] || null;
      if (!query && QueryClass) {
        query = new QueryClass(
          Object.assign(mixin2 || {}, {
            id,
            store: this,
            source: this.get("source")
          })
        );
      }
      if (query) {
        query.lastAccess = Date.now();
      }
      return query;
    },
    /**
            Method: O.Store#getAllQueries
    
            Returns a list of all remote queries registered with the store.
    
            Returns:
                {O.Query[]} A list of all registered queries.
        */
    getAllQueries() {
      return Object.values(this._idToQuery);
    },
    // === Source callbacks ====================================================
    /**
            Method: O.Store#sourceStateDidChange
    
            Call this method to notify the store of a change in the state of a
            particular record type in the source. The store will wait for any
            loading or committing of this type to finish, then check its state. If
            it doesn't match, it will then request updates.
    
            Parameters:
                accountId - {String|null} The account id.
                Type      - {O.Class} The record type.
                newState  - {String} The new state on the server.
    
            Returns:
                {O.Store} Returns self.
        */
    sourceStateDidChange(accountId, Type, newState) {
      const account = this.getAccount(accountId, Type);
      const typeId = guid(Type);
      const clientState = account.clientState[typeId];
      const oldState = account.serverState[typeId];
      if (oldState !== newState) {
        account.serverState[typeId] = oldState || !clientState ? newState : clientState;
        if (newState !== clientState && !account.ignoreServerState && !(account.status[typeId] & (LOADING | COMMITTING))) {
          if (clientState) {
            this.fetchAll(accountId, Type, true);
          }
          this.fire(typeId + ":server:" + accountId);
        }
      }
      return this;
    },
    // ---
    /**
            Method: O.Store#sourceDidFetchRecords
    
            Callback made by the <O.Source> object associated with this store when
            it fetches some records from the server.
    
            Parameters:
                accountId - {String} The account id.
                Type      - {O.Class} The record type.
                records   - {Object[]} Array of data objects.
                state     - {String} (optional) The state of the record type on the
                            server.
                isAll     - {Boolean} This is all the records of this type on the
                            server.
    
            Returns:
                {O.Store} Returns self.
        */
    sourceDidFetchRecords(accountId, Type, records, state, isAll) {
      const { _skToData, _skToLastAccess } = this;
      if (!accountId) {
        accountId = this.getPrimaryAccountIdForType(Type);
      }
      const account = this._accounts[accountId];
      const typeId = guid(Type);
      const idPropKey = Type.primaryKey || "id";
      const idAttrKey = Type.prototype[idPropKey].key || idPropKey;
      const now = Date.now();
      const seen = {};
      const updates = {};
      const foreignRefAttrs = getForeignRefAttrs(Type);
      for (let i = records.length - 1; i >= 0; i -= 1) {
        const data = records[i];
        const id = data[idAttrKey];
        const storeKey = this.getStoreKey(accountId, Type, id);
        const status = this.getStatus(storeKey);
        seen[storeKey] = true;
        if (foreignRefAttrs.length) {
          convertForeignKeysToSK(this, foreignRefAttrs, data, accountId);
        }
        data.accountId = accountId;
        if (status & READY) {
          updates[id] = data;
        } else if (status & DESTROYED && status & (DIRTY | COMMITTING)) {
          _skToData[storeKey] = data;
          this.setStatus(storeKey, status & ~LOADING);
        } else {
          if (!(status & EMPTY)) {
            this.setStatus(storeKey, EMPTY);
          }
          this.setData(storeKey, data);
          this.setStatus(storeKey, READY);
          _skToLastAccess[storeKey] = now;
        }
      }
      if (isAll) {
        const skToId = this._typeToSKToId[guid(Type)];
        const destroyed = [];
        for (const storeKey in skToId) {
          if (seen[storeKey]) {
            continue;
          }
          const status = this.getStatus(storeKey);
          if (status & READY && !(status & NEW) && _skToData[storeKey].accountId === accountId) {
            destroyed.push(skToId[storeKey]);
          }
        }
        if (destroyed.length) {
          this.sourceDidDestroyRecords(accountId, Type, destroyed);
        }
      }
      this.sourceDidFetchPartialRecords(accountId, Type, updates, true);
      if (state) {
        const oldClientState = account.clientState[typeId];
        const oldServerState = account.serverState[typeId];
        if (!isAll && oldClientState && oldClientState !== state) {
          this.sourceStateDidChange(accountId, Type, state);
        } else {
          account.clientState[typeId] = state;
          if (!oldClientState || !oldServerState || // If oldClientState == oldServerState, then the state we've
          // just received MUST be newer so we can update the server
          // state too
          oldClientState === oldServerState) {
            account.serverState[typeId] = state;
          }
        }
      }
      account.status[typeId] |= READY;
      const resolve = account.awaitingReadyResolve[typeId];
      if (resolve) {
        resolve();
        delete account.awaitingReadyResolve[typeId];
        delete account.awaitingReadyPromise[typeId];
      }
      this._changedTypes[typeId] = true;
      queueFn("middle", this._fireTypeChanges, this);
      return this;
    },
    /**
            Method: O.Store#sourceDidFetchPartialRecords
    
            Callback made by the <O.Source> object associated with this store when
            it has fetched some updates to records which may be loaded in the store.
            An update is a subset of a normal data object for the given record type,
            containing only the attributes which have changed since the previous
            state.
    
            Parameters:
                accountId - {String} The account id.
                Type      - {O.Class} The record type.
                updates   - {Object} An object mapping record id to an object of
                            changed attributes.
    
            Returns:
                {O.Store} Returns self.
        */
    sourceDidFetchPartialRecords(accountId, Type, updates, _idsAreSKs) {
      const account = this.getAccount(accountId, Type);
      const typeId = guid(Type);
      const { _skToData, _skToStatus, _skToChanged, _skToCommitted } = this;
      const _idToSk = account.typeToIdToSK[typeId] || {};
      const _skToId = this._typeToSKToId[typeId] || {};
      const idPropKey = Type.primaryKey || "id";
      const idAttrKey = Type.prototype[idPropKey].key || idPropKey;
      const foreignRefAttrs = _idsAreSKs ? [] : getForeignRefAttrs(Type);
      for (const id in updates) {
        const storeKey = _idToSk[id];
        const status = _skToStatus[storeKey];
        let update = updates[id];
        if (!update || !(status & READY)) {
          continue;
        }
        if (status & COMMITTING) {
          this.setStatus(storeKey, status & ~LOADING);
          this.fetchData(storeKey);
          continue;
        }
        if (foreignRefAttrs.length) {
          convertForeignKeysToSK(
            this,
            foreignRefAttrs,
            update,
            accountId
          );
        }
        const newId = update[idAttrKey];
        if (newId && newId !== id) {
          _skToId[storeKey] = newId;
          _idToSk[newId] = storeKey;
        }
        if (status & DIRTY) {
          update = Object.assign(_skToCommitted[storeKey], update);
          if (this.rebaseConflicts) {
            const oldData = _skToData[storeKey];
            const oldChanged = _skToChanged[storeKey];
            const newData = {};
            const newChanged = {};
            let clean = true;
            for (const key in oldData) {
              if (key in oldChanged) {
                if (!isEqual(oldData[key], update[key])) {
                  newChanged[key] = true;
                  clean = false;
                }
                newData[key] = oldData[key];
              } else {
                newData[key] = update[key];
              }
            }
            if (!clean) {
              _skToChanged[storeKey] = newChanged;
              _skToCommitted[storeKey] = update;
              this.setData(storeKey, newData);
              this.setStatus(storeKey, READY | DIRTY);
              continue;
            }
          }
          delete _skToChanged[storeKey];
          delete _skToCommitted[storeKey];
        }
        this.updateData(storeKey, update, false);
        this.setStatus(storeKey, READY);
      }
      return mayHaveChanges(this);
    },
    /**
            Method: O.Store#sourceDidChangeIds
    
            Callback made by the <O.Source> object associated with this store when
            the server has unilaterally changed the ids of some objects.
    
            Parameters:
                accountId    - {String} The account id.
                Type         - {O.Class} The record type.
                oldIdToNewId - {Id[Id]} Map of old to new id
    
            Returns:
                {O.Store} Returns self.
        */
    sourceDidChangeIds(accountId, Type, oldIdToNewId) {
      const account = this.getAccount(accountId, Type);
      const typeId = guid(Type);
      const _idToSk = account.typeToIdToSK[typeId] || {};
      const _skToId = this._typeToSKToId[typeId] || {};
      const idPropKey = Type.primaryKey || "id";
      const idAttrKey = Type.prototype[idPropKey].key || idPropKey;
      for (const oldId in oldIdToNewId) {
        const storeKey = _idToSk[oldId];
        if (!storeKey) {
          continue;
        }
        const newId = oldIdToNewId[oldId];
        if (newId && newId !== oldId) {
          _skToId[storeKey] = newId;
          _idToSk[newId] = storeKey;
        }
        if (this.getStatus(storeKey) & READY) {
          this.updateData(storeKey, { [idAttrKey]: newId }, false);
        }
      }
      return mayHaveChanges(this);
    },
    /**
            Method: O.Store#sourceCouldNotFindRecords
    
            Callback made by the <O.Source> object associated with this store when
            it has been asked to fetch certain record ids and the server has
            responded that the records do not exist.
    
            Parameters:
                accountId - {String} The account id.
                Type      - {O.Class} The record type.
                ids       - {String[]} The list of ids of non-existent requested
                            records.
    
            Returns:
                {O.Store} Returns self.
        */
    sourceCouldNotFindRecords(accountId, Type, ids) {
      const { _skToCommitted, _skToChanged } = this;
      for (let i = ids.length - 1; i >= 0; i -= 1) {
        const storeKey = this.getStoreKey(accountId, Type, ids[i]);
        const status = this.getStatus(storeKey);
        if (status & (EMPTY | NON_EXISTENT)) {
          this.setStatus(storeKey, NON_EXISTENT);
        } else {
          if (status & DIRTY) {
            this.setData(storeKey, _skToCommitted[storeKey]);
            delete _skToCommitted[storeKey];
            delete _skToChanged[storeKey];
          }
          this.setStatus(storeKey, DESTROYED);
          this.unloadRecord(storeKey);
        }
      }
      return mayHaveChanges(this);
    },
    // ---
    /**
            Method: O.Store#sourceDidFetchUpdates
    
            Callback made by the <O.Source> object associated with this store when
            it fetches the ids of all records of a particular type that have been
            created/modified/destroyed of a particular since the client's state.
    
            Parameters:
                accountId - {String} The account id.
                Type      - {O.Class} The record type.
                changed   - {String[]} List of ids for records which have been
                            added or changed in the store since oldState.
                destroyed - {String[]} List of ids for records which have been
                            destroyed in the store since oldState.
                oldState  - {String} The state these changes are from.
                newState  - {String} The state these changes are to.
    
            Returns:
                {O.Store} Returns self.
        */
    sourceDidFetchUpdates(accountId, Type, changed, destroyed, oldState, newState) {
      const account = this.getAccount(accountId, Type);
      const typeId = guid(Type);
      if (oldState === account.clientState[typeId]) {
        if (changed && changed.length) {
          this.sourceDidModifyRecords(accountId, Type, changed);
        }
        if (destroyed && destroyed.length) {
          this.sourceDidDestroyRecords(accountId, Type, destroyed);
        }
        if (oldState !== newState && newState !== account.serverState[typeId]) {
          this.fire(typeId + ":server:" + accountId);
        }
        account.clientState[typeId] = newState;
        if (account.serverState[typeId] === oldState) {
          account.serverState[typeId] = newState;
        }
      } else {
        this.sourceStateDidChange(accountId, Type, newState);
      }
      return this;
    },
    /**
            Method: O.Store#sourceDidModifyRecords
    
            Callback made by the <O.Source> object associated with this store when
            some records may be out of date.
    
            Parameters:
                accountId - {String} The account id.
                Type      - {O.Class} The record type.
                ids       - {String[]} The list of ids of records which have
                            updates available on the server.
    
            Returns:
                {O.Store} Returns self.
        */
    sourceDidModifyRecords(accountId, Type, ids) {
      for (let i = ids.length - 1; i >= 0; i -= 1) {
        const storeKey = this.getStoreKey(accountId, Type, ids[i]);
        const status = this.getStatus(storeKey);
        if (status & READY) {
          this.setStatus(storeKey, status | OBSOLETE);
        }
      }
      return this;
    },
    /**
            Method: O.Store#sourceDidDestroyRecords
    
            Callback made by the <O.Source> object associated with this store when
            the source has destroyed records (not in response to a commit request
            by the client).
    
            Parameters:
                accountId - {String} The account id.
                Type      - {O.Class} The record type.
                ids       - {String[]} The list of ids of records which have been
                            destroyed.
    
            Returns:
                {O.Store} Returns self.
        */
    sourceDidDestroyRecords(accountId, Type, ids) {
      for (let i = ids.length - 1; i >= 0; i -= 1) {
        const id = ids[i];
        const storeKey = this.getStoreKey(accountId, Type, id);
        if (this.getIdFromStoreKey(storeKey) === id) {
          this.setStatus(storeKey, DESTROYED);
          this.unloadRecord(storeKey);
        }
      }
      return this;
    },
    // ---
    /**
            Method: O.Store#sourceCommitDidChangeState
    
            Callback made by the <O.Source> object associated with this store when
            it finishes committing a record type which uses state tokens to stay in
            sync with the server.
    
            Parameters:
                accountId - {String} The account id.
                Type      - {O.Class} The record type.
                oldState  - {String} The state before the commit.
                newState  - {String} The state after the commit.
    
            Returns:
                {O.Store} Returns self.
        */
    sourceCommitDidChangeState(accountId, Type, oldState, newState) {
      const account = this.getAccount(accountId, Type);
      const typeId = guid(Type);
      if (account.clientState[typeId] === oldState) {
        account.clientState[typeId] = newState;
        if (account.serverState[typeId] === oldState) {
          account.serverState[typeId] = newState;
        }
      } else {
        this.sourceStateDidChange(accountId, Type, newState);
      }
      return this;
    },
    // ---
    /**
            Method: O.Store#sourceDidCommitCreate
    
            Callback made by the <O.Source> object associated with this store when
            the source commits the creation of records as requested by a call to
            <O.Source#commitChanges>.
    
            Parameters:
                skToPartialData - {Object} A map of the store key to an object
                with properties for the newly created record, which MUST include
                the id.
    
            Returns:
                {O.Store} Returns self.
        */
    sourceDidCommitCreate(skToPartialData) {
      const { _skToType, _skToData, _typeToSKToId, _accounts } = this;
      for (const storeKey in skToPartialData) {
        const status = this.getStatus(storeKey);
        if (status & NEW) {
          const data = skToPartialData[storeKey];
          const Type = _skToType[storeKey];
          const typeId = guid(Type);
          const idPropKey = Type.primaryKey || "id";
          const idAttrKey = Type.prototype[idPropKey].key || idPropKey;
          const accountId = _skToData[storeKey].accountId;
          const id = data[idAttrKey];
          const typeToIdToSK = _accounts[accountId].typeToIdToSK;
          const skToId = _typeToSKToId[typeId] || (_typeToSKToId[typeId] = {});
          const idToSK = typeToIdToSK[typeId] || (typeToIdToSK[typeId] = {});
          skToId[storeKey] = id;
          idToSK[id] = storeKey;
          const foreignRefAttrs = getForeignRefAttrs(Type);
          if (foreignRefAttrs.length) {
            convertForeignKeysToSK(
              this,
              foreignRefAttrs,
              data,
              accountId
            );
          }
          this.updateData(storeKey, data, false);
          this.setStatus(storeKey, status & ~(COMMITTING | NEW));
        } else {
          didError({
            name: SOURCE_COMMIT_CREATE_MISMATCH_ERROR
          });
        }
      }
      if (this.autoCommit) {
        this.commitChanges();
      }
      return this;
    },
    /**
            Method: O.Store#sourceDidNotCreate
    
            Callback made by the <O.Source> object associated with this store when
            the source does not commit the creation of some records as requested
            by a call to <O.Source#commitChanges>.
    
            If the condition is temporary (for example a precondition fail, such as
            the server being in a different state to the client) then the store
            will attempt to recommit the changes the next time commitChanges is
            called (or at the end of the current run loop if `autoCommit` is
            `true`); it is presumed that the precondition will be fixed before then.
    
            If the condition is permanent (as indicated by the `isPermanent`
            argument), the store will revert to the last known committed state,
            i.e. it will destroy the new record. If an `errors` array is passed,
            the store will first fire a `record:commit:error` event on the
            record (including in nested stores), if already instantiated. If
            <O.Event#preventDefault> is called on the event object, the record
            will **not** be reverted; it is up to the handler to then fix the record
            before it is recommitted.
    
            Parameters:
                storeKeys   - {String[]} The list of store keys of records for
                              which the creation was not committed.
                isPermanent - {Boolean} (optional) Should the store try to commit
                              the changes again, or just revert to last known
                              committed state?
                errors      - {Object[]} (optional) An array of objects
                              representing the error in committing the store key in
                              the equivalent location in the *storeKeys* argument.
    
            Returns:
                {O.Store} Returns self.
        */
    sourceDidNotCreate(storeKeys, isPermanent, errors) {
      const { _skToCommitted, _skToChanged, _created } = this;
      for (let i = storeKeys.length - 1; i >= 0; i -= 1) {
        const storeKey = storeKeys[i];
        const status = this.getStatus(storeKey);
        if (status & DESTROYED) {
          this.setStatus(storeKey, DESTROYED);
          this.unloadRecord(storeKey);
        } else {
          if (status & DIRTY) {
            delete _skToCommitted[storeKey];
            delete _skToChanged[storeKey];
          }
          this.setStatus(storeKey, READY | NEW | DIRTY);
          _created[storeKey] = "";
          if (isPermanent && (!errors || !this._notifyRecordOfError(storeKey, errors[i]))) {
            this.destroyRecord(storeKey);
          }
        }
      }
      if (this.autoCommit) {
        this.commitChanges();
      }
      return mayHaveChanges(this);
    },
    /**
            Method: O.Store#sourceDidCommitUpdate
    
            Callback made by the <O.Source> object associated with this store when
            the source commits updates to some records as requested by a call to
            <O.Source#commitChanges>.
    
            Parameters:
                storeKeys - {String[]} The list of store keys of records for
                            which the submitted updates have been committed.
    
            Returns:
                {O.Store} Returns self.
        */
    sourceDidCommitUpdate(storeKeys) {
      const { _skToRollback } = this;
      for (let i = storeKeys.length - 1; i >= 0; i -= 1) {
        const storeKey = storeKeys[i];
        const status = this.getStatus(storeKey);
        delete _skToRollback[storeKey];
        if (status !== EMPTY) {
          this.setStatus(storeKey, status & ~COMMITTING);
        }
      }
      if (this.autoCommit) {
        this.commitChanges();
      }
      return this;
    },
    /**
            Method: O.Store#sourceDidNotUpdate
    
            Callback made by the <O.Source> object associated with this store when
            the source does not commit the updates to some records as requested
            by a call to <O.Source#commitChanges>.
    
            If the condition is temporary (for example a precondition fail, such as
            the server being in a different state to the client) then the store
            will attempt to recommit the changes the next time commitChanges is
            called (or at the end of the current run loop if `autoCommit` is
            `true`); it is presumed that the precondition will be fixed before then.
    
            If the condition is permanent (as indicated by the `isPermanent`
            argument), the store will revert to the last known committed state.
            If an `errors` array is passed, the store will first fire a
            `record:commit:error` event on the record (including in nested stores),
            if already instantiated. If <O.Event#preventDefault> is called on the
            event object, the record will **not** be reverted; it is up to the
            handler to then fix the record before it is recommitted.
    
            Parameters:
                storeKeys   - {String[]} The list of store keys of records for
                              which the update was not committed.
                isPermanent - {Boolean} (optional) Should the store try to commit
                              the changes again, or just revert to last known
                              committed state?
                errors      - {Object[]} (optional) An array of objects
                              representing the error in committing the store key in
                              the equivalent location in the *storeKeys* argument.
    
            Returns:
                {O.Store} Returns self.
        */
    sourceDidNotUpdate(storeKeys, isPermanent, errors) {
      const {
        _skToData,
        _skToChanged,
        _skToCommitted,
        _skToRollback,
        _skToType
      } = this;
      for (let i = storeKeys.length - 1; i >= 0; i -= 1) {
        const storeKey = storeKeys[i];
        const status = this.getStatus(storeKey);
        if (status & DESTROYED && _skToRollback[storeKey]) {
          _skToData[storeKey] = _skToRollback[storeKey];
          delete _skToRollback[storeKey];
        }
        if (!(status & READY)) {
          if (status !== EMPTY) {
            this.setStatus(storeKey, status & ~COMMITTING);
          }
          continue;
        }
        const committed = _skToCommitted[storeKey] = _skToRollback[storeKey];
        delete _skToRollback[storeKey];
        const current = _skToData[storeKey];
        delete _skToChanged[storeKey];
        const changed = getChanged(_skToType[storeKey], current, committed);
        if (changed) {
          _skToChanged[storeKey] = changed;
          this.setStatus(storeKey, status & ~COMMITTING | DIRTY);
        } else {
          this.setStatus(storeKey, status & ~COMMITTING);
        }
        if (isPermanent && (!errors || !this._notifyRecordOfError(storeKey, errors[i]))) {
          this.revertData(storeKey);
        }
      }
      if (this.autoCommit) {
        this.commitChanges();
      }
      return mayHaveChanges(this);
    },
    /**
            Method: O.Store#sourceDidCommitDestroy
    
            Callback made by the <O.Source> object associated with this store when
            the source commits the destruction of some records as requested by a
            call to <O.Source#commitChanges>.
    
            Parameters:
                storeKeys - {String[]} The list of store keys of records whose
                            destruction has been committed.
    
            Returns:
                {O.Store} Returns self.
        */
    sourceDidCommitDestroy(storeKeys) {
      for (let i = storeKeys.length - 1; i >= 0; i -= 1) {
        const storeKey = storeKeys[i];
        const status = this.getStatus(storeKey);
        if ((status & ~DIRTY) === (READY | NEW | COMMITTING)) {
          if (status & DIRTY) {
            delete this._skToCommitted[storeKey];
            delete this._skToChanged[storeKey];
          }
          this.setStatus(storeKey, READY | NEW | DIRTY);
        } else if (status & DESTROYED) {
          this.setStatus(storeKey, DESTROYED);
          this.unloadRecord(storeKey);
        } else {
          didError({
            name: SOURCE_COMMIT_DESTROY_MISMATCH_ERROR
          });
        }
      }
      if (this.autoCommit) {
        this.commitChanges();
      }
      return mayHaveChanges(this);
    },
    /**
            Method: O.Store#sourceDidNotDestroy
    
            Callback made by the <O.Source> object associated with this store when
            the source does not commit the destruction of some records as requested
            by a call to <O.Source#commitChanges> (usually due to a precondition
            fail, such as the server being in a different state to the client).
    
            If the condition is temporary (for example a precondition fail, such as
            the server being in a different state to the client) then the store
            will attempt to recommit the changes the next time commitChanges is
            called (or at the end of the current run loop if `autoCommit` is
            `true`); it is presumed that the precondition will be fixed before then.
    
            If the condition is permanent (as indicated by the `isPermanent`
            argument), the store will revert to the last known committed state
            (i.e. the record will be revived). If an `errors` array is passed, the
            store will first fire a `record:commit:error` event on the record
            (including in nested stores), if already instantiated. If
            <O.Event#preventDefault> is called on the event object, the record will
            **not** be revived; it is up to the handler to then fix the record
            before it is recommitted.
    
            Parameters:
                storeKeys   - {String[]} The list of store keys of records for
                              which the destruction was not committed.
                isPermanent - {Boolean} (optional) Should the store try to commit
                              the changes again, or just revert to last known
                              committed state?
                errors      - {Object[]} (optional) An array of objects
                              representing the error in committing the store key in
                              the equivalent location in the *storeKeys* argument.
    
            Returns:
                {O.Store} Returns self.
        */
    sourceDidNotDestroy(storeKeys, isPermanent, errors) {
      const { _created, _destroyed } = this;
      for (let i = storeKeys.length - 1; i >= 0; i -= 1) {
        const storeKey = storeKeys[i];
        const status = this.getStatus(storeKey);
        if ((status & ~DIRTY) === (READY | NEW | COMMITTING)) {
          this.setStatus(storeKey, status & ~(COMMITTING | NEW));
          delete _created[storeKey];
        } else if (status & DESTROYED) {
          this.setStatus(storeKey, status & ~COMMITTING | DIRTY);
          _destroyed[storeKey] = "";
          if (isPermanent && (!errors || !this._notifyRecordOfError(storeKey, errors[i]))) {
            this.undestroyRecord(storeKey);
          }
        } else {
          didError({
            name: SOURCE_COMMIT_DESTROY_MISMATCH_ERROR
          });
        }
      }
      if (this.autoCommit) {
        this.commitChanges();
      }
      return mayHaveChanges(this);
    },
    _notifyRecordOfError(storeKey, error) {
      const record = this._skToRecord[storeKey];
      let isDefaultPrevented = false;
      const event = new Event(error.type || "error", record, error);
      if (record) {
        record.fire("record:commit:error", event);
      } else {
        this.fire("record:commit:error", event);
      }
      isDefaultPrevented = event.defaultPrevented;
      this._nestedStores.forEach((store) => {
        isDefaultPrevented = store._notifyRecordOfError(storeKey, error) || isDefaultPrevented;
      });
      return isDefaultPrevented;
    }
  });
  ["on", "once", "off"].forEach((property) => {
    Store.prototype[property] = function(type, object, method) {
      if (typeof type !== "string") {
        type = guid(type);
      }
      return EventTarget[property].call(this, type, object, method);
    };
  });

  // source/datastore/store/NestedStore.js
  var NestedStore = Class({
    Name: "NestedStore",
    Extends: Store,
    autoCommit: false,
    isNested: true,
    /**
            Constructor: O.NestedStore
    
            Parameters:
                store - {O.Store} The parent store (this may be another nested
                        store).
        */
    init: function(store) {
      NestedStore.parent.constructor.call(this);
      this._typeToSKToId = store._typeToSKToId;
      this._skToAccountId = store._skToAccountId;
      this._skToType = store._skToType;
      this._skToLastAccess = store._skToLastAccess;
      this._accounts = store._accounts;
      this._defaultAccountId = store._defaultAccountId;
      this._skToStatus = Object.create(store._skToStatus);
      this._skToData = Object.create(store._skToData);
      store.addNested(this);
      this._parentStore = store;
    },
    /**
            Method: O.NestedStore#destroy
    
            Removes the connection to the parent store so this store may be garbage
            collected.
        */
    destroy() {
      this._parentStore.removeNested(this);
      NestedStore.parent.destroy.call(this);
    },
    // === Client API ==========================================================
    /**
            Method: O.Store#commitChanges
    
            Commits any outstanding changes (created/updated/deleted records) to the
            parent store.
    
            Returns:
                {O.NestedStore} Returns self.
        */
    commitChanges() {
      this.fire("willCommit");
      const { _created, _destroyed, _skToData, _skToChanged, _skToType } = this;
      const parent = this._parentStore;
      for (const storeKey in _created) {
        const isCopyOfStoreKey = _created[storeKey];
        if (isCopyOfStoreKey) {
          const data = _skToData[storeKey];
          parent.moveRecord(
            isCopyOfStoreKey,
            this.getAccountIdFromStoreKey(storeKey),
            storeKey
          );
          delete _skToData[storeKey];
          parent.updateData(storeKey, data, true);
        } else {
          const data = _skToData[storeKey];
          const Type = _skToType[storeKey];
          parent.undestroyRecord(storeKey, Type, data);
        }
      }
      for (const storeKey in _skToChanged) {
        const changed = _skToChanged[storeKey];
        const data = _skToData[storeKey];
        parent.updateData(storeKey, filter(data, changed), true);
      }
      for (const storeKey in _destroyed) {
        const ifCopiedStoreKey = _destroyed[storeKey];
        if (!ifCopiedStoreKey || !_created[ifCopiedStoreKey]) {
          parent.destroyRecord(storeKey);
        }
      }
      this._skToData = Object.create(parent._skToData);
      this._skToStatus = Object.create(parent._skToStatus);
      this._skToChanged = {};
      this._skToCommitted = {};
      this._created = {};
      this._destroyed = {};
      return this.set("hasChanges", false).fire("didCommit");
    },
    /**
            Method: O.Store#discardChanges
    
            Discards any outstanding changes (created/updated/deleted records),
            reverting the store to the same state as its parent.
    
            Returns:
                {O.NestedStore} Returns self.
        */
    discardChanges() {
      NestedStore.parent.discardChanges.call(this);
      const parent = this._parentStore;
      this._skToData = Object.create(parent._skToData);
      this._skToStatus = Object.create(parent._skToStatus);
      return this;
    },
    // === Low level (primarily internal) API: uses storeKey ===================
    getStatus(storeKey) {
      const status = this._skToStatus[storeKey] || EMPTY;
      return this._skToData.hasOwnProperty(storeKey) ? status : status & ~(NEW | COMMITTING | DIRTY);
    },
    fetchAll(accountId, Type, force) {
      this._parentStore.fetchAll(accountId, Type, force);
      return this;
    },
    fetchData(storeKey) {
      this._parentStore.fetchData(storeKey);
      return this;
    },
    // === Notifications from parent store =====================================
    /**
            Method: O.NestedStore#parentDidChangeStatus
    
            Called by the parent store whenever it changes the status of a record.
            The nested store uses this to update its own status value for that
            record (if it has diverged from the parent) and to notify any O.Record
            instances belonging to it of the change.
    
            Parameters:
                storeKey - {String} The store key for the record.
                previous - {O.Status} The previous status value.
                status   - {O.Status} The new status value.
        */
    parentDidChangeStatus(storeKey, previous, status) {
      const { _skToStatus } = this;
      previous = previous & ~(NEW | COMMITTING | DIRTY);
      status = status & ~(NEW | COMMITTING | DIRTY);
      if (_skToStatus.hasOwnProperty(storeKey)) {
        previous = _skToStatus[storeKey];
        if (status & DESTROYED) {
          if (previous & READY && previous & DIRTY) {
            this.setData(storeKey, this._skToCommitted[storeKey]);
            delete this._skToCommitted[storeKey];
            delete this._skToChanged[storeKey];
          }
          delete this._skToData[storeKey];
          delete _skToStatus[storeKey];
        } else if (!(previous & NEW)) {
          _skToStatus[storeKey] = status = previous | status & (OBSOLETE | LOADING);
        }
      }
      if (previous !== status) {
        if ((previous ^ status) & READY) {
          this._recordDidChange(storeKey);
        }
        const record = this._skToRecord[storeKey];
        if (record) {
          record.propertyDidChange("status", previous, status);
        }
        this._nestedStores.forEach((store) => {
          store.parentDidChangeStatus(storeKey, previous, status);
        });
      }
    },
    /**
            Method: O.NestedStore#parentDidSetData
    
            Called by the parent store when it sets the inital data for an empty
            record. The nested store can't have any changes as a nested store cannot
            load data independently of its parent, so all we need to do is notify
            any records.
    
            Parameters:
                storeKey    - {String} The store key for the record.
                changedKeys - {Object} A list of keys which have changed.
        */
    parentDidSetData(storeKey, changedKeys) {
      this._notifyRecordOfChanges(storeKey, changedKeys);
      this._nestedStores.forEach((store) => {
        store.parentDidSetData(storeKey, changedKeys);
      });
    },
    /**
            Method: O.NestedStore#parentDidUpdateData
    
            Called by the parent store whenever it makes a change to the data object
            for a record. The nested store uses this to update its own copy of the
            data object if it has diverged from that of the parent (either rebasing
            changes on top of the new parent state or discarding changes, depending
            on the value of <O.Store#rebaseConflicts>).
    
            Parameters:
                storeKey    - {String} The store key for the record.
                changedKeys - {Object} A list of keys which have changed.
        */
    parentDidUpdateData(storeKey, changedKeys) {
      const { _skToData, _skToChanged, _skToCommitted } = this;
      const oldChanged = _skToChanged[storeKey];
      if (oldChanged && _skToData.hasOwnProperty(storeKey)) {
        const parent = this._parentStore;
        const rebase = this.rebaseConflicts;
        const newBase = parent.getData(storeKey);
        const oldData = _skToData[storeKey];
        const newData = {};
        const newChanged = {};
        let clean = true;
        changedKeys = [];
        for (const key in oldData) {
          const isChanged = !isEqual(oldData[key], newBase[key]);
          if (rebase && key in oldChanged) {
            if (isChanged) {
              newChanged[key] = true;
              clean = false;
            }
            newData[key] = oldData[key];
          } else {
            if (isChanged) {
              changedKeys.push(key);
            }
            newData[key] = newBase[key];
          }
        }
        if (!clean) {
          _skToChanged[storeKey] = newChanged;
          _skToCommitted[storeKey] = clone(newBase);
          this.setData(storeKey, newData);
          return;
        }
        this.setStatus(
          storeKey,
          parent.getStatus(storeKey) & ~(NEW | COMMITTING | DIRTY)
        );
        delete _skToData[storeKey];
        delete _skToChanged[storeKey];
        delete _skToCommitted[storeKey];
        delete this._skToStatus[storeKey];
      }
      this._notifyRecordOfChanges(storeKey, changedKeys);
      this._nestedStores.forEach((store) => {
        store.parentDidUpdateData(storeKey, changedKeys);
      });
      this._recordDidChange(storeKey);
      queueFn("before", this.checkForChanges, this);
    },
    // === A nested store is not directly connected to a source ================
    sourceStateDidChange: null,
    sourceDidFetchRecords: null,
    sourceDidFetchPartialRecords: null,
    sourceCouldNotFindRecords: null,
    sourceDidFetchUpdates: null,
    sourceDidModifyRecords: null,
    sourceDidDestroyRecords: null,
    sourceCommitDidChangeState: null,
    sourceDidCommitCreate: null,
    sourceDidNotCreate: null,
    sourceDidCommitUpdate: null,
    sourceDidNotUpdate: null,
    sourceDidCommitDestroy: null,
    sourceDidNotDestroy: null
  });

  // source/datastore/store/UndoManager.js
  var UndoManager = Class({
    Name: "UndoManager",
    Extends: Obj,
    init: function() {
      this._undoStack = [];
      this._redoStack = [];
      this._isInUndoState = false;
      this.canUndo = false;
      this.canRedo = false;
      this.maxUndoCount = 1;
      UndoManager.parent.constructor.apply(this, arguments);
    },
    _pushState(stack, data) {
      stack.push(data);
      while (stack.length > this.maxUndoCount) {
        stack.shift();
      }
      this._isInUndoState = true;
    },
    dataDidChange() {
      this._isInUndoState = false;
      return this.set("canRedo", false).set("canUndo", true).fire("input");
    },
    saveUndoCheckpoint(data) {
      if (data || !this._isInUndoState) {
        if (!data) {
          data = this.getUndoData();
        }
        if (data !== null) {
          this._pushState(this._undoStack, data);
        }
        this._isInUndoState = true;
        this._redoStack.length = 0;
        this.set("canUndo", !!this._undoStack.length).set("canRedo", false);
      }
      return this;
    },
    undo() {
      if (this.get("canUndo")) {
        if (!this._isInUndoState) {
          this.saveUndoCheckpoint();
          this.undo();
        } else {
          const redoData = this.applyChange(this._undoStack.pop(), false);
          if (redoData) {
            this._pushState(this._redoStack, redoData);
          }
          this.set("canUndo", !!this._undoStack.length).set("canRedo", !!this._redoStack.length).fire("undo");
        }
      }
      return this;
    },
    redo() {
      if (this.get("canRedo")) {
        this._pushState(
          this._undoStack,
          this.applyChange(this._redoStack.pop(), true)
        );
        this.set("canUndo", true).set("canRedo", !!this._redoStack.length).fire("redo");
      }
      return this;
    },
    getUndoData() {
    },
    applyChange() {
    }
  });

  // source/datastore/store/StoreUndoManager.js
  var StoreUndoManager = Class({
    Name: "StoreUndoManager",
    Extends: UndoManager,
    init: function() {
      StoreUndoManager.parent.constructor.apply(this, arguments);
      this.get("store").on("willCommit", this, "_saveUndoCheckpoint").on("record:user:create", this, "dataDidChange").on("record:user:update", this, "dataDidChange").on("record:user:destroy", this, "dataDidChange");
    },
    destroy() {
      this.get("store").off("willCommit", this, "_saveUndoCheckpoint").off("record:user:create", this, "dataDidChange").off("record:user:update", this, "dataDidChange").off("record:user:destroy", this, "dataDidChange");
      StoreUndoManager.parent.destroy.call(this);
    },
    // Avoid passing event argument to saveUndoCheckpoint method
    _saveUndoCheckpoint() {
      this.saveUndoCheckpoint();
    },
    dataDidChange() {
      const noChanges = !this.get("store").checkForChanges().get("hasChanges");
      this._isInUndoState = noChanges;
      return this.set("canRedo", noChanges && !!this._redoStack.length).set("canUndo", noChanges && !!this._undoStack.length).fire("input");
    },
    getUndoData() {
      const store = this.get("store");
      return store.checkForChanges().get("hasChanges") ? store.getInverseChanges() : null;
    },
    applyChange(data) {
      const store = this.get("store");
      store.applyChanges(data);
      const inverse = store.getInverseChanges();
      store.commitChanges();
      return inverse;
    }
  });

  // source/_codependent/_DragController.js
  var DragController = null;
  var setDragController = (x) => DragController = x;

  // source/drag/Drag.js
  var Drag = Class({
    Name: "Drag",
    Extends: Obj,
    /**
            Constructor: O.Drag
    
            Parameters:
                mixin - {Object} Overrides any properties on the object. Must
                        include an `event` property containing the event object that
                        triggered the drag.
        */
    init: function(mixin2) {
      const event = mixin2.event;
      this._dragCursor = null;
      this._stylesheet = null;
      this._scrollBounds = null;
      this._scrollView = null;
      this._scrollBy = null;
      this._scrollInterval = null;
      this._lastTargetView = null;
      this.isNative = false;
      this.isCanceled = false;
      this.dragSource = null;
      this.allowedEffects = ALL;
      this.dataSource = null;
      this.dropTarget = null;
      this.dropEffect = DEFAULT;
      this.cursorPosition = this.startPosition = {
        x: event.clientX,
        y: event.clientY
      };
      this.defaultCursor = "default";
      this.dragImage = null;
      this.autoScroll = true;
      Drag.parent.constructor.call(this, mixin2);
      this._setCursor(true);
      this.startDrag();
    },
    /**
            Property: O.Drag#isNative
            Type: Boolean
    
            Is this drag triggered by native drag/drop events rather than mouse
            up/down events?
        */
    /**
            Property: O.Drag#isCanceled
            Type: Boolean
    
            Has this drag been canceled (so no effect should take place)?
        */
    /**
            Property: O.Drag#dragSource
            Type: O.View|null
    
            The view on which the drag was initiated, if initiated in the current
            window. Otherwise null.
        */
    /**
            Property: O.Drag#allowedEffects
            Type: O.DragEffect
            Default: O.DragEffect.ALL
    
            Which effects (move/copy/link) will the drag source allow the drop
            target to perform with the data represented by this drag.
        */
    /**
            Property: O.Drag#dataSource
            Type: O.DragDataSource|null
    
            An object providing access to the data represented by the drag. If null,
            the <O.Drag#dragSource> object will be used as the data source if it is
            present and contains the <O.DragDataSource> mixin. Otherwise, the drag
            is presumed not to represent any data.
        */
    /**
            Property: O.Drag#dropTarget
            Type: O.DropTarget|null
    
            The nearest <O.DropTarget> implementing view (going up the view tree)
            under the mouse cursor at the moment, or null if none of them are drop
            targets.
        */
    /**
            Property: O.Drag#dropEffect
            Type: O.DragEffect
            Default: O.DragEffect.DEFAULT
    
            The effect of the action that will be performed on the data should a
            drop be performed. This should be set by the current drop target.
        */
    /**
            Property: O.Drag#cursorPosition
            Type: Object
    
            Contains `x` and `y` values indicating the current cursor position
            relative to the browser window.
        */
    /**
            Property: O.Drag#startPosition
            Type: Object
    
            Contains `x` and `y` values indicating the cursor position when the drag
            was initiated, relative to the browser window.
        */
    /**
            Property: O.Drag#defaultCursor
            Type: String
            Default: 'default'
    
            The CSS cursor property value for the cursor to use when no drop effect
            has been set.
        */
    /**
            Property: O.Drag#dragImage
            Type: Element|null
    
            A DOM element to display next to the cursor whilst the drag is active.
            This could be a simple <img> or <canvas> tag, or a more complicated DOM
            tree.
        */
    /**
            Property: O.Drag#dragImageOffset
            Type: Object
            Default: { x: 5, y: 5 }
    
            x - {Number} The number of pixels to the right of the cursor at which
                the drag image should begin.
            y - {Number} The number of pixels to the bottom of the cursor at which
                the drag image should begin.
        */
    dragImageOffset: { x: 5, y: 5 },
    /**
            Method (private): O.Drag#_dragImageDidChange
    
            Observes the <O.Drag#dragImage> property and updates the image being
            dragged if it changes.
    
            Parameters:
                _        - {*} Ignored.
                __       - {*} Ignored.
                oldImage - {Element|null} The current drag image.
                image    - {Element|null} The new drag image to set.
        */
    _dragImageDidChange: function(_, __, oldImage, image) {
      if (this.isNative) {
        const offset = this.get("dragImageOffset");
        this.event.dataTransfer.setDragImage(image, offset.x, offset.y);
      } else {
        let dragCursor = this._dragCursor;
        if (dragCursor) {
          if (oldImage) {
            dragCursor.removeChild(oldImage);
          }
        } else {
          dragCursor = this._dragCursor = create("div", {
            style: "position: fixed; z-index: 9999; pointer-events: none"
          });
          this._updateDragImagePosition();
          document.body.appendChild(dragCursor);
        }
        dragCursor.appendChild(image);
      }
    }.observes("dragImage"),
    /**
            Method (private): O.Drag#_updateDragImagePosition
    
            Observes the <O.Drag#cursorPosition> and <O.Drag#dragImageOffset>
            properties and repositions the drag image as appropriate (if it's not a
            native drag, where the browser will automatically update the drag image.
        */
    _updateDragImagePosition: function() {
      const dragImage = this._dragCursor;
      if (dragImage) {
        const cursor = this.get("cursorPosition");
        const offset = this.get("dragImageOffset");
        dragImage.style.left = cursor.x + Math.max(offset.x, 5) + "px";
        dragImage.style.top = cursor.y + Math.max(offset.y, 5) + "px";
      }
    }.queue("render").observes("cursorPosition", "dragImageOffset"),
    /**
            Method (private): O.Drag#_setCursor
    
            Sets the on-screen cursor image based on the current dropEffect,
            overriding the normal cursor image.
    
            Parameters:
                set - {Boolean} If true, the cursor image will be overridden to
                      match the drop effect. If false, it will be set back to the
                      default (e.g. hand when over a link, pointer otherwise).
        */
    _setCursor: function(set) {
      let stylesheet = this._stylesheet;
      let cursor = this.get("defaultCursor");
      if (stylesheet) {
        stylesheet.remove();
        stylesheet = null;
      }
      if (set) {
        switch (this.get("dropEffect")) {
          case NONE:
            cursor = "no-drop";
            break;
          case COPY:
            cursor = "copy";
            break;
          case LINK:
            cursor = "alias";
            break;
        }
        stylesheet = create2(
          "o-drag-cursor",
          "*{cursor:default !important;cursor:" + cursor + " !important;}"
        );
      }
      this._stylesheet = stylesheet;
    }.observes("defaultCursor", "dropEffect"),
    /**
            Property: O.Drag#dataTypes
            Type: String[]
    
            An array of the data types available to drop targets of this drag. The
            data type will be the MIME type of the data if a native drag, or a
            custom string if non-native. Native drags representing at least one
            file, will also contain a `'Files'` data type.
        */
    dataTypes: function() {
      const dataSource = this.get("dataSource") || this.get("dragSource");
      if (dataSource && dataSource.get("isDragDataSource")) {
        return dataSource.get("dragDataTypes");
      }
      if (this.isNative) {
        const dataTransfer = this.event.dataTransfer;
        const types = [];
        let hasFiles = false;
        const items = dataTransfer.items;
        const length = items.length;
        if (length) {
          for (let i = length - 1; i >= 0; i -= 1) {
            const item = items[i];
            const itemType = item.type;
            if (!hasFiles) {
              hasFiles = item.kind === "file";
            }
            if (itemType) {
              types.include(itemType);
            }
          }
          if (hasFiles) {
            types.push("Files");
          }
          return types;
        }
        return Array.from(dataTransfer.types);
      }
      return [];
    }.property(),
    /**
            Method: O.Drag#hasDataType
    
            Parameters
                type - {String} The type to test for.
    
            Returns:
                {Boolean} Does the drag contain data of this type?
        */
    hasDataType(type) {
      return this.get("dataTypes").indexOf(type) !== -1;
    },
    /**
            Method: O.Drag#getFiles
    
            Parameters
                typeRegExp - {RegExp} (optional) A regular expression to match
                             against the file's MIME type.
    
            Returns:
                {File[]} An array of all files represented by the drag, or if a
                regular expression is given, an array of all files with a matching
                MIME type.
        */
    getFiles(typeRegExp) {
      const files = [];
      const items = this.getFromPath("event.dataTransfer.items");
      const l = items ? items.length : 0;
      for (let i = 0; i < l; i += 1) {
        const item = items[i];
        const itemType = item.type;
        if (item.kind === "file") {
          if (!itemType) {
            const entry = item.getAsEntry ? item.getAsEntry() : item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
            if (entry && !entry.isFile) {
              continue;
            }
          }
          if (!typeRegExp || typeRegExp.test(itemType)) {
            const file = item.getAsFile();
            if (file) {
              files.push(file);
            }
          }
        }
      }
      return files;
    },
    /**
            Method: O.Drag#getFileSystemEntries
    
            Returns:
                {FileSystemEntry[]|null} An array of all file system entries
                represented by the drag.
        */
    getFileSystemEntries() {
      let entries = null;
      const items = this.getFromPath("event.dataTransfer.items");
      const l = items ? items.length : 0;
      for (let i = 0; i < l; i += 1) {
        const item = items[i];
        if (item.kind === "file") {
          if (item.getAsEntry) {
            if (!entries) {
              entries = [];
            }
            entries.push(item.getAsEntry());
          } else if (item.webkitGetAsEntry) {
            if (!entries) {
              entries = [];
            }
            entries.push(item.webkitGetAsEntry());
          }
        }
      }
      return entries;
    },
    /**
            Method: O.Drag#getDataOfType
    
            Fetches data of a particular type represented by the drag.
    
            Parameters
                type     - {String} The type of data to retrieve.
                callback - {Function} A callback to be called with the data as its
                           single argument, or null as the argument if no data
                           available of the requested type. Note, the callback may
                           be made synchronously or asynchronously.
    
            Returns:
                {O.Drag} Returns self.
        */
    getDataOfType(type, callback) {
      const dataSource = this.get("dataSource") || this.get("dragSource");
      let dataFound = false;
      if (dataSource && dataSource.get("isDragDataSource")) {
        callback(dataSource.getDragDataOfType(type, this));
        dataFound = true;
      } else if (this.isNative) {
        const items = this.getFromPath("event.dataTransfer.items");
        const l = items ? items.length : 0;
        for (let i = 0; i < l; i += 1) {
          const item = items[i];
          if (item.type === type) {
            item.getAsString(callback);
            dataFound = true;
            break;
          }
        }
      }
      if (!dataFound) {
        callback(null);
      }
      return this;
    },
    /**
            Method: O.Drag#startDrag
    
            Called automatically by the init method of the drag to register it with
            the drag controller and set any data on the dataTransfer event property
            if a native drag. It is unlikely you will ever need to call this method
            explicitly.
    
            Returns:
                {O.Drag} Returns self.
        */
    startDrag() {
      DragController.register(this);
      this.fire("dragStarted");
      const dragSource = this.get("dragSource");
      if (dragSource) {
        dragSource.set("isDragging", true).dragStarted(this);
        const allowedEffects = dragSource.get("allowedDragEffects");
        this.set("allowedEffects", allowedEffects);
        if (this.isNative) {
          const dataTransfer = this.event.dataTransfer;
          const dataSource = this.get("dataSource") || dragSource;
          let dataIsSet = false;
          dataTransfer.effectAllowed = effectToString[this.get("allowedEffects")];
          if (dataSource.get("isDragDataSource")) {
            dataSource.get("dragDataTypes").forEach((type) => {
              if (type.includes("/")) {
                const data = dataSource.getDragDataOfType(
                  type,
                  this
                );
                dataTransfer.items.add(data, type);
                dataIsSet = true;
              }
            });
          }
          if (!dataIsSet) {
            dataTransfer.setData("x-private", "");
          }
        }
      }
      return this;
    },
    /**
            Method: O.Drag#endDrag
    
            If the drag is in progress, you can call this to cancel the drag
            operation. Otherwise it will be called automatically when the drag is
            finished (i.e. when the user releases the mouse or moves it out of the
            browser window).
    
            The method will clean up after a drag, resetting the cursor back to
            normal, informing the current drop target and drag source that the drag
            is finished and deregistering with the drag controller.
    
            Returns:
                {O.Drag} Returns self.
        */
    endDrag() {
      const dropTarget = this.get("dropTarget");
      const dragSource = this.get("dragSource");
      if (dropTarget) {
        dropTarget.dropExited(this);
      }
      if (dragSource) {
        dragSource.set("isDragging", false).dragEnded(this);
      }
      if (this._dragCursor) {
        document.body.removeChild(this._dragCursor);
        this._dragCursor = null;
      }
      if (this._scrollInterval) {
        cancel(this._scrollInterval);
        this._scrollInterval = null;
      }
      this._setCursor(false);
      this.fire("dragEnded");
      DragController.deregister(this);
      return this;
    },
    /**
            Method: O.Drag#move
    
            Called automatically by the drag controller whenever the mouse moves
            whilst the drag is in progress. Gets the updated cursor position,
            recalculates the drop target and scrolls scroll views if hovering near
            the edge.
    
            Parameters:
                event - {Event} The dragover or mousemove event.
    
            Returns:
                {O.Drag} Returns self.
        */
    move(event) {
      this.event = event;
      let view2 = event.targetView;
      if (!view2) {
        view2 = this.get("dropTarget");
      }
      const x = event.clientX;
      const y = event.clientY;
      this.set("cursorPosition", { x, y });
      this._check(view2, x, y);
      this._update(view2);
      return this;
    },
    /**
            Property (private): O.Drag#_scrollBounds
            Type: Object|null
    
            An object caching the position of the scroll view on the screen.
        */
    /**
            Property (private): O.Drag#_scrollView
            Type: O.ScrollView|null
    
            The scroll view under the cursor, if any.
        */
    /**
            Property (private): O.Drag#_scrollBy
            Type: Object|null
    
            An object with `x` and `y` properties containing the number of pixels
            the scroll view should be scrolled in the next frame (negative values to
            scroll up, positive values to scroll down).
        */
    /**
            Property (private): O.Drag#_scrollInterval
            Type: InvocationToken|null
    
            The InvocationToken returned by a call to <O.RunLoop.cancel>.
        */
    /**
            Property (private): O.Drag#_lastTargetView
            Type: O.View|null
    
            The view the mouse was over last time <O.Drag#_check> was called.
        */
    /**
            Method (private): O.Drag#_check
    
            Checks if the mouse is currently near the edge of a scroll view, and if
            so, sets that to scroll automatically.
    
            Parameters
                view - {O.View} The view the mouse is currently over.
                x    - The current x-coordinate of the mouse.
                y    - The current y-coordinate of the mouse.
        */
    _check(view2, x, y) {
      let scroll = this._scrollBounds;
      const outsideTriggerRegionWidth = 15;
      if (!scroll || x < scroll.l || x > scroll.r || y < scroll.t || y > scroll.b) {
        scroll = null;
        if (this.autoScroll && view2 && this._lastTargetView !== view2) {
          let scrollView = this._lastTargetView = view2;
          if (!(scrollView instanceof ScrollView)) {
            scrollView = scrollView.getParent(ScrollView);
          }
          if (scrollView) {
            const bounds = getRawBoundingClientRect(
              scrollView.get("layer")
            );
            scroll = {
              l: bounds.left - outsideTriggerRegionWidth,
              r: bounds.right + outsideTriggerRegionWidth,
              t: bounds.top - outsideTriggerRegionWidth,
              b: bounds.bottom + outsideTriggerRegionWidth
            };
            const deltaX = Math.min(75, bounds.width >> 2);
            const deltaY = Math.min(75, bounds.height >> 2);
            scroll.hl = scroll.l + deltaX;
            scroll.hr = scroll.r - deltaX;
            scroll.ht = scroll.t + deltaY;
            scroll.hb = scroll.b - deltaY;
            scroll.mayX = scrollView.get("showScrollbarX");
            scroll.mayY = scrollView.get("showScrollbarY");
          }
          this._scrollView = scrollView;
          this._scrollBounds = scroll;
        }
      }
      if (this._scrollInterval) {
        cancel(this._scrollInterval);
        this._scrollInterval = null;
      }
      if (scroll) {
        const deltaX = !scroll.mayX ? 0 : x < scroll.hl ? -10 : x > scroll.hr ? 10 : 0;
        const deltaY = !scroll.mayY ? 0 : y < scroll.ht ? -10 : y > scroll.hb ? 10 : 0;
        if (deltaX || deltaY) {
          this._scrollBy = { x: deltaX, y: deltaY };
          this._scrollInterval = invokePeriodically(
            this._scroll,
            100,
            this
          );
        }
      }
    },
    /**
            Method (private): O.Drag#_scroll
    
            Moves the scroll position of the scroll view currently being hovered
            over.
        */
    _scroll() {
      const scrollView = this._scrollView;
      const scrollBy = this._scrollBy;
      if (scrollView.scrollBy(scrollBy.x, scrollBy.y)) {
        const cursor = this.get("cursorPosition");
        const target = document.elementFromPoint(cursor.x, cursor.y);
        if (target) {
          this._update(getViewFromNode(target));
        }
      }
    },
    /**
            Method (private): O.Drag#_update
    
            Finds the current drop target and invokes the appropriate callbacks on
            the drag source and old/new drop targets.
    
            Parameters:
                view - {O.View} The view the mouse is currently over.
        */
    _update(view2) {
      let currentDrop = this.get("dropTarget");
      const dragSource = this.get("dragSource");
      while (view2) {
        if (view2 === currentDrop || view2.get("isDropTarget") && view2.willAcceptDrag(this)) {
          break;
        }
        view2 = view2.get("parentView") || null;
      }
      if (view2 !== currentDrop) {
        if (currentDrop) {
          currentDrop.dropExited(this);
        }
        if (view2) {
          view2.dropEntered(this);
        }
        currentDrop = view2;
        this.set("dropTarget", view2);
      }
      if (currentDrop) {
        currentDrop.dropMoved(this);
      }
      if (dragSource) {
        dragSource.dragMoved(this);
      }
    },
    /**
            Method: O.Drag#drop
    
            Called automatically by the drag controller when a drop event occurs. If
            over a drop target, and the drop effect is not NONE, calls the
            <O.DropTarget#drop> method on the target.
    
            Parameters:
                event - {Event} The drop or mouseup event.
    
            Returns:
                {O.Drag} Returns self.
        */
    drop(event) {
      this.event = event;
      const dropEffect = this.dropEffect;
      if (this.dropTarget && dropEffect !== NONE && dropEffect !== DEFAULT) {
        this.dropTarget.drop(this);
      }
      return this;
    }
  });

  // source/drag/DragController.js
  var isControl = {
    BUTTON: 1,
    INPUT: 1,
    OPTION: 1,
    SELECT: 1,
    TEXTAREA: 1
  };
  var TouchDragEvent = class {
    constructor(touch) {
      const clientX = touch.clientX;
      const clientY = touch.clientY;
      let target;
      try {
        target = document.elementFromPoint(clientX, clientY) || touch.target;
      } catch (error) {
        const newError = new Error(
          "Invalid value provided to document.elementFromPoint"
        );
        newError.details = {
          clientX,
          clientY,
          target: touch.target
        };
        throw newError;
      }
      this.touch = touch;
      this.clientX = clientX;
      this.clientY = clientY;
      this.target = target;
      this.targetView = getViewFromNode(target);
    }
  };
  var getTouch = function(touches, touchId) {
    if (touchId === null) {
      return null;
    }
    for (let i = touches.length - 1; i >= 0; i -= 1) {
      const touch = touches[i];
      if (touch.identifier === touchId) {
        return touch;
      }
    }
    return null;
  };
  var DragController2 = new Obj({
    /**
            Property (private): O.DragController._x
            Type: Number
    
            The (screen-based) x coordinate of the mouse when the last mousedown
            event fired. Used to detect if the mouse has moved sufficiently whilst
            down to initiate a drag.
        */
    _x: 0,
    /**
            Property (private): O.DragController._y
            Type: Number
    
            The (screen-based) y coordinate of the mouse when the last mousedown
            event fired. Used to detect if the mouse has moved sufficiently whilst
            down to initiate a drag.
        */
    _y: 0,
    /**
            Property (private): O.DragController._targetView
            Type: O.View|null
    
            The <O.View> instance on which the mousedown event occurred. Used to
            determine the target view to trigger a simulated drag event.
        */
    _targetView: null,
    /**
            Property (private): O.DragController._ignore
            Type: Boolean
    
            If true, drag events will not be initiated on mousemove. Is set to true
            whilst the mouse is down (unless it was inside a control), until the
            mouse is up again or a drag is initiated.
        */
    _ignore: true,
    /**
            Property (private): O.DragController._ignoreClick
            Type: Boolean
    
            If a mouse-down generated a drag, ignore clicks until we see another
            mouse down.
        */
    _ignoreClick: false,
    /**
            Property (private): O.DragController._touchId
            Type: String|null
    
            If a touch-inited drag is in progress, this holds the identifier of the
            touch being tracked
        */
    _touchId: null,
    /**
            Property: O.DragController.drag
            Type: O.Drag|null
    
            If a drag is in progress, this holds the current <O.Drag> instance.
        */
    drag: null,
    /**
            Method: O.DragController.register
    
            Called by a new O.Drag instance when it is created to set it as the
            handler for all future drag events. Ends any previous drag if still
            active.
    
            Parameters:
                drag - {O.Drag} The new drag instance.
        */
    register(drag) {
      const oldDrag = this.drag;
      if (oldDrag) {
        oldDrag.set("isCanceled", true).endDrag();
      }
      this.set("drag", drag);
    },
    /**
            Method: O.DragController.deregister
    
            Called by a new O.Drag instance when it is finished to deregister from
            future drag events.
    
            Parameters:
                drag - {O.Drag} The finished drag instance.
        */
    deregister(drag) {
      if (this.drag === drag) {
        this.set("drag", null);
        this._touchId = null;
      }
    },
    /**
            Method: O.DragController.getNearestDragView
    
            Parameters:
                view - {O.View}
    
            Returns:
                {O.View|null} The view passed in or the nearest parent view of that
                (going up the tree) which is draggable. A view is draggable if it
                includes the <O.Draggable> mixin.
        */
    getNearestDragView(view2) {
      while (view2) {
        if (view2.get("isDraggable")) {
          break;
        }
        view2 = view2.get("parentView") || null;
      }
      return view2;
    },
    /**
            Method: O.DragController.handleEvent
    
            Handler for native events. Fires an equivalent <O.EventTarget> event.
    
            Parameters:
                event - {Event}
        */
    handleEvent: function(event) {
      let type;
      try {
        type = event.type;
      } catch (error) {
      }
      if (type) {
        this.fire(type, event);
      }
    }.invokeInRunLoop(),
    // === Non-native mouse API version ===
    /**
            Method (private): O.DragController._onMousedown
    
            Tracks mousedown events so that simulated drag events can be dispatched
            when a drag gesture is detected.
    
            Parameters:
                event - {Event} The mousedown event.
        */
    _onMousedown: function(event) {
      this._ignoreClick = false;
      if (event.button || event.metaKey || event.ctrlKey) {
        return;
      }
      if (isControl[event.target.nodeName]) {
        this._ignore = true;
      } else {
        this._x = event.clientX;
        this._y = event.clientY;
        this._targetView = event.targetView;
        this._ignore = false;
      }
    }.on(POINTER_DOWN),
    /**
            Method (private): O.DragController._onMousemove
    
            Tracks mousemove events and creates a new <O.Drag> instance if a drag
            gesture is detected, or passes the move event to an existing drag.
    
            Parameters:
                event - {Event} The mousemove event.
        */
    _onMousemove: function(event) {
      const drag = this.drag;
      if (drag && this._touchId === null) {
        if (!drag.get("isNative")) {
          drag.move(event);
        }
        event.stopPropagation();
      } else if (!this._ignore) {
        const x = event.clientX - this._x;
        const y = event.clientY - this._y;
        if (x * x + y * y > 25) {
          const view2 = this.getNearestDragView(this._targetView);
          if (view2) {
            new Drag({
              pointerType: "mouse",
              dragSource: view2,
              event,
              startPosition: {
                x: this._x,
                y: this._y
              }
            });
          }
          this._ignore = true;
        }
      }
    }.on(POINTER_MOVE),
    /**
            Method (private): O.DragController._onMouseup
    
            Tracks mouseup events to end simulated drags.
    
            Parameters:
                event - {Event} The mouseup event.
        */
    _onMouseup: function(event) {
      this._ignore = true;
      this._targetView = null;
      const drag = this.drag;
      if (drag && this._touchId === null) {
        drag.drop(event).endDrag();
        this._ignoreClick = true;
      }
    }.on(POINTER_UP),
    _onClick: function(event) {
      if (this._ignoreClick) {
        event.preventDefault();
        event.stopPropagation();
      }
    }.on("click"),
    // === Non-native touch API version ===
    /**
            Method (private): O.DragController._onHold
    
            Parameters:
                event - {Event} The hold event.
        */
    _onHold: function(event) {
      const touch = event.touch;
      const touchEvent = new TouchDragEvent(touch);
      const view2 = this.getNearestDragView(touchEvent.targetView);
      if (view2 && !isControl[touchEvent.target.nodeName] && view2.get("isTouchDraggable")) {
        this._touchId = touch.identifier;
        new Drag({
          pointerType: "touch",
          dragSource: view2,
          event: touchEvent
        });
      }
    }.on("hold"),
    /**
            Method (private): O.DragController._onTouchstart
    
            Parameters:
                event - {Event} The touchstart event.
        */
    // Just doing a sanity check to make sure our drag touch isn't orphaned
    _onTouchstart: function(event) {
      if (this._touchId !== null) {
        const touch = getTouch(event.touches, this._touchId);
        if (!touch) {
          this.drag.set("isCanceled", true).endDrag();
        }
      }
    }.on("touchstart"),
    /**
            Method (private): O.DragController._onTouchmove
    
            Parameters:
                event - {Event} The touchmove event.
        */
    _onTouchmove: function(event) {
      const touch = getTouch(event.changedTouches, this._touchId);
      if (touch) {
        this.drag.move(new TouchDragEvent(touch));
        event.preventDefault();
        event.stopPropagation();
      }
    }.on("touchmove"),
    /**
            Method (private): O.DragController._onTouchend
    
            Parameters:
                event - {Event} The touchend event.
        */
    _onTouchend: function(event) {
      const touch = getTouch(event.changedTouches, this._touchId);
      if (touch) {
        this.drag.drop(new TouchDragEvent(touch)).endDrag();
      }
    }.on("touchend"),
    /**
            Method (private): O.DragController._onTouchcancel
    
            Parameters:
                event - {Event} The touchcancel event.
        */
    _onTouchcancel: function(event) {
      const touch = getTouch(event.changedTouches, this._touchId);
      if (touch) {
        this.drag.set("isCanceled", true).endDrag();
      }
    }.on("touchcancel"),
    // === Native API version ===
    /**
            Method (private): O.DragController._onDragstart
    
            Tracks dragstart events to create a new <O.Drag> instance.
    
            Parameters:
                event - {Event} The dragstart event.
        */
    _onDragstart: function(event) {
      const dragView = this.getNearestDragView(event.targetView);
      if (dragView) {
        event.preventDefault();
      } else {
        new Drag({
          pointerType: "unknown",
          event,
          isNative: true
        });
      }
    }.on("dragstart"),
    /**
            Method (private): O.DragController._onDragover
    
            Tracks dragover events to pass mouse movement to the <O.Drag> instance.
    
            Parameters:
                event - {Event} The dragover event.
        */
    _onDragover: function(event) {
      let drag = this.drag;
      const dataTransfer = event.dataTransfer;
      let notify = true;
      if (!event.targetView) {
        event.targetView = getViewFromNode(event.target);
      }
      if (!drag) {
        let effectAllowed;
        try {
          effectAllowed = dataTransfer.effectAllowed;
        } catch (error) {
          effectAllowed = ALL;
        }
        drag = new Drag({
          pointerType: "unknown",
          event,
          isNative: true,
          allowedEffects: effectToString.indexOf(effectAllowed)
        });
      } else {
        const x = event.clientX;
        const y = event.clientY;
        if (this._x === x && this._y === y) {
          notify = false;
        } else {
          this._x = x;
          this._y = y;
        }
      }
      if (notify) {
        drag.move(event);
      }
      const dropEffect = drag.get("dropEffect");
      if (dropEffect !== DEFAULT) {
        dataTransfer.dropEffect = effectToString[dropEffect & drag.get("allowedEffects")];
        event.preventDefault();
      }
    }.on("dragover"),
    /**
            Property (private): O.DragController._nativeRefCount
            Type: Number
    
            A reference count, incremented each time we see a dragenter event and
            decremented each time we see a dragleave event.
    
            If a native drag starts outside the window, we never get a dragend
            event. Instead we need to keep track of the dragenter/dragleave calls.
            The drag enter event is fired before the drag leave event (see
            http://dev.w3.org/html5/spec/dnd.html#drag-and-drop-processing-model),
            so when the count gets down to zero it means the mouse has left the
            actual window and so we can end the drag.
        */
    _nativeRefCount: 0,
    /**
            Method (private): O.DragController._onDragenter
    
            Tracks dragenter events to increment the
            <O.DragController._nativeRefCount> refcount.
    
            Parameters:
                event - {Event} The dragenter event.
        */
    _onDragenter: function() {
      this._nativeRefCount += 1;
    }.on("dragenter"),
    /**
            Method (private): O.DragController._onDragleave
    
            Tracks dragleave events to decrement the
            <O.DragController._nativeRefCount> refcount, and end the drag if it gets
            down to 0 (as this means the drag has left the browser window).
    
            Parameters:
                event - {Event} The dragleave event.
        */
    _onDragleave: function() {
      const drag = this.drag;
      if (!(this._nativeRefCount -= 1) && drag) {
        drag.set("isCanceled", true).endDrag();
      }
    }.on("dragleave"),
    /**
            Method (private): O.DragController._onDrop
    
            Tracks drop events to pass them to the active <O.Drag> instance.
    
            Parameters:
                event - {Event} The drop event.
        */
    _onDrop: function(event) {
      this._nativeRefCount = 0;
      const drag = this.drag;
      if (drag) {
        if (browser === "safari" && drag.isNative) {
          drag.computedPropertyDidChange("dataTypes");
        }
        if (drag.get("dropEffect") !== DEFAULT) {
          event.preventDefault();
        }
        drag.drop(event).endDrag();
      }
    }.on("drop"),
    /**
            Method (private): O.DragController._onDragend
    
            Tracks dragend events to pass them to the active <O.Drag> instance.
    
            Parameters:
                event - {Event} The dragend event.
        */
    _onDragend: function() {
      this._nativeRefCount = 0;
      const drag = this.drag;
      if (drag) {
        drag.endDrag();
      }
    }.on("dragend"),
    // === Cancel on escape ===
    /**
            Method (private): O.DragController._escCancel
    
            Cancels the drag if the escape key is hit whilst the drag is in
            progress.
    
            Parameters:
                event - {Event} The keydown event.
        */
    _escCancel: function(event) {
      const drag = this.drag;
      if (drag && lookupKey(event) === "Escape") {
        drag.set("isCanceled", true).endDrag();
      }
    }.on("keydown")
  });
  ["dragover", "dragenter", "dragleave", "drop", "dragend"].forEach((type) => {
    document.addEventListener(type, DragController2, false);
  });
  ViewEventsController.addEventTarget(DragController2, 20);
  setDragController(DragController2);

  // source/drag/DragDataSource.js
  var DragDataSource = {
    /**
            Constructor: O.DragDataSource
    
            Parameters:
                dragData - {Object} An object with data types as keys and the data
                           itself as the values.
        */
    init: function(dragData) {
      if (!dragData) {
        dragData = {};
      }
      this._dragData = dragData;
      this.dragDataTypes = Object.keys(dragData);
      this.get = function(key) {
        return this[key];
      };
    },
    /**
            Property: O.DragDataSource#isDragDataSource
            Type: Boolean
            Default: true
    
            Identifies the object as a drag data source, even if used as a mixin.
        */
    isDragDataSource: true,
    /**
            Property: O.DragDataSource#allowedDragEffects
            Type: O.DragEffect
            Default: O.DragEffect.ALL
    
            The effects allowed on the data.
        */
    allowedDragEffects: ALL,
    /**
            Property: O.DragDataSource#dragDataTypes
            Type: String[]
    
            The list of data types available in this data source.
        */
    dragDataTypes: [],
    /**
            Method: O.DragController.getDragDataOfType
    
            Parameters:
                type - {String} The data type required.
                drag - {O.Drag} The drag instance representing the data.
    
            Returns:
                {*} The data of the requested type, if available.
        */
    getDragDataOfType(type) {
      return this._dragData[type];
    }
  };

  // source/drag/Draggable.js
  var Draggable = {
    /**
            Property: O.Draggable#isDraggable
            Type: Boolean
            Default: true
    
            Identifies the view as draggable.
        */
    isDraggable: true,
    /**
            Property: O.Draggable#isDragging
            Type: Boolean
    
            True if the view is currently being dragged.
        */
    isDragging: false,
    /**
            Property: O.Draggable#isTouchDraggable
            Type: Boolean
            Default: true
    
            If true, the view will initiate drag-drop on touch hold.
        */
    isTouchDraggable: true,
    /**
            Method: O.Draggable#dragStarted
    
            Called when a drag is initiated with this view.
    
            Parameters:
                drag - {O.Drag} The drag instance.
        */
    dragStarted() {
    },
    /**
            Method: O.Draggable#dragMoved
    
            Called when a drag initiated with this view moves.
    
            Parameters:
                drag - {O.Drag} The drag instance.
        */
    dragMoved() {
    },
    /**
            Method: O.Draggable#dragEnded
    
            Called when a drag initiated with this view finishes (no matter where on
            screen it finishes). This method is guaranteed to be called, if and only
            if dragStarted was called on the same view.
    
            Parameters:
                drag - {O.Drag} The drag instance.
        */
    dragEnded() {
    }
  };

  // source/io/XHR.js
  var parseHeaders = function(allHeaders) {
    const headers = {};
    let start = 0;
    while (true) {
      while (/\s/.test(allHeaders.charAt(start))) {
        start += 1;
      }
      let end = allHeaders.indexOf(":", start);
      if (end < 0) {
        break;
      }
      const name = allHeaders.slice(start, end).toLowerCase();
      start = end + 1;
      while (allHeaders.charAt(start) === " ") {
        start += 1;
      }
      end = allHeaders.indexOf("\n", start);
      if (end < 0) {
        end = allHeaders.length;
      }
      while (end > start && /\s/.test(allHeaders.charAt(end - 1))) {
        end -= 1;
      }
      headers[name] = allHeaders.slice(start, end);
      start = end + 1;
    }
    return headers;
  };
  var XHR = class {
    /**
            Constructor: O.XHR
    
            Parameters:
                io - {O.Object} (optional).
        */
    constructor(io) {
      this._isRunning = false;
      this._status = 0;
      this.io = io || null;
      this.xhr = null;
    }
  };
  Object.assign(XHR.prototype, {
    /**
            Property: O.XHR#io
            Type: (O.Object|null)
    
            Reference to object on which properties are set and events fired.
        */
    /**
            Property (private): O.XHR#_isRunning
            Type: Boolean
    
            Is a request in progress?
        */
    destroy() {
      this.abort();
    },
    /**
            Method: O.XHR#isRunning
    
            Determines whether a request is currently in progress.
    
            Returns:
                {Boolean} Is there a request still in progress?
        */
    isRunning() {
      return !!this._isRunning;
    },
    /**
            Method: O.XHR#getHeader
    
            Returns the contents of the response header corresponding to the name
            supplied as a parameter to the method.
    
            Parameters:
                name - {String} The name of the header to be fetched.
    
            Returns:
                {String} The text of the header or the empty string if not found.
        */
    getHeader(name) {
      try {
        return this.xhr.getResponseHeader(name) || "";
      } catch (error) {
        return "";
      }
    },
    /**
            Method: O.XHR#getResponse
    
            Returns the response to the request.
    
            Returns:
                {String|ArrayBuffer|Blob|Document|Object|null} The response.
                (The type is determined by the responseType parameter to #send.)
        */
    getResponse() {
      try {
        return this.xhr.response;
      } catch (error) {
        return null;
      }
    },
    /**
            Method: O.XHR#getStatus
    
            Returns the HTTP status code returned by the server in response to the
            request.
    
            Returns:
                {Number} The HTTP status code
        */
    getStatus() {
      return this._status;
    },
    /**
            Method: O.XHR#send
    
            If a request is currently active, it is first aborted. A new request is
            then made to the server, using the parameters supplied.
    
            Parameters:
                method  - {String} The HTTP method to use ('GET' or 'POST').
                url     - {String} The URL to which the request is to be made. This
                          must be at the same domain as the current page or a
                          security error will be thrown.
                data    - {String} The data to send in the body of the request; only
                          valid for POST requests; this will be ignored if the
                          method is GET.
                headers - {Object} (Optional) A set of key:value pairs corresponding
                          to header names and their values which will be sent with
                          the request.
                withCredentials - {Boolean} (Optional) (Default false) Whether or
                                  not to include credentials in cross-site requests
                responseType - {String} See XMLHttpRequest.responseType for
                               permitted values. This controls the type of
                               {O.XHR#getResponse} and in consequence the {data}
                               field on an {io:success} or {io:failure} event.
    
            Returns:
                {O.XHR} Returns self.
        */
    send(method, url2, data, headers, withCredentials, responseType) {
      if (this._isRunning) {
        this.abort();
      }
      this._isRunning = true;
      const xhr = this.xhr = new XMLHttpRequest();
      const io = this.io;
      const that = this;
      if (io) {
        io.fire("io:begin");
      }
      xhr.open(method, url2, true);
      xhr.withCredentials = !!withCredentials;
      responseType = responseType || "";
      xhr.responseType = responseType;
      this._actualResponseType = xhr.responseType !== responseType ? responseType : "";
      for (const name in headers || {}) {
        if (name !== "Content-type" || !(data instanceof FormData)) {
          xhr.setRequestHeader(name, headers[name]);
        }
      }
      xhr.onreadystatechange = function() {
        that._xhrStateDidChange(this);
      };
      if (xhr.upload) {
        if (method !== "GET") {
          xhr.upload.addEventListener("progress", this, false);
        }
        xhr.addEventListener("progress", this, false);
      }
      try {
        xhr.send(data);
      } catch (error) {
        this.abort();
      }
      return this;
    },
    /**
            Method (private): O.XHR#_xhrStateDidChange
    
            Determines the state of the XMLHttpRequest object and fires the
            appropriate callbacks when it is loading/finished.
    
            Parameters:
                xhr - {XMLHttpRequest} The object whose state has changed.
        */
    _xhrStateDidChange: function(xhr) {
      const state = xhr.readyState;
      const io = this.io;
      if (state < 3 || !this._isRunning) {
        return;
      }
      if (state === 3) {
        if (io) {
          io.set("uploadProgress", 100).fire("io:loading");
        }
        return;
      }
      this._isRunning = false;
      xhr.onreadystatechange = function() {
      };
      if (xhr.upload) {
        xhr.upload.removeEventListener("progress", this, false);
        xhr.removeEventListener("progress", this, false);
      }
      const status = xhr.status;
      this._status = status;
      if (io) {
        const allHeaders = xhr.getAllResponseHeaders();
        const responseHeaders = parseHeaders(allHeaders);
        let response = this.getResponse();
        if (this._actualResponseType === "json") {
          try {
            response = JSON.parse(response);
          } catch (error) {
            response = null;
          }
        }
        const isSuccess = status >= 200 && status < 300 && (!!allHeaders || !!response);
        io.set("uploadProgress", 100).set("progress", 100).set("status", status).set("responseHeaders", responseHeaders).set("response", response).fire(isSuccess ? "io:success" : "io:failure", {
          status,
          headers: responseHeaders,
          data: response
        }).fire("io:end");
      }
    }.invokeInRunLoop(),
    handleEvent: function(event) {
      const io = this.io;
      if (io && event.type === "progress") {
        const type = event.target === this.xhr ? "progress" : "uploadProgress";
        io.set(
          type,
          Math.min(99, ~~(event.loaded / event.total * 100))
        ).fire("io:" + type, event);
      }
    }.invokeInRunLoop(),
    /**
            Method: O.XHR#abort
    
            Aborts the currently active request. No further callbacks will be made
            for that request. If there is no active request, calling this method has
            no effect.
    
            Returns:
                {O.XHR} Returns self.
        */
    abort() {
      if (this._isRunning) {
        this._isRunning = false;
        const xhr = this.xhr;
        const io = this.io;
        xhr.abort();
        xhr.onreadystatechange = function() {
        };
        if (xhr.upload) {
          xhr.upload.removeEventListener("progress", this, false);
          xhr.removeEventListener("progress", this, false);
        }
        if (io) {
          io.fire("io:abort").fire("io:end");
        }
      }
      return this;
    }
  });

  // source/io/HttpRequest.js
  var HttpRequest = Class({
    Name: "HttpRequest",
    Extends: Obj,
    /**
            Property: O.HttpRequest#timeout
            Type: Number
            Default: 0
    
            Time in milliseconds to wait before timing out and aborting the request.
            If the value is 0, the request will not timeout but will wait
            indefinitely to complete.
        */
    timeout: 0,
    /**
            Property: O.HttpRequest#method
            Type: String
            Default: 'GET'
    
            The HTTP method to use for the request.
        */
    method: "GET",
    /**
            Property: O.HttpRequest#url
            Type: String
    
            The URL to submit the request to.
        */
    url: "",
    /**
            Property: O.HttpRequest#contentType
            Type: String
            Default: 'application/x-www-form-urlencoded'
    
            The Content-type header for POST requests.
        */
    contentType: "application/x-www-form-urlencoded",
    /**
            Property: O.HttpRequest#headers
            Type: Object
            Default:
                    {Accept: 'application/json, * / *'}
    
            An object of default headers to be sent with each request (can be
            overridden individually in each request). The format of the object is
            `{headerName: headerValue}`.
        */
    headers: {
      Accept: "application/json, */*"
    },
    /**
            Property: O.HttpRequest#withCredentials
            Type: Boolean
            Default: false
    
            Send cookies with cross-domain requests?
        */
    withCredentials: false,
    /**
            Property: O.HttpRequest#responseType
            Type: String
            Default: ''
    
            What type should {data} in an {io:success} or {io:failure} event be?
            Refer to {XMLHttpRequest.responseType} for permitted values.
        */
    responseType: "",
    // ---
    init: function() {
      this._transport = null;
      this._timer = null;
      this._lastActivity = 0;
      this.uploadProgress = 0;
      this.progress = 0;
      this.status = 0;
      this.responseHeaders = {};
      this.response = "";
      HttpRequest.parent.constructor.apply(this, arguments);
    },
    // ---
    setTimeout: function() {
      const timeout = this.get("timeout");
      if (timeout) {
        this._lastActivity = Date.now();
        this._timer = invokeAfterDelay(this.didTimeout, timeout, this);
      }
    }.on("io:begin"),
    resetTimeout: function() {
      this._lastActivity = Date.now();
    }.on("io:uploadProgress", "io:loading", "io:progress"),
    clearTimeout: function() {
      const timer = this._timer;
      if (timer) {
        cancel(timer);
      }
    }.on("io:end"),
    didTimeout() {
      this._timer = null;
      const timeout = this.get("timeout");
      const timeSinceLastReset = Date.now() - this._lastActivity;
      const timeToTimeout = timeout - timeSinceLastReset;
      if (timeToTimeout < 10) {
        this.fire("io:timeout").abort();
      } else {
        this._timer = invokeAfterDelay(
          this.didTimeout,
          timeToTimeout,
          this
        );
      }
    },
    // ---
    // Send the request, immediately if possible, or if this.data is a promise,
    // after it resolves. (Caution: if this.data is rejected, the send will
    // never happen. Either ensure that it is never rejected, or handle that
    // case yourself.)
    send() {
      let data = this.get("data") || null;
      if (data instanceof Promise) {
        data.then((_data) => {
          this.set("data", _data);
          this.send();
        });
        return this;
      }
      const method = this.get("method").toUpperCase();
      let url2 = this.get("url");
      const headers = this.get("headers");
      const withCredentials = this.get("withCredentials");
      const responseType = this.get("responseType");
      const transport = new XHR();
      if (data && method === "GET") {
        url2 += (url2.includes("?") ? "&" : "?") + data;
        data = null;
      }
      const contentType = headers["Content-type"];
      if (contentType && method === "POST" && typeof data === "string" && contentType.indexOf(";") === -1) {
        headers["Content-type"] += ";charset=utf-8";
      }
      this._transport = transport;
      transport.io = this;
      transport.send(
        method,
        url2,
        data,
        headers,
        withCredentials,
        responseType
      );
      return this;
    },
    abort() {
      const transport = this._transport;
      if (transport && transport.io === this) {
        transport.abort();
      }
    },
    _releaseXhr: function() {
      const transport = this._transport;
      if (transport instanceof XHR) {
        transport.io = null;
        this._transport = null;
      }
    }.on("io:success", "io:failure", "io:abort")
    // ---
    /**
            Event: io:begin
    
            This event is fired when the request starts.
        */
    /**
            Event: io:abort
    
            This event is fired if the request is aborted.
        */
    /**
            Event: io:uploadProgress
    
            This event *may* be fired as data is uploaded, but only if the browser
            supports XHR2.
        */
    /**
            Event: io:loading
    
            This event is fired when the response body begins to download.
        */
    /**
            Event: io:progress
    
            This event *may* be fired periodically whilst the response body is
            downloading, but only if the browser supports XHR2.
        */
    /**
            Event: io:success
    
            This event is fired if the request completes successfully. It includes
            the following properties:
    
            status  - The HTTP status code of the response.
            headers - The headers of the response.
            data    - The data returned by the response.
        */
    /**
            Event: io:failure
    
            This event is fired if the request completes unsuccessfully (normally
            determined by the HTTP status code). It includes the following
            properties:
    
            status  - The HTTP status code of the response.
            headers - The headers of the response.
            data    - The data returned by the response.
        */
    /**
            Event: io:timeout
    
            This event is fired if the request times out.
        */
    /**
            Event: io:end
    
            This is the final event to be fired for the request, this will always
            fire no matter if the request was successful, failed or aborted.
        */
  });

  // source/localisation/regionNames.js
  var regionNames = {
    AC: "Ascension",
    AD: "Andorra",
    AE: "United Arab Emirates",
    AF: "Afghanistan",
    AG: "Antigua and Barbuda",
    AI: "Anguilla",
    AL: "Albania",
    AM: "Armenia",
    AN: "Netherlands Antilles",
    AO: "Angola",
    AQ: "Australian External Territories",
    AR: "Argentina",
    AS: "American Samoa",
    AT: "Austria",
    AU: "Australia",
    AW: "Aruba",
    AZ: "Azerbaijan",
    BA: "Bosnia and Herzegovina",
    BB: "Barbados",
    BD: "Bangladesh",
    BE: "Belgium",
    BF: "Burkina Faso",
    BG: "Bulgaria",
    BH: "Bahrain",
    BI: "Burundi",
    BJ: "Benin",
    BL: "Saint Barth\xE9lemy",
    BM: "Bermuda",
    BN: "Brunei Darussalam",
    BO: "Bolivia",
    BQ: "Caribbean Netherlands",
    BR: "Brazil",
    BS: "The Bahamas",
    BT: "Bhutan",
    BW: "Botswana",
    BY: "Belarus",
    BZ: "Belize",
    CA: "Canada",
    CC: "Cocos Islands",
    CD: "Democratic Republic of the Congo",
    CF: "Central African Republic",
    CG: "Republic of the Congo",
    CH: "Switzerland",
    CI: "C\xF4te d'Ivoire",
    CK: "Cook Islands",
    CL: "Chile",
    CM: "Cameroon",
    CN: "China mainland",
    CO: "Colombia",
    CR: "Costa Rica",
    CU: "Cuba",
    CV: "Cape Verde",
    CW: "Cura\xE7ao",
    CX: "Christmas Island",
    CY: "Cyprus",
    CZ: "Czech Republic",
    DE: "Germany",
    DG: "Diego Garcia",
    DJ: "Djibouti",
    DK: "Denmark",
    DM: "Dominica",
    DO: "Dominican Republic",
    DZ: "Algeria",
    EC: "Ecuador",
    EE: "Estonia",
    EG: "Egypt",
    ER: "Eritrea",
    ES: "Spain",
    ET: "Ethiopia",
    EU: "Europe",
    FI: "Finland",
    FJ: "Fiji",
    FK: "Falkland Islands",
    FM: "Micronesia",
    FO: "Faroe Islands",
    FR: "France",
    GA: "Gabon",
    GB: "United Kingdom",
    GD: "Grenada",
    GE: "Georgia",
    GF: "French Guiana",
    GG: "Guernsey",
    GH: "Ghana",
    GI: "Gibraltar",
    GL: "Greenland",
    GM: "The Gambia",
    GN: "Guinea",
    GP: "Guadeloupe",
    GQ: "Equatorial Guinea",
    GR: "Greece",
    GS: "South Georgia and South Sandwich Islands",
    GT: "Guatemala",
    GU: "Guam",
    GW: "Guinea-Bissau",
    GY: "Guyana",
    HK: "Hong Kong",
    HN: "Honduras",
    HR: "Croatia",
    HT: "Haiti",
    HU: "Hungary",
    ID: "Indonesia",
    IE: "Ireland",
    IL: "Israel",
    IM: "Isle of Man",
    IN: "India",
    IQ: "Iraq",
    IR: "Iran",
    IS: "Iceland",
    IT: "Italy",
    JE: "Jersey",
    JM: "Jamaica",
    JO: "Jordan",
    JP: "Japan",
    KE: "Kenya",
    KG: "Kyrgyzstan",
    KH: "Cambodia",
    KI: "Kiribati",
    KM: "Comoros",
    KN: "Saint Kitts and Nevis",
    KP: "North Korea",
    KR: "South Korea",
    KW: "Kuwait",
    KY: "Cayman Islands",
    KZ: "Kazakhstan",
    LA: "Laos",
    LB: "Lebanon",
    LC: "Saint Lucia",
    LI: "Liechtenstein",
    LK: "Sri Lanka",
    LR: "Liberia",
    LS: "Lesotho",
    LT: "Lithuania",
    LU: "Luxembourg",
    LV: "Latvia",
    LY: "Libya",
    MA: "Morocco",
    MC: "Monaco",
    MD: "Moldova",
    ME: "Montenegro",
    MF: "Saint Martin",
    MG: "Madagascar",
    MH: "Marshall Islands",
    MK: "North Macedonia",
    ML: "Mali",
    MM: "Myanmar",
    MN: "Mongolia",
    MO: "Macau",
    MP: "Northern Mariana Islands",
    MQ: "Martinique",
    MR: "Mauritania",
    MS: "Montserrat",
    MT: "Malta",
    MU: "Mauritius",
    MV: "Maldives",
    MW: "Malawi",
    MX: "Mexico",
    MY: "Malaysia",
    MZ: "Mozambique",
    NA: "Namibia",
    NC: "New Caledonia",
    NE: "Niger",
    NG: "Nigeria",
    NI: "Nicaragua",
    NL: "Netherlands",
    NO: "Norway",
    NP: "Nepal",
    NR: "Nauru",
    NU: "Niue",
    NZ: "New Zealand",
    OM: "Oman",
    PA: "Panama",
    PE: "Peru",
    PF: "French Polynesia",
    PG: "Papua New Guinea",
    PH: "Philippines",
    PK: "Pakistan",
    PL: "Poland",
    PM: "Saint Pierre and Miquelon",
    PR: "Puerto Rico",
    PS: "Palestinian Territories",
    PT: "Portugal",
    PW: "Palau",
    PY: "Paraguay",
    QA: "Qatar",
    RE: "R\xE9union",
    RO: "Romania",
    RS: "Serbia",
    RU: "Russia",
    RW: "Rwanda",
    SA: "Saudi Arabia",
    SB: "Solomon Islands",
    SC: "Seychelles",
    SD: "Sudan",
    SE: "Sweden",
    SG: "Singapore",
    SH: "Saint Helena",
    SI: "Slovenia",
    SK: "Slovakia",
    SL: "Sierra Leone",
    SM: "San Marino",
    SN: "Senegal",
    SO: "Somalia",
    SR: "Suriname",
    SS: "South Sudan",
    ST: "Sao Tome and Principe",
    SV: "El Salvador",
    SX: "Sint Maarten",
    SY: "Syria",
    SZ: "Swaziland",
    TC: "Turks and Caicos Islands",
    TD: "Chad",
    TG: "Togo",
    TH: "Thailand",
    TJ: "Tajikistan",
    TK: "Tokelau",
    TL: "Timor-Leste",
    TM: "Turkmenistan",
    TN: "Tunisia",
    TO: "Tonga",
    TP: "East Timor",
    TR: "Turkey",
    TT: "Trinidad and Tobago",
    TV: "Tuvalu",
    TW: "Taiwan",
    TZ: "Tanzania",
    UA: "Ukraine",
    UG: "Uganda",
    US: "United States",
    UY: "Uruguay",
    UZ: "Uzbekistan",
    VA: "Vatican",
    VC: "Saint Vincent and the Grenadines",
    VE: "Venezuela",
    VG: "British Virgin Islands",
    VI: "U.S. Virgin Islands",
    VN: "Vietnam",
    VU: "Vanuatu",
    WF: "Wallis and Futuna",
    WS: "Samoa",
    XK: "Kosovo",
    YE: "Yemen",
    YT: "Mayotte",
    YU: "Serbia and Montenegro",
    ZA: "South Africa",
    ZM: "Zambia",
    ZW: "Zimbabwe"
  };

  // source/localisation/Locale.js
  var Locale = class {
    /**
            Constructor: O.Locale
    
            Most options passed as the argument to this constructor are just added
            as properties to the object (and will override any inherited value for
            the same key). The following keys are special:
    
            code         - {String} The code for this locale. This *must* be
                           included.
            macros       - {Object} A mapping of key to functions, which may be used
                           inside the string translations (see documentation for the
                           translate method).
            translations - {Object} A mapping of key to string or function
                           specifying specific translations for this locale.
            dateFormats  - {Object} A mapping of key to (String|Date->String), each
                           taking a single Date object as an argument and outputting
                           a formatted date.
    
            Parameters:
                mixin - {Object} Information for this locale.
        */
    constructor(mixin2) {
      this.dateFormats = Object.create(this.dateFormats);
      merge(this, mixin2);
      if (typeof Intl !== "undefined" && typeof Intl.DisplayNames !== "undefined") {
        const displayNames = new Intl.DisplayNames(this.code, {
          type: "region"
        });
        this.getRegionName = (isoCode) => {
          if (!isoCode) {
            return "";
          }
          const name = displayNames.of(isoCode);
          return name === isoCode ? "" : name;
        };
      }
    }
  };
  Object.assign(Locale.prototype, {
    /**
            Property: O.Locale#code
            Type: String
    
            The ISO code for this locale.
        */
    code: "xx",
    // === Numbers ===
    /**
            Property: O.Locale#decimalPoint
            Type: String
    
            The symbol used to divide the integer part from the decimal part of a
            number.
        */
    decimalPoint: ".",
    /**
            Property: O.Locale#thousandsSeparator
            Type: String
    
            The symbol used to divide large numbers up to make them easier to read.
        */
    thousandsSeparator: ",",
    /**
            Property: O.Locale#fileSizeUnits
            Type: String[]
    
            An array containing the suffix denoting units of bytes, kilobytes,
            megabytes and gigabytes (in that order).
        */
    fileSizeUnits: ["B", "KB", "MB", "GB"],
    /**
            Method: O.Locale#getFormattedInt
    
            Format an integer according to local conventions. Inserts thousands
            separators if used in the locale.  Should not be used for fractional
            numbers; use getFormattedNumber instead!
    
            Parameters:
                number - {(Number|String)} The integer to format.
    
            Returns:
                {String} The localised number.
        */
    getFormattedInt(number, locale) {
      let string = number + "";
      if (string.length > 3) {
        string = string.replace(
          /(\d+?)(?=(?:\d{3})+$)/g,
          "$1" + locale.thousandsSeparator
        );
      }
      return string;
    },
    /**
            Method: O.Locale#getFormattedNumber
    
            Format a number according to local conventions. Ensures the correct
            symbol is used for a decimal point, and inserts thousands separators if
            used in the locale.
    
            Parameters:
                number - {(Number|String)} The number to format.
    
            Returns:
                {String} The localised number.
        */
    getFormattedNumber(number) {
      let integer = number + "";
      let fraction = "";
      const decimalPointIndex = integer.indexOf(".");
      if (decimalPointIndex > -1) {
        fraction = integer.slice(decimalPointIndex + 1);
        integer = integer.slice(0, decimalPointIndex);
      }
      return this.getFormattedInt(integer, this) + (fraction && this.decimalPoint + fraction);
    },
    /**
            Method: O.Locale#getFormattedOrdinal
    
            Format an ordinal number according to local conventions, e.g. "1st",
            "42nd" or "53rd".
    
            Parameters:
                number - {Number} The number to format.
    
            Returns:
                {String} The localised ordinal.
        */
    getFormattedOrdinal(number) {
      return number + ".";
    },
    /**
            Method: O.Locale#getFormattedFileSize
    
            Format a number of bytes into a locale-specific file size string.
    
            Parameters:
                bytes         - {Number} The number of bytes.
                decimalPlaces - {Number} (optional) The number of decimal places to
                                use in the result, if in MB or GB.
    
            Returns:
                {String} The localised, human-readable file size.
        */
    getFormattedFileSize(bytes, decimalPlaces) {
      const units = this.fileSizeUnits;
      const l = units.length - 1;
      let i = 0;
      const ORDER_MAGNITUDE = 1e3;
      while (i < l && bytes >= ORDER_MAGNITUDE) {
        bytes /= ORDER_MAGNITUDE;
        i += 1;
      }
      const number = i < 2 ? Math.round(bytes) + "" : bytes.toFixed(decimalPlaces || 0);
      return this.getFormattedNumber(number) + "\xA0" + units[i];
    },
    // === Date and Time ===
    /**
            Property: O.Locale#dayNames
            Type: String[]
    
            Names of days of the week, starting from Sunday at index 0.
        */
    dayNames: [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
    ],
    /**
            Property: O.Locale#abbreviatedDayNames
            Type: String[]
    
            Abbreviated names of days of the week, starting from Sunday at index 0.
        */
    abbreviatedDayNames: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    /**
            Property: O.Locale#monthNames
            Type: String[]
    
            Names of months of the year, starting from January.
        */
    monthNames: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ],
    /**
            Property: O.Locale#abbreviatedMonthNames
            Type: String[]
    
            Abbreviated names of months of the year, starting from January.
        */
    abbreviatedMonthNames: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ],
    /**
            Property: O.Locale#amDesignator
            Type: String
    
            The string used to designate AM. Will be the empty string in locales
            which do not use the 12h clock.
        */
    amDesignator: "AM",
    /**
            Property: O.Locale#pmDesignator
            Type: String
    
            The string used to designate PM. Will be the empty string in locales
            which do not use the 12h clock.
        */
    pmDesignator: "PM",
    /**
            Property: O.Locale#use24hClock
            Type: Boolean
    
            Should the 24h clock be used?
        */
    use24hClock: true,
    /**
            Property: O.Locale#dateElementOrder
            Type: String
    
            Either 'dmy', 'mdy' or 'ymd', representing the order of day/month/year
            used in this locale to write dates.
        */
    dateElementOrder: "dmy",
    /**
            Property: O.Locale#dateFormats
            Type: String[String]
    
            A set of string patterns for dates, in the format used with
            <Date#format>.
        */
    dateFormats: {
      date: "%d/%m/%Y",
      time(date2, locale, utc) {
        return date2.format(
          locale.use24hClock ? this.time24 : this.time12,
          utc
        );
      },
      time12: "%-I:%M %p",
      time24: "%H:%M",
      fullDate: "%A, %-d %B %Y",
      fullDateAndTime: "%A, %-d %B %Y %H:%M",
      abbreviatedFullDate: "%a, %-d %b %Y",
      shortDayMonth: "%-d %b",
      shortDayMonthYear: "%-d %b \u2019%y"
    },
    /**
            Property: O.Locale#datePatterns
            Type: String[RegExp]
    
            A set of regular expressions for matching key words used in dates.
        */
    datePatterns: {},
    /**
            Method: O.Locale#getFormattedDate
    
            Get a date or time formatted according to local conventions.
    
            Parameters:
                date - {Date} The date object to format.
                type - {String} The type of result you want, e.g. 'shortDate',
                       'time', 'fullDateAndTime'.
                utc  - {Boolean} (optional) If true, the UTC time of this date
                       object will be used when determining the date.
    
            Returns:
                {String} The localised date.
        */
    getFormattedDate(date2, type, utc) {
      const dateFormats = this.dateFormats;
      const format = dateFormats[type] || dateFormats.date;
      return typeof format === "function" ? dateFormats[type](date2, this, utc) : date2.format(format, utc);
    },
    // === Strings ===
    /**
            Method: O.Locale#getRegionName
    
            Get the localised region (mostly country) name from the two-letter
            ISO 3166 region code.
    
            Parameters:
                isoCode - {String} The region code to get the name for.
    
            Returns:
                {String} The localised region name.
        */
    getRegionName(isoCode) {
      return regionNames[isoCode] || "";
    },
    /**
            Method (private): Method: O.Locale#_lr
    
            Accepts a list of translated strings/arguments and, when no DOM
            elements are included in the list, reduces them to a single string.
    
            Parameters:
                parts - {*[]} Array of items.
    
            Returns:
                {String|*[]} A single string or array of items.
        */
    _lr(parts) {
      if (parts.some((p) => typeof p === "object")) {
        return parts;
      }
      return parts.join("");
    },
    /**
            Method: O.Locale#p
    
            Dynamically constructed at compile time.  Short for "pluralise" — made
            compact for less data to be sent over the wire.
    
            Given a number and arguments for ICU message syntax options, returns the
            string with the number interpolated using the correct plural noun rules
            for a language.
    
            An ICUMessageObject has keys in the set {zero, one, two, many, few,
            other}, as appropriate for the locale, as described by Unicode CLDR:
            https://unicode-org.github.io/cldr-staging/charts/latest/supplemental/language_plural_rules.html
    
            Parameters:
                number        - {Number} The number to insert.
                options       - {ICUMessageObject} The options for a string.
    
            Returns:
                {String} The localised result string using the correct plural noun.
        */
    /**
            Property: O.Locale#translations
            Type: String[String]
    
            A map from the string identifier or English string to the localised
            string.
        */
    translations: {}
  });

  // source/selection/SelectionController.js
  var SelectionController = Class({
    Name: "SelectionController",
    Extends: Obj,
    content: null,
    visible: null,
    init: function() {
      this._selectionId = 0;
      this._lastSelectedIndex = 0;
      this._selectedStoreKeys = {};
      this.isLoadingSelection = false;
      this.length = 0;
      this.hasSelection = false;
      SelectionController.parent.constructor.apply(this, arguments);
      const content = this.get("content");
      if (content) {
        content.on("query:updated", this, "contentWasUpdated");
      }
    },
    destroy() {
      const content = this.get("content");
      if (content) {
        content.off("query:updated", this, "contentWasUpdated");
      }
      SelectionController.parent.destroy.call(this);
    },
    contentDidChange: function(_, __, oldContent, newContent) {
      if (oldContent) {
        oldContent.off("query:updated", this, "contentWasUpdated");
      }
      if (newContent) {
        newContent.on("query:updated", this, "contentWasUpdated");
      }
      this.selectNone();
    }.observes("content"),
    visibleDidChange: function() {
      this._lastSelectedIndex = 0;
    }.observes("visible"),
    contentWasUpdated(event) {
      const _selectedStoreKeys = this._selectedStoreKeys;
      let length = this.get("length");
      const removed = event.removed;
      const added = new Set(event.added);
      for (let i = removed.length - 1; i >= 0; i -= 1) {
        const storeKey = removed[i];
        if (_selectedStoreKeys[storeKey] && !added.has(storeKey)) {
          length -= 1;
          delete _selectedStoreKeys[storeKey];
        }
      }
      const lastSelectedIndex = this._lastSelectedIndex;
      this._lastSelectedIndex = lastSelectedIndex + event.addedIndexes.binarySearch(lastSelectedIndex) - event.removedIndexes.binarySearch(lastSelectedIndex);
      this.set("length", length).propertyDidChange("selectedStoreKeys");
    },
    // ---
    selectedStoreKeys: function() {
      return Object.keys(this._selectedStoreKeys);
    }.property().nocache(),
    isStoreKeySelected(storeKey) {
      return !!this._selectedStoreKeys[storeKey];
    },
    getSelectedRecords(store) {
      return this.get("selectedStoreKeys").map(
        (storeKey) => store.getRecordFromStoreKey(storeKey)
      );
    },
    // ---
    setHasSelection: function() {
      this.set("hasSelection", !!this.get("length"));
    }.observes("length"),
    // ---
    selectStoreKeys(storeKeys, isSelected, _selectionId) {
      if (_selectionId && _selectionId !== this._selectionId || isDestroyed(this)) {
        return;
      }
      isSelected = !!isSelected;
      const _selectedStoreKeys = this._selectedStoreKeys;
      let howManyChanged = 0;
      for (let i = storeKeys.length - 1; i >= 0; i -= 1) {
        const storeKey = storeKeys[i];
        const wasSelected = !!_selectedStoreKeys[storeKey];
        if (isSelected !== wasSelected) {
          if (isSelected) {
            _selectedStoreKeys[storeKey] = true;
          } else {
            delete _selectedStoreKeys[storeKey];
          }
          howManyChanged += 1;
        }
      }
      if (howManyChanged) {
        this.increment(
          "length",
          isSelected ? howManyChanged : -howManyChanged
        ).propertyDidChange("selectedStoreKeys");
      }
      this.set("isLoadingSelection", false);
    },
    selectIndex(index, isSelected, includeRangeFromLastSelected) {
      const lastSelectedIndex = this._lastSelectedIndex;
      const start = includeRangeFromLastSelected ? Math.min(index, lastSelectedIndex) : index;
      const end = (includeRangeFromLastSelected ? Math.max(index, lastSelectedIndex) : index) + 1;
      this._lastSelectedIndex = index;
      return this.selectRange(start, end, isSelected);
    },
    selectRange(start, end, isSelected) {
      const query = this.get("visible") || this.get("content");
      const selectionId = this._selectionId += 1;
      const loading = query.getStoreKeysForObjectsInRange(
        start,
        Math.min(end, query.get("length") || 0),
        (storeKeys, _start, _end) => {
          this.selectStoreKeys(
            storeKeys,
            isSelected,
            selectionId,
            _start,
            _end
          );
        }
      );
      if (loading) {
        this.set("isLoadingSelection", true);
      }
      return this;
    },
    selectIndexWithFocusedItem(index, isSelected, includeRangeFromLastSelected, focusedIndex) {
      if (includeRangeFromLastSelected && typeof focusedIndex === "number" && focusedIndex > -1 && !this.get("length")) {
        this._lastSelectedIndex = focusedIndex;
      }
      return this.selectIndex(
        index,
        isSelected,
        includeRangeFromLastSelected
      );
    },
    selectAll() {
      const query = this.get("visible") || this.get("content");
      const selectionId = this._selectionId += 1;
      const loading = query.getStoreKeysForAllObjects(
        (storeKeys, start, end) => {
          this.selectStoreKeys(storeKeys, true, selectionId, start, end);
        }
      );
      if (loading) {
        this.set("isLoadingSelection", true);
      }
      return this;
    },
    selectNone() {
      this._lastSelectedIndex = 0;
      this._selectedStoreKeys = {};
      this.set("length", 0).propertyDidChange("selectedStoreKeys").set("isLoadingSelection", false).setHasSelection();
      return this;
    }
  });

  // source/selection/SingleSelectionController.js
  var SingleSelectionController = Class({
    Name: "SingleSelectionController",
    Extends: Obj,
    allowNoSelection: true,
    init: function() {
      this._ignore = false;
      this._range = { start: -1, end: 0 };
      this.content = null;
      this.record = null;
      this.index = -1;
      this.isFetchingIndex = false;
      SingleSelectionController.parent.constructor.apply(this, arguments);
      const content = this.get("content");
      if (content) {
        this.contentDidChange(null, "", null, content);
      }
    },
    destroy() {
      const content = this.get("content");
      if (content) {
        content.off("query:reset", this, "contentWasReset").off("query:updated", this, "contentWasUpdated");
        content.removeObserverForRange(
          this._range,
          this,
          "recordAtIndexDidChange"
        );
      }
      SingleSelectionController.parent.destroy.call(this);
    },
    recordAtIndexDidChange: function() {
      const record = this.get("record");
      const content = this.get("content");
      const recordAtIndex = content && content.getObjectAt(this.get("index")) || null;
      if (!record) {
        this.set("record", recordAtIndex);
      } else if (recordAtIndex !== record) {
        const index = content.indexOfStoreKey(record.get("storeKey"));
        if (index > -1) {
          this._ignore = true;
          this.set("index", index);
          this._ignore = false;
        }
      }
    }.queue("before"),
    _indexDidChange: function() {
      const list = this.get("content");
      const length = list ? list.get("length") : 0;
      const index = this.get("index");
      const range = this._range;
      range.start = index;
      range.end = index + 1;
      if (!this._ignore) {
        if (index < 0 && !this.get("allowNoSelection") || !length && index > 0) {
          this.set("index", 0);
        } else if (length > 0 && index >= length) {
          this.set("index", length - 1);
        } else {
          let record;
          if (length && index > -1) {
            record = list.getObjectAt(index);
          }
          this._ignore = true;
          this.set("record", record || null);
          this._ignore = false;
        }
      }
    }.observes("index"),
    _recordDidChange: function() {
      if (!this._ignore) {
        const binding = meta(this).bindings.content;
        if (binding) {
          this._ignore = true;
          binding.sync();
          this._ignore = false;
        }
        const record = this.get("record");
        const list = this.get("content");
        if (record && list) {
          this.set("isFetchingIndex", true);
          list.indexOfStoreKey(record.get("storeKey"), 0, (index) => {
            if (this.get("record") === record && this.get("content") === list) {
              this._ignore = true;
              this.set("index", index);
              this._ignore = false;
              this.set("isFetchingIndex", false);
            }
          });
        } else if (record || this.get("allowNoSelection")) {
          this._ignore = true;
          this.set("index", -1);
          this._ignore = false;
        }
      }
    }.observes("record"),
    setRecordInNewContent(list) {
      if (this.get("isFetchingIndex")) {
        return;
      }
      const binding = meta(this).bindings.record;
      if (binding && binding.isNotInSync && binding.willSyncForward) {
        return;
      }
      const allowNoSelection = this.get("allowNoSelection");
      let record = this.get("record");
      let index = allowNoSelection ? -1 : 0;
      if (list !== this.get("content")) {
        return;
      }
      if (record) {
        index = list.indexOfStoreKey(record.get("storeKey"));
        if (!allowNoSelection && index < 0) {
          index = 0;
        }
      }
      if (index === this.get("index")) {
        record = list.getObjectAt(index);
        this.set("record", record || null);
      } else {
        this.set("index", index);
      }
    },
    contentDidChange: function(_, __, oldVal, newVal) {
      const range = this._range;
      if (oldVal) {
        oldVal.off("query:reset", this, "contentWasReset").off("query:updated", this, "contentWasUpdated");
        oldVal.removeObserverForRange(
          range,
          this,
          "recordAtIndexDidChange"
        );
        oldVal.removeObserverForKey("status", this, "contentBecameReady");
      }
      if (newVal) {
        newVal.addObserverForRange(range, this, "recordAtIndexDidChange");
        newVal.on("query:updated", this, "contentWasUpdated").on("query:reset", this, "contentWasReset");
        this.set("isFetchingIndex", false);
        if (!this._ignore) {
          if (!oldVal && this.get("record")) {
            this._recordDidChange();
          } else if (newVal.is(READY)) {
            this.setRecordInNewContent(newVal);
          } else {
            newVal.addObserverForKey(
              "status",
              this,
              "contentBecameReady"
            );
          }
        }
      }
    }.observes("content"),
    contentBecameReady(list, key) {
      if (list.is(READY)) {
        list.removeObserverForKey(key, this, "contentBecameReady");
        queueFn("before", this.setRecordInNewContent.bind(this, list));
      }
    },
    contentWasUpdated(updates) {
      let record = this.get("record");
      let index = record ? updates.added.indexOf(record.get("storeKey")) : -1;
      const removedIndexes = updates.removedIndexes;
      const addedIndexes = updates.addedIndexes;
      const content = this.get("content");
      if (!record) {
        return;
      }
      if (index > -1) {
        index = addedIndexes[index];
      } else {
        index = this.get("index");
        if (index === -1) {
          return;
        }
        let l = removedIndexes.length;
        let change = 0;
        for (let i = 0; i < l; i += 1) {
          if (removedIndexes[i] < index) {
            change += 1;
          } else {
            break;
          }
        }
        index -= change;
        l = addedIndexes.length;
        for (let i = 0; i < l; i += 1) {
          if (addedIndexes[i] <= index) {
            index += 1;
          } else {
            break;
          }
        }
      }
      index = Math.min(index, (content && content.get("length") || 1) - 1);
      if (index === this.get("index")) {
        record = content && content.getObjectAt(index);
        this.set("record", record || null);
      } else {
        this.set("index", index);
      }
    },
    contentWasReset() {
      this._recordDidChange();
    }
  });

  // source/storage/LocalStorage.js
  var dummyStorage = {
    setItem() {
    },
    getItem() {
    }
  };
  var LocalStorage = Class({
    Name: "LocalStorage",
    Extends: Obj,
    /**
            Constructor: O.LocalStorage
    
            Parameters:
                name        - {String} The name of this storage set. Objects with
                              the same name will overwrite each others' values.
                sessionOnly - {Boolean} (optional) Should the values only be
                              persisted for the session?
        */
    init: function(name, sessionOnly, defaults) {
      this._name = name + ".";
      this._store = location.protocol === "file:" ? dummyStorage : sessionOnly ? sessionStorage : localStorage;
      this._defaults = defaults || {};
      LocalStorage.parent.constructor.call(this);
    },
    setName(name) {
      this._name = name + ".";
      const keys2 = Object.keys(this).filter(
        (key) => this.hasOwnProperty(key) && key.charAt(0) !== "_"
      );
      this.beginPropertyChanges();
      keys2.forEach((key) => {
        const oldValue = this[key];
        delete this[key];
        const newValue = this.get(key);
        if (!isEqual(oldValue, newValue)) {
          this.propertyDidChange(key, oldValue, newValue);
        }
      });
      return this.endPropertyChanges();
    },
    get(key) {
      if (!(key in this)) {
        const defaults = this._defaults;
        let item;
        try {
          item = this._store.getItem(this._name + key);
        } catch (error) {
        }
        const value = item ? JSON.parse(item) : defaults[key];
        this[key] = value;
        return value;
      }
      return LocalStorage.parent.get.call(this, key);
    },
    set(key, value) {
      try {
        this._store.setItem(this._name + key, JSON.stringify(value));
      } catch (error) {
      }
      return LocalStorage.parent.set.call(this, key, value);
    }
  });

  // source/timezones/TimeZone.js
  var getPeriod = function(periods, date2, isUTC) {
    const lastIndex = periods.length - 1;
    let period = periods[lastIndex];
    for (let i = lastIndex - 1; i >= 0; i -= 1) {
      const candidate = periods[i];
      if (candidate[0] < date2 - (isUTC ? 0 : candidate[1])) {
        break;
      }
      period = candidate;
    }
    return period;
  };
  var tzRules = {
    "-": []
  };
  var getRule = function(rules, offset, datetime, isUTC, recurse) {
    const year = datetime.getUTCFullYear();
    let ruleInEffect = null;
    let prevRule;
    let dateInEffect;
    for (let i = rules.length - 1; i >= 0; i -= 1) {
      const rule = rules[i];
      if (rule[1] < year) {
        break;
      }
      if (rule[0] <= year) {
        const month = rule[2];
        const date2 = rule[3] || Date.getDaysInMonth(month, year);
        const ruleDate = new Date(Date.UTC(year, month, date2));
        const day = rule[4];
        if (day) {
          const difference = (Math.abs(day) - ruleDate.getUTCDay() + 6) % 7;
          if (difference) {
            ruleDate.add(
              day < 1 ? difference - 7 : difference,
              "day",
              true
            );
          }
        }
        ruleDate.setUTCHours(rule[5]);
        ruleDate.setUTCMinutes(rule[6]);
        ruleDate.setUTCSeconds(rule[7]);
        const ruleIsUTC = !rule[8];
        if (ruleIsUTC !== isUTC) {
          ruleDate.add((ruleIsUTC ? 1 : -1) * offset, "second", true);
          if (rule[8] === 2 && Math.abs(ruleDate - datetime) <= 3 * 60 * 60 * 1e3) {
            prevRule = getRule(
              rules,
              offset,
              new Date(datetime - 864e5),
              isUTC,
              true
            );
            if (prevRule) {
              ruleDate.add(
                (ruleIsUTC ? 1 : -1) * prevRule[9],
                "second",
                true
              );
            }
          }
        }
        if (!isUTC) {
          ruleDate.add(rule[9], "second", true);
          if (Math.abs(ruleDate - datetime) <= 3 * 60 * 60 * 1e3) {
            prevRule = prevRule || getRule(
              rules,
              offset,
              new Date(datetime - 864e5),
              isUTC,
              true
            );
            if (prevRule) {
              ruleDate.add(prevRule[9], "second", true);
            }
          }
        }
        if (ruleDate <= datetime && (!dateInEffect || ruleDate > dateInEffect)) {
          ruleInEffect = rule;
          dateInEffect = ruleDate;
        }
      }
    }
    if (!ruleInEffect && recurse) {
      return getRule(
        rules,
        offset,
        new Date(Date.UTC(year - 1, 11, 31, 12, 0, 0)),
        isUTC,
        false
      );
    }
    return ruleInEffect;
  };
  var idToTZ = /* @__PURE__ */ new Map();
  var getTimeZoneById = (id) => idToTZ.get(id) || null;
  var TimeZone = class _TimeZone {
    constructor(id, periods) {
      this.id = id;
      this.periods = periods;
    }
    convert(date2, toTimeZone) {
      const [, offset, daylightSavingsRule] = getPeriod(this.periods, date2);
      const rule = getRule(
        tzRules[daylightSavingsRule || "-"],
        offset,
        date2,
        toTimeZone,
        true
      );
      let effectiveOffset = offset;
      if (rule) {
        effectiveOffset += rule[9];
      }
      if (!toTimeZone) {
        effectiveOffset = -effectiveOffset;
      }
      return new Date(+date2 + effectiveOffset * 1e3);
    }
    convertDateToUTC(date2) {
      return this.convert(date2, false);
    }
    convertDateToTimeZone(date2) {
      return this.convert(date2, true);
    }
    getSuffix(date2) {
      return this.getTZAbbr(date2) || this.getGMTAbbr(date2);
    }
    getTZAbbr(date2) {
      const [, offset, daylightSavingsRule, suffix] = getPeriod(
        this.periods,
        date2,
        false
      );
      let rule = getRule(
        tzRules[daylightSavingsRule || "-"],
        offset,
        date2,
        false,
        true
      );
      let abbr = suffix;
      const slashIndex = suffix.indexOf("/");
      if (rule && slashIndex > -1) {
        abbr = rule[9] ? abbr.slice(slashIndex + 1) : abbr.slice(0, slashIndex);
        rule = null;
      }
      abbr = formatString(abbr, rule ? rule[10] : "S");
      if (/^[-+]/.test(abbr)) {
        return "";
      }
      return abbr;
    }
    getGMTAbbr(date2) {
      const offset = (this.convertDateToTimeZone(date2) - date2) / 6e4;
      if (!offset) {
        return "GMT";
      }
      const hours = Math.abs(Math.floor(offset / 60));
      const minutes = Math.abs(mod(offset, 60));
      const offsetString = minutes ? formatString("%n:%'02n", hours, minutes) : formatString("%n", hours);
      return "GMT" + (offset < 0 ? "\u2212" : "+") + offsetString;
    }
    toJSON() {
      return this.id;
    }
    static fromJSON(id) {
      return getTimeZoneById(id);
    }
    static isEqual(a, b) {
      return a.id === b.id;
    }
    static load(json) {
      const zones = json.zones;
      const link = json.link;
      const alias = json.alias;
      for (const id in zones) {
        idToTZ.set(id, new _TimeZone(id, zones[id]));
      }
      for (const id in link) {
        idToTZ.set(
          id,
          new _TimeZone(
            id,
            zones[link[id]] || idToTZ.get(link[id]).periods
          )
        );
      }
      for (const id in alias) {
        idToTZ.set(id, idToTZ.get(alias[id]));
      }
      Object.assign(tzRules, json.rules);
    }
  };

  // source/touch/Gesture.js
  var Gesture = class {
    constructor(mixin2) {
      Object.assign(this, mixin2);
    }
    cancel() {
    }
    start() {
    }
    move() {
    }
    scroll() {
    }
    end() {
    }
  };

  // source/touch/gestureManager.js
  var gestureManager = new Obj({
    _gestures: [],
    register(gesture) {
      this._gestures.push(gesture);
      return this;
    },
    deregister(gesture) {
      this._gestures.erase(gesture);
      return this;
    },
    isMouseDown: false,
    fire(type, event) {
      switch (true) {
        case /^touch/.test(type):
          type = type.slice(5);
        /* falls through */
        case type === "scroll": {
          const gestures = this._gestures;
          for (let i = gestures.length - 1; i >= 0; i -= 1) {
            gestures[i][type](event);
          }
        }
      }
      if (!event.button) {
        if (type === POINTER_DOWN) {
          this.set("isMouseDown", true);
        }
        if (type === POINTER_UP) {
          this.set("isMouseDown", false);
        }
      }
      event.propagationStopped = false;
    }
  });
  ViewEventsController.addEventTarget(gestureManager, 30);

  // source/touch/tap.js
  var TapEvent = class extends Event {
  };
  var HoldEvent = class extends Event {
    constructor(touch) {
      super("hold", touch.target);
      this.touch = touch;
    }
  };
  var fireHoldEvent = function() {
    if (!this._ignore) {
      ViewEventsController.handleEvent(new HoldEvent(this.touch));
    }
  };
  var TrackedTouch = class {
    constructor(touch) {
      const activeEls = [];
      let target = touch.target;
      let view2 = getViewFromNode(target);
      let inScrollView = false;
      while (view2) {
        if (view2.get("showScrollbarX") || view2.get("showScrollbarY")) {
          inScrollView = true;
          break;
        }
        view2 = view2.get("parentView");
      }
      this.timestamp = Date.now();
      this.x = touch.clientX;
      this.y = touch.clientY;
      this.target = target;
      this.touch = touch;
      this.cancelOnMove = inScrollView;
      this.activeEls = activeEls;
      do {
        if (/^(?:A|BUTTON|INPUT|LABEL)$/.test(target.nodeName) || target.classList && target.classList.contains("tap-target")) {
          activeEls.push(target);
          target.classList.add("tap-active");
        }
      } while (target = target.parentNode);
      this._ignore = false;
      invokeAfterDelay(fireHoldEvent, 450, this);
    }
    done() {
      const activeEls = this.activeEls;
      const l = activeEls.length;
      for (let i = 0; i < l; i += 1) {
        activeEls[i].classList.remove("tap-active");
      }
      this._ignore = true;
    }
  };
  var getParents = function(node) {
    const parents = [];
    while (node) {
      parents.push(node);
      node = node.parentNode;
    }
    parents.reverse();
    return parents;
  };
  var getCommonAncestor = function(a, b) {
    const parentsA = getParents(a);
    const parentsB = getParents(b);
    for (let i = 0; true; i += 1) {
      if (parentsA[i] !== parentsB[i]) {
        return i ? parentsA[i - 1] : null;
      }
    }
  };
  var tap = new Gesture({
    _tracking: {},
    cancel() {
      const tracking = this._tracking;
      for (const id in tracking) {
        tracking[id].done();
      }
      this._tracking = {};
    },
    start(event) {
      const touches = event.changedTouches;
      const tracking = this._tracking;
      const l = touches.length;
      for (let i = 0; i < l; i += 1) {
        const touch = touches[i];
        const id = touch.identifier;
        if (!tracking[id]) {
          tracking[id] = new TrackedTouch(touch);
        }
      }
    },
    move(event) {
      const touches = event.changedTouches;
      const tracking = this._tracking;
      const l = touches.length;
      for (let i = 0; i < l; i += 1) {
        const touch = touches[i];
        const id = touch.identifier;
        const trackedTouch = tracking[id];
        if (trackedTouch && trackedTouch.cancelOnMove) {
          const deltaX = touch.clientX - trackedTouch.x;
          const deltaY = touch.clientY - trackedTouch.y;
          if (deltaX * deltaX + deltaY * deltaY > 25) {
            trackedTouch.done();
            delete tracking[id];
          }
        }
      }
    },
    scroll() {
      this.cancel();
    },
    end(event) {
      const touches = event.changedTouches;
      const tracking = this._tracking;
      const l = touches.length;
      for (let i = 0; i < l; i += 1) {
        const touch = touches[i];
        const id = touch.identifier;
        const trackedTouch = tracking[id];
        if (trackedTouch) {
          const { clientX, clientY } = touch;
          let target = 0 <= clientX && clientX < Infinity && 0 <= clientY && clientY < Infinity ? document.elementFromPoint(clientX, clientY) : null;
          const initialTarget = trackedTouch.target;
          const duration2 = Date.now() - trackedTouch.timestamp;
          if (target && target !== initialTarget) {
            target = getCommonAncestor(target, initialTarget);
          }
          if (target) {
            const tapEvent = new TapEvent("tap", target, {
              duration: duration2,
              touch
            });
            ViewEventsController.handleEvent(tapEvent);
          }
          trackedTouch.done();
          delete tracking[id];
        }
      }
    }
  });

  // source/views/collections/ListItemView.js
  var ListItemView = Class({
    Name: "ListItemView",
    Extends: View2,
    content: null,
    index: 0,
    itemLayout: 0,
    selection: null,
    isSelected: false,
    animateIn: false,
    init: function(mixin2) {
      const selection = mixin2.selection;
      const content = mixin2.content;
      if (selection && content) {
        this.isSelected = selection.isStoreKeySelected(
          content.get("storeKey")
        );
      }
      ListItemView.parent.constructor.call(this, mixin2);
    },
    positioning: "absolute",
    layout: function() {
      const listView = this.get("parentView");
      let top = listView.indexToOffset(this.get("index"), this);
      const animateIn = this.get("animateIn");
      const isNew = animateIn && !this.get("isInDocument");
      if (isNew) {
        top -= listView.get("itemHeight");
      }
      return {
        top,
        opacity: animateIn ? isNew ? 0 : 1 : void 0
      };
    }.property(),
    invalidateLayout() {
      this.computedPropertyDidChange("layout");
    },
    layoutWillChange: function() {
      if (this.get("animateLayer")) {
        invokeInNextEventLoop(this.invalidateLayout, this);
      } else {
        this.invalidateLayout();
      }
    }.observes("index", "itemLayout"),
    resetLayout: function() {
      if (this.get("animateIn")) {
        this.invalidateLayout();
      }
    }.nextLoop().observes("isInDocument")
  });

  // source/views/collections/ListKBFocusView.js
  var ListKBFocusView = Class({
    Name: "ListKBFocusView",
    Extends: View2,
    listView: null,
    selection: null,
    singleSelection: null,
    index: bind("singleSelection*index"),
    record: bind("singleSelection*record"),
    keys: {
      j: "goNext",
      k: "goPrev",
      x: "select",
      X: "select",
      o: "trigger",
      Enter: "trigger",
      s: "star"
    },
    className: "v-ListKBFocus",
    positioning: "absolute",
    itemLayout: bind("listView*itemLayout"),
    layoutIndex: function() {
      const index = this.get("index");
      const list = this.get("singleSelection").get("content");
      if (index > -1 && list && list.getObjectAt(index) !== this.get("record")) {
        return -1;
      }
      return index;
    }.property("index", "record"),
    layout: function() {
      const index = this.get("layoutIndex");
      const listView = this.get("listView");
      return {
        visibility: index < 0 ? "hidden" : "visible",
        marginTop: index < 0 ? 0 : listView.indexToOffset(index),
        height: listView.get("itemHeight")
      };
    }.property("itemLayout", "layoutIndex"),
    didEnterDocument() {
      const keys2 = this.get("keys");
      const shortcuts = ViewEventsController.kbShortcuts;
      for (const key in keys2) {
        shortcuts.register(key, this, keys2[key]);
      }
      return ListKBFocusView.parent.didEnterDocument.call(this);
    },
    willLeaveDocument() {
      const keys2 = this.get("keys");
      const shortcuts = ViewEventsController.kbShortcuts;
      for (const key in keys2) {
        shortcuts.deregister(key, this, keys2[key]);
      }
      return ListKBFocusView.parent.willLeaveDocument.call(this);
    },
    // Scroll to centre widget on screen with no animation
    recordDidChange: function() {
      this._animateIntoView = this.get("isInDocument");
      this.checkScroll();
    }.observes("record"),
    checkScroll: function() {
      const distance = this.get("distanceFromVisRect");
      const animateIntoView = this._animateIntoView;
      if (distance) {
        this.scrollIntoView(
          !animateIntoView ? 0 : distance < 0 ? -0.6 : 0.6,
          animateIntoView
        );
      }
    }.queue("after"),
    distanceFromVisRect: function() {
      const layoutIndex = this.get("layoutIndex");
      const scrollView = this.getParent(ScrollView);
      if (scrollView && layoutIndex > -1 && this.get("isInDocument") && !this._needsRedraw) {
        const scrollTop = scrollView.get("scrollTop");
        const position = this.getPositionRelativeTo(scrollView);
        const top = position.top;
        const above = top - scrollTop;
        if (above < 0) {
          return above;
        }
        const scrollHeight = scrollView.get("pxHeight");
        const below = top + this.get("pxHeight") - scrollTop - scrollHeight;
        if (below > 0) {
          return below;
        }
      }
      return 0;
    }.property().nocache(),
    scrollIntoView(offset, withAnimation) {
      const scrollView = this.getParent(ScrollView);
      if (scrollView) {
        const scrollHeight = scrollView.get("pxHeight");
        const pxHeight = this.get("pxHeight");
        const top = this.getPositionRelativeTo(scrollView).top;
        if (offset && -1 <= offset && offset <= 1) {
          offset = offset * (scrollHeight - pxHeight) >> 1;
        }
        scrollView.scrollTo(
          0,
          Math.max(
            0,
            top + (pxHeight - scrollHeight >> 1) + (offset || 0)
          ),
          withAnimation
        );
      }
    },
    go(delta2) {
      const index = this.get("index");
      const singleSelection = this.get("singleSelection");
      const list = singleSelection.get("content");
      const length = list && list.get("length") || 0;
      if (delta2 === 1 && index > -1 && list && list.getObjectAt(index) !== this.get("record")) {
        delta2 = 0;
      }
      if (delta2) {
        singleSelection.set("index", limit(index + delta2, 0, length - 1));
      } else {
        singleSelection.propertyDidChange("index");
      }
    },
    goNext() {
      this.go(1);
    },
    goPrev() {
      this.go(-1);
    },
    select(event) {
      const index = this.get("index");
      const selection = this.get("selection");
      const record = this.get("record");
      if (selection && record) {
        selection.selectIndex(
          index,
          !selection.isStoreKeySelected(record.get("storeKey")),
          event.shiftKey
        );
      }
    },
    trigger() {
    },
    star() {
    }
  });

  // source/views/collections/TrueVisibleRect.js
  var TrueVisibleRect = {
    visibleRect: function() {
      if (!this.get("isInDocument")) {
        return { x: 0, y: 0, width: 0, height: 0 };
      }
      const x = this.get("pxLeft");
      const y = this.get("pxTop");
      const width = this.get("pxWidth");
      const height = this.get("pxHeight");
      const parent = this.get("parentView").get("visibleRect");
      const left = Math.max(x, parent.x);
      const right = Math.min(x + width, parent.x + parent.width);
      const top = Math.max(y, parent.y);
      const bottom = Math.min(y + height, parent.y + parent.height);
      const across = Math.max(right - left, 0);
      const down = Math.max(bottom - top, 0);
      return {
        x: left - x + this.get("scrollLeft"),
        y: top - y + this.get("scrollTop"),
        width: across,
        height: down
      };
    }.property(
      "scrollTop",
      "scrollLeft",
      "pxLayout",
      "parentView.visibleRect",
      "isInDocument"
    )
  };

  // source/views/collections/ProgressiveListView.js
  var ProgressiveListView = Class({
    Name: "ProgressiveListView",
    Extends: ListView,
    Mixin: TrueVisibleRect,
    batchSize: 10,
    numItemsPastVisible: function() {
      return Math.ceil(200 / this.get("itemHeight"));
    }.property("itemHeight"),
    init: function() {
      ProgressiveListView.parent.constructor.apply(this, arguments);
      this.firstVisible = 0;
      this.lastVisible = 0;
      this._renderRange.end = 0;
    },
    contentWasUpdated(event) {
      const scrollView = this.getParent(ScrollView);
      if (scrollView) {
        const itemHeight = this.get("itemHeight");
        const y = Math.max(this.get("visibleRect").y, 0);
        let top = ~~(y / itemHeight);
        const removedIndexes = event.removedIndexes;
        const addedIndexes = event.addedIndexes;
        const rendered = this._rendered;
        let change = 0;
        if (top > 2) {
          for (let i = 0, l = removedIndexes.length; i < l; i += 1) {
            if (removedIndexes[i] < top) {
              change -= 1;
            } else {
              break;
            }
          }
          top += change;
          for (let i = 0, l = addedIndexes.length; i < l; i += 1) {
            if (addedIndexes[i] <= top) {
              change += 1;
            } else {
              break;
            }
          }
        }
        if (change) {
          for (const id in rendered) {
            const view2 = rendered[id];
            view2.set("animateLayer", false).set("index", view2.get("index") + change).redraw().set("animateLayer", true);
          }
          scrollView.scrollBy(0, change * itemHeight);
          scrollView.redraw();
        }
      }
      return ProgressiveListView.parent.contentWasUpdated.call(this, event);
    },
    _simulateScroll: function(_, __, oldLength, length) {
      if (!this.get("isInDocument")) {
        return;
      }
      if (!length) {
        length = 0;
      }
      if (length < oldLength) {
        invokeInNextEventLoop(this.fire.bind(this, "scroll", null, null));
      }
    }.observes("contentLength"),
    visibleRectDidChange: function() {
      if (this.get("isInDocument")) {
        const visible = this.get("visibleRect");
        const extension = this.get("numItemsPastVisible");
        const batchSize = this.get("batchSize");
        const x = visible.x;
        const y = visible.y;
        const width = visible.width;
        const height = visible.height;
        const firstVisible = this.offsetToIndex(y, x);
        const lastVisible = this.offsetToIndex(
          y + height - 1,
          x + width - 1
        );
        const start = Math.max(
          0,
          Math.floor((firstVisible - extension) / batchSize) * batchSize
        );
        const end = (Math.floor((lastVisible + extension) / batchSize) + 1) * batchSize;
        const _renderRange = this._renderRange;
        this.set("firstVisible", firstVisible).set(
          "lastVisible",
          lastVisible + 1
          // End index is exclusive
        );
        if (start !== _renderRange.start || end !== _renderRange.end) {
          _renderRange.start = start;
          _renderRange.end = end;
          this.viewNeedsRedraw();
        }
      }
    }.queue("middle").observes("visibleRect", "itemLayout")
  });

  // source/views/containers/SplitDividerView.js
  var SplitDividerView = Class({
    Name: "SplitDividerView",
    Extends: View2,
    Mixin: Draggable,
    init: function(mixin2) {
      const controller = mixin2.controller;
      SplitDividerView.parent.init.call(this, mixin2, {
        direction: controller.get("direction"),
        flex: controller.get("flex"),
        offset: bind(controller, "staticPaneLength")
      });
      this.clickAfterDrag = false;
    },
    /**
            Property: O.SplitDividerView#className
            Type: String
            Default: 'v-SplitDivider'
    
            Overrides default in O.View#className.
        */
    className: "v-SplitDivider",
    /**
            Property: O.SplitDividerView#thickness
            Type: Number
            Default: 10
    
            How many pixels wide (if vertical split) or tall (if horizontal split)
            the view should be. Note, by default the view is invisible, so this
            really represents the hit area for dragging.
        */
    thickness: 10,
    /**
            Property: O.SplitDividerView#controller
            Type: O.SplitViewController
    
            The controller for the split view.
        */
    /**
            Property: O.SplitDividerView#direction
            Type: Number
    
            Bound to the <O.SplitViewController#direction>.
        */
    /**
            Property: O.SplitDividerView#flex
            Type: Number
    
            Bound to the <O.SplitViewController#flex>.
        */
    /**
            Property: O.SplitDividerView#offset
            Type: Number
    
            Bound to the <O.SplitViewController#staticPaneLength>. It is
            the distance from the edge of the split view that the split divider
            view should be positioned.
        */
    /**
            Property: O.SplitDividerView#anchor
            Type: String
    
            The CSS property giving the side the <O.SplitDividerView#offset> is from
            (top/left/bottom/right).
        */
    anchor: function() {
      const flexTL = this.get("flex") === TOP_LEFT;
      const isVertical = this.get("direction") === VERTICAL;
      return isVertical ? flexTL ? "right" : "left" : flexTL ? "bottom" : "top";
    }.property("flex", "direction"),
    /**
            Property: O.SplitDividerView#positioning
            Type: String
            Default: 'absolute'
    
            Overrides default in O.View#positioning
        */
    positioning: "absolute",
    /**
            Property: O.SplitDividerView#layout
            Type: Object
    
            Overrides default in O.View#layout to position the view based on the
            direction, anchor, thickness and offset properties.
        */
    layout: function() {
      const thickness = this.get("thickness");
      let styles;
      if (this.get("direction") === VERTICAL) {
        styles = {
          top: 0,
          bottom: 0,
          width: thickness
        };
      } else {
        styles = {
          left: 0,
          right: 0,
          height: thickness
        };
      }
      styles[this.get("anchor")] = this.get("offset") - thickness / 2;
      return styles;
    }.property("direction", "anchor", "thickness", "offset"),
    /**
            Method: O.SplitDividerView#dragStarted
    
            Records the offset at the time the drag starts.
        */
    dragStarted() {
      this.get("controller").set("isResizing", true);
      this._offset = this.get("offset");
      this._dir = this.get("direction") === VERTICAL ? "x" : "y";
    },
    /**
            Method: O.SplitDividerView#dragMoved
    
            Updates the offset property based on the difference between the current
            cursor position and the initial cursor position when the drag started.
    
            Parameters:
                drag - {O.Drag} The drag instance.
        */
    dragMoved(drag) {
      const dir = this._dir;
      const delta2 = drag.get("cursorPosition")[dir] - drag.get("startPosition")[dir];
      const sign = this.get("flex") === TOP_LEFT ? -1 : 1;
      const controller = this.get("controller");
      const offset = limit(
        this._offset + sign * delta2,
        controller.get("minStaticPaneLength"),
        controller.get("maxStaticPaneLength")
      );
      this.set("offset", offset);
      controller.userDidResize(offset);
    },
    dragEnded() {
      this.clickAfterDrag = true;
      this.get("controller").set("isResizing", false);
    },
    resetClickAfterDrag: function() {
      this.clickAfterDrag = false;
    }.queue("before").on("click")
  });

  // source/views/controls/ToggleView.js
  var ToggleView = Class({
    Name: "ToggleView",
    Extends: AbstractInputView,
    // --- Render ---
    /**
            Property: O.ToggleView#layerTag
            Type: String
            Default: 'label'
    
            Overrides default in <O.AbstractControlView#layerTag>.
        */
    layerTag: "label",
    /**
            Property: O.ToggleView#baseClassName
            Type: String
            Default: 'v-Toggle'
    
            Overrides default in <O.AbstractControlView#baseClassName>.
        */
    baseClassName: "v-Toggle",
    /**
            Property: O.ToggleView#className
            Type: String
            Default: 'v-Toggle'
    
            Overrides default in <O.View#className>.
        */
    className: function() {
      const type = this.get("type");
      return this.get("baseClassName") + (this.get("value") ? " is-checked" : " is-unchecked") + (this.get("isDisabled") ? " is-disabled" : "") + (this.get("isFocused") ? " is-focused" : "") + (type ? " " + type : "");
    }.property("baseClassName", "type", "value", "isDisabled", "isFocused"),
    /**
            Method: O.ToggleView#drawControl
            Type: String
            Default: 'v-Toggle'
    
            Overrides default in <O.AbstractInputView#drawControl>.
        */
    drawControl() {
      return this._domControl = create("input", {
        type: "checkbox",
        id: this.get("id") + "-input",
        className: this.get("baseClassName") + "-input",
        checked: this.get("value"),
        disabled: this.get("isDisabled"),
        name: this.get("name")
      });
    },
    /**
            Method: O.ToggleView#drawLabel
            Type: String
            Default: 'v-Toggle'
    
            Overrides default in <O.AbstractInputView#drawLabel>.
        */
    drawLabel(label) {
      return create("p", [label]);
    },
    /**
            Method: O.ToggleView#draw
    
            Overridden to draw toggle in layer. See <O.View#draw>.
        */
    draw(layer) {
      const control = this.drawControl();
      let label = this.get("label");
      if (label) {
        label = this.drawLabel(label);
      }
      let description = this.get("description");
      if (description) {
        description = this.drawDescription(description);
      }
      this.redrawInputAttributes(layer);
      this.redrawTabIndex(layer);
      return [
        control,
        create(`div.${this.get("baseClassName")}-text`, [label, description])
      ];
    },
    // --- Keep render in sync with state ---
    /**
            Method: O.ToggleView#redrawValue
    
            Updates the checked status of the DOM `<input type="checkbox">` to match
            the value property of the view.
        */
    redrawValue() {
      this._domControl.checked = this.get("value");
    },
    // --- Keep state in sync with render ---
    /**
            Method: O.ToggleView#change
    
            Update view state when the control state changes.
        */
    click: function(event) {
      if (event.targetView === this && !nearest(event.target, "A", this.get("layer"))) {
        event.preventDefault();
        if (!this.get("isDisabled")) {
          this.userDidInput(!this.get("value"), event);
        }
      }
    }.on("click")
  });

  // source/views/controls/CheckboxView.js
  var CheckboxView = Class({
    Name: "CheckboxView",
    Extends: ToggleView,
    isIndeterminate: false,
    // --- Render ---
    baseClassName: "v-Checkbox",
    drawControl() {
      const control = CheckboxView.parent.drawControl.call(this);
      this.redrawIsIndeterminate();
      return control;
    },
    // --- Keep render in sync with state ---
    /**
            Method: O.CheckboxView#checkboxNeedsRedraw
    
            Calls <O.View#propertyNeedsRedraw> for extra properties requiring
            redraw.
        */
    checkboxNeedsRedraw: function(self, property, oldValue) {
      return this.propertyNeedsRedraw(self, property, oldValue);
    }.observes("value", "isIndeterminate"),
    redrawIsIndeterminate() {
      this._domControl.indeterminate = this.get("isIndeterminate");
    }
  });

  // source/views/content/TextView.js
  var TextView = Class({
    Name: "TextView",
    Extends: View2,
    /**
            Property: O.TextView#layerTag
            Type: String
            Default: 'span'
    
            Overrides default in <O.View#layerTag>.
        */
    layerTag: "span",
    /**
            Property: O.TextView.value
            Type: String
            Default: ''
    
            The text to display in the view.
        */
    value: "",
    /**
            Property: O.TextView#tooltip
            Type: String
            Default: ''
    
            The tooltip for the view.
        */
    tooltip: "",
    /**
            Method: O.TextView#draw
    
            Overridden to draw view. See <O.View#draw>.
        */
    draw(layer) {
      const tooltip = this.get("tooltip");
      if (tooltip) {
        layer.title = tooltip;
      }
      return [this.get("value")];
    },
    /**
            Method: O.TextView#labelNeedsRedraw
    
            Calls <O.View#propertyNeedsRedraw> for extra properties requiring
            redraw.
        */
    labelNeedsRedraw: function(self, property, oldValue) {
      return this.propertyNeedsRedraw(self, property, oldValue);
    }.observes("tooltip", "value"),
    /**
            Method: O.TextView#redrawTooltip
    
            Parameters:
                layer - {Element} The DOM layer for the view.
    
            Updates the title attribute on the DOM layer to match the tooltip
            property of the view.
        */
    redrawTooltip(layer) {
      const tooltip = this.get("tooltip");
      if (tooltip) {
        layer.title = tooltip;
      } else {
        layer.removeAttribute("title");
      }
    },
    /**
            Method: O.TextView#redrawValue
    
            Parameters:
                layer - {Element} The DOM layer for the view.
    
            Updates the text content of the DOM layer to match the value property of
            the view.
        */
    redrawValue(layer) {
      layer.set("children", [this.get("value")]);
    }
  });

  // source/views/controls/KeyDownController.js
  var KeyDownController = Class({
    Name: "KeyDownController",
    Extends: Obj,
    key: isApple ? "Meta" : "Ctrl",
    // Delay between trigger key being pressed in becoming visible
    delay: 0,
    init: function() {
      KeyDownController.parent.init.apply(this, arguments);
      ViewEventsController.addEventTarget(this, 100);
      this._invocationToken = null;
    },
    destroy() {
      this.isUp();
      ViewEventsController.removeEventTarget(this);
      KeyDownController.parent.destroy.call(this);
    },
    isKeyDown: false,
    _activate() {
      this.set("isKeyDown", true);
    },
    _cancel() {
      if (this._invocationToken !== null) {
        cancel(this._invocationToken);
        this._invocationToken = null;
      }
    },
    isDown() {
      const delay = this.get("delay");
      this._cancel();
      if (delay) {
        this._invocationToken = invokeAfterDelay(
          this._activate,
          delay,
          this
        );
      } else {
        this._activate();
      }
      return this;
    },
    isUp() {
      this._cancel();
      return this.set("isKeyDown", false);
    },
    isKey(event) {
      return event.key === this.get("key");
    },
    keydown: function(event) {
      if (!this.isKey(event)) {
        return;
      }
      this.isDown();
    }.on("keydown"),
    keyup: function(event) {
      if (event.type === "keyup" && !this.isKey(event)) {
        return;
      }
      this.isUp();
    }.on("keyup", "blur")
  });

  // source/views/controls/ShortcutOverlayView.js
  var ShortcutView = Class({
    Name: "ShortcutView",
    Extends: View2,
    key: null,
    forButton: false,
    className: "v-Shortcut",
    positioning: "absolute",
    draw() {
      const text = formatKeyForPlatform(this.get("key"));
      return text.length > 1 ? text.split(/(?![^a-z])\b/i).map((key) => create("span.v-Shortcut-key", [key])) : [text];
    }
  });
  var ShortcutOverlayView = Class({
    Name: "ShortcutOverlayView",
    Extends: View2,
    className: "v-ShortcutOverlay",
    shortcuts: {},
    positioning: "absolute",
    layout: LAYOUT_FILL_PARENT,
    draw() {
      const shortcuts = this.get("shortcuts")._shortcuts;
      const styleCache = /* @__PURE__ */ new Map();
      const getEffectiveZIndex = function(node) {
        const ancestors = getAncestors(node);
        for (let i = 0; i < ancestors.length; i += 1) {
          const values = styleCache.get(ancestors[i]);
          let position;
          let zIndex;
          if (values) {
            position = values[0];
            zIndex = values[1];
          } else {
            position = getStyle(ancestors[i], "position");
            zIndex = getStyle(ancestors[i], "z-index");
            styleCache.set(ancestors[i], [position, zIndex]);
          }
          if (position !== "static" && zIndex !== "auto") {
            return parseInt(zIndex, 10);
          }
        }
        return 0;
      };
      return Object.entries(shortcuts).flatMap(([key, value]) => {
        const view2 = value.last()[0];
        if (!(view2 instanceof View2)) {
          return null;
        }
        const target = view2.getShortcutTarget(key);
        const targets = (Array.isArray(target) ? target : [target]).filter(
          (_target) => _target !== null
        );
        return targets.map((_target) => {
          const bbox = getRawBoundingClientRect(_target);
          const zIndex = getEffectiveZIndex(_target);
          return new ShortcutView({
            key,
            target: _target,
            layout: {
              left: bbox.right,
              top: bbox.bottom - bbox.height / 2,
              zIndex: zIndex + 1
            }
          });
        });
      });
    },
    viewNeedsRedraw: function() {
      if (!this.get("isInDocument")) {
        this.propertyNeedsRedraw(this, "layer");
      }
    }.observes("isInDocument")
  });

  // source/views/controls/RadioView.js
  var RadioView = Class({
    Name: "RadioView",
    Extends: ToggleView,
    // --- Render ---
    baseClassName: "v-Radio",
    /**
            Method: O.RadioView#draw
    
            Overridden to draw radio button in layer. See <O.View#draw>.
        */
    drawControl() {
      return this._domControl = create("input", {
        type: "radio",
        id: this.get("id") + "-input",
        className: this.get("baseClassName") + "-input",
        checked: this.get("value"),
        disabled: this.get("isDisabled"),
        name: this.get("name")
      });
    },
    userDidInput() {
      this.set("value", true);
    }
  });

  // source/views/controls/SelectView.js
  var SelectView = Class({
    Name: "SelectView",
    Extends: AbstractInputView,
    /**
            Property: O.SelectView#options
            Type: Array
    
            The array of options to present in the select menu. Each item in the
            array should be an object, with the following properties:
    
            label      - {String} The text to display for the item
            value      - {*} The value for the <O.SelectView#value> property to take
                         when this item is selected.
            isDisabled - {Boolean} (optional) If true, the option will be disabled
                         (unselectable). Defaults to false if not present.
        */
    options: [],
    /**
            Property: O.SelectView#inputAttributes
            Type: Object|null
    
            Extra attributes to add to the <select> element, if provided.
        */
    inputAttributes: null,
    // --- Render ---
    baseClassName: "v-Select",
    /**
            Method: O.SelectView#drawSelect
    
            Creates the DOM elements for the `<select>` and all `<option>` children.
    
            Parameters:
                options - {Array} Array of option objects.
    
            Returns:
                {Element} The `<select>`.
        */
    drawSelect() {
      const options = this.get("options");
      const selected = this.get("value");
      const select = this._domControl = create(
        "select",
        {
          id: this.get("id") + "-input",
          className: this.get("baseClassName") + "-input",
          disabled: this.get("isDisabled")
        },
        options.reduce((children, option, i, array) => {
          children.push(
            create("option", {
              text: option.label,
              value: i,
              selected: isEqual(option.value, selected),
              disabled: !!option.isDisabled
            })
          );
          if (option.isLastOfSection && i + 1 < array.length) {
            children.push(create("hr"));
          }
          return children;
        }, [])
      );
      return select;
    },
    drawControl() {
      return this.drawSelect();
    },
    // --- Keep render in sync with state ---
    /**
            Method: O.SelectView#selectNeedsRedraw
    
            Calls <O.View#propertyNeedsRedraw> for extra properties requiring
            redraw.
        */
    selectNeedsRedraw: function(self, property, oldValue) {
      return this.propertyNeedsRedraw(self, property, oldValue);
    }.observes("options"),
    /**
            Method: O.SelectView#redrawOptions
    
            Updates the DOM representation when the <O.SelectView#options> property
            changes.
        */
    redrawOptions(layer, oldOptions) {
      const options = this.get("options");
      if (!isEqual(options, oldOptions)) {
        const isFocused = this.get("isFocused");
        if (isFocused) {
          this.blur();
        }
        const oldControl = this._domControl;
        oldControl.parentNode.replaceChild(this.drawControl(), oldControl);
        if (isFocused) {
          this.focus();
        }
      }
    },
    /**
            Method: O.SelectView#redrawValue
    
            Selects the corresponding option in the select when the
            <O.SelectView#value> property changes.
        */
    redrawValue() {
      const value = this.get("value");
      const options = this.get("options");
      for (let i = options.length - 1; i >= 0; i -= 1) {
        if (isEqual(options[i].value, value)) {
          this._domControl.value = i + "";
          break;
        }
      }
      if (this.get("isFocused")) {
        this.blur().focus();
      }
    },
    // --- Keep state in sync with render ---
    /**
            Method: O.SelectView#syncBackValue
    
            Observes the `change` event to update the view's `value` property when
            the user selects a different option.
        */
    syncBackValue: function() {
      const i = this._domControl.selectedIndex;
      const option = this.get("options").getObjectAt(i);
      if (option) {
        this.userDidInput(option.value);
      }
    }.on("change")
  });

  // source/Overture.js
  GlobalKeyboardShortcuts.DEFAULT_IN_INPUT = DEFAULT_IN_INPUT;
  GlobalKeyboardShortcuts.ACTIVE_IN_INPUT = ACTIVE_IN_INPUT;
  GlobalKeyboardShortcuts.DISABLE_IN_INPUT = DISABLE_IN_INPUT;
  Query.AUTO_REFRESH_NEVER = AUTO_REFRESH_NEVER;
  Query.AUTO_REFRESH_IF_OBSERVED = AUTO_REFRESH_IF_OBSERVED;
  Query.AUTO_REFRESH_ALWAYS = AUTO_REFRESH_ALWAYS;
  Record.attr = attr;
  Record.toMany = toMany;
  Record.toOne = toOne;
  RecordResult.HANDLE_ALL_ERRORS = HANDLE_ALL_ERRORS;
  RecordResult.HANDLE_NO_ERRORS = HANDLE_NO_ERRORS;
  ValidationError.REQUIRED = 1;
  ValidationError.TOO_SHORT = 2;
  ValidationError.TOO_LONG = 4;
  ValidationError.INVALID_CHAR = 8;
  ValidationError.FIRST_CUSTOM_ERROR = 16;
  IOQueue.QUEUE = QUEUE;
  IOQueue.IGNORE = IGNORE;
  IOQueue.ABORT = ABORT;
  View2.LAYOUT_FILL_PARENT = LAYOUT_FILL_PARENT;
  View2.POSITION_SAME = POSITION_SAME;
  View2.POSITION_DISCONNECTED = POSITION_DISCONNECTED;
  View2.POSITION_PRECEDING = POSITION_PRECEDING;
  View2.POSITION_FOLLOWING = POSITION_FOLLOWING;
  View2.POSITION_CONTAINS = POSITION_CONTAINS;
  View2.POSITION_CONTAINED_BY = POSITION_CONTAINED_BY;
  View2.peekId = peekId;
  SplitViewController.VERTICAL = VERTICAL;
  SplitViewController.HORIZONTAL = HORIZONTAL;
  SplitViewController.TOP_LEFT = TOP_LEFT;
  SplitViewController.BOTTOM_RIGHT = BOTTOM_RIGHT;
  RichTextView.TOOLBAR_HIDDEN = TOOLBAR_HIDDEN;
  RichTextView.TOOLBAR_AT_TOP = TOOLBAR_AT_TOP;
})();
