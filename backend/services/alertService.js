const Alert = require('../models/Alert');
const CalculationService = require('./calculationService');

class AlertService {
    // Tipos de alertas disponibles
    static ALERT_TYPES = {
        ESTRES_CRITICO: 'ESTRES_CRITICO',
        BURNOUT_CRITICO: 'BURNOUT_CRITICO',
        SOBRECARGA_AGOTAMIENTO: 'SOBRECARGA_AGOTAMIENTO',
        RIESGO_ALTO_GENERAL: 'RIESGO_ALTO_GENERAL',
        DETERIORO_PROGRESIVO: 'DETERIORO_PROGRESIVO',
        PRIMERA_EVALUACION_ALTA: 'PRIMERA_EVALUACION_ALTA'
    };

    // Niveles de prioridad
    static PRIORITY_LEVELS = {
        CRITICA: 'CRITICA',
        ALTA: 'ALTA',
        MEDIA: 'MEDIA',
        BAJA: 'BAJA'
    };

    // Generar alertas basadas en puntajes y contexto
    static async generateAlerts(estudiante_id, evaluacion_id, scores, previousScores = null) {
        const alerts = [];

        try {
            // Alerta por estrés crítico
            if (scores.estres >= 8) {
                alerts.push(await Alert.create({
                    estudiante_id,
                    evaluacion_id,
                    tipo: this.ALERT_TYPES.ESTRES_CRITICO,
                    mensaje: `Niveles críticos de estrés detectados (${scores.estres.toFixed(1)}/10). Se recomienda atención inmediata y considerar técnicas de manejo del estrés.`,
                    nivel_prioridad: this.PRIORITY_LEVELS.ALTA
                }));
            }

            // Alerta por burnout crítico
            if (scores.burnout >= 8) {
                alerts.push(await Alert.create({
                    estudiante_id,
                    evaluacion_id,
                    tipo: this.ALERT_TYPES.BURNOUT_CRITICO,
                    mensaje: `Signos severos de burnout académico detectados (${scores.burnout.toFixed(1)}/10). Es crucial buscar apoyo psicológico profesional.`,
                    nivel_prioridad: this.PRIORITY_LEVELS.CRITICA
                }));
            }

            // Alerta por combinación peligrosa
            if (scores.agotamiento >= 7 && scores.sobrecarga >= 7) {
                alerts.push(await Alert.create({
                    estudiante_id,
                    evaluacion_id,
                    tipo: this.ALERT_TYPES.SOBRECARGA_AGOTAMIENTO,
                    mensaje: `Combinación peligrosa de sobrecarga académica (${scores.sobrecarga.toFixed(1)}/10) y agotamiento (${scores.agotamiento.toFixed(1)}/10) detectada. Se sugiere revisión urgente de la carga académica.`,
                    nivel_prioridad: this.PRIORITY_LEVELS.ALTA
                }));
            }

            // Alerta por riesgo alto general
            const riskLevel = CalculationService.calculateRiskLevel(scores);
            if (riskLevel === 'ALTO') {
                const promedio = (scores.estres + scores.agotamiento + scores.sobrecarga + scores.burnout) / 4;
                alerts.push(await Alert.create({
                    estudiante_id,
                    evaluacion_id,
                    tipo: this.ALERT_TYPES.RIESGO_ALTO_GENERAL,
                    mensaje: `Múltiples factores de riesgo psicosocial detectados con promedio general de ${promedio.toFixed(1)}/10. Se sugiere evaluación psicológica profesional.`,
                    nivel_prioridad: this.PRIORITY_LEVELS.ALTA
                }));
            }

            // Alerta por deterioro progresivo (comparación con evaluación anterior)
            if (previousScores) {
                const deterioro = this.detectProgressiveDeterioration(scores, previousScores);
                if (deterioro.detected) {
                    alerts.push(await Alert.create({
                        estudiante_id,
                        evaluacion_id,
                        tipo: this.ALERT_TYPES.DETERIORO_PROGRESIVO,
                        mensaje: `Deterioro progresivo detectado: ${deterioro.details}. Monitoreo cercano recomendado.`,
                        nivel_prioridad: this.PRIORITY_LEVELS.MEDIA
                    }));
                }
            }

            // Alerta para primera evaluación con riesgo alto
            if (!previousScores && riskLevel === 'ALTO') {
                alerts.push(await Alert.create({
                    estudiante_id,
                    evaluacion_id,
                    tipo: this.ALERT_TYPES.PRIMERA_EVALUACION_ALTA,
                    mensaje: 'Primera evaluación muestra niveles altos de riesgo. Se recomienda seguimiento inmediato y recursos de apoyo.',
                    nivel_prioridad: this.PRIORITY_LEVELS.MEDIA
                }));
            }

            return alerts;
        } catch (error) {
            console.error('Error generando alertas:', error);
            throw new Error('Error al generar alertas automáticas');
        }
    }

