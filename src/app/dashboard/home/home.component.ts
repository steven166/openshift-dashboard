import { Component, OnInit, trigger, state, style, transition, animate } from '@angular/core';
import * as Chartist from 'chartist';

declare const md: any;

@Component({
  selector: 'home-cmp',
  moduleId: module.id,
  templateUrl: 'home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {

  cpuUsed = 17;
  cpuCapacity = 24;
  memoryUsed = 178;
  memoryCapacity = 320;
  discUsed = 26;
  discCapacity = 30;
  podsUsed = 78;
  podsCapacity = 200;

  ngOnInit() {

    this.drawChart('#cpuChart', this.cpuUsed / this.cpuCapacity * 100);
    this.drawChart('#memoryChart', this.memoryUsed / this.memoryCapacity * 100);
    this.drawChart('#discChart', this.discUsed / this.discCapacity * 100);
    this.drawChart('#podsChart', this.podsUsed / this.podsCapacity * 100);
  }

  private drawChart( clazz: string, progress: number ) {
    const chart = new Chartist.Pie(clazz, {
      series: [progress],
      labels: [1]
    }, {
      donut: true,
      showLabel: false,
      donutWidth: 15,
      startAngle: 225,
      total: 133
    });

    chart.on('draw', function ( data ) {
      if (data.type === 'slice') {
        // Get the total path length in order to use for dash array animation
        const pathLength = data.element._node.getTotalLength();

        // Set a dasharray that matches the path length as prerequisite to animate dashoffset
        data.element.attr({
          'stroke-dasharray': pathLength + 'px ' + pathLength + 'px'
        });

        // Create animation definition while also assigning an ID to the animation for later sync usage
        const animationDefinition: any = {
          'stroke-dashoffset': {
            id: 'anim' + data.index,
            dur: 1000,
            from: -pathLength + 'px',
            to: '0px',
            easing: Chartist.Svg.Easing.easeOutQuint,
            // We need to use `fill: 'freeze'` otherwise our animation will fall back to initial (not visible)
            fill: 'freeze'
          }
        };

        // If this was not the first slice, we need to time the animation so that it uses the end sync event of the previous animation
        if (data.index !== 0) {
          animationDefinition['stroke-dashoffset'].begin = 'anim' + (data.index - 1) + '.end';
        }

        // We need to set an initial value before the animation starts as we are not in guided mode which would do that for us
        data.element.attr({
          'stroke-dashoffset': -pathLength + 'px'
        });

        // We can't use guided mode as the animations need to rely on setting begin manually
        // See http://gionkunz.github.io/chartist-js/api-documentation.html#chartistsvg-function-animate
        data.element.animate(animationDefinition, false);
      }
    });
  }
}
