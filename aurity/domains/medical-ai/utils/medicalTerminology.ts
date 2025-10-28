export const medicalTerminology = {
  terms: ['fiebre', 'dolor', 'tos'],
  isMedicalTerm(term: string): boolean {
    return this.terms.includes(term.toLowerCase());
  }
};
