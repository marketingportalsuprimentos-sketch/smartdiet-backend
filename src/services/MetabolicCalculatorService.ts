// src/services/MetabolicCalculatorService.ts

type Gender = 'MALE' | 'FEMALE';
type ActivityLevel = 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';
type GoalPace = 'SLOW' | 'NORMAL' | 'FAST';

interface PatientData {
  birthDate: Date;
  gender: Gender;
  heightCm: number;
  currentWeightKg: number;
  goalWeightKg: number;
  goalPace: GoalPace;
  activityLevel: ActivityLevel;
}

interface CalculationResult {
  basalMetabolicRate: number;
  totalDailyEnergyExpenditure: number;
  targetDailyCalories: number;
  targetProteinG: number;
  targetFatG: number;
  targetCarbsG: number;
  targetWaterMl: number;
  daysToReachGoal: number;
  estimatedGoalDate: Date;
}

export class MetabolicCalculatorService {
  private static readonly ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
    SEDENTARY: 1.2,
    LIGHT: 1.375,
    MODERATE: 1.55,
    ACTIVE: 1.725,
    VERY_ACTIVE: 1.9,
  };

  private static readonly PACE_ADJUSTMENTS: Record<GoalPace, number> = {
    SLOW: 250,   
    NORMAL: 500, 
    FAST: 750,   
  };

  private static readonly KCAL_PER_KG_FAT = 7700; 

  public calculateGoal(patient: PatientData): CalculationResult {
    const today = new Date();
    let age = today.getFullYear() - patient.birthDate.getFullYear();
    const m = today.getMonth() - patient.birthDate.getMonth();
    
    if (m < 0 || (m === 0 && today.getDate() < patient.birthDate.getDate())) {
      age--;
    }

    let bmr = 0;
    if (patient.gender === 'MALE') {
      bmr = (10 * patient.currentWeightKg) + (6.25 * patient.heightCm) - (5 * age) + 5;
    } else {
      bmr = (10 * patient.currentWeightKg) + (6.25 * patient.heightCm) - (5 * age) - 161;
    }

    const multiplier = MetabolicCalculatorService.ACTIVITY_MULTIPLIERS[patient.activityLevel];
    const tdee = bmr * multiplier;

    const caloricAdjustment = MetabolicCalculatorService.PACE_ADJUSTMENTS[patient.goalPace] || 500;

    const weightDifference = patient.currentWeightKg - patient.goalWeightKg;
    let targetDailyCalories = tdee;
    
    if (weightDifference > 0) {
      targetDailyCalories = tdee - caloricAdjustment;
    } else if (weightDifference < 0) {
      targetDailyCalories = tdee + caloricAdjustment;
    }

    if (patient.gender === 'FEMALE' && targetDailyCalories < 1200) {
      targetDailyCalories = 1200;
    } else if (patient.gender === 'MALE' && targetDailyCalories < 1500) {
      targetDailyCalories = 1500;
    }

    const absoluteWeightDifference = Math.abs(weightDifference);
    const totalCaloriesToBurnOrGain = absoluteWeightDifference * MetabolicCalculatorService.KCAL_PER_KG_FAT;
    const actualDailyAdjustment = Math.abs(tdee - targetDailyCalories);
    
    let daysToReachGoal = 0;
    let estimatedGoalDate = new Date();

    if (actualDailyAdjustment > 0 && absoluteWeightDifference > 0) {
      daysToReachGoal = Math.ceil(totalCaloriesToBurnOrGain / actualDailyAdjustment);
      estimatedGoalDate.setDate(estimatedGoalDate.getDate() + daysToReachGoal);
    }

    // DIVISÃO DE MACROS
    let targetProteinG = Math.round(patient.currentWeightKg * 2.0);
    let targetFatG = Math.round(patient.currentWeightKg * 1.0);
    
    let caloriesFromProteinAndFat = (targetProteinG * 4) + (targetFatG * 9);
    let targetCarbsG = Math.round((targetDailyCalories - caloriesFromProteinAndFat) / 4);

    // Proteção de Nutrição: Se a meta zerar os carbos devido ao déficit alto, 
    // rebalanceamos para uma proporção viável (40% Proteína, 30% Gordura, 30% Carbo)
    if (targetCarbsG <= 0) {
      targetProteinG = Math.round((targetDailyCalories * 0.40) / 4);
      targetFatG = Math.round((targetDailyCalories * 0.30) / 9);
      targetCarbsG = Math.round((targetDailyCalories * 0.30) / 4);
    }

    const targetWaterMl = Math.round(patient.currentWeightKg * 35);

    return {
      basalMetabolicRate: Math.round(bmr),
      totalDailyEnergyExpenditure: Math.round(tdee),
      targetDailyCalories: Math.round(targetDailyCalories),
      targetProteinG,
      targetFatG,
      targetCarbsG,
      targetWaterMl,
      daysToReachGoal,
      estimatedGoalDate,
    };
  }
}