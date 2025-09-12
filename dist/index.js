import { r as requireCore, a as requireIo, b as requireLib, c as requireExec, d as commonjsGlobal, e as coreExports, f as execExports, g as core } from './exec-BTlTa8sL.js';
import require$$0$1 from 'crypto';
import * as fs from 'fs';
import fs__default from 'fs';
import * as require$$0 from 'os';
import require$$0__default from 'os';
import require$$2 from 'child_process';
import * as path from 'path';
import path__default, { join } from 'path';
import require$$0$2 from 'stream';
import require$$0$3 from 'util';
import require$$0$4 from 'assert';
import 'http';
import 'https';
import 'net';
import 'tls';
import 'events';
import 'buffer';
import 'querystring';
import 'stream/web';
import 'node:stream';
import 'node:util';
import 'node:events';
import 'worker_threads';
import 'perf_hooks';
import 'util/types';
import 'async_hooks';
import 'console';
import 'url';
import 'zlib';
import 'string_decoder';
import 'diagnostics_channel';
import 'timers';

var toolCache = {};

var manifest$1 = {exports: {}};

var semver = {exports: {}};

var hasRequiredSemver;

function requireSemver () {
	if (hasRequiredSemver) return semver.exports;
	hasRequiredSemver = 1;
	(function (module, exports) {
		exports = module.exports = SemVer;

		var debug;
		/* istanbul ignore next */
		if (typeof process === 'object' &&
		    process.env &&
		    process.env.NODE_DEBUG &&
		    /\bsemver\b/i.test(process.env.NODE_DEBUG)) {
		  debug = function () {
		    var args = Array.prototype.slice.call(arguments, 0);
		    args.unshift('SEMVER');
		    console.log.apply(console, args);
		  };
		} else {
		  debug = function () {};
		}

		// Note: this is the semver.org version of the spec that it implements
		// Not necessarily the package version of this code.
		exports.SEMVER_SPEC_VERSION = '2.0.0';

		var MAX_LENGTH = 256;
		var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER ||
		  /* istanbul ignore next */ 9007199254740991;

		// Max safe segment length for coercion.
		var MAX_SAFE_COMPONENT_LENGTH = 16;

		var MAX_SAFE_BUILD_LENGTH = MAX_LENGTH - 6;

		// The actual regexps go on exports.re
		var re = exports.re = [];
		var safeRe = exports.safeRe = [];
		var src = exports.src = [];
		var t = exports.tokens = {};
		var R = 0;

		function tok (n) {
		  t[n] = R++;
		}

		var LETTERDASHNUMBER = '[a-zA-Z0-9-]';

		// Replace some greedy regex tokens to prevent regex dos issues. These regex are
		// used internally via the safeRe object since all inputs in this library get
		// normalized first to trim and collapse all extra whitespace. The original
		// regexes are exported for userland consumption and lower level usage. A
		// future breaking change could export the safer regex only with a note that
		// all input should have extra whitespace removed.
		var safeRegexReplacements = [
		  ['\\s', 1],
		  ['\\d', MAX_LENGTH],
		  [LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH],
		];

		function makeSafeRe (value) {
		  for (var i = 0; i < safeRegexReplacements.length; i++) {
		    var token = safeRegexReplacements[i][0];
		    var max = safeRegexReplacements[i][1];
		    value = value
		      .split(token + '*').join(token + '{0,' + max + '}')
		      .split(token + '+').join(token + '{1,' + max + '}');
		  }
		  return value
		}

		// The following Regular Expressions can be used for tokenizing,
		// validating, and parsing SemVer version strings.

		// ## Numeric Identifier
		// A single `0`, or a non-zero digit followed by zero or more digits.

		tok('NUMERICIDENTIFIER');
		src[t.NUMERICIDENTIFIER] = '0|[1-9]\\d*';
		tok('NUMERICIDENTIFIERLOOSE');
		src[t.NUMERICIDENTIFIERLOOSE] = '\\d+';

		// ## Non-numeric Identifier
		// Zero or more digits, followed by a letter or hyphen, and then zero or
		// more letters, digits, or hyphens.

		tok('NONNUMERICIDENTIFIER');
		src[t.NONNUMERICIDENTIFIER] = '\\d*[a-zA-Z-]' + LETTERDASHNUMBER + '*';

		// ## Main Version
		// Three dot-separated numeric identifiers.

		tok('MAINVERSION');
		src[t.MAINVERSION] = '(' + src[t.NUMERICIDENTIFIER] + ')\\.' +
		                   '(' + src[t.NUMERICIDENTIFIER] + ')\\.' +
		                   '(' + src[t.NUMERICIDENTIFIER] + ')';

		tok('MAINVERSIONLOOSE');
		src[t.MAINVERSIONLOOSE] = '(' + src[t.NUMERICIDENTIFIERLOOSE] + ')\\.' +
		                        '(' + src[t.NUMERICIDENTIFIERLOOSE] + ')\\.' +
		                        '(' + src[t.NUMERICIDENTIFIERLOOSE] + ')';

		// ## Pre-release Version Identifier
		// A numeric identifier, or a non-numeric identifier.

		tok('PRERELEASEIDENTIFIER');
		src[t.PRERELEASEIDENTIFIER] = '(?:' + src[t.NUMERICIDENTIFIER] +
		                            '|' + src[t.NONNUMERICIDENTIFIER] + ')';

		tok('PRERELEASEIDENTIFIERLOOSE');
		src[t.PRERELEASEIDENTIFIERLOOSE] = '(?:' + src[t.NUMERICIDENTIFIERLOOSE] +
		                                 '|' + src[t.NONNUMERICIDENTIFIER] + ')';

		// ## Pre-release Version
		// Hyphen, followed by one or more dot-separated pre-release version
		// identifiers.

		tok('PRERELEASE');
		src[t.PRERELEASE] = '(?:-(' + src[t.PRERELEASEIDENTIFIER] +
		                  '(?:\\.' + src[t.PRERELEASEIDENTIFIER] + ')*))';

		tok('PRERELEASELOOSE');
		src[t.PRERELEASELOOSE] = '(?:-?(' + src[t.PRERELEASEIDENTIFIERLOOSE] +
		                       '(?:\\.' + src[t.PRERELEASEIDENTIFIERLOOSE] + ')*))';

		// ## Build Metadata Identifier
		// Any combination of digits, letters, or hyphens.

		tok('BUILDIDENTIFIER');
		src[t.BUILDIDENTIFIER] = LETTERDASHNUMBER + '+';

		// ## Build Metadata
		// Plus sign, followed by one or more period-separated build metadata
		// identifiers.

		tok('BUILD');
		src[t.BUILD] = '(?:\\+(' + src[t.BUILDIDENTIFIER] +
		             '(?:\\.' + src[t.BUILDIDENTIFIER] + ')*))';

		// ## Full Version String
		// A main version, followed optionally by a pre-release version and
		// build metadata.

		// Note that the only major, minor, patch, and pre-release sections of
		// the version string are capturing groups.  The build metadata is not a
		// capturing group, because it should not ever be used in version
		// comparison.

		tok('FULL');
		tok('FULLPLAIN');
		src[t.FULLPLAIN] = 'v?' + src[t.MAINVERSION] +
		                  src[t.PRERELEASE] + '?' +
		                  src[t.BUILD] + '?';

		src[t.FULL] = '^' + src[t.FULLPLAIN] + '$';

		// like full, but allows v1.2.3 and =1.2.3, which people do sometimes.
		// also, 1.0.0alpha1 (prerelease without the hyphen) which is pretty
		// common in the npm registry.
		tok('LOOSEPLAIN');
		src[t.LOOSEPLAIN] = '[v=\\s]*' + src[t.MAINVERSIONLOOSE] +
		                  src[t.PRERELEASELOOSE] + '?' +
		                  src[t.BUILD] + '?';

		tok('LOOSE');
		src[t.LOOSE] = '^' + src[t.LOOSEPLAIN] + '$';

		tok('GTLT');
		src[t.GTLT] = '((?:<|>)?=?)';

		// Something like "2.*" or "1.2.x".
		// Note that "x.x" is a valid xRange identifer, meaning "any version"
		// Only the first item is strictly required.
		tok('XRANGEIDENTIFIERLOOSE');
		src[t.XRANGEIDENTIFIERLOOSE] = src[t.NUMERICIDENTIFIERLOOSE] + '|x|X|\\*';
		tok('XRANGEIDENTIFIER');
		src[t.XRANGEIDENTIFIER] = src[t.NUMERICIDENTIFIER] + '|x|X|\\*';

		tok('XRANGEPLAIN');
		src[t.XRANGEPLAIN] = '[v=\\s]*(' + src[t.XRANGEIDENTIFIER] + ')' +
		                   '(?:\\.(' + src[t.XRANGEIDENTIFIER] + ')' +
		                   '(?:\\.(' + src[t.XRANGEIDENTIFIER] + ')' +
		                   '(?:' + src[t.PRERELEASE] + ')?' +
		                   src[t.BUILD] + '?' +
		                   ')?)?';

		tok('XRANGEPLAINLOOSE');
		src[t.XRANGEPLAINLOOSE] = '[v=\\s]*(' + src[t.XRANGEIDENTIFIERLOOSE] + ')' +
		                        '(?:\\.(' + src[t.XRANGEIDENTIFIERLOOSE] + ')' +
		                        '(?:\\.(' + src[t.XRANGEIDENTIFIERLOOSE] + ')' +
		                        '(?:' + src[t.PRERELEASELOOSE] + ')?' +
		                        src[t.BUILD] + '?' +
		                        ')?)?';

		tok('XRANGE');
		src[t.XRANGE] = '^' + src[t.GTLT] + '\\s*' + src[t.XRANGEPLAIN] + '$';
		tok('XRANGELOOSE');
		src[t.XRANGELOOSE] = '^' + src[t.GTLT] + '\\s*' + src[t.XRANGEPLAINLOOSE] + '$';

		// Coercion.
		// Extract anything that could conceivably be a part of a valid semver
		tok('COERCE');
		src[t.COERCE] = '(^|[^\\d])' +
		              '(\\d{1,' + MAX_SAFE_COMPONENT_LENGTH + '})' +
		              '(?:\\.(\\d{1,' + MAX_SAFE_COMPONENT_LENGTH + '}))?' +
		              '(?:\\.(\\d{1,' + MAX_SAFE_COMPONENT_LENGTH + '}))?' +
		              '(?:$|[^\\d])';
		tok('COERCERTL');
		re[t.COERCERTL] = new RegExp(src[t.COERCE], 'g');
		safeRe[t.COERCERTL] = new RegExp(makeSafeRe(src[t.COERCE]), 'g');

		// Tilde ranges.
		// Meaning is "reasonably at or greater than"
		tok('LONETILDE');
		src[t.LONETILDE] = '(?:~>?)';

		tok('TILDETRIM');
		src[t.TILDETRIM] = '(\\s*)' + src[t.LONETILDE] + '\\s+';
		re[t.TILDETRIM] = new RegExp(src[t.TILDETRIM], 'g');
		safeRe[t.TILDETRIM] = new RegExp(makeSafeRe(src[t.TILDETRIM]), 'g');
		var tildeTrimReplace = '$1~';

		tok('TILDE');
		src[t.TILDE] = '^' + src[t.LONETILDE] + src[t.XRANGEPLAIN] + '$';
		tok('TILDELOOSE');
		src[t.TILDELOOSE] = '^' + src[t.LONETILDE] + src[t.XRANGEPLAINLOOSE] + '$';

		// Caret ranges.
		// Meaning is "at least and backwards compatible with"
		tok('LONECARET');
		src[t.LONECARET] = '(?:\\^)';

		tok('CARETTRIM');
		src[t.CARETTRIM] = '(\\s*)' + src[t.LONECARET] + '\\s+';
		re[t.CARETTRIM] = new RegExp(src[t.CARETTRIM], 'g');
		safeRe[t.CARETTRIM] = new RegExp(makeSafeRe(src[t.CARETTRIM]), 'g');
		var caretTrimReplace = '$1^';

		tok('CARET');
		src[t.CARET] = '^' + src[t.LONECARET] + src[t.XRANGEPLAIN] + '$';
		tok('CARETLOOSE');
		src[t.CARETLOOSE] = '^' + src[t.LONECARET] + src[t.XRANGEPLAINLOOSE] + '$';

		// A simple gt/lt/eq thing, or just "" to indicate "any version"
		tok('COMPARATORLOOSE');
		src[t.COMPARATORLOOSE] = '^' + src[t.GTLT] + '\\s*(' + src[t.LOOSEPLAIN] + ')$|^$';
		tok('COMPARATOR');
		src[t.COMPARATOR] = '^' + src[t.GTLT] + '\\s*(' + src[t.FULLPLAIN] + ')$|^$';

		// An expression to strip any whitespace between the gtlt and the thing
		// it modifies, so that `> 1.2.3` ==> `>1.2.3`
		tok('COMPARATORTRIM');
		src[t.COMPARATORTRIM] = '(\\s*)' + src[t.GTLT] +
		                      '\\s*(' + src[t.LOOSEPLAIN] + '|' + src[t.XRANGEPLAIN] + ')';

		// this one has to use the /g flag
		re[t.COMPARATORTRIM] = new RegExp(src[t.COMPARATORTRIM], 'g');
		safeRe[t.COMPARATORTRIM] = new RegExp(makeSafeRe(src[t.COMPARATORTRIM]), 'g');
		var comparatorTrimReplace = '$1$2$3';

		// Something like `1.2.3 - 1.2.4`
		// Note that these all use the loose form, because they'll be
		// checked against either the strict or loose comparator form
		// later.
		tok('HYPHENRANGE');
		src[t.HYPHENRANGE] = '^\\s*(' + src[t.XRANGEPLAIN] + ')' +
		                   '\\s+-\\s+' +
		                   '(' + src[t.XRANGEPLAIN] + ')' +
		                   '\\s*$';

		tok('HYPHENRANGELOOSE');
		src[t.HYPHENRANGELOOSE] = '^\\s*(' + src[t.XRANGEPLAINLOOSE] + ')' +
		                        '\\s+-\\s+' +
		                        '(' + src[t.XRANGEPLAINLOOSE] + ')' +
		                        '\\s*$';

		// Star ranges basically just allow anything at all.
		tok('STAR');
		src[t.STAR] = '(<|>)?=?\\s*\\*';

		// Compile to actual regexp objects.
		// All are flag-free, unless they were created above with a flag.
		for (var i = 0; i < R; i++) {
		  debug(i, src[i]);
		  if (!re[i]) {
		    re[i] = new RegExp(src[i]);

		    // Replace all greedy whitespace to prevent regex dos issues. These regex are
		    // used internally via the safeRe object since all inputs in this library get
		    // normalized first to trim and collapse all extra whitespace. The original
		    // regexes are exported for userland consumption and lower level usage. A
		    // future breaking change could export the safer regex only with a note that
		    // all input should have extra whitespace removed.
		    safeRe[i] = new RegExp(makeSafeRe(src[i]));
		  }
		}

		exports.parse = parse;
		function parse (version, options) {
		  if (!options || typeof options !== 'object') {
		    options = {
		      loose: !!options,
		      includePrerelease: false
		    };
		  }

		  if (version instanceof SemVer) {
		    return version
		  }

		  if (typeof version !== 'string') {
		    return null
		  }

		  if (version.length > MAX_LENGTH) {
		    return null
		  }

		  var r = options.loose ? safeRe[t.LOOSE] : safeRe[t.FULL];
		  if (!r.test(version)) {
		    return null
		  }

		  try {
		    return new SemVer(version, options)
		  } catch (er) {
		    return null
		  }
		}

		exports.valid = valid;
		function valid (version, options) {
		  var v = parse(version, options);
		  return v ? v.version : null
		}

		exports.clean = clean;
		function clean (version, options) {
		  var s = parse(version.trim().replace(/^[=v]+/, ''), options);
		  return s ? s.version : null
		}

		exports.SemVer = SemVer;

		function SemVer (version, options) {
		  if (!options || typeof options !== 'object') {
		    options = {
		      loose: !!options,
		      includePrerelease: false
		    };
		  }
		  if (version instanceof SemVer) {
		    if (version.loose === options.loose) {
		      return version
		    } else {
		      version = version.version;
		    }
		  } else if (typeof version !== 'string') {
		    throw new TypeError('Invalid Version: ' + version)
		  }

		  if (version.length > MAX_LENGTH) {
		    throw new TypeError('version is longer than ' + MAX_LENGTH + ' characters')
		  }

		  if (!(this instanceof SemVer)) {
		    return new SemVer(version, options)
		  }

		  debug('SemVer', version, options);
		  this.options = options;
		  this.loose = !!options.loose;

		  var m = version.trim().match(options.loose ? safeRe[t.LOOSE] : safeRe[t.FULL]);

		  if (!m) {
		    throw new TypeError('Invalid Version: ' + version)
		  }

		  this.raw = version;

		  // these are actually numbers
		  this.major = +m[1];
		  this.minor = +m[2];
		  this.patch = +m[3];

		  if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
		    throw new TypeError('Invalid major version')
		  }

		  if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
		    throw new TypeError('Invalid minor version')
		  }

		  if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
		    throw new TypeError('Invalid patch version')
		  }

		  // numberify any prerelease numeric ids
		  if (!m[4]) {
		    this.prerelease = [];
		  } else {
		    this.prerelease = m[4].split('.').map(function (id) {
		      if (/^[0-9]+$/.test(id)) {
		        var num = +id;
		        if (num >= 0 && num < MAX_SAFE_INTEGER) {
		          return num
		        }
		      }
		      return id
		    });
		  }

		  this.build = m[5] ? m[5].split('.') : [];
		  this.format();
		}

		SemVer.prototype.format = function () {
		  this.version = this.major + '.' + this.minor + '.' + this.patch;
		  if (this.prerelease.length) {
		    this.version += '-' + this.prerelease.join('.');
		  }
		  return this.version
		};

		SemVer.prototype.toString = function () {
		  return this.version
		};

		SemVer.prototype.compare = function (other) {
		  debug('SemVer.compare', this.version, this.options, other);
		  if (!(other instanceof SemVer)) {
		    other = new SemVer(other, this.options);
		  }

		  return this.compareMain(other) || this.comparePre(other)
		};

		SemVer.prototype.compareMain = function (other) {
		  if (!(other instanceof SemVer)) {
		    other = new SemVer(other, this.options);
		  }

		  return compareIdentifiers(this.major, other.major) ||
		         compareIdentifiers(this.minor, other.minor) ||
		         compareIdentifiers(this.patch, other.patch)
		};

		SemVer.prototype.comparePre = function (other) {
		  if (!(other instanceof SemVer)) {
		    other = new SemVer(other, this.options);
		  }

		  // NOT having a prerelease is > having one
		  if (this.prerelease.length && !other.prerelease.length) {
		    return -1
		  } else if (!this.prerelease.length && other.prerelease.length) {
		    return 1
		  } else if (!this.prerelease.length && !other.prerelease.length) {
		    return 0
		  }

		  var i = 0;
		  do {
		    var a = this.prerelease[i];
		    var b = other.prerelease[i];
		    debug('prerelease compare', i, a, b);
		    if (a === undefined && b === undefined) {
		      return 0
		    } else if (b === undefined) {
		      return 1
		    } else if (a === undefined) {
		      return -1
		    } else if (a === b) {
		      continue
		    } else {
		      return compareIdentifiers(a, b)
		    }
		  } while (++i)
		};

		SemVer.prototype.compareBuild = function (other) {
		  if (!(other instanceof SemVer)) {
		    other = new SemVer(other, this.options);
		  }

		  var i = 0;
		  do {
		    var a = this.build[i];
		    var b = other.build[i];
		    debug('prerelease compare', i, a, b);
		    if (a === undefined && b === undefined) {
		      return 0
		    } else if (b === undefined) {
		      return 1
		    } else if (a === undefined) {
		      return -1
		    } else if (a === b) {
		      continue
		    } else {
		      return compareIdentifiers(a, b)
		    }
		  } while (++i)
		};

		// preminor will bump the version up to the next minor release, and immediately
		// down to pre-release. premajor and prepatch work the same way.
		SemVer.prototype.inc = function (release, identifier) {
		  switch (release) {
		    case 'premajor':
		      this.prerelease.length = 0;
		      this.patch = 0;
		      this.minor = 0;
		      this.major++;
		      this.inc('pre', identifier);
		      break
		    case 'preminor':
		      this.prerelease.length = 0;
		      this.patch = 0;
		      this.minor++;
		      this.inc('pre', identifier);
		      break
		    case 'prepatch':
		      // If this is already a prerelease, it will bump to the next version
		      // drop any prereleases that might already exist, since they are not
		      // relevant at this point.
		      this.prerelease.length = 0;
		      this.inc('patch', identifier);
		      this.inc('pre', identifier);
		      break
		    // If the input is a non-prerelease version, this acts the same as
		    // prepatch.
		    case 'prerelease':
		      if (this.prerelease.length === 0) {
		        this.inc('patch', identifier);
		      }
		      this.inc('pre', identifier);
		      break

		    case 'major':
		      // If this is a pre-major version, bump up to the same major version.
		      // Otherwise increment major.
		      // 1.0.0-5 bumps to 1.0.0
		      // 1.1.0 bumps to 2.0.0
		      if (this.minor !== 0 ||
		          this.patch !== 0 ||
		          this.prerelease.length === 0) {
		        this.major++;
		      }
		      this.minor = 0;
		      this.patch = 0;
		      this.prerelease = [];
		      break
		    case 'minor':
		      // If this is a pre-minor version, bump up to the same minor version.
		      // Otherwise increment minor.
		      // 1.2.0-5 bumps to 1.2.0
		      // 1.2.1 bumps to 1.3.0
		      if (this.patch !== 0 || this.prerelease.length === 0) {
		        this.minor++;
		      }
		      this.patch = 0;
		      this.prerelease = [];
		      break
		    case 'patch':
		      // If this is not a pre-release version, it will increment the patch.
		      // If it is a pre-release it will bump up to the same patch version.
		      // 1.2.0-5 patches to 1.2.0
		      // 1.2.0 patches to 1.2.1
		      if (this.prerelease.length === 0) {
		        this.patch++;
		      }
		      this.prerelease = [];
		      break
		    // This probably shouldn't be used publicly.
		    // 1.0.0 "pre" would become 1.0.0-0 which is the wrong direction.
		    case 'pre':
		      if (this.prerelease.length === 0) {
		        this.prerelease = [0];
		      } else {
		        var i = this.prerelease.length;
		        while (--i >= 0) {
		          if (typeof this.prerelease[i] === 'number') {
		            this.prerelease[i]++;
		            i = -2;
		          }
		        }
		        if (i === -1) {
		          // didn't increment anything
		          this.prerelease.push(0);
		        }
		      }
		      if (identifier) {
		        // 1.2.0-beta.1 bumps to 1.2.0-beta.2,
		        // 1.2.0-beta.fooblz or 1.2.0-beta bumps to 1.2.0-beta.0
		        if (this.prerelease[0] === identifier) {
		          if (isNaN(this.prerelease[1])) {
		            this.prerelease = [identifier, 0];
		          }
		        } else {
		          this.prerelease = [identifier, 0];
		        }
		      }
		      break

		    default:
		      throw new Error('invalid increment argument: ' + release)
		  }
		  this.format();
		  this.raw = this.version;
		  return this
		};

		exports.inc = inc;
		function inc (version, release, loose, identifier) {
		  if (typeof (loose) === 'string') {
		    identifier = loose;
		    loose = undefined;
		  }

		  try {
		    return new SemVer(version, loose).inc(release, identifier).version
		  } catch (er) {
		    return null
		  }
		}

		exports.diff = diff;
		function diff (version1, version2) {
		  if (eq(version1, version2)) {
		    return null
		  } else {
		    var v1 = parse(version1);
		    var v2 = parse(version2);
		    var prefix = '';
		    if (v1.prerelease.length || v2.prerelease.length) {
		      prefix = 'pre';
		      var defaultResult = 'prerelease';
		    }
		    for (var key in v1) {
		      if (key === 'major' || key === 'minor' || key === 'patch') {
		        if (v1[key] !== v2[key]) {
		          return prefix + key
		        }
		      }
		    }
		    return defaultResult // may be undefined
		  }
		}

		exports.compareIdentifiers = compareIdentifiers;

		var numeric = /^[0-9]+$/;
		function compareIdentifiers (a, b) {
		  var anum = numeric.test(a);
		  var bnum = numeric.test(b);

		  if (anum && bnum) {
		    a = +a;
		    b = +b;
		  }

		  return a === b ? 0
		    : (anum && !bnum) ? -1
		    : (bnum && !anum) ? 1
		    : a < b ? -1
		    : 1
		}

		exports.rcompareIdentifiers = rcompareIdentifiers;
		function rcompareIdentifiers (a, b) {
		  return compareIdentifiers(b, a)
		}

		exports.major = major;
		function major (a, loose) {
		  return new SemVer(a, loose).major
		}

		exports.minor = minor;
		function minor (a, loose) {
		  return new SemVer(a, loose).minor
		}

		exports.patch = patch;
		function patch (a, loose) {
		  return new SemVer(a, loose).patch
		}

		exports.compare = compare;
		function compare (a, b, loose) {
		  return new SemVer(a, loose).compare(new SemVer(b, loose))
		}

		exports.compareLoose = compareLoose;
		function compareLoose (a, b) {
		  return compare(a, b, true)
		}

		exports.compareBuild = compareBuild;
		function compareBuild (a, b, loose) {
		  var versionA = new SemVer(a, loose);
		  var versionB = new SemVer(b, loose);
		  return versionA.compare(versionB) || versionA.compareBuild(versionB)
		}

		exports.rcompare = rcompare;
		function rcompare (a, b, loose) {
		  return compare(b, a, loose)
		}

		exports.sort = sort;
		function sort (list, loose) {
		  return list.sort(function (a, b) {
		    return exports.compareBuild(a, b, loose)
		  })
		}

		exports.rsort = rsort;
		function rsort (list, loose) {
		  return list.sort(function (a, b) {
		    return exports.compareBuild(b, a, loose)
		  })
		}

		exports.gt = gt;
		function gt (a, b, loose) {
		  return compare(a, b, loose) > 0
		}

		exports.lt = lt;
		function lt (a, b, loose) {
		  return compare(a, b, loose) < 0
		}

		exports.eq = eq;
		function eq (a, b, loose) {
		  return compare(a, b, loose) === 0
		}

		exports.neq = neq;
		function neq (a, b, loose) {
		  return compare(a, b, loose) !== 0
		}

		exports.gte = gte;
		function gte (a, b, loose) {
		  return compare(a, b, loose) >= 0
		}

		exports.lte = lte;
		function lte (a, b, loose) {
		  return compare(a, b, loose) <= 0
		}

		exports.cmp = cmp;
		function cmp (a, op, b, loose) {
		  switch (op) {
		    case '===':
		      if (typeof a === 'object')
		        a = a.version;
		      if (typeof b === 'object')
		        b = b.version;
		      return a === b

		    case '!==':
		      if (typeof a === 'object')
		        a = a.version;
		      if (typeof b === 'object')
		        b = b.version;
		      return a !== b

		    case '':
		    case '=':
		    case '==':
		      return eq(a, b, loose)

		    case '!=':
		      return neq(a, b, loose)

		    case '>':
		      return gt(a, b, loose)

		    case '>=':
		      return gte(a, b, loose)

		    case '<':
		      return lt(a, b, loose)

		    case '<=':
		      return lte(a, b, loose)

		    default:
		      throw new TypeError('Invalid operator: ' + op)
		  }
		}

		exports.Comparator = Comparator;
		function Comparator (comp, options) {
		  if (!options || typeof options !== 'object') {
		    options = {
		      loose: !!options,
		      includePrerelease: false
		    };
		  }

		  if (comp instanceof Comparator) {
		    if (comp.loose === !!options.loose) {
		      return comp
		    } else {
		      comp = comp.value;
		    }
		  }

		  if (!(this instanceof Comparator)) {
		    return new Comparator(comp, options)
		  }

		  comp = comp.trim().split(/\s+/).join(' ');
		  debug('comparator', comp, options);
		  this.options = options;
		  this.loose = !!options.loose;
		  this.parse(comp);

		  if (this.semver === ANY) {
		    this.value = '';
		  } else {
		    this.value = this.operator + this.semver.version;
		  }

		  debug('comp', this);
		}

		var ANY = {};
		Comparator.prototype.parse = function (comp) {
		  var r = this.options.loose ? safeRe[t.COMPARATORLOOSE] : safeRe[t.COMPARATOR];
		  var m = comp.match(r);

		  if (!m) {
		    throw new TypeError('Invalid comparator: ' + comp)
		  }

		  this.operator = m[1] !== undefined ? m[1] : '';
		  if (this.operator === '=') {
		    this.operator = '';
		  }

		  // if it literally is just '>' or '' then allow anything.
		  if (!m[2]) {
		    this.semver = ANY;
		  } else {
		    this.semver = new SemVer(m[2], this.options.loose);
		  }
		};

		Comparator.prototype.toString = function () {
		  return this.value
		};

		Comparator.prototype.test = function (version) {
		  debug('Comparator.test', version, this.options.loose);

		  if (this.semver === ANY || version === ANY) {
		    return true
		  }

		  if (typeof version === 'string') {
		    try {
		      version = new SemVer(version, this.options);
		    } catch (er) {
		      return false
		    }
		  }

		  return cmp(version, this.operator, this.semver, this.options)
		};

		Comparator.prototype.intersects = function (comp, options) {
		  if (!(comp instanceof Comparator)) {
		    throw new TypeError('a Comparator is required')
		  }

		  if (!options || typeof options !== 'object') {
		    options = {
		      loose: !!options,
		      includePrerelease: false
		    };
		  }

		  var rangeTmp;

		  if (this.operator === '') {
		    if (this.value === '') {
		      return true
		    }
		    rangeTmp = new Range(comp.value, options);
		    return satisfies(this.value, rangeTmp, options)
		  } else if (comp.operator === '') {
		    if (comp.value === '') {
		      return true
		    }
		    rangeTmp = new Range(this.value, options);
		    return satisfies(comp.semver, rangeTmp, options)
		  }

		  var sameDirectionIncreasing =
		    (this.operator === '>=' || this.operator === '>') &&
		    (comp.operator === '>=' || comp.operator === '>');
		  var sameDirectionDecreasing =
		    (this.operator === '<=' || this.operator === '<') &&
		    (comp.operator === '<=' || comp.operator === '<');
		  var sameSemVer = this.semver.version === comp.semver.version;
		  var differentDirectionsInclusive =
		    (this.operator === '>=' || this.operator === '<=') &&
		    (comp.operator === '>=' || comp.operator === '<=');
		  var oppositeDirectionsLessThan =
		    cmp(this.semver, '<', comp.semver, options) &&
		    ((this.operator === '>=' || this.operator === '>') &&
		    (comp.operator === '<=' || comp.operator === '<'));
		  var oppositeDirectionsGreaterThan =
		    cmp(this.semver, '>', comp.semver, options) &&
		    ((this.operator === '<=' || this.operator === '<') &&
		    (comp.operator === '>=' || comp.operator === '>'));

		  return sameDirectionIncreasing || sameDirectionDecreasing ||
		    (sameSemVer && differentDirectionsInclusive) ||
		    oppositeDirectionsLessThan || oppositeDirectionsGreaterThan
		};

		exports.Range = Range;
		function Range (range, options) {
		  if (!options || typeof options !== 'object') {
		    options = {
		      loose: !!options,
		      includePrerelease: false
		    };
		  }

		  if (range instanceof Range) {
		    if (range.loose === !!options.loose &&
		        range.includePrerelease === !!options.includePrerelease) {
		      return range
		    } else {
		      return new Range(range.raw, options)
		    }
		  }

		  if (range instanceof Comparator) {
		    return new Range(range.value, options)
		  }

		  if (!(this instanceof Range)) {
		    return new Range(range, options)
		  }

		  this.options = options;
		  this.loose = !!options.loose;
		  this.includePrerelease = !!options.includePrerelease;

		  // First reduce all whitespace as much as possible so we do not have to rely
		  // on potentially slow regexes like \s*. This is then stored and used for
		  // future error messages as well.
		  this.raw = range
		    .trim()
		    .split(/\s+/)
		    .join(' ');

		  // First, split based on boolean or ||
		  this.set = this.raw.split('||').map(function (range) {
		    return this.parseRange(range.trim())
		  }, this).filter(function (c) {
		    // throw out any that are not relevant for whatever reason
		    return c.length
		  });

		  if (!this.set.length) {
		    throw new TypeError('Invalid SemVer Range: ' + this.raw)
		  }

		  this.format();
		}

		Range.prototype.format = function () {
		  this.range = this.set.map(function (comps) {
		    return comps.join(' ').trim()
		  }).join('||').trim();
		  return this.range
		};

		Range.prototype.toString = function () {
		  return this.range
		};

		Range.prototype.parseRange = function (range) {
		  var loose = this.options.loose;
		  // `1.2.3 - 1.2.4` => `>=1.2.3 <=1.2.4`
		  var hr = loose ? safeRe[t.HYPHENRANGELOOSE] : safeRe[t.HYPHENRANGE];
		  range = range.replace(hr, hyphenReplace);
		  debug('hyphen replace', range);
		  // `> 1.2.3 < 1.2.5` => `>1.2.3 <1.2.5`
		  range = range.replace(safeRe[t.COMPARATORTRIM], comparatorTrimReplace);
		  debug('comparator trim', range, safeRe[t.COMPARATORTRIM]);

		  // `~ 1.2.3` => `~1.2.3`
		  range = range.replace(safeRe[t.TILDETRIM], tildeTrimReplace);

		  // `^ 1.2.3` => `^1.2.3`
		  range = range.replace(safeRe[t.CARETTRIM], caretTrimReplace);

		  // normalize spaces
		  range = range.split(/\s+/).join(' ');

		  // At this point, the range is completely trimmed and
		  // ready to be split into comparators.

		  var compRe = loose ? safeRe[t.COMPARATORLOOSE] : safeRe[t.COMPARATOR];
		  var set = range.split(' ').map(function (comp) {
		    return parseComparator(comp, this.options)
		  }, this).join(' ').split(/\s+/);
		  if (this.options.loose) {
		    // in loose mode, throw out any that are not valid comparators
		    set = set.filter(function (comp) {
		      return !!comp.match(compRe)
		    });
		  }
		  set = set.map(function (comp) {
		    return new Comparator(comp, this.options)
		  }, this);

		  return set
		};

		Range.prototype.intersects = function (range, options) {
		  if (!(range instanceof Range)) {
		    throw new TypeError('a Range is required')
		  }

		  return this.set.some(function (thisComparators) {
		    return (
		      isSatisfiable(thisComparators, options) &&
		      range.set.some(function (rangeComparators) {
		        return (
		          isSatisfiable(rangeComparators, options) &&
		          thisComparators.every(function (thisComparator) {
		            return rangeComparators.every(function (rangeComparator) {
		              return thisComparator.intersects(rangeComparator, options)
		            })
		          })
		        )
		      })
		    )
		  })
		};

		// take a set of comparators and determine whether there
		// exists a version which can satisfy it
		function isSatisfiable (comparators, options) {
		  var result = true;
		  var remainingComparators = comparators.slice();
		  var testComparator = remainingComparators.pop();

		  while (result && remainingComparators.length) {
		    result = remainingComparators.every(function (otherComparator) {
		      return testComparator.intersects(otherComparator, options)
		    });

		    testComparator = remainingComparators.pop();
		  }

		  return result
		}

		// Mostly just for testing and legacy API reasons
		exports.toComparators = toComparators;
		function toComparators (range, options) {
		  return new Range(range, options).set.map(function (comp) {
		    return comp.map(function (c) {
		      return c.value
		    }).join(' ').trim().split(' ')
		  })
		}

		// comprised of xranges, tildes, stars, and gtlt's at this point.
		// already replaced the hyphen ranges
		// turn into a set of JUST comparators.
		function parseComparator (comp, options) {
		  debug('comp', comp, options);
		  comp = replaceCarets(comp, options);
		  debug('caret', comp);
		  comp = replaceTildes(comp, options);
		  debug('tildes', comp);
		  comp = replaceXRanges(comp, options);
		  debug('xrange', comp);
		  comp = replaceStars(comp, options);
		  debug('stars', comp);
		  return comp
		}

		function isX (id) {
		  return !id || id.toLowerCase() === 'x' || id === '*'
		}

		// ~, ~> --> * (any, kinda silly)
		// ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0
		// ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0
		// ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0
		// ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0
		// ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0
		function replaceTildes (comp, options) {
		  return comp.trim().split(/\s+/).map(function (comp) {
		    return replaceTilde(comp, options)
		  }).join(' ')
		}

		function replaceTilde (comp, options) {
		  var r = options.loose ? safeRe[t.TILDELOOSE] : safeRe[t.TILDE];
		  return comp.replace(r, function (_, M, m, p, pr) {
		    debug('tilde', comp, _, M, m, p, pr);
		    var ret;

		    if (isX(M)) {
		      ret = '';
		    } else if (isX(m)) {
		      ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
		    } else if (isX(p)) {
		      // ~1.2 == >=1.2.0 <1.3.0
		      ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
		    } else if (pr) {
		      debug('replaceTilde pr', pr);
		      ret = '>=' + M + '.' + m + '.' + p + '-' + pr +
		            ' <' + M + '.' + (+m + 1) + '.0';
		    } else {
		      // ~1.2.3 == >=1.2.3 <1.3.0
		      ret = '>=' + M + '.' + m + '.' + p +
		            ' <' + M + '.' + (+m + 1) + '.0';
		    }

		    debug('tilde return', ret);
		    return ret
		  })
		}

		// ^ --> * (any, kinda silly)
		// ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0
		// ^2.0, ^2.0.x --> >=2.0.0 <3.0.0
		// ^1.2, ^1.2.x --> >=1.2.0 <2.0.0
		// ^1.2.3 --> >=1.2.3 <2.0.0
		// ^1.2.0 --> >=1.2.0 <2.0.0
		function replaceCarets (comp, options) {
		  return comp.trim().split(/\s+/).map(function (comp) {
		    return replaceCaret(comp, options)
		  }).join(' ')
		}

		function replaceCaret (comp, options) {
		  debug('caret', comp, options);
		  var r = options.loose ? safeRe[t.CARETLOOSE] : safeRe[t.CARET];
		  return comp.replace(r, function (_, M, m, p, pr) {
		    debug('caret', comp, _, M, m, p, pr);
		    var ret;

		    if (isX(M)) {
		      ret = '';
		    } else if (isX(m)) {
		      ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
		    } else if (isX(p)) {
		      if (M === '0') {
		        ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
		      } else {
		        ret = '>=' + M + '.' + m + '.0 <' + (+M + 1) + '.0.0';
		      }
		    } else if (pr) {
		      debug('replaceCaret pr', pr);
		      if (M === '0') {
		        if (m === '0') {
		          ret = '>=' + M + '.' + m + '.' + p + '-' + pr +
		                ' <' + M + '.' + m + '.' + (+p + 1);
		        } else {
		          ret = '>=' + M + '.' + m + '.' + p + '-' + pr +
		                ' <' + M + '.' + (+m + 1) + '.0';
		        }
		      } else {
		        ret = '>=' + M + '.' + m + '.' + p + '-' + pr +
		              ' <' + (+M + 1) + '.0.0';
		      }
		    } else {
		      debug('no pr');
		      if (M === '0') {
		        if (m === '0') {
		          ret = '>=' + M + '.' + m + '.' + p +
		                ' <' + M + '.' + m + '.' + (+p + 1);
		        } else {
		          ret = '>=' + M + '.' + m + '.' + p +
		                ' <' + M + '.' + (+m + 1) + '.0';
		        }
		      } else {
		        ret = '>=' + M + '.' + m + '.' + p +
		              ' <' + (+M + 1) + '.0.0';
		      }
		    }

		    debug('caret return', ret);
		    return ret
		  })
		}

		function replaceXRanges (comp, options) {
		  debug('replaceXRanges', comp, options);
		  return comp.split(/\s+/).map(function (comp) {
		    return replaceXRange(comp, options)
		  }).join(' ')
		}

		function replaceXRange (comp, options) {
		  comp = comp.trim();
		  var r = options.loose ? safeRe[t.XRANGELOOSE] : safeRe[t.XRANGE];
		  return comp.replace(r, function (ret, gtlt, M, m, p, pr) {
		    debug('xRange', comp, ret, gtlt, M, m, p, pr);
		    var xM = isX(M);
		    var xm = xM || isX(m);
		    var xp = xm || isX(p);
		    var anyX = xp;

		    if (gtlt === '=' && anyX) {
		      gtlt = '';
		    }

		    // if we're including prereleases in the match, then we need
		    // to fix this to -0, the lowest possible prerelease value
		    pr = options.includePrerelease ? '-0' : '';

		    if (xM) {
		      if (gtlt === '>' || gtlt === '<') {
		        // nothing is allowed
		        ret = '<0.0.0-0';
		      } else {
		        // nothing is forbidden
		        ret = '*';
		      }
		    } else if (gtlt && anyX) {
		      // we know patch is an x, because we have any x at all.
		      // replace X with 0
		      if (xm) {
		        m = 0;
		      }
		      p = 0;

		      if (gtlt === '>') {
		        // >1 => >=2.0.0
		        // >1.2 => >=1.3.0
		        // >1.2.3 => >= 1.2.4
		        gtlt = '>=';
		        if (xm) {
		          M = +M + 1;
		          m = 0;
		          p = 0;
		        } else {
		          m = +m + 1;
		          p = 0;
		        }
		      } else if (gtlt === '<=') {
		        // <=0.7.x is actually <0.8.0, since any 0.7.x should
		        // pass.  Similarly, <=7.x is actually <8.0.0, etc.
		        gtlt = '<';
		        if (xm) {
		          M = +M + 1;
		        } else {
		          m = +m + 1;
		        }
		      }

		      ret = gtlt + M + '.' + m + '.' + p + pr;
		    } else if (xm) {
		      ret = '>=' + M + '.0.0' + pr + ' <' + (+M + 1) + '.0.0' + pr;
		    } else if (xp) {
		      ret = '>=' + M + '.' + m + '.0' + pr +
		        ' <' + M + '.' + (+m + 1) + '.0' + pr;
		    }

		    debug('xRange return', ret);

		    return ret
		  })
		}

		// Because * is AND-ed with everything else in the comparator,
		// and '' means "any version", just remove the *s entirely.
		function replaceStars (comp, options) {
		  debug('replaceStars', comp, options);
		  // Looseness is ignored here.  star is always as loose as it gets!
		  return comp.trim().replace(safeRe[t.STAR], '')
		}

		// This function is passed to string.replace(re[t.HYPHENRANGE])
		// M, m, patch, prerelease, build
		// 1.2 - 3.4.5 => >=1.2.0 <=3.4.5
		// 1.2.3 - 3.4 => >=1.2.0 <3.5.0 Any 3.4.x will do
		// 1.2 - 3.4 => >=1.2.0 <3.5.0
		function hyphenReplace ($0,
		  from, fM, fm, fp, fpr, fb,
		  to, tM, tm, tp, tpr, tb) {
		  if (isX(fM)) {
		    from = '';
		  } else if (isX(fm)) {
		    from = '>=' + fM + '.0.0';
		  } else if (isX(fp)) {
		    from = '>=' + fM + '.' + fm + '.0';
		  } else {
		    from = '>=' + from;
		  }

		  if (isX(tM)) {
		    to = '';
		  } else if (isX(tm)) {
		    to = '<' + (+tM + 1) + '.0.0';
		  } else if (isX(tp)) {
		    to = '<' + tM + '.' + (+tm + 1) + '.0';
		  } else if (tpr) {
		    to = '<=' + tM + '.' + tm + '.' + tp + '-' + tpr;
		  } else {
		    to = '<=' + to;
		  }

		  return (from + ' ' + to).trim()
		}

		// if ANY of the sets match ALL of its comparators, then pass
		Range.prototype.test = function (version) {
		  if (!version) {
		    return false
		  }

		  if (typeof version === 'string') {
		    try {
		      version = new SemVer(version, this.options);
		    } catch (er) {
		      return false
		    }
		  }

		  for (var i = 0; i < this.set.length; i++) {
		    if (testSet(this.set[i], version, this.options)) {
		      return true
		    }
		  }
		  return false
		};

		function testSet (set, version, options) {
		  for (var i = 0; i < set.length; i++) {
		    if (!set[i].test(version)) {
		      return false
		    }
		  }

		  if (version.prerelease.length && !options.includePrerelease) {
		    // Find the set of versions that are allowed to have prereleases
		    // For example, ^1.2.3-pr.1 desugars to >=1.2.3-pr.1 <2.0.0
		    // That should allow `1.2.3-pr.2` to pass.
		    // However, `1.2.4-alpha.notready` should NOT be allowed,
		    // even though it's within the range set by the comparators.
		    for (i = 0; i < set.length; i++) {
		      debug(set[i].semver);
		      if (set[i].semver === ANY) {
		        continue
		      }

		      if (set[i].semver.prerelease.length > 0) {
		        var allowed = set[i].semver;
		        if (allowed.major === version.major &&
		            allowed.minor === version.minor &&
		            allowed.patch === version.patch) {
		          return true
		        }
		      }
		    }

		    // Version has a -pre, but it's not one of the ones we like.
		    return false
		  }

		  return true
		}

		exports.satisfies = satisfies;
		function satisfies (version, range, options) {
		  try {
		    range = new Range(range, options);
		  } catch (er) {
		    return false
		  }
		  return range.test(version)
		}

		exports.maxSatisfying = maxSatisfying;
		function maxSatisfying (versions, range, options) {
		  var max = null;
		  var maxSV = null;
		  try {
		    var rangeObj = new Range(range, options);
		  } catch (er) {
		    return null
		  }
		  versions.forEach(function (v) {
		    if (rangeObj.test(v)) {
		      // satisfies(v, range, options)
		      if (!max || maxSV.compare(v) === -1) {
		        // compare(max, v, true)
		        max = v;
		        maxSV = new SemVer(max, options);
		      }
		    }
		  });
		  return max
		}

		exports.minSatisfying = minSatisfying;
		function minSatisfying (versions, range, options) {
		  var min = null;
		  var minSV = null;
		  try {
		    var rangeObj = new Range(range, options);
		  } catch (er) {
		    return null
		  }
		  versions.forEach(function (v) {
		    if (rangeObj.test(v)) {
		      // satisfies(v, range, options)
		      if (!min || minSV.compare(v) === 1) {
		        // compare(min, v, true)
		        min = v;
		        minSV = new SemVer(min, options);
		      }
		    }
		  });
		  return min
		}

		exports.minVersion = minVersion;
		function minVersion (range, loose) {
		  range = new Range(range, loose);

		  var minver = new SemVer('0.0.0');
		  if (range.test(minver)) {
		    return minver
		  }

		  minver = new SemVer('0.0.0-0');
		  if (range.test(minver)) {
		    return minver
		  }

		  minver = null;
		  for (var i = 0; i < range.set.length; ++i) {
		    var comparators = range.set[i];

		    comparators.forEach(function (comparator) {
		      // Clone to avoid manipulating the comparator's semver object.
		      var compver = new SemVer(comparator.semver.version);
		      switch (comparator.operator) {
		        case '>':
		          if (compver.prerelease.length === 0) {
		            compver.patch++;
		          } else {
		            compver.prerelease.push(0);
		          }
		          compver.raw = compver.format();
		          /* fallthrough */
		        case '':
		        case '>=':
		          if (!minver || gt(minver, compver)) {
		            minver = compver;
		          }
		          break
		        case '<':
		        case '<=':
		          /* Ignore maximum versions */
		          break
		        /* istanbul ignore next */
		        default:
		          throw new Error('Unexpected operation: ' + comparator.operator)
		      }
		    });
		  }

		  if (minver && range.test(minver)) {
		    return minver
		  }

		  return null
		}

		exports.validRange = validRange;
		function validRange (range, options) {
		  try {
		    // Return '*' instead of '' so that truthiness works.
		    // This will throw if it's invalid anyway
		    return new Range(range, options).range || '*'
		  } catch (er) {
		    return null
		  }
		}

		// Determine if version is less than all the versions possible in the range
		exports.ltr = ltr;
		function ltr (version, range, options) {
		  return outside(version, range, '<', options)
		}

		// Determine if version is greater than all the versions possible in the range.
		exports.gtr = gtr;
		function gtr (version, range, options) {
		  return outside(version, range, '>', options)
		}

		exports.outside = outside;
		function outside (version, range, hilo, options) {
		  version = new SemVer(version, options);
		  range = new Range(range, options);

		  var gtfn, ltefn, ltfn, comp, ecomp;
		  switch (hilo) {
		    case '>':
		      gtfn = gt;
		      ltefn = lte;
		      ltfn = lt;
		      comp = '>';
		      ecomp = '>=';
		      break
		    case '<':
		      gtfn = lt;
		      ltefn = gte;
		      ltfn = gt;
		      comp = '<';
		      ecomp = '<=';
		      break
		    default:
		      throw new TypeError('Must provide a hilo val of "<" or ">"')
		  }

		  // If it satisifes the range it is not outside
		  if (satisfies(version, range, options)) {
		    return false
		  }

		  // From now on, variable terms are as if we're in "gtr" mode.
		  // but note that everything is flipped for the "ltr" function.

		  for (var i = 0; i < range.set.length; ++i) {
		    var comparators = range.set[i];

		    var high = null;
		    var low = null;

		    comparators.forEach(function (comparator) {
		      if (comparator.semver === ANY) {
		        comparator = new Comparator('>=0.0.0');
		      }
		      high = high || comparator;
		      low = low || comparator;
		      if (gtfn(comparator.semver, high.semver, options)) {
		        high = comparator;
		      } else if (ltfn(comparator.semver, low.semver, options)) {
		        low = comparator;
		      }
		    });

		    // If the edge version comparator has a operator then our version
		    // isn't outside it
		    if (high.operator === comp || high.operator === ecomp) {
		      return false
		    }

		    // If the lowest version comparator has an operator and our version
		    // is less than it then it isn't higher than the range
		    if ((!low.operator || low.operator === comp) &&
		        ltefn(version, low.semver)) {
		      return false
		    } else if (low.operator === ecomp && ltfn(version, low.semver)) {
		      return false
		    }
		  }
		  return true
		}

		exports.prerelease = prerelease;
		function prerelease (version, options) {
		  var parsed = parse(version, options);
		  return (parsed && parsed.prerelease.length) ? parsed.prerelease : null
		}

		exports.intersects = intersects;
		function intersects (r1, r2, options) {
		  r1 = new Range(r1, options);
		  r2 = new Range(r2, options);
		  return r1.intersects(r2)
		}

		exports.coerce = coerce;
		function coerce (version, options) {
		  if (version instanceof SemVer) {
		    return version
		  }

		  if (typeof version === 'number') {
		    version = String(version);
		  }

		  if (typeof version !== 'string') {
		    return null
		  }

		  options = options || {};

		  var match = null;
		  if (!options.rtl) {
		    match = version.match(safeRe[t.COERCE]);
		  } else {
		    // Find the right-most coercible string that does not share
		    // a terminus with a more left-ward coercible string.
		    // Eg, '1.2.3.4' wants to coerce '2.3.4', not '3.4' or '4'
		    //
		    // Walk through the string checking with a /g regexp
		    // Manually set the index so as to pick up overlapping matches.
		    // Stop when we get a match that ends at the string end, since no
		    // coercible string can be more right-ward without the same terminus.
		    var next;
		    while ((next = safeRe[t.COERCERTL].exec(version)) &&
		      (!match || match.index + match[0].length !== version.length)
		    ) {
		      if (!match ||
		          next.index + next[0].length !== match.index + match[0].length) {
		        match = next;
		      }
		      safeRe[t.COERCERTL].lastIndex = next.index + next[1].length + next[2].length;
		    }
		    // leave it in a clean state
		    safeRe[t.COERCERTL].lastIndex = -1;
		  }

		  if (match === null) {
		    return null
		  }

		  return parse(match[2] +
		    '.' + (match[3] || '0') +
		    '.' + (match[4] || '0'), options)
		} 
	} (semver, semver.exports));
	return semver.exports;
}

