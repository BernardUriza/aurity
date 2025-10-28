// Medical category types for classification
export enum MedicalCategoryType {
  SYMPTOM = 'symptom',
  DIAGNOSIS = 'diagnosis',
  MEDICATION = 'medication',
  PROCEDURE = 'procedure'
}

export const medicalTermsDatabase = {
  symptoms: [
    { term: 'cefalea', synonyms: ['dolor de cabeza', 'jaqueca'], category: MedicalCategoryType.SYMPTOM },
    { term: 'pirexia', synonyms: ['fiebre', 'temperatura elevada'], category: MedicalCategoryType.SYMPTOM },
    { term: 'disnea', synonyms: ['dificultad respiratoria', 'falta de aire'], category: MedicalCategoryType.SYMPTOM },
    { term: 'taquicardia', synonyms: ['pulso rápido', 'latidos acelerados'], category: MedicalCategoryType.SYMPTOM },
    { term: 'hipertensión', synonyms: ['presión alta', 'tensión arterial elevada'], category: MedicalCategoryType.DIAGNOSIS },
    { term: 'diabetes', synonyms: ['diabetes mellitus', 'azúcar alta'], category: MedicalCategoryType.DIAGNOSIS },
    { term: 'anemia', synonyms: ['hemoglobina baja', 'déficit de hierro'], category: MedicalCategoryType.DIAGNOSIS }
  ],
  medications: [
    { term: 'paracetamol', synonyms: ['acetaminofén'], category: MedicalCategoryType.MEDICATION },
    { term: 'ibuprofeno', synonyms: ['antiinflamatorio'], category: MedicalCategoryType.MEDICATION },
    { term: 'amoxicilina', synonyms: ['antibiótico'], category: MedicalCategoryType.MEDICATION },
    { term: 'omeprazol', synonyms: ['protector gástrico'], category: MedicalCategoryType.MEDICATION }
  ],
  procedures: [
    { term: 'hemograma', synonyms: ['análisis de sangre', 'conteo sanguíneo'], category: MedicalCategoryType.PROCEDURE },
    { term: 'radiografía', synonyms: ['rayos x', 'rx'], category: MedicalCategoryType.PROCEDURE },
    { term: 'electrocardiograma', synonyms: ['ecg', 'ekg'], category: MedicalCategoryType.PROCEDURE },
    { term: 'ecografía', synonyms: ['ultrasonido', 'eco'], category: MedicalCategoryType.PROCEDURE }
  ]
};

export const findMedicalTerm = (text: string): { term: string; category: MedicalCategoryType } | null => {
  const lowerText = text.toLowerCase();
  
  for (const category of Object.values(medicalTermsDatabase)) {
    for (const item of category) {
      if (lowerText.includes(item.term.toLowerCase()) || 
          item.synonyms.some(syn => lowerText.includes(syn.toLowerCase()))) {
        return { term: item.term, category: item.category };
      }
    }
  }
  
  return null;
};

export const extractMedicalTermsFromText = (text: string): Array<{ term: string; category: MedicalCategoryType }> => {
  const terms: Array<{ term: string; category: MedicalCategoryType }> = [];
  const words = text.toLowerCase().split(/\s+/);
  
  for (const word of words) {
    const medicalTerm = findMedicalTerm(word);
    if (medicalTerm && !terms.some(t => t.term === medicalTerm.term)) {
      terms.push(medicalTerm);
    }
  }
  
  return terms;
};