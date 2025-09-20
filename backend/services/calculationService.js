class CalculationService {
    // Calcular puntajes por categoría
    static calculateCategoryScores(responses) {
        const categories = {
            estres: [],
            agotamiento: [],
            sobrecarga: [],
            burnout: []
        };

        // Agrupar respuestas por categoría
        responses.forEach(response => {
            if (categories[response.categoria]) {
                categories[response.categoria].push(response.valor);
            }
        });

        // Calcular promedios
        const scores = {};
        Object.keys(categories).forEach(category => {
            const values = categories[category];
            scores[category] = values.length > 0 
                ? (values.reduce((sum, val) => sum + val, 0) / values.length)
                : 0;
        });

        return scores;
    }

    // Calcular nivel de riesgo general
    static calculateRiskLevel(scores) {
        const average = (scores.estres + scores.agotamiento + scores.sobrecarga + scores.burnout) / 4;
        
        if (average >= 7) return 'ALTO';
        if (average >= 5) return 'MEDIO';
        return 'BAJO';
    }

    // Determinar si necesita alerta
    static needsAlert(scores, riskLevel) {
        const alerts = [];

        // Alertas por categoría específica
        if (scores.estres >= 8) {
            alerts.push({
                tipo: 'ESTRES_CRITICO',
                mensaje: 'Niveles críticos de estrés detectados. Se recomienda atención inmediata.',
                prioridad: 'ALTA'
            });
        }

        if (scores.burnout >= 8) {
            alerts.push({
                tipo: 'BURNOUT_CRITICO',
                mensaje: 'Signos severos de burnout académico. Considere buscar apoyo psicológico.',
                prioridad: 'CRITICA'
            });
        }

        if (scores.agotamiento >= 7 && scores.sobrecarga >= 7) {
            alerts.push({
                tipo: 'SOBRECARGA_AGOTAMIENTO',
                mensaje: 'Combinación peligrosa de sobrecarga y agotamiento detectada.',
                prioridad: 'ALTA'
            });
        }

        // Alerta por nivel de riesgo general
        if (riskLevel === 'ALTO') {
            alerts.push({
                tipo: 'RIESGO_ALTO_GENERAL',
                mensaje: 'Múltiples factores de riesgo psicosocial detectados. Se sugiere evaluación profesional.',
                prioridad: 'ALTA'
            });
        }

        return alerts;
    }
}

module.exports = CalculationService;