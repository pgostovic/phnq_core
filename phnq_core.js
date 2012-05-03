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
			
			for(var k in ext)
			{
				cls.prototype[k] = ext[k];
			}
			
			return cls;
		},

		escapeJS: function(s)
		{
			return s.replace(/"/g, "\\\"");
		},
		
		getRelPath: function(src)
		{
			this.assertServer();
			return require("path").relative(src, __filename);
		}
	};

	if(phnq_core.isServer())
	{
		module.exports = phnq_core;
	}
	else if(phnq_core.isClient())
	{
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
