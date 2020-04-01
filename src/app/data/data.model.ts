 export interface ContactsLimitationMeasures {
    startDay: number;
    endDay: number;
    maxContactsAllowed: number;
}

 export interface SeasonalityImpactOnTransmissibility {
    startDay: number;
    endDay: number;
    transferVirusProbability: number;
}

export enum SicknessState {
    ACTIVE_SILENT = 1,
    ACTIVE = 2,
    RECOVERED = 3,
    DEAD = 4
}

export interface InfectedPersonData {
    state: SicknessState;
    infectionDay: number;
}

export interface Stats {
    day: number;
    infected: number;
    died: number;
}

export interface InfectedRegistry {
   [key: number]: InfectedPersonData;
} 
