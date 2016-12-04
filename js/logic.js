$.getJSON("data/afinn.json", doSentimentAnalysis);

var parseTime = d3.timeParse("%m/%d/%Y")

var svg1 = d3.select("#personChart"),
    margin = {top: 20, right: 80, bottom: 30, left: 50},
    width = svg1.attr("width") - margin.left - margin.right,
    height = svg1.attr("height") - margin.top - margin.bottom,
    g = svg1.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var svg2 = d3.select("#sentimentChart"),
    margin = {top: 20, right: 80, bottom: 30, left: 50},
    width = svg2.attr("width") - margin.left - margin.right,
    height = svg2.attr("height") - margin.top - margin.bottom,
    g2 = svg2.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var text = d3.select("#personIdentity");

var x = d3.scaleTime().range([0, width]),
    y = d3.scaleLinear().range([height, 0]),
    z = d3.scaleOrdinal(d3.schemeCategory20);


var line = d3.line()
    .curve(d3.curveBasis)
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.value); });

var line2 = d3.line()
    .curve(d3.curveLinear)
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.value); });

function mOver(d) {
	d3.select(this)
	   .style('stroke-width', 4);
	text.text(d.id);
	g.selectAll(".person").select("path")
	  .style("stroke-opacity", 0.2);
	d3.select(this)
	  .style("stroke-opacity", 1);
}

function mOut(d) {
	d3.select(this)
	 .style('stroke-width', 1.5);
   text.text("");
   g.selectAll(".person").select("path")
	 .style("stroke-opacity", 1);
}

d3.csv('data/perfect.csv', function(data) {
	var nameMap = {};
	data.map(function(d) {
		date = new Date(d.date);
		handle = d.handle;
		timesTexted = +d.timesTexted;
		if (handle in nameMap) {
			nameMap[handle].values.push({'date': date, 'value': timesTexted});
		} else {
			nameMap[handle] = {}
			nameMap[handle].values = [{'date': date, 'value': timesTexted}];
			nameMap[handle].id = handle;
		}
	});

	var names = []
	for (i in nameMap) {
		if (nameMap[i].values.length > 5) {
			names.push(nameMap[i]);
		}
	}

	x.domain(d3.extent(data, function(d) { return new Date(d.date); }));

	y.domain([0, 150]);
	z.domain(names.map(function(c) {return c.id}));

	g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

	g.append("g")
	  .attr("class", "axis axis--y")
	  .call(d3.axisLeft(y))
	 .append("text")
	 .attr("transform", "rotate(-90)")
	 .attr("y", 6)
	 .attr("dy", "0.71em")
	 .attr("fill", "#000")
	 .text("Times texted");

	var person = g.selectAll(".person")
		.data(names)
		.enter().append("g")
		  .attr("class", "person"); 
    
    person.append("path")
    	  .attr("class", "line")
    	  .attr("d", function(d) { return line(d.values);} )
    	  .style("stroke", function(d) { return z(d.id) })
    	  .on("mouseover", mOver)
    	  .on("mouseout", mOut);
});

function tokenize(input) {
    return input
        	.toLowerCase()
        	.replace(/[^a-z0-9á-úñäâàéèëêïîöôùüûœç\- ]+/g, '')
        	.replace('/ {2,}/',' ')
        	.split(' ');
}

function scorer(text) {
	var tokens = tokenize(text);
	var len = tokens.length;
	var score = 0;
	var a = 0;
	for (var i = 0; i < len; i++) {
		var obj = tokens[i];
		if (sDict.hasOwnProperty(obj)) {
			score += sDict[obj];
			a += 1;
		}
	}
	if (a > 0) {
		return score / a;
	} else {
		return null;
	}
}

//ugh javascript
function add(a, b) {
    return a + b;
}

var sDict;
var bisectDate = d3.bisector(function(d) { return d.date; }).left;

function doSentimentAnalysis(sDictionary) {
	sDict = sDictionary;
	console.log("got here")
	var dates = [];
	d3.csv('data/textAnalysis.csv', function(data) {
		var dateMap = {};
		var i = 0;
		data.map(function(d) {
			i += 1;
			if (d.is_from_me == 0) {
				if (dateMap.hasOwnProperty(d.date)) {
					var s = scorer(d.text);
					if (s != null) {
						dateMap[d.date].scores.push(scorer(d.text));
						dateMap[d.date].texts.push(d.text);
					}
				} else {
					dateMap[d.date] = {};
					dateMap[d.date].date = new Date(d.date);
					dateMap[d.date].scores = [];
					dateMap[d.date].texts = [];
				}
			}
		});
		for (i in dateMap) {
			if (dateMap[i].scores.length > 0) {
				dateMap[i].value = dateMap[i].scores.reduce(add, 0) / dateMap[i].scores.length; // normalize
			} else {
				dateMap[i].value = 0;
			}
			dates.push(dateMap[i]);
		}
		for (d in dates) {
			if (d.value > 0) {
				d.texts.sort(function (a, b) {
					if (scorer(a.text) > scorer(b.text)) {
						return 1;
					}
					if (scorer(a.text) < scorer(b.text)) {
						return -1;
					}
					return 0;
				})
			}
			if (d.value < 0) {
				d.texts.sort(function (a, b) {
					if (scorer(a.text) > scorer(b.text)) {
						return -1;
					}
					if (scorer(a.text) < scorer(b.text)) {
						return 1;
					}
					return 0;
				})
			}
		}
		dates.sort(function (a, b) {
			if (a.date > b.date) {
				return 1;
			}
			if (a.date < b.date) {
				return -1;
			}
			if (a.date == b.date) {
				return 0;
			}
		});
		x.domain(d3.extent(dates, function(d) { return d.date}));
		y.domain([-5, 5]);

		g2.append("g")
	      .attr("class", "axis axis--x")
	      .attr("transform", "translate(0," + height + ")")
	      .call(d3.axisBottom(x));

		g2.append("g")
		  .attr("class", "axis axis--y")
		  .call(d3.axisLeft(y))
		 .append("text")
		 .attr("transform", "rotate(-90)")
		 .attr("y", 6)
		 .attr("dy", "0.71em")
		 .attr("fill", "#000")
		 .text("Sentiment");
	    
	    g2.append("path")
	    	  .datum(dates)
	    	  .attr("class", "line")
	    	  .attr("d", function(d) {return line2(d) });

	    var focus = g2.append("g")
			  .attr("class", "focus")
			  .style("display", "none");

		focus.append("circle")
		      .attr("r", 4.5);

		focus.append("text")
		      .attr("x", 9)
		      .attr("dy", ".35em");

		g2.append("rect")
	      .attr("class", "overlay")
	      .attr("width", width)
	      .attr("height", height)
	      .on("mouseover", function() { focus.style("display", null); })
	      .on("mouseout", function() { focus.style("display", "none"); })
	      .on("mousemove", mousemove);

	   	function mousemove() {
	    	var x0 = x.invert(d3.mouse(this)[0]),
		        i = bisectDate(dates, x0, 1),
		        d0 = dates[i - 1],
		        d1 = dates[i],
		        d = x0 - d0.date > d1.date - x0 ? d1 : d0;
		    focus.attr("transform", "translate(" + x(d.date) + "," + y(d.value) + ")");
		    focus.select("text").text(d.texts[0]);
	  	}
	});

}








