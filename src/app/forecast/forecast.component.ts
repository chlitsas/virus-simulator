import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ContactsLimitationMeasures, SeasonalityImpactOnTransmissibility } from 'src/app/data/data.model';

import { Stats, InfectedPersonData, SicknessState, InfectedRegistry } from 'src/app/data/data.model';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-forecast',
  templateUrl: './forecast.component.html',
  styleUrls: ['./forecast.component.scss'],
  animations: [
    trigger(
      'inOutAnimation', 
      [
        transition(
          ':enter', 
          [
            style({ height: 0, opacity: 0 }),
            animate('1s ease-out', 
                    style({ height: 300, opacity: 1 }))
          ]
        ),
        transition(
          ':leave', 
          [
            style({ height: 300, opacity: 1 }),
            animate('1s ease-in', 
                    style({ height: 0, opacity: 0 }))
          ]
        )
      ]
    )
  ]
})
export class ForecastComponent implements OnInit {
  data: Stats[];
  title: string;
  
  MAX_DAYS = 300;
  initialInfections = 90;
  population = 10000000;
  infectiousDays = 11;
  transmissibility = 0.035;
  contactsLimitationMeasures: ContactsLimitationMeasures[] = [];
  seasonalityImpactOnTransmissibility: SeasonalityImpactOnTransmissibility[] = [];
  effectiveContacts = 13;
  SICKNESS_ENDING_PROB = 0.9;
  mortalityRate = 0.017;
  simulating = false;
  totalInfected = 1;
  totalDied = 0;
  simulationDays = 90;
  algo = 'random_walk';
  sizeOfExtraDaysToStore = 10;

  constructor(private http: HttpClient) {
    this.data = [];
    this.title = "Start simulation";
  }

  ngOnInit() {
  }

  addSeasonalTransmissibility(): void {
    if (this.seasonalityImpactOnTransmissibility.length > 0) {
      let lastDay = this.seasonalityImpactOnTransmissibility[this.seasonalityImpactOnTransmissibility.length-1].endDay;
      if (lastDay < this.simulationDays - 10) {
        this.seasonalityImpactOnTransmissibility.push({startDay: lastDay+1, endDay: lastDay+10, transferVirusProbability: 0.02});
        return;
      }
    }
    this.seasonalityImpactOnTransmissibility.push({startDay: 30, endDay: 50, transferVirusProbability: 0.02});
  }

  removeSeasonalTransmissibility(i: number): void {
    this.seasonalityImpactOnTransmissibility.splice(i, 1);
  }

  getTrasnferVirusProbabilityForDay(day: number): number {
    for (let item of this.seasonalityImpactOnTransmissibility) {
      if (item.startDay <= day && day <= item.endDay) {
        return item.transferVirusProbability;
      }
    }
    return this.transmissibility;
  }

  addMeasures(): void {
    if (this.contactsLimitationMeasures.length > 0) {
      let lastDay = this.contactsLimitationMeasures[this.contactsLimitationMeasures.length-1].endDay;
      if (lastDay < this.simulationDays - 10) {
        this.contactsLimitationMeasures.push({startDay: lastDay+1, endDay: lastDay+10, maxContactsAllowed: 3});
        return;
      }
    }
    this.contactsLimitationMeasures.push({startDay: 30, endDay: 50, maxContactsAllowed: 3});
  }

  removeMeasure(i: number): void {
    this.contactsLimitationMeasures.splice(i, 1);
  }

  getEffectiveContactsForDay(day: number): number {
    for (let measure of this.contactsLimitationMeasures) {
      if (measure.startDay <= day && day <= measure.endDay) {
        return measure.maxContactsAllowed;
      }
    }
    return this.effectiveContacts;
  }

  numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  probabilisticRound(x: number): number {
    if (x == Math.round(x)) {
      return x;
    }

    if (Math.random() < x % 1) {
      return Math.ceil(x);
    }
    return Math.floor(x);
  }

  normalSkewedRand(min, max, skew): number {
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );

