import { Component, ViewEncapsulation, ViewChild, ElementRef, OnChanges, AfterViewInit, Input, OnInit } from '@angular/core';

import * as d3Selection from 'd3-selection';
import * as d3Scale from 'd3-scale';
import * as d3Shape from 'd3-shape';
import * as d3Array from 'd3-array';
import * as d3Axis from 'd3-axis';
import * as d3 from 'd3';

import { Stats } from 'src/app/data/data.model';

@Component({
  selector: 'app-line-chart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss']
})
export class LineChartComponent implements OnChanges, AfterViewInit {
    @ViewChild('chart')
    private chartContainer: ElementRef;

    @Input() title: string;

    @Input() data: Stats[];

    private margin = {top: 20, right: 20, bottom: 30, left: 50};
    private width: number;
    private height: number;
    private x: any;
    private y: any;
    private svg: any;
    private line: d3Shape.Line<[number, number]>;

    constructor() {
        this.width = 900 - this.margin.left - this.margin.right;
        this.height = 500 - this.margin.top - this.margin.bottom;
    }

  ngAfterViewInit(): void {
    if (!this.data) { return; }

    this.createChart();
  }

    ngOnChanges(): void {
        if (!this.data) { return; }
        this.createChart();
    }

    onResize(x: any) {
        this.createChart();
    }

    ngOnInit() {
    }

  private createChart(): void {
    if (!this.chartContainer) { return; }
    d3.select('svg').remove();

    const element = this.chartContainer.nativeElement;
    const data = this.data;

    const svg = d3.select(element).append('svg')
        .attr('width', element.offsetWidth)
        .attr('height', element.offsetHeight);

    const contentWidth = element.offsetWidth - this.margin.left - this.margin.right;
    const contentHeight = element.offsetHeight - this.margin.top - this.margin.bottom;

    const x = d3
      .scaleBand()
      .rangeRound([0, contentWidth])
      .padding(0.1)
      .domain(data.map(d => String(d.day)));
      //.domain(d3Array.extent(this.data, (d) => String(d.day)));

    const y = d3
      .scaleLinear()
      .rangeRound([contentHeight, 0])
      .domain([0, d3.max(data, d => d.died)]);

    const g = svg.append('g')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

    let xAxisSkip = 1;
    if (this.data.length > 40) {
        xAxisSkip = Math.round(this.data.length/30);
    }
    g.append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', 'translate(0,' + contentHeight + ')')
      .call(
          d3.axisBottom(x).tickValues(
            this.data.map((d, i) =>
              i % xAxisSkip == 0 ? ''+i : undefined).filter(item => item)
            )
           ).append('text')
            .attr('class', 'axis-title')
            .attr('x', contentWidth-20)
            .attr('dy', '2.6em')
            .style('text-anchor', 'end')
            .text('Days');

    g.append('g')
      .attr('class', 'axis axis--y')
      .call(d3.axisLeft(y).ticks(10))
            .append('text')
            .attr('class', 'axis-title')
            .attr('transform', 'rotate(-90)')
            .attr('y', 6)
            .attr('dy', '.7em')
            .style('text-anchor', 'end')
            .text('Daily deaths');

    let bars = g.selectAll('.bar')
      .data(data)
      .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(String(d.day)))
        .attr('y', d => y(d.died))
        .attr('width', x.bandwidth())
        .attr('height', d => contentHeight - y(d.died));


    bars.attr("y", function(d) {
        return y(d.died);
    })
        .on("mouseover", function() {
            d3.select(this)
                .attr("fill", "red");
        })

    bars.append("title")
        .text(function(d) {
            return 'Day: '+d.day+'\nDeaths: '+d.died;
        });
  }

}