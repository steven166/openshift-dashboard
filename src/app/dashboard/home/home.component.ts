import { Component, OnInit, trigger, state, style, transition, animate } from '@angular/core';
import * as Chartist from 'chartist';
import { Http, Headers, Response } from "@angular/http";
import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/zip";

@Component({
  selector: 'home-cmp',
  moduleId: module.id,
  templateUrl: 'home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent {

  cpuUsed = 17;
  cpuCapacity = 24;
  memoryUsed = 178;
  memoryCapacity = 320;
  discUsed = 26;
  discCapacity = 30;
  podsUsed = 78;
  podsCapacity = 200;

  nodeNames = [];
  namespaces = [];

  constructor (http:Http){
    const host = "";
    const token = "";
    let obs1 = http.get(host + "/api/v1/nodes", {headers: new Headers({Authorization: "Bearer " + token})});
    let obs2 = http.get(host + "/api/v1/pods", {headers: new Headers({Authorization: "Bearer " + token})});
    Observable.zip(obs1, obs2).subscribe((resp:Response[]) => {
      this.calcLoad(resp[0].json().items, resp[1].json().items);
    });
  }

  calcLoad(nodes, pods){
    let cpu = 0;
    let memory = 0;
    let cpuUsed = 0;
    let memoryUsed = 0;
    nodes.forEach(node => {
      if(node.metadata && this.nodeNames.indexOf(node.metadata.name) > -1 && node.status && node.status.capacity){
        cpu += parseInt(node.status.capacity.cpu);
        let mem = node.status.capacity.memory.replace("Ki", "");
        memory += parseInt(mem) / 1024 / 1024;
      }
    });
    pods.forEach(pod => {
      if(pod.spec && pod.spec.containers && pod.metadata && this.namespaces.indexOf(pod.metadata.namespace) > -1){
        pod.spec.containers.forEach(container => {
          let mem:number;
          let cpu:number;
          if(container.resources){
            if(container.resources.requests){
              cpu = this.findCpu(container.resources.requests);
              mem = this.findMemory(container.resources.requests);
            }
            if((!cpu || !mem) && container.resources.limits){
              if(!cpu){
                cpu = this.findCpu(container.resources.limits);
              }
              if(!mem){
                mem = this.findMemory(container.resources.limits);
              }
            }
          }
          if(cpu){
            cpuUsed += cpu;
          }
          if(mem){
            memoryUsed += mem;
          }
        });
      }
    });
    this.podsUsed = pods.length;
    this.cpuCapacity = Math.round(cpu);
    this.memoryCapacity = Math.round(memory);
    this.cpuUsed = Math.round(cpuUsed);
    this.memoryUsed = Math.round(memoryUsed);

    let cpuRatio = this.cpuUsed / this.cpuCapacity;
    let memRatio = this.memoryUsed / this.memoryCapacity;
    if(cpuRatio > memRatio){
      this.podsCapacity = Math.round(this.podsUsed / cpuRatio);
    }else{
      this.podsCapacity = Math.round(this.podsUsed / memRatio);
    }

    this.drawChart('#cpuChart', this.cpuUsed / this.cpuCapacity * 100);
    this.drawChart('#memoryChart', this.memoryUsed / this.memoryCapacity * 100);
    this.drawChart('#discChart', this.discUsed / this.discCapacity * 100);
    this.drawChart('#podsChart', this.podsUsed / this.podsCapacity * 100);
  }

  private findCpu(obj:any):number{
    if(obj.cpu){
      if(obj.cpu.indexOf("m") > -1){
        return parseInt(obj.cpu.replace("m", "")) / 1000
      }else{
        return parseFloat(obj.cpu);
      }
    }
    return 0;
  }

  private findMemory(obj:any):number{
    if(obj.memory){
      if(obj.memory.indexOf("Mi") > -1){
        return parseFloat(obj.memory.replace("Mi", "")) / 1024
      }else if(obj.memory.indexOf("Gi") > -1){
        return parseFloat(obj.memory.replace("Gi", ""))
      }else if(obj.memory.indexOf("Ki") > -1) {
        return parseInt( obj.memory.replace( "Ki", "" ) ) / 1024 / 1024
      }
    }
    return 0;
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
