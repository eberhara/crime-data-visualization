var LINE_COLOR_0 = '#09c';
var LINE_COLOR_1 = '#c69';

function drawParallelCoordinates2(id) {
  // canvas W & h & maring
  var margin = {top: 40, right: 60, bottom: 60, left: 80},
      width = 750,
      height = 400;

  // prepare canvas
  var svg = d3.select(id)
      .append('svg')
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
      .style({ 'border':'1px solid #000' })
      .append("g")
          // .attr('width', width)
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // scale X & Y
  var x = d3.scale.ordinal().rangePoints([0, width], 1),
      y = {};

  var line = d3.svg.line(),
      axis = d3.svg.axis().orient("left");

  var background, foreground;
  var dragging = {};

  var color = d3.scale.category10();
  var dimensions = ['Populacao', 'Educacao', 'PIB', 'Crime1000hab', 'Furto1000hab', 'PosseDrogas1000hab', 'Trafico1000hab'];

  // Returns the path for a given data point.
  var path = function(d) {
        return line(dimensions.map(function(p) { return [position(p), y[p](d[p])]; }));
      },
      position = function(d) {
        var v = dragging[d];
        return v == null ? x(d) : v;
      };

  // Survey of Labour and Income Dynamics
  // "","wages","education","age","sex","language"
  // "1",10.56,15,40,"Male","English"
  d3.csv("macro-regioes.csv", function(error, data) {

    //data = data.slice(data.length - 200); // last 50 record
//data = data.slice(data.length);
    data.forEach(function(d) {
      d.Populacao = 'NA' === d.Populacao ? 0 : +d.Populacao;
      d.Educacao = 'NA' === d.Educacao ? 0 : +d.Educacao;
      d.PIB = 'NA' === d.PIB ? 0 : +d.PIB;
d.Crime1000hab = 'NA' === d.Crime1000hab ? 0 : +d.Crime1000hab;
d.Furto1000hab = 'NA' === d.Furto1000hab ? 0 : +d.Furto1000hab;
d.PosseDrogas1000hab = 'NA' === d.PosseDrogas1000hab ? 0 : +d.PosseDrogas1000hab;
d.Trafico1000hab = 'NA' === d.Trafico1000hab ? 0 : +d.Trafico1000hab;
    });

    // create a scale for each dimension.
    dimensions.forEach(function(dim) {
      y[dim] = d3.scale.linear()
        .domain(d3.extent(data, function(p) { return +p[dim]; }))
        .range([height, 0])
    });

    x.domain(dimensions);

    // Add grey background lines for context.
    background = svg.append("g")
      .attr("class", "background")
      .selectAll("path")
      .data(data)
      .enter().append("path")
      .attr("d", path);

    // Add blue foreground lines for focus.
    foreground = svg.append("g")
      .attr("class", "foreground")
      .selectAll("path")
      .data(data)
      .enter().append("path")
      .attr({'style': function(d) {
        return "stroke: " + color(d.Macroregiao)
      }})
      .attr("d", path);

    // Add a group element for each dimension.
    var g = svg.selectAll(".dimension")
      .data(dimensions)
      .enter().append("g")
      .attr("class", "dimension")
      .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
      .call(d3.behavior.drag()
                      .origin(function(d) { return {x: x(d)}; })
                      .on("dragstart", function(d) {
                          dragging[d] = x(d);
                          background.attr("visibility", "hidden");
                      })
                      .on("drag", function(d) {
                          dragging[d] = Math.min(width, Math.max(0, d3.event.x));
                          foreground.attr("d", path);
                          dimensions.sort(function(a, b) { return position(a) - position(b); });
                          x.domain(dimensions);
                          g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
                      })
                      .on("dragend", function(d) {
                          delete dragging[d];
                          transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
                          transition(foreground).attr("d", path);
                          background.attr("d", path)
                                  .transition()
                                  .delay(500)
                                  .duration(0)
                                  .attr("visibility", null);
                      }));

    // Add an axis and title.
    g.append("g")
      .attr("class", "axis")
      .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
      .append("text")
      .style("text-anchor", "middle")
      .attr("y", -9)
      .text(function(d) { return d; });

    g.append("g")
      .attr("class", "brush")
      .each(function(d) {
          d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brushstart", brushstart).on("brush", brush));
      })
      .selectAll("rect")
      .attr("x", -8)
      .attr("width", 16);
    // prepare legend
    var legend = svg.append('g')
        .attr("width", 60)
        .attr("height", 10)
        .attr('stroke', '#555')
        .attr("transform", "translate(60," + (height + 30) + ")");

    var newLegend = function(legendContainer, color, text, offsetX) {
      var g = legendContainer.append('g');
      if (offsetX) {
          g.attr("transform", "translate(" + offsetX + ", 0)");
      }
      g.append('text')
        .style({'font-size': '8px', 'stroke': color, 'fill': color})
        .text('██');
      g.append('text')
        .attr("transform", "translate(24, 0)")
        .attr('fill', '#000')
        .text(text);
    };

   // newLegend(legend, color('Male'), 'Male');
    newLegend(legend, color('CentroOeste'), 'CentroOeste');
    newLegend(legend, color('Metropolitana'), 'Metropolitana', 100);
    newLegend(legend, color('Missioneira'), 'Missioneira', 200);
    newLegend(legend, color('Norte'), 'Norte', 300);
    newLegend(legend, color('Serra'), 'Serra', 370);
    newLegend(legend, color('Sul'), 'Sul', 430);
    newLegend(legend, color('Vales'), 'Vales', 500);
  });
  function transition(g) {
      return g.transition().duration(500);
  }

  function brushstart() {
      d3.event.sourceEvent.stopPropagation();
  }

  // Handles a brush event, toggling the display of foreground lines.
  function brush() {
      var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); }),
              extents = actives.map(function(p) { return y[p].brush.extent(); });
      foreground.style("display", function(d) {
          return actives.every(function(p, i) {
              return extents[i][0] <= d[p] && d[p] <= extents[i][1];
          }) ? null : "none";
      });
  }
}

drawParallelCoordinates2('#canvas')
