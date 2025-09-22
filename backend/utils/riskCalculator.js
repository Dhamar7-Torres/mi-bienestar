/**
 * Calculadora Avanzada de Riesgo Psicosocial
 * Sistema completo para evaluar estrés y burnout en estudiantes
 */

class RiskCalculator {
  constructor() {
    // Configuración de pesos y umbrales
    this.config = {
      // Pesos por categoría (pueden ajustarse según investigación)
      categoryWeights: {
        ESTRES: 1.2,
        BURNOUT: 1.3
      },
      
      // Umbrales para clasificación de riesgo (sobre 10) - CORREGIDOS
      riskThresholds: {
        BAJO: { min: 0, max: 4.0 },
        MEDIO: { min: 4.1, max: 6.0 },
        ALTO: { min: 6.1, max: 10 }
      },
      
      // Pesos específicos por pregunta (se pueden personalizar)
      questionWeights: {
        // Preguntas de estrés con mayor peso
        highStressQuestions: [1, 2, 3, 7, 8, 9], // índices base 1
        // Preguntas de burnout con mayor peso  
        highBurnoutQuestions: [1, 2, 3, 7, 8, 9, 10]
      }
    };
    
    // Factores de ajuste basados en características del estudiante
    this.adjustmentFactors = {
      semester: {
        1: 0.9,   // Primer semestre, menos experiencia de estrés
        2: 0.95,  
        3: 1.0,   // Semestres medios, factor neutro
        4: 1.0,
        5: 1.0,
        6: 1.05,  // Semestres avanzados, más presión
        7: 1.1,
        8: 1.15,  // Últimos semestres, mayor estrés por tesis/graduación
        9: 1.2,
        10: 1.2
      },
      // Se pueden agregar más factores como carrera, edad, etc.
    };
  }

  /**
   * Calcula el puntaje de una categoría específica
   */
  calculateCategoryScore(answers, weights, category) {
    if (!answers || answers.length === 0) {
      return { score: 0, details: [] };
    }

    const details = [];
    let totalScore = 0;
    let totalWeight = 0;

    answers.forEach((answer, index) => {
      const baseWeight = weights[index] || 1;
      
      // Aplicar peso adicional a preguntas críticas
      let finalWeight = baseWeight;
      if (category === 'ESTRES' && this.config.questionWeights.highStressQuestions.includes(index + 1)) {
        finalWeight *= 1.5;
      } else if (category === 'BURNOUT' && this.config.questionWeights.highBurnoutQuestions.includes(index + 1)) {
        finalWeight *= 1.5;
      }
      
      const weightedScore = answer * finalWeight;
      totalScore += weightedScore;
      totalWeight += finalWeight;
      
      details.push({
        questionIndex: index + 1,
        answer,
        weight: finalWeight,
        contribution: weightedScore
      });
    });

    // Normalizar a escala 0-10
    const averageScore = totalScore / totalWeight;
    const normalizedScore = (averageScore / 4) * 10; // 4 es el máximo por pregunta
    
    return {
      score: Math.round(normalizedScore * 10) / 10,
      details,
      totalWeight,
      averageScore
    };
  }

  /**
   * Determina el nivel de riesgo basado en puntaje - CORREGIDO
   */
  determineRiskLevel(score) {
    const thresholds = this.config.riskThresholds;
    
    console.log(`🔍 Determinando riesgo para puntaje: ${score}`);
    console.log(`📊 Umbrales: BAJO(0-${thresholds.BAJO.max}), MEDIO(${thresholds.MEDIO.min}-${thresholds.MEDIO.max}), ALTO(${thresholds.ALTO.min}-10)`);
    
    let level;
    if (score >= thresholds.ALTO.min) {
      level = 'ALTO';
    } else if (score >= thresholds.MEDIO.min) {
      level = 'MEDIO';
    } else {
      level = 'BAJO';
    }
    
    console.log(`✅ Resultado: ${score} → ${level}`);
    return level;
  }

  /**
   * Aplica factores de ajuste basados en perfil del estudiante
   */
  applyAdjustmentFactors(score, studentProfile) {
    let adjustedScore = score;
    
    // Ajuste por semestre
    if (studentProfile.semestre && this.adjustmentFactors.semester[studentProfile.semestre]) {
      const semesterFactor = this.adjustmentFactors.semester[studentProfile.semestre];
      adjustedScore *= semesterFactor;
    }
    
    // Se pueden agregar más ajustes aquí
    // Por ejemplo: por carrera, horario de clases, trabajo, etc.
    
    return Math.min(10, Math.max(0, adjustedScore)); // Mantener en rango 0-10
  }

