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

		extend: function(dest, obj)
		{
			for(var k in obj)
			{
				dest[k] = obj[k];
			}
			return dest;
		},

		escapeJS: function(s)
		{
			return s.replace(/"/g, "\\\"").replace(/\n/g, "\\n");
		},

		trimLines: function(str)
		{
			var buf = [];
			var lines = str.split("\n");
			var linesLen = lines.length;
			for(var i=0; i<linesLen; i++)
			{
				buf.push(lines[i].trim());
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

		parallel: function(fns, callback)
		{
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
