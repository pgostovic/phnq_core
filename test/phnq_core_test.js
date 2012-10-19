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
			assert.deepEqual(o1, {foo:"bar", num:43});
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
});