  /**
   * Procesa una evaluación completa
   */
  processEvaluation(evaluationData) {
    const { 
      stressAnswers, 
      burnoutAnswers, 
      stressWeights, 
      burnoutWeights, 
      studentProfile 
    } = evaluationData;

    console.log('🎯 Procesando evaluación:');
    console.log('  Respuestas estrés:', stressAnswers);
    console.log('  Respuestas burnout:', burnoutAnswers);

    // Calcular puntajes por categoría
    const stressResult = this.calculateCategoryScore(stressAnswers, stressWeights, 'ESTRES');
    const burnoutResult = this.calculateCategoryScore(burnoutAnswers, burnoutWeights, 'BURNOUT');

    console.log('📊 Puntajes calculados:');
    console.log('  Estrés raw:', stressResult.score);
    console.log('  Burnout raw:', burnoutResult.score);

    // Aplicar factores de ajuste
    const adjustedStressScore = this.applyAdjustmentFactors(stressResult.score, studentProfile);
    const adjustedBurnoutScore = this.applyAdjustmentFactors(burnoutResult.score, studentProfile);

    console.log('📊 Puntajes ajustados:');
    console.log('  Estrés ajustado:', adjustedStressScore);
    console.log('  Burnout ajustado:', adjustedBurnoutScore);

    // Calcular puntaje total ponderado
    const weightedTotal = (
      (adjustedStressScore * this.config.categoryWeights.ESTRES) +
      (adjustedBurnoutScore * this.config.categoryWeights.BURNOUT)
    ) / (this.config.categoryWeights.ESTRES + this.config.categoryWeights.BURNOUT);

    const finalTotalScore = Math.round(weightedTotal * 10) / 10;

    // Determinar niveles de riesgo
    const overallRiskLevel = this.determineRiskLevel(finalTotalScore);
    const stressRiskLevel = this.determineRiskLevel(adjustedStressScore);
    const burnoutRiskLevel = this.determineRiskLevel(adjustedBurnoutScore);

    console.log('🎯 Niveles de riesgo:');
    console.log('  Estrés:', stressRiskLevel);
    console.log('  Burnout:', burnoutRiskLevel);
    console.log('  General:', overallRiskLevel);

    // Generar análisis detallado
    const analysis = this.generateDetailedAnalysis({
      stressScore: adjustedStressScore,
      burnoutScore: adjustedBurnoutScore,
      totalScore: finalTotalScore,
      overallRisk: overallRiskLevel,
      stressRisk: stressRiskLevel,
      burnoutRisk: burnoutRiskLevel,
      studentProfile
    });

    return {
      scores: {
        stress: Math.round(adjustedStressScore),
        burnout: Math.round(adjustedBurnoutScore),
        total: Math.round(finalTotalScore),
        rawStress: stressResult.score,
        rawBurnout: burnoutResult.score
      },
      riskLevels: {
        overall: overallRiskLevel,
        stress: stressRiskLevel,
        burnout: burnoutRiskLevel
      },
      analysis,
      recommendations: this.generateRecommendations(overallRiskLevel, adjustedStressScore, adjustedBurnoutScore),
      details: {
        stress: stressResult,
        burnout: burnoutResult
      },
      metadata: {
        evaluationDate: new Date(),
        adjustmentFactors: this.getAppliedFactors(studentProfile),
        categoryWeights: this.config.categoryWeights
      }
    };
  }

  /**
   * Genera análisis detallado de la evaluación
   */
  generateDetailedAnalysis(data) {
    const { stressScore, burnoutScore, totalScore, overallRisk, studentProfile } = data;
    
    const analysis = {
      summary: this.generateSummary(overallRisk, stressScore, burnoutScore),
      patterns: this.identifyPatterns(stressScore, burnoutScore),
      trends: this.analyzeTrends(data),
      riskFactors: this.identifyRiskFactors(data),
      strengths: this.identifyStrengths(data)
    };

    return analysis;
  }

  /**
   * Genera resumen del estado actual
   */
  generateSummary(riskLevel, stressScore, burnoutScore) {
    const summaries = {
      ALTO: {
        es: `Tu evaluación indica un nivel de riesgo ALTO (${Math.round((stressScore + burnoutScore) / 2)}/10). Es importante que busques apoyo profesional y implementes estrategias de manejo inmediatas.`,
        priority: 'urgent'
      },
      MEDIO: {
        es: `Tu evaluación muestra un nivel de riesgo MEDIO (${Math.round((stressScore + burnoutScore) / 2)}/10). Es recomendable implementar técnicas de manejo del estrés y monitorear tu bienestar.`,
        priority: 'moderate'
      },
      BAJO: {
        es: `Tu evaluación indica un nivel de riesgo BAJO (${Math.round((stressScore + burnoutScore) / 2)}/10). Mantén tus hábitos actuales de autocuidado.`,
        priority: 'low'
      }
    };

    return summaries[riskLevel];
  }

