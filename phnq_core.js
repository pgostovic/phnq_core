(function()
{
	var phnq_core =
	{
		isServer: function()
		{
			return typeof(module) == "object";
		},

		isClient: function()
		{
			return typeof(window) == "object";
		},

		assertServer: function()
		{
			if(!this.isServer())
				throw "Assertion Failed: not running on server as asserted";
		},

		assertClient: function()
		{
			if(!this.isClient())
				throw "Assertion Failed: not running on client as asserted";
		},

		clazz: function(ext)
		{
			var cls = function()
			{
				if(this.init)
					this.init.apply(this, arguments);
			};
			this.extend(cls.prototype, ext);
			return cls;
		},

		/**
		*	Copies the keys and values from one object onto another
		*	@param {object} dest object onto which keys and values will be copied
		*	@param {object} src object from which keys and values will be copied
		*	@return {object} the destination object
		*/
		extend: function(dest, src)
		{
			for(var k in src)
			{
				dest[k] = src[k];
			}
			return dest;
		},

		clone: function(obj)
		{
			if(obj instanceof Array)
				return obj.slice();
			else if(typeof(obj) == "object")
				return this.extend({}, obj);
			else
				return obj;
		},

		jsPath: function(obj, path, valToSet)
		{
			try
			{
				var val = obj;
				var comps = path.split(/[/\.]/);
				for(var i=0; i<comps.length; i++)
				{
					if(valToSet && i == comps.length-1)
						val = val[comps[i]] = valToSet;
					else
						val = val[comps[i]];
				}
				return val === undefined ? null : val;
			}
			catch(ex)
			{
				return null;
			}
		},

		escapeJS: function(s)
		{
			return s.replace(/"/g, "\\\"").replace(/\n/g, "\\n");
		},

		trimLines: function(str, excludeEmptyLines)
		{
			var buf = [];
			var lines = str.split("\n");
			var linesLen = lines.length;
			for(var i=0; i<linesLen; i++)
			{
				var line = lines[i].trim();
				if(line || !excludeEmptyLines)
					buf.push(line);
			}
			return buf.join("\n");
		},

		getRelPath: function(src)
		{
			this.assertServer();
			return require("path").relative(src, __filename);
		},

		getFileName: function()
		{
			this.assertServer();
			return __filename;
		},


		/*
			Call like phnq_core.parallel(fn1, fn2, ... , fnN, callback). Example...

				phnq_core.parallel(function(done)
				{
					done();
				}, function(done)
				{
					done();
				}, function()
				{
					// Callback
				});

			Or, call like phnq_core.parallel(fns, callback). Example...

				var fns = [];

				fns.push(function(done)
				{
					done();
				});

				fns.push(function(done)
				{
					done();
				});

				phnq_core.parallel(fns, function()
				{
					// Callback
				});
		*/
		parallel: function()
		{
			var fns, callback;
			if(arguments.length == 2 && arguments[0] instanceof Array && typeof(arguments[1]) == "function")
			{
				fns = arguments[0];
				callback = arguments[1];
			}
			else
			{
				fns = [];
				var numArgs = arguments.length;
				for(var i=0; i<numArgs; i++)
				{
					var arg = arguments[i];
					if(typeof(arg) == "function")
					{
						if(i == numArgs-1)
							callback = arg;
						else
							fns.push(arg);
					}
					else
					{
						throw "Bad arguments: must be phnq_core.parallel(fn1, fn2, ... , fnN, callback) or phnq_core.parallel(fns, callback)";
					}
				}
			}

			var len = fns.length;
			var remaining = len;
			var stats =
			{
				durations:[],
			};
			var startTime = new Date().getTime();
			for(var i=0; i<len; i++)
			{
				var fn = fns[i];
				fn(function()
				{
					stats.durations.push(new Date().getTime() - startTime);
					if(--remaining == 0)
					{
						stats.totalTime = new Date().getTime() - startTime;
						stats.averageTime = eval(stats.durations.join("+")) / stats.durations.length;
						callback(stats);
					}
				});
			}
		}
	};

	var serBase = 32;
	var serWidth = 24;
	phnq_core.BitSet = phnq_core.clazz(
	{
		init: function(arr)
		{
			this.comps = [];
			if(arr)
			{
				for(var i=0; i<arr.length; i++)
				{
					this.comps.push(parseInt(arr[i], serBase));
				}
			}
		},

		set: function(bit, val)
		{
			val = (val === undefined) ? 1 : val;
			var idx = Math.floor(bit/serWidth);
			while(this.comps.length < (idx+1))
				this.comps.push(0);

			this.comps[idx] = this.comps[idx] | val<<(bit%serWidth);
		},

		unset: function(bit)
		{
			this.set(idx, 0);
		},

		isSet: function(bit)
		{
			var idx = Math.floor(bit/serWidth);
			return !!(this.comps[idx] & 1<<(bit%serWidth));
		},

		trim: function()
		{
			while(this.comps[this.comps.length-1] == 0)
			{
				this.comps.pop();
			}
		},

		toArray: function()
		{
			var arr = [];
			for(var i=0; i<this.comps.length; i++)
			{
				arr.push(this.comps[i].toString(serBase));
			}
			return arr;
		},

		toString: function()
		{
			this.trim();

			var idxs = [];
			var len = this.comps.length * serWidth;
			for(var i=0; i<len; i++)
			{
				if(this.isSet(i))
					idxs.push(i);
			}
			return "[ " + idxs.join(", ") + " ]";
		}
	});

	if(phnq_core.isServer())
	{
		module.exports = phnq_core;
	}
	else if(phnq_core.isClient())
	{
		var baseUriRe = /^(https?:\/\/[^\/]*).*$/;
		var baseUriMatch = baseUriRe.exec($("script").last().get(0).src);
		if(baseUriMatch)
			phnq_core.baseURI = baseUriMatch[1];

		window.phnq_core = phnq_core;
		window.require = function(name)
		{
			var lib = window[name];
			if(!lib)
				throw "Lib not found: "+name;

			return lib;
		};
	}
})();
