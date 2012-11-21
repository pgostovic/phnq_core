var assert = require("assert");
var phnq_core = require("../phnq_core");

describe("phnq_core", function()
{
	describe("extend()", function()
	{
		it("should extend the destination object with the source object's keys and values", function()
		{
			var o1 = {foo:"bar"};
			var o2 = {num:42};
			phnq_core.extend(o1, o2);
			assert.deepEqual(o1, {foo:"bar", num:42});
		});
	});

	describe("getJsPath()", function()
	{
		var obj =
		{
			user:
			{
				address:
				{
					street: "123 Main St.",
					city: "Toronto",
					province: "Ontario"
				}
			}
		};

		it("should return the correct value for an extisting path -- dots", function()
		{
			assert.equal(phnq_core.jsPath(obj, "user.address.province"), "Ontario");
		});

		it("should return the correct value for an extisting path -- slashes", function()
		{
			assert.equal(phnq_core.jsPath(obj, "user/address/city"), "Toronto");
		});

		it("should return null for a non-existent path -- dots", function()
		{
			assert.equal(phnq_core.jsPath(obj, "user.address.state"), null);
		});

		it("should return null for a non-existent path -- slashes", function()
		{
			assert.equal(phnq_core.jsPath(obj, "user/address/state"), null);
		});

		it("should correctly set a value for an extisting path -- dots", function()
		{
			var objClone = phnq_core.clone(obj);
			phnq_core.jsPath(objClone, "user.address.province", "P.E.I.");
			assert.equal(objClone.user.address.province, "P.E.I.");
		});

		it("should correctly set a value for an extisting path -- slashes", function()
		{
			var objClone = phnq_core.clone(obj);
			phnq_core.jsPath(objClone, "user/address/province", "P.E.I.");
			assert.equal(objClone.user.address.province, "P.E.I.");
		});
	});

	describe("escapeJS()", function()
	{
		it("should escape quotes", function()
		{
			assert.equal(phnq_core.escapeJS("he said \"hello\"."), "he said \\\"hello\\\".");
		});

		it("should escape newlines", function()
		{
			assert.equal(phnq_core.escapeJS("line 1\nline 2\nline 3"), "line 1\\nline 2\\nline 3");
		});
	});

	describe("trimLines()", function()
	{
		it("should trim all the lines", function()
		{
			var untrimmed = "  \t   \t  ONE   \n      TWO    \n    THREE     ";
			var trimmed = "ONE\nTWO\nTHREE";
			assert.equal(phnq_core.trimLines(untrimmed), trimmed);
		});
	});

	describe("clazz", function()
	{
		var Animal, Dog, Human, Snake;

		beforeEach(function()
		{
			Animal = phnq_core.clazz(
			{
				init: function(type)
				{
					this.type = type;
				},

				isAlive: function()
				{
					return true;
				},

				getNumLegs: function()
				{
					return 0;
				},

				hasLegs: function()
				{
					return this.getNumLegs() > 0;
				},

				getTotalNums: function()
				{
					return 5;
				}
			});

			Dog = Animal.extend(
			{
				init: function()
				{
					this._init("Dog");
				},

				getNumLegs: function()
				{
					return 4;
				},

				getTotalNums: function()
				{
					return 1 + this._getTotalNums();
				}
			});

			Human = Animal.extend(
			{
				init: function()
				{
					this._init("Human");
				},

				getNumLegs: function()
				{
					return 2;
				},

				getTotalNums: function()
				{
					return 2 + this._getTotalNums();
				}
			});

			Snake = Animal.extend(
			{
				init: function()
				{
					this._init("Snake");
				},

				getTotalNums: function()
				{
					return 3 + this._getTotalNums();
				}
			});
		});


		it("should inherit from super", function()
		{
			var d = new Dog();
			var h = new Human();
			var s = new Snake();

			assert.equal(true, d.isAlive());
			assert.equal(true, h.isAlive());
			assert.equal(true, s.isAlive());
		});

		it("should be able to call super's init from concrete init", function()
		{
			var d = new Dog();
			var h = new Human();
			var s = new Snake();

			assert.equal("Dog", d.type);
			assert.equal("Human", h.type);
			assert.equal("Snake", s.type);
		});

		it("should call an overridden concrete method from super class", function()
		{
			var d = new Dog();
			var h = new Human();
			var s = new Snake();

			assert.equal(4, d.getNumLegs());
			assert.equal(true, d.hasLegs());

			assert.equal(2, h.getNumLegs());
			assert.equal(true, h.hasLegs());

			assert.equal(0, s.getNumLegs());
			assert.equal(false, s.hasLegs());
		});

		it("should be able to call super method from sub method", function()
		{
			var d = new Dog();
			var h = new Human();
			var s = new Snake();

			assert.equal(6, d.getTotalNums());
			assert.equal(7, h.getTotalNums());
			assert.equal(8, s.getTotalNums());
		})
	});

	describe("phnq_core.BitSet", function()
	{
		it("should get and set bits", function()
		{
			var bitset = new phnq_core.BitSet();

			var rnd = [];
			for(var i=0; i<1000; i++)
			{
				rnd[i] = Math.random() > 0.5;
				if(rnd[i])
					bitset.set(i);
			}

			for(var i=0; i<1000; i++)
			{
				assert.equal(rnd[i], bitset.isSet(i));
			}
		});

		it("should serialize to an array and deserialize from an array", function()
		{
			var bitset = new phnq_core.BitSet();

			var rnd = [];
			for(var i=0; i<1000; i++)
			{
				rnd[i] = Math.random() > 0.5;
				if(rnd[i])
					bitset.set(i);
			}

			var arr = bitset.toArray();

			var bitset2 = new phnq_core.BitSet(arr);
			for(var i=0; i<1000; i++)
			{
				assert.equal(rnd[i], bitset2.isSet(i));
			}
		});
	});

	describe("phnq_core.parallel", function()
	{
		it("should perform three async functions in parallel", function(doneTest)
		{
			var tos =
			[
				Math.round(Math.random() * 1000),
				Math.round(Math.random() * 1000),
				Math.round(Math.random() * 1000)
			];

			var finishOrder = [];
			var finishTimes = [];

			var t1 = new Date().getTime();

			phnq_core.parallel(
				function(done)
				{
					setTimeout(function()
					{
						finishOrder.push(0);
						finishTimes.push(new Date().getTime() - t1);
						done();
					}, tos[0]);
				},
				function(done)
				{
					setTimeout(function()
					{
						finishOrder.push(1);
						finishTimes.push(new Date().getTime() - t1);
						done();
					}, tos[1]);
				},
				function(done)
				{
					setTimeout(function()
					{
						finishOrder.push(2);
						finishTimes.push(new Date().getTime() - t1);
						done();
					}, tos[2]);
				},
				function()
				{
					var totalTime = new Date().getTime() - t1;
					var slowestFnTime = finishTimes[2];

					var closeEnough = Math.abs(totalTime - slowestFnTime) < 3;

					assert.ok(closeEnough, "total time is within 3ms of longest running function");

					doneTest();
				});
		});

	});
});