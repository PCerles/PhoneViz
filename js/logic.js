var parseTime = d3.timeParse("%m/%d/%Y")

var svg = d3.select("svg"),
    margin = {top: 20, right: 80, bottom: 30, left: 50},
    width = svg.attr("width") - margin.left - margin.right,
    height = svg.attr("height") - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var text = d3.select("#personIdentity");

var x = d3.scaleTime().range([0, width]),
    y = d3.scaleLinear().range([height, 0]),
    z = d3.scaleOrdinal(d3.schemeCategory20);


var line = d3.line()
    .curve(d3.curveBasis)
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.timesTexted); });

function mOver(d) {
	d3.select(this)
	   .style('stroke-width', 4);
	text.text(d.id);
}

d3.csv('data/perfect.csv', function(data) {
	var nameMap = {};
	data.map(function(d) {
		date = new Date(d.date);
		handle = d.handle;
		timesTexted = +d.timesTexted;
		if (handle in nameMap) {
			nameMap[handle].values.push({'date': date, 'timesTexted': timesTexted});
		} else {
			nameMap[handle] = {}
			nameMap[handle].values = [{'date': date, 'timesTexted': timesTexted}];
			nameMap[handle].id = handle;
		}
	});

	var names = []
	for (i in nameMap) {
		//if (nameMap[i].values.length > 50) {
			console.log(i);
			names.push(nameMap[i]);
		//}
	}
	console.log(names)

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
    	  .on("mouseout", function(d) {d3.select(this)
	   									 .style('stroke-width', 1.5);
	   									 text.text("")});
});








