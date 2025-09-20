export const RISK_LEVELS = {
  BAJO: {
    label: 'Bajo',
    color: 'success',
    bgColor: 'bg-success-100',
    textColor: 'text-success-600',
    description: 'Nivel de riesgo bajo. Continúa con tus hábitos saludables.'
  },
  MEDIO: {
    label: 'Medio',
    color: 'warning',
    bgColor: 'bg-warning-100',
    textColor: 'text-warning-600',
    description: 'Nivel de riesgo medio. Se recomienda atención y seguimiento.'
  },
  ALTO: {
    label: 'Alto',
    color: 'danger',
    bgColor: 'bg-danger-100',
    textColor: 'text-danger-600',
    description: 'Nivel de riesgo alto. Se sugiere buscar apoyo profesional.'
  }
};

export const ALERT_PRIORITIES = {
  BAJA: {
    label: 'Baja',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  MEDIA: {
    label: 'Media',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  },
  ALTA: {
    label: 'Alta',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  CRITICA: {
    label: 'Crítica',
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  }
};

export const CATEGORIES = {
  estres: {
    label: 'Estrés',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    icon: '😰'
  },
  agotamiento: {
    label: 'Agotamiento',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    icon: '😴'
  },
  sobrecarga: {
    label: 'Sobrecarga',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    icon: '📚'
  },
  burnout: {
    label: 'Burnout',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    icon: '🔥'
  }
};

export const RESOURCE_TYPES = {
  video: {
    label: 'Video',
    icon: '🎥',
    color: 'text-red-600'
  },
  articulo: {
    label: 'Artículo',
    icon: '📄',
    color: 'text-blue-600'
  },
  audio: {
    label: 'Audio',
    icon: '🎧',
    color: 'text-green-600'
  },
  documento: {
    label: 'Documento',
    icon: '📋',
    color: 'text-gray-600'
  },
  herramienta: {
    label: 'Herramienta',
    icon: '🛠️',
    color: 'text-purple-600'
  }
};