export const calculateRiskLevel = (scores) => {
  const average = (scores.estres + scores.agotamiento + scores.sobrecarga + scores.burnout) / 4;
  
  if (average >= 7) return 'ALTO';
  if (average >= 5) return 'MEDIO';
  return 'BAJO';
};

export const getRiskColor = (level) => {
  const colors = {
    'ALTO': 'text-red-600 bg-red-100',
    'MEDIO': 'text-yellow-600 bg-yellow-100',
    'BAJO': 'text-green-600 bg-green-100'
  };
  return colors[level] || 'text-gray-600 bg-gray-100';
};

export const formatScore = (score) => {
  if (typeof score !== 'number') return '0.0';
  return Number(score).toFixed(1);
};

export const getScoreColor = (score) => {
  if (score >= 7) return 'text-red-600';
  if (score >= 5) return 'text-yellow-600';
  return 'text-green-600';
};