async function mkSliderModel(allData) {
  let model = {
    height: 100,
    width: 800
  };

  model.boundaryBar = {
    height: 2 * model.height / 3,
    width: 5
  };

  model.optionBar = {
    height: model.height / 3,
    width: (model.width - model.boundaryBar.width) / (allData.length - 1)
  };

  model.filterBar = {
    height: 50,
    width: 6
  };

  model.a = 0;
  model.b = 30;

  model.color = d3.scaleLinear()
    .domain([Math.min(...allData), 0, Math.max(...allData)])
    .range(['red', '#555544', 'green']);

  return model;

}

async function slider(container, data, model, update) {

  var slider = model;
  var boundaryBar = model.boundaryBar;
  var slideBar = model.optionBar;
  var optionBar = model.optionBar;

  var x = d3.scaleLinear()
    .domain([0, data.length])
    .range([boundaryBar.width, model.width - boundaryBar.width]);

  // Boundary Bars
  var boundaryBars = container.selectAll('#boundaryBar').data([0, model.width - boundaryBar.width]);

  boundaryBars.join('rect')
    .attr('id', 'boundaryBar')
    .attr('height', boundaryBar.height)
    .attr('width', boundaryBar.width)
    .attr('x', (d) => d)
    .attr('y', model.height / 2 - boundaryBar.height / 2)
    .attr('fill', 'black');

  // Option bars

  var optionBars = container.selectAll('#optionBar').data(data);

  optionBars.join('rect')
    .attr('id', 'optionBar')
    .attr('height', optionBar.height)
    .attr('width', optionBar.width)
    .attr('x', (d, i) => x(i))
    .attr('y', model.height / 2 - optionBar.height / 2)
    .attr('fill', (d, i) => model.color(d.value))
    .attr('stroke-width', 1)
    .attr('stroke', 'black');

  var choiceEnvelope = container.selectAll('#choice').data([model]);

  choiceEnvelope.join('rect')
    .attr('id', 'choice')
    .attr('x', (d) => x(d.a))
    .attr('y', 25)
    .attr('height', 50)
    .attr('width', (d) => x(d.b) - x(d.a))
    .attr('fill', 'grey')
    .attr('opacity', 0.8)
    .attr('stroke', 'black')
    .attr('stroke-width', 1)
    .call(d3.drag().on('drag', (e) => {
      new_a = x.invert(x(model.a) + d3.event.dx);
      new_b = x.invert(x(model.b) + d3.event.dx);
      if (new_a > 0 && new_b < data.length) {
        model.a = new_a;
        model.b = new_b;
      } else if (new_b >= data.length) {
        new_dx = data.length - model.b;
        model.a = model.a + new_dx;
        model.b = model.b + new_dx;
      } else if (new_a < 0) {
        new_dx = model.a;
        model.a = 0;
        model.b = model.b - new_dx;
      }
      update(data.slice(Math.round(model.a), Math.round(model.b)));
    }));

  var leftChoice = container.selectAll('#leftChoice').data([model.a]);
  var rightChoice = container.selectAll('#rightChoice').data([model.b]);

  leftChoice.join('path')
    .attr('id', 'leftChoice')
    .attr('d', 'M0 0 L6 0 L3 3 L3 47 L6 50 L0 50 Z')
    .attr('fill', '#333333')
    .attr('stroke', 'black')
    .attr('transform', (d) => 'translate(' + x(d) + ',25)')
    .call(d3.drag().on('drag', (e) => {
      new_x = x.invert(d3.event.x);
      if (new_x <= 0) {
        model.a = 0;
      }
      else if (new_x > model.b - 5) {
        model.a = model.b - 5;
      }
      else {
        model.a = new_x;
      }
      update(data.slice(Math.round(model.a), Math.round(model.b)));
    }));

  rightChoice.join('path')
    .attr('id', 'rightChoice')
    .attr('d', 'M0 0 L6 0 L6 50 L0 50 L3 47 L3 3 Z')
    .attr('fill', '#333333')
    .attr('stroke', 'black')
    .attr('transform', (d) => 'translate(' + x(d - 2) + ',25)')
    .call(d3.drag().on('drag', (e) => {
      new_x = x.invert(d3.event.x);
      if (new_x > data.length) {
        model.b = data.length;
      }
      else if (new_x < model.a + 5) {
        model.b = model.a + 5;
      }
      else {
        model.b = new_x;
      }
      update(data.slice(Math.round(model.a), Math.round(model.b)));
    }));
}

