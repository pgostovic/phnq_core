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
		}
	};

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