    // Detectar deterioro progresivo comparando evaluaciones
    static detectProgressiveDeterioration(currentScores, previousScores) {
        const threshold = 1.5; // Incremento mínimo para considerar deterioro
        const deteriorations = [];

        Object.keys(currentScores).forEach(category => {
            const current = currentScores[category];
            const previous = previousScores[category];
            
            if (current - previous >= threshold) {
                deteriorations.push(`${category}: +${(current - previous).toFixed(1)} puntos`);
            }
        });

        return {
            detected: deteriorations.length > 0,
            details: deteriorations.length > 0 
                ? deteriorations.join(', ')
                : null,
            count: deteriorations.length
        };
    }

    // Obtener recomendaciones basadas en alertas
    static getRecommendations(alertTypes) {
        const recommendations = {
            immediate: [], // Acciones inmediatas
            shortTerm: [], // Acciones a corto plazo
            longTerm: [] // Acciones a largo plazo
        };

        alertTypes.forEach(type => {
            switch (type) {
                case this.ALERT_TYPES.ESTRES_CRITICO:
                    recommendations.immediate.push('Aplicar técnicas de respiración y relajación');
                    recommendations.shortTerm.push('Programar sesión con servicio de bienestar estudiantil');
                    recommendations.longTerm.push('Implementar estrategias de manejo del estrés');
                    break;

                case this.ALERT_TYPES.BURNOUT_CRITICO:
                    recommendations.immediate.push('Contactar servicio de apoyo psicológico');
                    recommendations.shortTerm.push('Evaluar reducción temporal de carga académica');
                    recommendations.longTerm.push('Desarrollar plan de recuperación y prevención');
                    break;

                case this.ALERT_TYPES.SOBRECARGA_AGOTAMIENTO:
                    recommendations.immediate.push('Revisar y priorizar tareas académicas');
                    recommendations.shortTerm.push('Implementar técnicas de gestión del tiempo');
                    recommendations.longTerm.push('Establecer límites saludables en compromisos académicos');
                    break;

                default:
                    recommendations.shortTerm.push('Monitorear de cerca el progreso del estudiante');
                    break;
            }
        });

        return recommendations;
    }

    // Calcular urgencia de una alerta
    static calculateUrgency(alert, studentHistory) {
        let urgencyScore = 0;

        // Puntuación base por prioridad
        switch (alert.nivel_prioridad) {
            case this.PRIORITY_LEVELS.CRITICA:
                urgencyScore += 40;
                break;
            case this.PRIORITY_LEVELS.ALTA:
                urgencyScore += 30;
                break;
            case this.PRIORITY_LEVELS.MEDIA:
                urgencyScore += 20;
                break;
            case this.PRIORITY_LEVELS.BAJA:
                urgencyScore += 10;
                break;
        }

        // Aumentar urgencia si hay alertas similares recientes
        if (studentHistory && studentHistory.recentAlerts) {
            const similarAlerts = studentHistory.recentAlerts.filter(
                a => a.tipo === alert.tipo && !a.leida
            );
            urgencyScore += similarAlerts.length * 5;
        }

        // Reducir urgencia si han pasado muchos días
        const daysSinceAlert = Math.floor(
            (Date.now() - new Date(alert.fecha_alerta).getTime()) / (1000 * 60 * 60 * 24)
        );
        urgencyScore -= Math.min(daysSinceAlert * 2, 20);

        return Math.max(urgencyScore, 0);
    }

    // Agrupar alertas por estudiante para dashboard
    static async getGroupedAlerts(filters = {}) {
        try {
            const alerts = await Alert.findAll(filters, 100, 0);
            
            const grouped = alerts.reduce((acc, alert) => {
                const studentId = alert.estudiante_id;
                
                if (!acc[studentId]) {
                    acc[studentId] = {
                        estudiante_id: studentId,
                        estudiante_nombre: alert.estudiante_nombre,
                        estudiante_email: alert.estudiante_email,
                        estudiante_carrera: alert.estudiante_carrera,
                        alertas: [],
                        total_alertas: 0,
                        alertas_no_leidas: 0,
                        max_prioridad: 'BAJA'
                    };
                }

                acc[studentId].alertas.push(alert);
                acc[studentId].total_alertas += 1;
                
                if (!alert.leida) {
                    acc[studentId].alertas_no_leidas += 1;
                }

                // Actualizar máxima prioridad
                const priorities = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'];
                const currentMaxIndex = priorities.indexOf(acc[studentId].max_prioridad);
                const alertPriorityIndex = priorities.indexOf(alert.nivel_prioridad);
                
                if (alertPriorityIndex > currentMaxIndex) {
                    acc[studentId].max_prioridad = alert.nivel_prioridad;
                }

                return acc;
            }, {});

            return Object.values(grouped);
        } catch (error) {
            console.error('Error agrupando alertas:', error);
            throw new Error('Error al agrupar alertas por estudiante');
        }
    }
}

module.exports = AlertService;