async function graph(container, data, model) {

  var x = d3.scaleLinear()
    .domain([0, data.length])
    .range([25, model.width]);

  var bars = container.selectAll("#bar").data(data);

  var y = model.y;
  var color = model.color;

  container.selectAll('#axes').data([1])
    .join('g')
    .attr('id', 'axes')
    .attr('transform', 'translate(23,0)')
    .call(d3.axisLeft(y));

  bars.join('rect')
    .attr('id', 'bar')
    .attr('x', (d, i) => x(i))
    .attr('width', 2 * (x(1) - x(0)) / 3)
    .attr('y', (d) => Math.min(y(0), y(d.value)))
    .attr('height', (d) => Math.abs(y(0) - y(d.value)))
    .attr('fill', (d) => color(d.value));

  var tooltip = (d, i) => {
    var tooltip = d3.select('#tooltip').data([d]);

    tooltip.join('div')
      .attr('id', 'tooltip')
      .style('position', 'absolute')
      .style('background', 'white')
      .style('border-style', 'solid')
      .style('opacity', 1)
      .style('left', (d3.event.pageX + 10) + 'px')
      .style('top', (d3.event.pageY + 10) + 'px')
      .html('<p>Date: ' + d.date + '</p>' +
        '<p>Unadjusted GDP: ' + Math.round(d.unadjusted) / 100 + '</p>' +
        '<p>Symmetrical GDP: ' + Math.round(d.value * 100) / 100 + '</p>');

  }

  bars.on('mouseenter', tooltip);

  bars.on('mousemove', tooltip);

  bars.on('mouseout', (d, i) => {
    d3.select('#tooltip').remove();
  });

}

async function mkGraphModel(allData) {

  var model = {
    height: 300,
    width: 500
  };

  model.y = d3.scaleLinear()
    .domain([Math.min(...allData), Math.max(...allData)])
    .range([model.height, 0]);

  model.color = d3.scaleLinear()
    .domain([Math.min(...allData), 0, Math.max(...allData)])
    .range(['red', '#555544', 'green']);

  return model;

}

async function recession_ranges(_data) {
  let data = await _data;
  let recessions = [];
  for (var i = 30; i < data.length; i++) {
    if (data[i - 1].value < 0 && data[i].value < 0) {
      recessions.push([i - 30 >= 0 ? i - 30 : 0, i < data.length ? i : data.length - 1]);
      i += 2;
    }
  }
  return recessions;
}

async function navButtons(container, data, model, update) {
  var ranges = await recession_ranges(data);

  var buttonLabel = container.selectAll('#buttonLabel').data(['Recessions: ']);

  buttonLabel.join('span').text((d) => d);

  var buttons = container.selectAll('#navButton').data(ranges);

  buttons.join('button')
    .text((d, i) => data[d[0]].date + ' to ' + data[d[1]].date)
    .on('click', (d, i) => {
      model.a = d[0];
      model.b = d[1] + 1;
      update(data.slice(model.a, model.b));
    })

}

async function main() {

  var data = await d3.csv("data.csv", (d) => {
    return {
      value: (Number(d['GDP 2012']) >= 0 ? Number(d['GDP 2012']) / 100 : 1 - 1 / (1 + Number(d['GDP 2012']) / 100)),
      unadjusted: Number(d['GDP 2012']),
      date: d['Date']
    }
  });

  var graphModel = await mkGraphModel(data.map((d) => d.value));
  var sliderModel = await mkSliderModel(data.map((d) => d.value));
  var graphContainer = d3.select('#graph').append('svg').attr('viewBox', '0 0 500 300').attr('width', 800);
  var navContainer = d3.select('#nav').append('div').attr('id', 'navButtons');
  var sliderContainer = d3.select('#nav').append('svg').attr('height', 100).attr('width', 800);


  async function update(selection) {
    graph(graphContainer, selection, graphModel);
    slider(sliderContainer, data, sliderModel, update);
  }

  navButtons(navContainer, data, sliderModel, update);
  update(data.slice(Math.round(sliderModel.a), Math.round(sliderModel.b)));
  update(data.slice(Math.round(sliderModel.a), Math.round(sliderModel.b)));

}

main();