var manifest = manifest$1.exports;

var hasRequiredManifest;

function requireManifest () {
	if (hasRequiredManifest) return manifest$1.exports;
	hasRequiredManifest = 1;
	(function (module, exports) {
		var __createBinding = (manifest && manifest.__createBinding) || (Object.create ? (function(o, m, k, k2) {
		    if (k2 === undefined) k2 = k;
		    var desc = Object.getOwnPropertyDescriptor(m, k);
		    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
		      desc = { enumerable: true, get: function() { return m[k]; } };
		    }
		    Object.defineProperty(o, k2, desc);
		}) : (function(o, m, k, k2) {
		    if (k2 === undefined) k2 = k;
		    o[k2] = m[k];
		}));
		var __setModuleDefault = (manifest && manifest.__setModuleDefault) || (Object.create ? (function(o, v) {
		    Object.defineProperty(o, "default", { enumerable: true, value: v });
		}) : function(o, v) {
		    o["default"] = v;
		});
		var __importStar = (manifest && manifest.__importStar) || function (mod) {
		    if (mod && mod.__esModule) return mod;
		    var result = {};
		    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
		    __setModuleDefault(result, mod);
		    return result;
		};
		var __awaiter = (manifest && manifest.__awaiter) || function (thisArg, _arguments, P, generator) {
		    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
		    return new (P || (P = Promise))(function (resolve, reject) {
		        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
		        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
		        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
		        step((generator = generator.apply(thisArg, _arguments || [])).next());
		    });
		};
		Object.defineProperty(exports, "__esModule", { value: true });
		exports._readLinuxVersionFile = exports._getOsVersion = exports._findMatch = void 0;
		const semver = __importStar(requireSemver());
		const core_1 = requireCore();
		// needs to be require for core node modules to be mocked
		/* eslint @typescript-eslint/no-require-imports: 0 */
		const os = require$$0__default;
		const cp = require$$2;
		const fs = fs__default;
		function _findMatch(versionSpec, stable, candidates, archFilter) {
		    return __awaiter(this, void 0, void 0, function* () {
		        const platFilter = os.platform();
		        let result;
		        let match;
		        let file;
		        for (const candidate of candidates) {
		            const version = candidate.version;
		            (0, core_1.debug)(`check ${version} satisfies ${versionSpec}`);
		            if (semver.satisfies(version, versionSpec) &&
		                (!stable || candidate.stable === stable)) {
		                file = candidate.files.find(item => {
		                    (0, core_1.debug)(`${item.arch}===${archFilter} && ${item.platform}===${platFilter}`);
		                    let chk = item.arch === archFilter && item.platform === platFilter;
		                    if (chk && item.platform_version) {
		                        const osVersion = module.exports._getOsVersion();
		                        if (osVersion === item.platform_version) {
		                            chk = true;
		                        }
		                        else {
		                            chk = semver.satisfies(osVersion, item.platform_version);
		                        }
		                    }
		                    return chk;
		                });
		                if (file) {
		                    (0, core_1.debug)(`matched ${candidate.version}`);
		                    match = candidate;
		                    break;
		                }
		            }
		        }
		        if (match && file) {
		            // clone since we're mutating the file list to be only the file that matches
		            result = Object.assign({}, match);
		            result.files = [file];
		        }
		        return result;
		    });
		}
		exports._findMatch = _findMatch;
		function _getOsVersion() {
		    // TODO: add windows and other linux, arm variants
		    // right now filtering on version is only an ubuntu and macos scenario for tools we build for hosted (python)
		    const plat = os.platform();
		    let version = '';
		    if (plat === 'darwin') {
		        version = cp.execSync('sw_vers -productVersion').toString();
		    }
		    else if (plat === 'linux') {
		        // lsb_release process not in some containers, readfile
		        // Run cat /etc/lsb-release
		        // DISTRIB_ID=Ubuntu
		        // DISTRIB_RELEASE=18.04
		        // DISTRIB_CODENAME=bionic
		        // DISTRIB_DESCRIPTION="Ubuntu 18.04.4 LTS"
		        const lsbContents = module.exports._readLinuxVersionFile();
		        if (lsbContents) {
		            const lines = lsbContents.split('\n');
		            for (const line of lines) {
		                const parts = line.split('=');
		                if (parts.length === 2 &&
		                    (parts[0].trim() === 'VERSION_ID' ||
		                        parts[0].trim() === 'DISTRIB_RELEASE')) {
		                    version = parts[1].trim().replace(/^"/, '').replace(/"$/, '');
		                    break;
		                }
		            }
		        }
		    }
		    return version;
		}
		exports._getOsVersion = _getOsVersion;
		function _readLinuxVersionFile() {
		    const lsbReleaseFile = '/etc/lsb-release';
		    const osReleaseFile = '/etc/os-release';
		    let contents = '';
		    if (fs.existsSync(lsbReleaseFile)) {
		        contents = fs.readFileSync(lsbReleaseFile).toString();
		    }
		    else if (fs.existsSync(osReleaseFile)) {
		        contents = fs.readFileSync(osReleaseFile).toString();
		    }
		    return contents;
		}
		exports._readLinuxVersionFile = _readLinuxVersionFile;
		
	} (manifest$1, manifest$1.exports));
	return manifest$1.exports;
}

