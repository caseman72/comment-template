"use strict";

require("string-utils");

var fs = require("fs");
var hash_get = require("hash-get-cwm");
var json_human = require("hjson");

// get site def
var site_def = json_human.parse(fs.readFileSync("{0}/site_def.hjson".format(__dirname), "utf8"));

// ng.isDefined
var ng = {
	isDefined: function(val) {
		return typeof val !== "undefined";
	}
};

// parse site def and add template if file is specified
//
var walk_site_def = function(obj, full_key) {
	full_key = full_key || "";

	for (var key in obj) {
		if (obj[key] !== null && typeof obj[key] === "object") {
			walk_site_def(obj[key], full_key ? "{0}.{1}".format(full_key, key) : key);
		}
		else {
			if (key === "file") {
				try {
					obj["content"] = fs.readFileSync("{0}/views/{1}".format(__dirname, obj[key]), "utf8");
				}
				catch(e) {
					obj["content"] = "<!-- Error: Template Not Found '{0}/views/{1}' -->".format(__dirname, obj[key]);
				}
			}
		}
	}
};
walk_site_def(site_def);


var template_to_array = function(html) {
	var re_keys = /<!--[ ]([a-z.-]+)[ ]-->/g;
	var re_comment = /(<!--[ ][a-z.-]+[ ]-->)/g;

	return html.replace(re_keys, function(str, key) {
		return "<!-- {0} -->".format(key);
	}).split(re_comment);
};


var compile = function(lines, data) {
	var re_key = /^<!--[ ]([a-z.-]+)[ ]-->/;

	var html = [];
	for (var i=0,n=lines.length; i<n; i++) {
		var line = lines[i];
		if (re_key.exec(line)) {
			var key = RegExp.$1;
			var val = hash_get(data, key, "");

			val.length && html.push(val);
			key === "content" && html.push("\n<!-- content -->");
		}
		else {
			html.push(line);
		}
	}

	return html;
};


var render = function(page) {
	page = "{0}".format(page || "/")
		.replace(/^\//g, "")
		.replace(/\/$/g, "")
		.replace(/\//g, "-") || "home";

	var view = hash_get(site_def, "views.{0}".format(page), {});
	var layout_name = hash_get(view, "layout", "");
	var layout = hash_get(site_def, "layouts.{0}.content".format(layout_name), "")
	var lines = template_to_array(layout);
	var html = compile(lines, view);

	return html.join("").replace(/\n\n+/g, "\n");
};


// view tests
//
//
console.log(render("/"));
console.log("\n\n");
console.log(render("/template/dashboard/"));
console.log("\n\n");
console.log(render("/template/login/"));
console.log("\n\n");
console.log(render("/template/not-found/"));
//
//
// done