  /**
   * Identifica patrones en las respuestas
   */
  identifyPatterns(stressScore, burnoutScore) {
    const patterns = [];

    if (stressScore > burnoutScore + 2) {
      patterns.push({
        type: 'stress_dominant',
        description: 'El estrés es tu principal desafío actual',
        recommendation: 'Enfócate en técnicas de relajación y manejo del tiempo'
      });
    } else if (burnoutScore > stressScore + 2) {
      patterns.push({
        type: 'burnout_dominant',
        description: 'El agotamiento emocional es tu principal preocupación',
        recommendation: 'Busca reconectar con tus motivaciones y considera apoyo psicológico'
      });
    } else {
      patterns.push({
        type: 'balanced_risk',
        description: 'Presentas niveles similares de estrés y burnout',
        recommendation: 'Un enfoque integral de bienestar será más efectivo'
      });
    }

    return patterns;
  }

  /**
   * Analiza tendencias (requeriría evaluaciones históricas)
   */
  analyzeTrends(data) {
    // En una implementación completa, esto compararía con evaluaciones anteriores
    return {
      direction: 'stable', // 'improving', 'worsening', 'stable'
      note: 'Análisis de tendencias disponible después de múltiples evaluaciones'
    };
  }

  /**
   * Identifica factores de riesgo específicos
   */
  identifyRiskFactors(data) {
    const factors = [];

    if (data.stressScore >= 7) {
      factors.push('Niveles altos de estrés académico');
    }

    if (data.burnoutScore >= 7) {
      factors.push('Agotamiento emocional significativo');
    }

    if (data.studentProfile.semestre >= 8) {
      factors.push('Presión adicional por estar en semestres finales');
    }

    return factors;
  }

  /**
   * Identifica fortalezas del estudiante
   */
  identifyStrengths(data) {
    const strengths = [];

    if (data.stressScore <= 4) {
      strengths.push('Buen manejo del estrés académico');
    }

    if (data.burnoutScore <= 4) {
      strengths.push('Mantiene motivación y energía en los estudios');
    }

    if (data.totalScore <= 4) {
      strengths.push('Excelente equilibrio psicológico general');
    }

    return strengths;
  }