var retryHelper = {};

var hasRequiredRetryHelper;

function requireRetryHelper () {
	if (hasRequiredRetryHelper) return retryHelper;
	hasRequiredRetryHelper = 1;
	var __createBinding = (retryHelper && retryHelper.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    var desc = Object.getOwnPropertyDescriptor(m, k);
	    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
	      desc = { enumerable: true, get: function() { return m[k]; } };
	    }
	    Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __setModuleDefault = (retryHelper && retryHelper.__setModuleDefault) || (Object.create ? (function(o, v) {
	    Object.defineProperty(o, "default", { enumerable: true, value: v });
	}) : function(o, v) {
	    o["default"] = v;
	});
	var __importStar = (retryHelper && retryHelper.__importStar) || function (mod) {
	    if (mod && mod.__esModule) return mod;
	    var result = {};
	    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
	    __setModuleDefault(result, mod);
	    return result;
	};
	var __awaiter = (retryHelper && retryHelper.__awaiter) || function (thisArg, _arguments, P, generator) {
	    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	Object.defineProperty(retryHelper, "__esModule", { value: true });
	retryHelper.RetryHelper = void 0;
	const core = __importStar(requireCore());
	/**
	 * Internal class for retries
	 */
	class RetryHelper {
	    constructor(maxAttempts, minSeconds, maxSeconds) {
	        if (maxAttempts < 1) {
	            throw new Error('max attempts should be greater than or equal to 1');
	        }
	        this.maxAttempts = maxAttempts;
	        this.minSeconds = Math.floor(minSeconds);
	        this.maxSeconds = Math.floor(maxSeconds);
	        if (this.minSeconds > this.maxSeconds) {
	            throw new Error('min seconds should be less than or equal to max seconds');
	        }
	    }
	    execute(action, isRetryable) {
	        return __awaiter(this, void 0, void 0, function* () {
	            let attempt = 1;
	            while (attempt < this.maxAttempts) {
	                // Try
	                try {
	                    return yield action();
	                }
	                catch (err) {
	                    if (isRetryable && !isRetryable(err)) {
	                        throw err;
	                    }
	                    core.info(err.message);
	                }
	                // Sleep
	                const seconds = this.getSleepAmount();
	                core.info(`Waiting ${seconds} seconds before trying again`);
	                yield this.sleep(seconds);
	                attempt++;
	            }
	            // Last attempt
	            return yield action();
	        });
	    }
	    getSleepAmount() {
	        return (Math.floor(Math.random() * (this.maxSeconds - this.minSeconds + 1)) +
	            this.minSeconds);
	    }
	    sleep(seconds) {
	        return __awaiter(this, void 0, void 0, function* () {
	            return new Promise(resolve => setTimeout(resolve, seconds * 1000));
	        });
	    }
	}
	retryHelper.RetryHelper = RetryHelper;
	
	return retryHelper;
}

var hasRequiredToolCache;

function requireToolCache () {
	if (hasRequiredToolCache) return toolCache;
	hasRequiredToolCache = 1;
	var __createBinding = (toolCache && toolCache.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    var desc = Object.getOwnPropertyDescriptor(m, k);
	    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
	      desc = { enumerable: true, get: function() { return m[k]; } };
	    }
	    Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __setModuleDefault = (toolCache && toolCache.__setModuleDefault) || (Object.create ? (function(o, v) {
	    Object.defineProperty(o, "default", { enumerable: true, value: v });
	}) : function(o, v) {
	    o["default"] = v;
	});
	var __importStar = (toolCache && toolCache.__importStar) || function (mod) {
	    if (mod && mod.__esModule) return mod;
	    var result = {};
	    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
	    __setModuleDefault(result, mod);
	    return result;
	};
	var __awaiter = (toolCache && toolCache.__awaiter) || function (thisArg, _arguments, P, generator) {
	    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	Object.defineProperty(toolCache, "__esModule", { value: true });
	toolCache.evaluateVersions = toolCache.isExplicitVersion = toolCache.findFromManifest = toolCache.getManifestFromRepo = toolCache.findAllVersions = toolCache.find = toolCache.cacheFile = toolCache.cacheDir = toolCache.extractZip = toolCache.extractXar = toolCache.extractTar = toolCache.extract7z = toolCache.downloadTool = toolCache.HTTPError = void 0;
	const core = __importStar(requireCore());
	const io = __importStar(requireIo());
	const crypto = __importStar(require$$0$1);
	const fs = __importStar(fs__default);
	const mm = __importStar(requireManifest());
	const os = __importStar(require$$0__default);
	const path = __importStar(path__default);
	const httpm = __importStar(requireLib());
	const semver = __importStar(requireSemver());
	const stream = __importStar(require$$0$2);
	const util = __importStar(require$$0$3);
	const assert_1 = require$$0$4;
	const exec_1 = requireExec();
	const retry_helper_1 = requireRetryHelper();
	class HTTPError extends Error {
	    constructor(httpStatusCode) {
	        super(`Unexpected HTTP response: ${httpStatusCode}`);
	        this.httpStatusCode = httpStatusCode;
	        Object.setPrototypeOf(this, new.target.prototype);
	    }
	}
	toolCache.HTTPError = HTTPError;
	const IS_WINDOWS = process.platform === 'win32';
	const IS_MAC = process.platform === 'darwin';
	const userAgent = 'actions/tool-cache';
	/**
	 * Download a tool from an url and stream it into a file
	 *
	 * @param url       url of tool to download
	 * @param dest      path to download tool
	 * @param auth      authorization header
	 * @param headers   other headers
	 * @returns         path to downloaded tool
	 */
	function downloadTool(url, dest, auth, headers) {
	    return __awaiter(this, void 0, void 0, function* () {
	        dest = dest || path.join(_getTempDirectory(), crypto.randomUUID());
	        yield io.mkdirP(path.dirname(dest));
	        core.debug(`Downloading ${url}`);
	        core.debug(`Destination ${dest}`);
	        const maxAttempts = 3;
	        const minSeconds = _getGlobal('TEST_DOWNLOAD_TOOL_RETRY_MIN_SECONDS', 10);
	        const maxSeconds = _getGlobal('TEST_DOWNLOAD_TOOL_RETRY_MAX_SECONDS', 20);
	        const retryHelper = new retry_helper_1.RetryHelper(maxAttempts, minSeconds, maxSeconds);
	        return yield retryHelper.execute(() => __awaiter(this, void 0, void 0, function* () {
	            return yield downloadToolAttempt(url, dest || '', auth, headers);
	        }), (err) => {
	            if (err instanceof HTTPError && err.httpStatusCode) {
	                // Don't retry anything less than 500, except 408 Request Timeout and 429 Too Many Requests
	                if (err.httpStatusCode < 500 &&
	                    err.httpStatusCode !== 408 &&
	                    err.httpStatusCode !== 429) {
	                    return false;
	                }
	            }
	            // Otherwise retry
	            return true;
	        });
	    });
	}
	toolCache.downloadTool = downloadTool;
	function downloadToolAttempt(url, dest, auth, headers) {
	    return __awaiter(this, void 0, void 0, function* () {
	        if (fs.existsSync(dest)) {
	            throw new Error(`Destination file path ${dest} already exists`);
	        }
	        // Get the response headers
	        const http = new httpm.HttpClient(userAgent, [], {
	            allowRetries: false
	        });
	        if (auth) {
	            core.debug('set auth');
	            if (headers === undefined) {
	                headers = {};
	            }
	            headers.authorization = auth;
	        }
	        const response = yield http.get(url, headers);
	        if (response.message.statusCode !== 200) {
	            const err = new HTTPError(response.message.statusCode);
	            core.debug(`Failed to download from "${url}". Code(${response.message.statusCode}) Message(${response.message.statusMessage})`);
	            throw err;
	        }
	        // Download the response body
	        const pipeline = util.promisify(stream.pipeline);
	        const responseMessageFactory = _getGlobal('TEST_DOWNLOAD_TOOL_RESPONSE_MESSAGE_FACTORY', () => response.message);
	        const readStream = responseMessageFactory();
	        let succeeded = false;
	        try {
	            yield pipeline(readStream, fs.createWriteStream(dest));
	            core.debug('download complete');
	            succeeded = true;
	            return dest;
	        }
	        finally {
	            // Error, delete dest before retry
	            if (!succeeded) {
	                core.debug('download failed');
	                try {
	                    yield io.rmRF(dest);
	                }
	                catch (err) {
	                    core.debug(`Failed to delete '${dest}'. ${err.message}`);
	                }
	            }
	        }
	    });
	}
	/**
	 * Extract a .7z file
	 *
	 * @param file     path to the .7z file
	 * @param dest     destination directory. Optional.
	 * @param _7zPath  path to 7zr.exe. Optional, for long path support. Most .7z archives do not have this
	 * problem. If your .7z archive contains very long paths, you can pass the path to 7zr.exe which will
	 * gracefully handle long paths. By default 7zdec.exe is used because it is a very small program and is
	 * bundled with the tool lib. However it does not support long paths. 7zr.exe is the reduced command line
	 * interface, it is smaller than the full command line interface, and it does support long paths. At the
	 * time of this writing, it is freely available from the LZMA SDK that is available on the 7zip website.
	 * Be sure to check the current license agreement. If 7zr.exe is bundled with your action, then the path
	 * to 7zr.exe can be pass to this function.
	 * @returns        path to the destination directory
	 */
	function extract7z(file, dest, _7zPath) {
	    return __awaiter(this, void 0, void 0, function* () {
	        (0, assert_1.ok)(IS_WINDOWS, 'extract7z() not supported on current OS');
	        (0, assert_1.ok)(file, 'parameter "file" is required');
	        dest = yield _createExtractFolder(dest);
	        const originalCwd = process.cwd();
	        process.chdir(dest);
	        if (_7zPath) {
	            try {
	                const logLevel = core.isDebug() ? '-bb1' : '-bb0';
	                const args = [
	                    'x',
	                    logLevel,
	                    '-bd',
	                    '-sccUTF-8',
	                    file
	                ];
	                const options = {
	                    silent: true
	                };
	                yield (0, exec_1.exec)(`"${_7zPath}"`, args, options);
	            }
	            finally {
	                process.chdir(originalCwd);
	            }
	        }
	        else {
	            const escapedScript = path
	                .join(__dirname, '..', 'scripts', 'Invoke-7zdec.ps1')
	                .replace(/'/g, "''")
	                .replace(/"|\n|\r/g, ''); // double-up single quotes, remove double quotes and newlines
	            const escapedFile = file.replace(/'/g, "''").replace(/"|\n|\r/g, '');
	            const escapedTarget = dest.replace(/'/g, "''").replace(/"|\n|\r/g, '');
	            const command = `& '${escapedScript}' -Source '${escapedFile}' -Target '${escapedTarget}'`;
	            const args = [
	                '-NoLogo',
	                '-Sta',
	                '-NoProfile',
	                '-NonInteractive',
	                '-ExecutionPolicy',
	                'Unrestricted',
	                '-Command',
	                command
	            ];
	            const options = {
	                silent: true
	            };
	            try {
	                const powershellPath = yield io.which('powershell', true);
	                yield (0, exec_1.exec)(`"${powershellPath}"`, args, options);
	            }
	            finally {
	                process.chdir(originalCwd);
	            }
	        }
	        return dest;
	    });
	}
	toolCache.extract7z = extract7z;
	/**
	 * Extract a compressed tar archive
	 *
	 * @param file     path to the tar
	 * @param dest     destination directory. Optional.
	 * @param flags    flags for the tar command to use for extraction. Defaults to 'xz' (extracting gzipped tars). Optional.
	 * @returns        path to the destination directory
	 */
	function extractTar(file, dest, flags = 'xz') {
	    return __awaiter(this, void 0, void 0, function* () {
	        if (!file) {
	            throw new Error("parameter 'file' is required");
	        }
	        // Create dest
	        dest = yield _createExtractFolder(dest);
	        // Determine whether GNU tar
	        core.debug('Checking tar --version');
	        let versionOutput = '';
	        yield (0, exec_1.exec)('tar --version', [], {
	            ignoreReturnCode: true,
	            silent: true,
	            listeners: {
	                stdout: (data) => (versionOutput += data.toString()),
	                stderr: (data) => (versionOutput += data.toString())
	            }
	        });
	        core.debug(versionOutput.trim());
	        const isGnuTar = versionOutput.toUpperCase().includes('GNU TAR');
	        // Initialize args
	        let args;
	        if (flags instanceof Array) {
	            args = flags;
	        }
	        else {
	            args = [flags];
	        }
	        if (core.isDebug() && !flags.includes('v')) {
	            args.push('-v');
	        }
	        let destArg = dest;
	        let fileArg = file;
	        if (IS_WINDOWS && isGnuTar) {
	            args.push('--force-local');
	            destArg = dest.replace(/\\/g, '/');
	            // Technically only the dest needs to have `/` but for aesthetic consistency
	            // convert slashes in the file arg too.
	            fileArg = file.replace(/\\/g, '/');
	        }
	        if (isGnuTar) {
	            // Suppress warnings when using GNU tar to extract archives created by BSD tar
	            args.push('--warning=no-unknown-keyword');
	            args.push('--overwrite');
	        }
	        args.push('-C', destArg, '-f', fileArg);
	        yield (0, exec_1.exec)(`tar`, args);
	        return dest;
	    });
	}
	toolCache.extractTar = extractTar;
	/**
	 * Extract a xar compatible archive
	 *
	 * @param file     path to the archive
	 * @param dest     destination directory. Optional.
	 * @param flags    flags for the xar. Optional.
	 * @returns        path to the destination directory
	 */
	function extractXar(file, dest, flags = []) {
	    return __awaiter(this, void 0, void 0, function* () {
	        (0, assert_1.ok)(IS_MAC, 'extractXar() not supported on current OS');
	        (0, assert_1.ok)(file, 'parameter "file" is required');
	        dest = yield _createExtractFolder(dest);
	        let args;
	        if (flags instanceof Array) {
	            args = flags;
	        }
	        else {
	            args = [flags];
	        }
	        args.push('-x', '-C', dest, '-f', file);
	        if (core.isDebug()) {
	            args.push('-v');
	        }
	        const xarPath = yield io.which('xar', true);
	        yield (0, exec_1.exec)(`"${xarPath}"`, _unique(args));
	        return dest;
	    });
	}
	toolCache.extractXar = extractXar;
	/**
	 * Extract a zip
	 *
	 * @param file     path to the zip
	 * @param dest     destination directory. Optional.
	 * @returns        path to the destination directory
	 */
	function extractZip(file, dest) {
	    return __awaiter(this, void 0, void 0, function* () {
	        if (!file) {
	            throw new Error("parameter 'file' is required");
	        }
	        dest = yield _createExtractFolder(dest);
	        if (IS_WINDOWS) {
	            yield extractZipWin(file, dest);
	        }
	        else {
	            yield extractZipNix(file, dest);
	        }
	        return dest;
	    });
	}
	toolCache.extractZip = extractZip;
	function extractZipWin(file, dest) {
	    return __awaiter(this, void 0, void 0, function* () {
	        // build the powershell command
	        const escapedFile = file.replace(/'/g, "''").replace(/"|\n|\r/g, ''); // double-up single quotes, remove double quotes and newlines
	        const escapedDest = dest.replace(/'/g, "''").replace(/"|\n|\r/g, '');
	        const pwshPath = yield io.which('pwsh', false);
	        //To match the file overwrite behavior on nix systems, we use the overwrite = true flag for ExtractToDirectory
	        //and the -Force flag for Expand-Archive as a fallback
	        if (pwshPath) {
	            //attempt to use pwsh with ExtractToDirectory, if this fails attempt Expand-Archive
	            const pwshCommand = [
	                `$ErrorActionPreference = 'Stop' ;`,
	                `try { Add-Type -AssemblyName System.IO.Compression.ZipFile } catch { } ;`,
	                `try { [System.IO.Compression.ZipFile]::ExtractToDirectory('${escapedFile}', '${escapedDest}', $true) }`,
	                `catch { if (($_.Exception.GetType().FullName -eq 'System.Management.Automation.MethodException') -or ($_.Exception.GetType().FullName -eq 'System.Management.Automation.RuntimeException') ){ Expand-Archive -LiteralPath '${escapedFile}' -DestinationPath '${escapedDest}' -Force } else { throw $_ } } ;`
	            ].join(' ');
	            const args = [
	                '-NoLogo',
	                '-NoProfile',
	                '-NonInteractive',
	                '-ExecutionPolicy',
	                'Unrestricted',
	                '-Command',
	                pwshCommand
	            ];
	            core.debug(`Using pwsh at path: ${pwshPath}`);
	            yield (0, exec_1.exec)(`"${pwshPath}"`, args);
	        }
	        else {
	            const powershellCommand = [
	                `$ErrorActionPreference = 'Stop' ;`,
	                `try { Add-Type -AssemblyName System.IO.Compression.FileSystem } catch { } ;`,
	                `if ((Get-Command -Name Expand-Archive -Module Microsoft.PowerShell.Archive -ErrorAction Ignore)) { Expand-Archive -LiteralPath '${escapedFile}' -DestinationPath '${escapedDest}' -Force }`,
	                `else {[System.IO.Compression.ZipFile]::ExtractToDirectory('${escapedFile}', '${escapedDest}', $true) }`
	            ].join(' ');
	            const args = [
	                '-NoLogo',
	                '-Sta',
	                '-NoProfile',
	                '-NonInteractive',
	                '-ExecutionPolicy',
	                'Unrestricted',
	                '-Command',
	                powershellCommand
	            ];
	            const powershellPath = yield io.which('powershell', true);
	            core.debug(`Using powershell at path: ${powershellPath}`);
	            yield (0, exec_1.exec)(`"${powershellPath}"`, args);
	        }
	    });
	}
	function extractZipNix(file, dest) {
	    return __awaiter(this, void 0, void 0, function* () {
	        const unzipPath = yield io.which('unzip', true);
	        const args = [file];
	        if (!core.isDebug()) {
	            args.unshift('-q');
	        }
	        args.unshift('-o'); //overwrite with -o, otherwise a prompt is shown which freezes the run
	        yield (0, exec_1.exec)(`"${unzipPath}"`, args, { cwd: dest });
	    });
	}
	/**
	 * Caches a directory and installs it into the tool cacheDir
	 *
	 * @param sourceDir    the directory to cache into tools
	 * @param tool          tool name
	 * @param version       version of the tool.  semver format
	 * @param arch          architecture of the tool.  Optional.  Defaults to machine architecture
	 */
	function cacheDir(sourceDir, tool, version, arch) {
	    return __awaiter(this, void 0, void 0, function* () {
	        version = semver.clean(version) || version;
	        arch = arch || os.arch();
	        core.debug(`Caching tool ${tool} ${version} ${arch}`);
	        core.debug(`source dir: ${sourceDir}`);
	        if (!fs.statSync(sourceDir).isDirectory()) {
	            throw new Error('sourceDir is not a directory');
	        }
	        // Create the tool dir
	        const destPath = yield _createToolPath(tool, version, arch);
	        // copy each child item. do not move. move can fail on Windows
	        // due to anti-virus software having an open handle on a file.
	        for (const itemName of fs.readdirSync(sourceDir)) {
	            const s = path.join(sourceDir, itemName);
	            yield io.cp(s, destPath, { recursive: true });
	        }
	        // write .complete
	        _completeToolPath(tool, version, arch);
	        return destPath;
	    });
	}
	toolCache.cacheDir = cacheDir;
	/**
	 * Caches a downloaded file (GUID) and installs it
	 * into the tool cache with a given targetName
	 *
	 * @param sourceFile    the file to cache into tools.  Typically a result of downloadTool which is a guid.
	 * @param targetFile    the name of the file name in the tools directory
	 * @param tool          tool name
	 * @param version       version of the tool.  semver format
	 * @param arch          architecture of the tool.  Optional.  Defaults to machine architecture
	 */
	function cacheFile(sourceFile, targetFile, tool, version, arch) {
	    return __awaiter(this, void 0, void 0, function* () {
	        version = semver.clean(version) || version;
	        arch = arch || os.arch();
	        core.debug(`Caching tool ${tool} ${version} ${arch}`);
	        core.debug(`source file: ${sourceFile}`);
	        if (!fs.statSync(sourceFile).isFile()) {
	            throw new Error('sourceFile is not a file');
	        }
	        // create the tool dir
	        const destFolder = yield _createToolPath(tool, version, arch);
	        // copy instead of move. move can fail on Windows due to
	        // anti-virus software having an open handle on a file.
	        const destPath = path.join(destFolder, targetFile);
	        core.debug(`destination file ${destPath}`);
	        yield io.cp(sourceFile, destPath);
	        // write .complete
	        _completeToolPath(tool, version, arch);
	        return destFolder;
	    });
	}
	toolCache.cacheFile = cacheFile;
	/**
	 * Finds the path to a tool version in the local installed tool cache
	 *
	 * @param toolName      name of the tool
	 * @param versionSpec   version of the tool
	 * @param arch          optional arch.  defaults to arch of computer
	 */
	function find(toolName, versionSpec, arch) {
	    if (!toolName) {
	        throw new Error('toolName parameter is required');
	    }
	    if (!versionSpec) {
	        throw new Error('versionSpec parameter is required');
	    }
	    arch = arch || os.arch();
	    // attempt to resolve an explicit version
	    if (!isExplicitVersion(versionSpec)) {
	        const localVersions = findAllVersions(toolName, arch);
	        const match = evaluateVersions(localVersions, versionSpec);
	        versionSpec = match;
	    }
	    // check for the explicit version in the cache
	    let toolPath = '';
	    if (versionSpec) {
	        versionSpec = semver.clean(versionSpec) || '';
	        const cachePath = path.join(_getCacheDirectory(), toolName, versionSpec, arch);
	        core.debug(`checking cache: ${cachePath}`);
	        if (fs.existsSync(cachePath) && fs.existsSync(`${cachePath}.complete`)) {
	            core.debug(`Found tool in cache ${toolName} ${versionSpec} ${arch}`);
	            toolPath = cachePath;
	        }
	        else {
	            core.debug('not found');
	        }
	    }
	    return toolPath;
	}
	toolCache.find = find;
	/**
	 * Finds the paths to all versions of a tool that are installed in the local tool cache
	 *
	 * @param toolName  name of the tool
	 * @param arch      optional arch.  defaults to arch of computer
	 */
	function findAllVersions(toolName, arch) {
	    const versions = [];
	    arch = arch || os.arch();
	    const toolPath = path.join(_getCacheDirectory(), toolName);
	    if (fs.existsSync(toolPath)) {
	        const children = fs.readdirSync(toolPath);
	        for (const child of children) {
	            if (isExplicitVersion(child)) {
	                const fullPath = path.join(toolPath, child, arch || '');
	                if (fs.existsSync(fullPath) && fs.existsSync(`${fullPath}.complete`)) {
	                    versions.push(child);
	                }
	            }
	        }
	    }
	    return versions;
	}
	toolCache.findAllVersions = findAllVersions;
	function getManifestFromRepo(owner, repo, auth, branch = 'master') {
	    return __awaiter(this, void 0, void 0, function* () {
	        let releases = [];
	        const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}`;
	        const http = new httpm.HttpClient('tool-cache');
	        const headers = {};
	        if (auth) {
	            core.debug('set auth');
	            headers.authorization = auth;
	        }
	        const response = yield http.getJson(treeUrl, headers);
	        if (!response.result) {
	            return releases;
	        }
	        let manifestUrl = '';
	        for (const item of response.result.tree) {
	            if (item.path === 'versions-manifest.json') {
	                manifestUrl = item.url;
	                break;
	            }
	        }
	        headers['accept'] = 'application/vnd.github.VERSION.raw';
	        let versionsRaw = yield (yield http.get(manifestUrl, headers)).readBody();
	        if (versionsRaw) {
	            // shouldn't be needed but protects against invalid json saved with BOM
	            versionsRaw = versionsRaw.replace(/^\uFEFF/, '');
	            try {
	                releases = JSON.parse(versionsRaw);
	            }
	            catch (_a) {
	                core.debug('Invalid json');
	            }
	        }
	        return releases;
	    });
	}
	toolCache.getManifestFromRepo = getManifestFromRepo;
	function findFromManifest(versionSpec, stable, manifest, archFilter = os.arch()) {
	    return __awaiter(this, void 0, void 0, function* () {
	        // wrap the internal impl
	        const match = yield mm._findMatch(versionSpec, stable, manifest, archFilter);
	        return match;
	    });
	}
	toolCache.findFromManifest = findFromManifest;
	function _createExtractFolder(dest) {
	    return __awaiter(this, void 0, void 0, function* () {
	        if (!dest) {
	            // create a temp dir
	            dest = path.join(_getTempDirectory(), crypto.randomUUID());
	        }
	        yield io.mkdirP(dest);
	        return dest;
	    });
	}
	function _createToolPath(tool, version, arch) {
	    return __awaiter(this, void 0, void 0, function* () {
	        const folderPath = path.join(_getCacheDirectory(), tool, semver.clean(version) || version, arch || '');
	        core.debug(`destination ${folderPath}`);
	        const markerPath = `${folderPath}.complete`;
	        yield io.rmRF(folderPath);
	        yield io.rmRF(markerPath);
	        yield io.mkdirP(folderPath);
	        return folderPath;
	    });
	}
	function _completeToolPath(tool, version, arch) {
	    const folderPath = path.join(_getCacheDirectory(), tool, semver.clean(version) || version, arch || '');
	    const markerPath = `${folderPath}.complete`;
	    fs.writeFileSync(markerPath, '');
	    core.debug('finished caching tool');
	}
	/**
	 * Check if version string is explicit
	 *
	 * @param versionSpec      version string to check
	 */
	function isExplicitVersion(versionSpec) {
	    const c = semver.clean(versionSpec) || '';
	    core.debug(`isExplicit: ${c}`);
	    const valid = semver.valid(c) != null;
	    core.debug(`explicit? ${valid}`);
	    return valid;
	}
	toolCache.isExplicitVersion = isExplicitVersion;
	/**
	 * Get the highest satisfiying semantic version in `versions` which satisfies `versionSpec`
	 *
	 * @param versions        array of versions to evaluate
	 * @param versionSpec     semantic version spec to satisfy
	 */
	function evaluateVersions(versions, versionSpec) {
	    let version = '';
	    core.debug(`evaluating ${versions.length} versions`);
	    versions = versions.sort((a, b) => {
	        if (semver.gt(a, b)) {
	            return 1;
	        }
	        return -1;
	    });
	    for (let i = versions.length - 1; i >= 0; i--) {
	        const potential = versions[i];
	        const satisfied = semver.satisfies(potential, versionSpec);
	        if (satisfied) {
	            version = potential;
	            break;
	        }
	    }
	    if (version) {
	        core.debug(`matched: ${version}`);
	    }
	    else {
	        core.debug('match not found');
	    }
	    return version;
	}
	toolCache.evaluateVersions = evaluateVersions;
	/**
	 * Gets RUNNER_TOOL_CACHE
	 */
	function _getCacheDirectory() {
	    const cacheDirectory = process.env['RUNNER_TOOL_CACHE'] || '';
	    (0, assert_1.ok)(cacheDirectory, 'Expected RUNNER_TOOL_CACHE to be defined');
	    return cacheDirectory;
	}
	/**
	 * Gets RUNNER_TEMP
	 */
	function _getTempDirectory() {
	    const tempDirectory = process.env['RUNNER_TEMP'] || '';
	    (0, assert_1.ok)(tempDirectory, 'Expected RUNNER_TEMP to be defined');
	    return tempDirectory;
	}
	/**
	 * Gets a global variable
	 */
	function _getGlobal(key, defaultValue) {
	    /* eslint-disable @typescript-eslint/no-explicit-any */
	    const value = commonjsGlobal[key];
	    /* eslint-enable @typescript-eslint/no-explicit-any */
	    return value !== undefined ? value : defaultValue;
	}
	/**
	 * Returns an array of unique values.
	 * @param values Values to make unique.
	 */
	function _unique(values) {
	    return Array.from(new Set(values));
	}
	
	return toolCache;
}

var toolCacheExports = requireToolCache();

const platformFlavor = {
  linux: {
    x64: "linux-x64",
    arm64: "linux-aarch64",
  },
  win32: {
    x64: "windows-x64",
  },
  darwin: {
    x64: "macosx-x64",
    arm64: "macosx-aarch64",
  },
};

function getPlatformFlavor(platform, arch) {
  const flavor = platformFlavor[platform]?.[arch];

  if (!flavor) {
    throw new Error(`Platform ${platform} ${arch} not supported`);
  }

  return flavor;
}

function getScannerDownloadURL({
  scannerBinariesUrl,
  scannerVersion,
  flavor,
}) {
  const trimURL = scannerBinariesUrl.replace(/\/$/, "");
  return `${trimURL}/sonar-scanner-cli-${scannerVersion}-${flavor}.zip`;
}

const scannerDirName = (version, flavor) =>
  `sonar-scanner-${version}-${flavor}`;

const TOOLNAME = "sonar-scanner-cli";

/**
 * Download the Sonar Scanner CLI for the current environment and cache it.
 */
async function installSonarScanner({
  scannerVersion,
  scannerBinariesUrl,
}) {
  const flavor = getPlatformFlavor(require$$0.platform(), require$$0.arch());

  // Check if tool is already cached
  let toolDir = toolCacheExports.find(TOOLNAME, scannerVersion, flavor);

  if (!toolDir) {
    coreExports.info(
      `Installing Sonar Scanner CLI ${scannerVersion} for ${flavor}...`
    );

    const downloadUrl = getScannerDownloadURL({
      scannerBinariesUrl,
      scannerVersion,
      flavor,
    });

    coreExports.info(`Downloading from: ${downloadUrl}`);

    const downloadPath = await toolCacheExports.downloadTool(downloadUrl);
    const extractedPath = await toolCacheExports.extractZip(downloadPath);

    // Find the actual scanner directory inside the extracted folder
    const scannerPath = path.join(
      extractedPath,
      scannerDirName(scannerVersion, flavor)
    );

    toolDir = await toolCacheExports.cacheDir(scannerPath, TOOLNAME, scannerVersion, flavor);

    coreExports.info(`Sonar Scanner CLI cached to: ${toolDir}`);
  } else {
    coreExports.info(`Using cached Sonar Scanner CLI from: ${toolDir}`);
  }

  // Add the bin directory to PATH
  const binDir = path.join(toolDir, "bin");
  coreExports.addPath(binDir);

  return toolDir;
}

function parseArgsStringToArgv(value, env, file) {
    // ([^\s'"]([^\s'"]*(['"])([^\3]*?)\3)+[^\s'"]*) Matches nested quotes until the first space outside of quotes
    // [^\s'"]+ or Match if not a space ' or "
    // (['"])([^\5]*?)\5 or Match "quoted text" without quotes
    // `\3` and `\5` are a backreference to the quote style (' or ") captured
    var myRegexp = /([^\s'"]([^\s'"]*(['"])([^\3]*?)\3)+[^\s'"]*)|[^\s'"]+|(['"])([^\5]*?)\5/gi;
    var myString = value;
    var myArray = [];
    var match;
    do {
        // Each call to exec returns the next regex match as an array
        match = myRegexp.exec(myString);
        if (match !== null) {
            // Index 1 in the array is the captured group if it exists
            // Index 0 is the matched text, which we use if no captured group exists
            myArray.push(firstString(match[1], match[6], match[0]));
        }
    } while (match !== null);
    return myArray;
}
// Accepts any number of arguments, and returns the first one that is a string
// (even an empty string)
function firstString() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    for (var i = 0; i < args.length; i++) {
        var arg = args[i];
        if (typeof arg === "string") {
            return arg;
        }
    }
}

const KEYTOOL_MAIN_CLASS = "sun.security.tools.keytool.Main";
const TRUSTSTORE_PASSWORD = "changeit"; // default password of the Java truststore!

async function runSonarScanner(
  inputArgs,
  projectBaseDir,
  scannerDir,
  runnerEnv = {}
) {
  const { runnerDebug, runnerOs, runnerTemp, sonarRootCert, sonarcloudUrl } =
    runnerEnv;

  const scannerBin =
    runnerOs === "Windows" ? "sonar-scanner.bat" : "sonar-scanner";

  const scannerArgs = [];

  /**
   * Not sanitization is needed when populating scannerArgs.
   * @actions/exec will take care of sanitizing the args it receives.
   */

  if (sonarcloudUrl) {
    scannerArgs.push(`-Dsonar.scanner.sonarcloudUrl=${sonarcloudUrl}`);
  }

  if (runnerDebug === "1") {
    scannerArgs.push("--debug");
  }

  if (projectBaseDir) {
    scannerArgs.push(`-Dsonar.projectBaseDir=${projectBaseDir}`);
  }

  // The SSL folder may exist on an uncleaned self-hosted runner
  const sslFolder = path.join(require$$0.homedir(), ".sonar", "ssl");
  const truststoreFile = path.join(sslFolder, "truststore.p12");

  const keytoolParams = {
    scannerDir,
    truststoreFile,
  };

  if (fs.existsSync(truststoreFile)) {
    let aliasSonarIsPresent = true;

    try {
      await checkSonarAliasInTruststore(keytoolParams);
    } catch (_) {
      aliasSonarIsPresent = false;
      coreExports.info(
        `Existing Scanner truststore ${truststoreFile} does not contain 'sonar' alias`
      );
    }

    if (aliasSonarIsPresent) {
      coreExports.info(
        `Removing 'sonar' alias from already existing Scanner truststore: ${truststoreFile}`
      );
      await deleteSonarAliasFromTruststore(keytoolParams);
    }
  }

  if (sonarRootCert) {
    coreExports.info("Adding SSL certificate to the Scanner truststore");
    const tempCertPath = path.join(runnerTemp, "tmpcert.pem");

    try {
      fs.unlinkSync(tempCertPath);
    } catch (_) {
      // File doesn't exist, ignore
    }

    fs.writeFileSync(tempCertPath, sonarRootCert);
    fs.mkdirSync(sslFolder, { recursive: true });

    await importCertificateToTruststore(keytoolParams, tempCertPath);

    scannerArgs.push(
      `-Dsonar.scanner.truststorePassword=${TRUSTSTORE_PASSWORD}`
    );
  }

  if (inputArgs) {
    /**
     * No sanitization, but it is parsing a string into an array of arguments in a safe way (= no command execution),
     * and with good enough support of quotes to support arguments containing spaces.
     */
    const args = parseArgsStringToArgv(inputArgs);
    scannerArgs.push(...args);
  }

  /**
   * Arguments are sanitized by `exec`
   */
  await execExports.exec(scannerBin, scannerArgs);
}

/**
 * Use keytool for now, as SonarQube 10.6 and below doesn't support openssl generated keystores
 * keytool requires a password > 6 characters,  so we won't use the default password 'sonar'
 */
function executeKeytoolCommand({
  scannerDir,
  truststoreFile,
  extraArgs,
  options = {},
}) {
  const baseArgs = [
    KEYTOOL_MAIN_CLASS,
    "-storetype",
    "PKCS12",
    "-keystore",
    truststoreFile,
    "-storepass",
    TRUSTSTORE_PASSWORD,
    "-noprompt",
    "-trustcacerts",
    ...extraArgs,
  ];

  return execExports.exec(`${scannerDir}/jre/bin/java`, baseArgs, options);
}

function importCertificateToTruststore(keytoolParams, certPath) {
  return executeKeytoolCommand({
    ...keytoolParams,
    extraArgs: ["-importcert", "-alias", "sonar", "-file", certPath],
  });
}

function checkSonarAliasInTruststore(keytoolParams) {
  return executeKeytoolCommand({
    ...keytoolParams,
    extraArgs: ["-list", "-v", "-alias", "sonar"],
    options: { silent: true },
  });
}

function deleteSonarAliasFromTruststore(keytoolParams) {
  return executeKeytoolCommand({
    ...keytoolParams,
    extraArgs: ["-delete", "-alias", "sonar"],
  });
}

function validateScannerVersion(version) {
  if (!version) {
    return;
  }

  const versionRegex = /^\d+\.\d+\.\d+\.\d+$/;
  if (!versionRegex.test(version)) {
    throw new Error(
      "Invalid scannerVersion format. Expected format: x.y.z.w (e.g., 7.1.0.4889)"
    );
  }
}

function checkSonarToken(core, sonarToken) {
  if (!sonarToken) {
    core.warning(
      "Running this GitHub Action without SONAR_TOKEN is not recommended"
    );
  }
}

function checkMavenProject(core, projectBaseDir) {
  const pomPath = join(projectBaseDir.replace(/\/$/, ""), "pom.xml");
  if (fs__default.existsSync(pomPath)) {
    core.warning(
      "Maven project detected. Sonar recommends running the 'org.sonarsource.scanner.maven:sonar-maven-plugin:sonar' goal during the build process instead of using this GitHub Action to get more accurate results."
    );
  }
}

function checkGradleProject(core, projectBaseDir) {
  const baseDir = projectBaseDir.replace(/\/$/, "");
  const gradlePath = join(baseDir, "build.gradle");
  const gradleKtsPath = join(baseDir, "build.gradle.kts");

  if (fs__default.existsSync(gradlePath) || fs__default.existsSync(gradleKtsPath)) {
    core.warning(
      "Gradle project detected. Sonar recommends using the SonarQube plugin for Gradle during the build process instead of using this GitHub Action to get more accurate results."
    );
  }
}

/**
 * Inputs are defined in action.yml
 */
function getInputs() {
  const args = coreExports.getInput("args");
  const projectBaseDir = coreExports.getInput("projectBaseDir");
  const scannerBinariesUrl = coreExports.getInput("scannerBinariesUrl");
  const scannerVersion = coreExports.getInput("scannerVersion");

  return { args, projectBaseDir, scannerBinariesUrl, scannerVersion };
}

/**
 * These RUNNER env variables come from GitHub by default.
 * See https://docs.github.com/en/actions/reference/workflows-and-actions/variables#default-environment-variables
 *
 * The others are optional env variables provided by the user of the action
 */
function getEnvVariables() {
  return {
    runnerDebug: process.env.RUNNER_DEBUG,
    runnerOs: process.env.RUNNER_OS,
    runnerTemp: process.env.RUNNER_TEMP,
    sonarRootCert: process.env.SONAR_ROOT_CERT,
    sonarcloudUrl: process.env.SONARCLOUD_URL,
    sonarToken: process.env.SONAR_TOKEN,
  };
}

function runSanityChecks(inputs) {
  try {
    const { projectBaseDir, scannerVersion, sonarToken } = inputs;

    validateScannerVersion(scannerVersion);
    checkSonarToken(core, sonarToken);
    checkMavenProject(core, projectBaseDir);
    checkGradleProject(core, projectBaseDir);
  } catch (error) {
    coreExports.setFailed(`Sanity checks failed: ${error.message}`);
    process.exit(1);
  }
}

async function run() {
  try {
    const { args, projectBaseDir, scannerVersion, scannerBinariesUrl } =
      getInputs();
    const runnerEnv = getEnvVariables();
    const { sonarToken } = runnerEnv;

    runSanityChecks({ projectBaseDir, scannerVersion, sonarToken });

    const scannerDir = await installSonarScanner({
      scannerVersion,
      scannerBinariesUrl,
    });

    await runSonarScanner(args, projectBaseDir, scannerDir, runnerEnv);
  } catch (error) {
    coreExports.setFailed(`Action failed: ${error.message}`);
    process.exit(1);
  }
}

run();
//# sourceMappingURL=index.js.map
