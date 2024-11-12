export const formatDateToString = (date: Date | null): string | null => {
  if (!date) return null;
  return date.toISOString();
};

export const parseStringToDate = (dateString: string | null): Date | null => {
  if (!dateString) return null;
  return new Date(dateString);
}; 