  /**
   * Genera recomendaciones personalizadas
   */
  generateRecommendations(riskLevel, stressScore, burnoutScore) {
    const recommendations = [];

    // Recomendaciones por nivel de riesgo general
    switch (riskLevel) {
      case 'ALTO':
        recommendations.push({
          category: 'urgent',
          title: 'Buscar apoyo profesional',
          description: 'Considera contactar al servicio de bienestar estudiantil o un psicólogo',
          priority: 1
        });
        recommendations.push({
          category: 'immediate',
          title: 'Técnicas de relajación diaria',
          description: 'Implementa al menos 15 minutos de relajación o meditación diarios',
          priority: 2
        });
        break;

      case 'MEDIO':
        recommendations.push({
          category: 'preventive',
          title: 'Implementar rutina de autocuidado',
          description: 'Establece horarios regulares para descanso y actividades placenteras',
          priority: 1
        });
        break;

      case 'BAJO':
        recommendations.push({
          category: 'maintenance',
          title: 'Mantener hábitos actuales',
          description: 'Continúa con tus estrategias actuales de manejo del estrés',
          priority: 1
        });
        break;
    }

    // Recomendaciones específicas por estrés
    if (stressScore >= 7) {
      recommendations.push({
        category: 'stress_management',
        title: 'Técnicas de respiración',
        description: 'Practica ejercicios de respiración profunda 3 veces al día',
        priority: stressScore >= 8 ? 1 : 2
      });
      recommendations.push({
        category: 'time_management',
        title: 'Organización del tiempo',
        description: 'Utiliza técnicas como Pomodoro para mejorar la productividad',
        priority: 2
      });
    }

    // Recomendaciones específicas por burnout
    if (burnoutScore >= 7) {
      recommendations.push({
        category: 'motivation',
        title: 'Reconectar con objetivos',
        description: 'Reflexiona sobre tus metas académicas y personales',
        priority: burnoutScore >= 8 ? 1 : 2
      });
      recommendations.push({
        category: 'social_support',
        title: 'Apoyo social',
        description: 'Conecta con compañeros, familia o amigos para obtener apoyo emocional',
        priority: 2
      });
    }

    // Ordenar por prioridad
    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Determina si se necesita generar una alerta - CORREGIDO COMPLETAMENTE
   */
  shouldGenerateAlert(riskLevel, stressScore, burnoutScore) {
    console.log('🚨 EVALUANDO ALERTAS:');
    console.log(`  Riesgo general: ${riskLevel}`);
    console.log(`  Puntaje estrés: ${stressScore}`);
    console.log(`  Puntaje burnout: ${burnoutScore}`);
    
    const alerts = [];
    
    // Determinar niveles de riesgo individuales
    const stressRiskLevel = this.determineRiskLevel(stressScore);
    const burnoutRiskLevel = this.determineRiskLevel(burnoutScore);
    
    console.log(`  Nivel estrés individual: ${stressRiskLevel}`);
    console.log(`  Nivel burnout individual: ${burnoutRiskLevel}`);
    
    // ALERTA POR ESTRÉS ALTO (independiente)
    if (stressRiskLevel === 'ALTO') {
      console.log('  ✅ Generando alerta ESTRÉS ALTO');
      alerts.push({
        needed: true,
        type: 'Estrés Alto',
        severity: 'ALTO',
        message: `Niveles críticos de estrés detectados (${Math.round(stressScore)}/10)`,
        requiresIntervention: true,
        category: 'ESTRES'
      });
    }
    
    // ALERTA POR BURNOUT ALTO (independiente)
    if (burnoutRiskLevel === 'ALTO') {
      console.log('  ✅ Generando alerta BURNOUT ALTO');
      alerts.push({
        needed: true,
        type: 'Burnout Alto', 
        severity: 'ALTO',
        message: `Niveles críticos de burnout detectados (${Math.round(burnoutScore)}/10)`,
        requiresIntervention: true,
        category: 'BURNOUT'
      });
    }
    
    // ALERTAS POR RIESGO MEDIO (solo si no hay alertas altas)
    if (alerts.length === 0) {
      console.log('  🟡 No hay alertas ALTO, evaluando MEDIO...');
      
      if (stressRiskLevel === 'MEDIO') {
        console.log('  ⚠️ Generando alerta ESTRÉS MEDIO');
        alerts.push({
          needed: true,
          type: 'Estrés Moderado',
          severity: 'MEDIO', 
          message: `Niveles moderados de estrés detectados (${Math.round(stressScore)}/10) - seguimiento recomendado`,
          requiresIntervention: false,
          category: 'ESTRES'
        });
      }
      
      if (burnoutRiskLevel === 'MEDIO') {
        console.log('  ⚠️ Generando alerta BURNOUT MEDIO');
        alerts.push({
          needed: true,
          type: 'Burnout Moderado',
          severity: 'MEDIO',
          message: `Síntomas moderados de burnout detectados (${Math.round(burnoutScore)}/10) - seguimiento recomendado`, 
          requiresIntervention: false,
          category: 'BURNOUT'
        });
      }
    }
    
    // Si no hay alertas individuales, evaluar riesgo general
    if (alerts.length === 0 && riskLevel === 'ALTO') {
      console.log('  🔶 Generando alerta RIESGO GENERAL ALTO');
      alerts.push({
        needed: true,
        type: 'Riesgo Psicosocial Alto',
        severity: 'ALTO',
        message: `Combinación de factores de riesgo detectada - evaluación integral recomendada`,
        requiresIntervention: true,
        category: 'GENERAL'
      });
    }
    
    console.log(`  📊 TOTAL ALERTAS: ${alerts.length}`);
    if (alerts.length > 0) {
      alerts.forEach(alert => {
        console.log(`    - ${alert.type} (${alert.severity})`);
      });
    }
    
    // Retornar todas las alertas o una estructura vacía si no hay ninguna
    if (alerts.length === 0) {
      console.log('  ❌ NO se generaron alertas');
      return {
        needed: false,
        type: null,
        severity: null,
        message: null,
        requiresIntervention: false,
        alerts: []
      };
    }
    
    // Si hay múltiples alertas, retornar la más severa como principal
    const mainAlert = alerts.find(alert => alert.severity === 'ALTO') || alerts[0];
    
    console.log(`  ✅ ALERTA PRINCIPAL: ${mainAlert.type} (${mainAlert.severity})`);
    
    return {
      needed: true,
      type: mainAlert.type,
      severity: mainAlert.severity,
      message: mainAlert.message,
      requiresIntervention: mainAlert.requiresIntervention,
      alerts: alerts // Array con todas las alertas detectadas
    };
  }

  /**
   * Obtiene los factores de ajuste aplicados
   */
  getAppliedFactors(studentProfile) {
    const applied = {};
    
    if (studentProfile.semestre && this.adjustmentFactors.semester[studentProfile.semestre]) {
      applied.semester = {
        value: studentProfile.semestre,
        factor: this.adjustmentFactors.semester[studentProfile.semestre]
      };
    }

    return applied;
  }

  /**
   * Exporta la configuración actual (útil para auditoría)
   */
  exportConfiguration() {
    return {
      version: '2.0',
      lastUpdated: new Date().toISOString(),
      config: this.config,
      adjustmentFactors: this.adjustmentFactors
    };
  }
}

export default RiskCalculator;