    num = num / 10.0 + 0.5; // Translate to 0 -> 1
    if (num > 1 || num < 0) {
      num = this.normalSkewedRand(min, max, skew); 
    }
    num = Math.pow(num, skew); // Skew
    num *= max - min; // Stretch to fill range
    num += min; // offset to min
    return num;
  }

  run(): void {
    switch(this.algo) { 
      case 'random_walk': {
        this.randomWalk();
        break;
      }
      case 'random_walk_deep': {
        this.randomWalkXXX();
        break;
      }
      default: {
        this.simulate();
      }
    }
  }

  simulate(): void {
    this.data = [];  

    this.totalInfected = 1;
    this.totalDied = 0;

    let memoryLength = this.infectiousDays + this.sizeOfExtraDaysToStore;
    let activeCasesPerDay: number[] = Array(memoryLength).fill(0);
    activeCasesPerDay[memoryLength-1] = this.initialInfections;

    let infectionsPerDay: number[] = Array(memoryLength).fill(0);
    infectionsPerDay[memoryLength-1] = this.initialInfections;

    for (let day = 0; day < this.simulationDays; day++) {
      let diedToday = 0;
      for (let i = 0; i < 10; i++){
        let diedFromSlot = this.probabilisticRound(this.mortalityRate * infectionsPerDay[i]/10);
        activeCasesPerDay[i] -= diedFromSlot;
        diedToday += diedFromSlot;
      }
      this.totalDied += diedToday;
      
      let activeCases = activeCasesPerDay.slice(this.sizeOfExtraDaysToStore+1).reduce((prev, curr) => prev + curr, 0);

      let contacts = this.getEffectiveContactsForDay(day);
      let percentageOfHealthyPeople = (this.population - this.totalInfected) / this.population;
      
      let healthyPeopleContacted = ((activeCases/2 + activeCasesPerDay[activeCasesPerDay.length-1]/2) * contacts) * Math.pow(percentageOfHealthyPeople, 1.2);
      if (healthyPeopleContacted > this.population - this.totalInfected) {
        healthyPeopleContacted = this.population - this.totalInfected;
      }

      let infectedTodayDecimal = this.getTrasnferVirusProbabilityForDay(day) * healthyPeopleContacted;
      let infectedToday = this.probabilisticRound(infectedTodayDecimal);
      this.totalInfected += infectedToday;
      activeCasesPerDay.shift();
      activeCasesPerDay.push(infectedTodayDecimal);
      infectionsPerDay.shift();
      infectionsPerDay.push(infectedTodayDecimal);
      this.data.push({day: day, died: diedToday, infected: infectedToday});
    }
    this.title = "Deaths per Day";
  }

  randomWalk(): void {
    this.data = [];  
    this.title = "Simulation started, it may take a moment...";

    this.totalInfected = 1;
    this.totalDied = 0;

    let memoryLength = this.infectiousDays + this.sizeOfExtraDaysToStore;
    let activeCasesPerDay: number[] = Array(memoryLength).fill(0);
    activeCasesPerDay[memoryLength-1] = this.initialInfections;

    let infectionsPerDay: number[] = Array(memoryLength).fill(0);
    infectionsPerDay[memoryLength-1] = this.initialInfections;

    for (let day = 0; day < this.simulationDays; day++) {
      let infectedToday = 0;
      let diedToday = 0;
      for (let i = 0; i < 10; i++){
        let diedFromSlot = this.probabilisticRound(
        2 * this.mortalityRate * activeCasesPerDay[i]/10 * this.normalSkewedRand(0, 1, 1)
        );
        activeCasesPerDay[i] -= diedFromSlot;
        diedToday += diedFromSlot;
      }
      this.totalDied += diedToday;


      let activeCases = activeCasesPerDay.slice(this.sizeOfExtraDaysToStore+1).reduce((prev, curr) => prev + curr, 0);

      let contacts = this.effectiveContacts;
      let percentageOfHealthyPeople = (this.population - this.totalInfected) / this.population;
      contacts = this.getEffectiveContactsForDay(day);

      let healthyPeopleContacted = activeCases * contacts * percentageOfHealthyPeople;
      if (healthyPeopleContacted > this.population - this.totalInfected) {
        healthyPeopleContacted = this.population - this.totalInfected;
      }

      infectedToday = this.probabilisticRound(this.normalSkewedRand(0, healthyPeopleContacted * this.getTrasnferVirusProbabilityForDay(day), 1));

      if (healthyPeopleContacted < infectedToday){
        infectedToday = healthyPeopleContacted;  
      }
      activeCasesPerDay.shift();

      this.totalInfected += infectedToday;
      activeCasesPerDay.push(infectedToday);
      this.data.push({day: day, died: diedToday, infected: infectedToday});
    }
    this.title = "Deaths per Day";
  }

  randomWalkDeprecated(): void {
    this.data = [];  
    this.title = "Simulation started, it may take a moment...";

    this.totalInfected = 1;
    this.totalDied = 0;

    let activeCasesPerDay: number[] = Array(this.infectiousDays).fill(0);
    activeCasesPerDay[this.infectiousDays-1] = this.initialInfections;
    let infectedByActiveCasesPerDay: number[] = Array(this.infectiousDays).fill(0);

    for (let day = 0; day < this.simulationDays; day++) {
      let infectedToday = 0;
      let diedToday = 0;

      for (let j = 0; j < activeCasesPerDay[5]; j++){
        if (Math.random() < this.mortalityRate) {
            diedToday++;
            activeCasesPerDay[5]--;
            this.totalDied++;
        }
      }

      for (let i = 0; i < this.infectiousDays; i++) {
        let healthyContacts = this.getEffectiveContactsForDay(day) - infectedByActiveCasesPerDay[i];
        let percentageOfHealthyPeople = (this.population - this.totalInfected) / this.population;

        let healthyPeopleContacted = activeCasesPerDay[i] * healthyContacts * Math.pow(percentageOfHealthyPeople, 1);
        if (healthyPeopleContacted > this.population - this.totalInfected) {
          healthyPeopleContacted = this.population - this.totalInfected;
        }

        let newPeopleMet = this.probabilisticRound(2 * healthyPeopleContacted * this.normalSkewedRand(0, 1, 1));

        let infectedContacts = 0;
        for (let i = 0; i < newPeopleMet; i++){
          if (Math.random() < this.getTrasnferVirusProbabilityForDay(day)) {
            this.totalInfected++;
            infectedToday++;
            infectedContacts++;
          }
        }
        infectedByActiveCasesPerDay[i] += infectedContacts;
      }
      infectedByActiveCasesPerDay.shift();
      infectedByActiveCasesPerDay.push(0);
      activeCasesPerDay.shift();
      activeCasesPerDay.push(infectedToday);
      this.data.push({day: day, died: diedToday, infected: infectedToday});
    }
    this.title = "Deaths per Day";
  }
}
