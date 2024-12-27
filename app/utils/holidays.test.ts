import { isUSHoliday } from "./holidays";

// holidays.test.ts
describe('isUSHoliday', () => {
  describe('input validation', () => {
    it('should throw error for invalid date format', () => {
      expect(() => isUSHoliday('2024/12/25')).toThrow('Date must be in yyyy-mm-dd format');
      expect(() => isUSHoliday('12-25-2024')).toThrow('Date must be in yyyy-mm-dd format');
      expect(() => isUSHoliday('invalid')).toThrow('Date must be in yyyy-mm-dd format');
    });

    it('should throw error for invalid dates', () => {
      expect(() => isUSHoliday('2024-13-01')).toThrow('Invalid date');
      expect(() => isUSHoliday('2024-00-01')).toThrow('Invalid date');
      expect(() => isUSHoliday('2024-12-32')).toThrow('Invalid date');
    });
  });

  describe('fixed date holidays', () => {
    it('should identify New Years Day', () => {
      expect(isUSHoliday('2024-01-01')).toEqual({
        id: 'new-years-day',
        name: "New Year's Day"
      });
    });

    it('should identify Juneteenth', () => {
      expect(isUSHoliday('2024-06-19')).toEqual({
        id: 'juneteenth',
        name: 'Juneteenth'
      });
    });

    it('should identify Independence Day', () => {
      expect(isUSHoliday('2024-07-04')).toEqual({
        id: 'independence-day',
        name: 'Independence Day'
      });
    });

    it('should identify Veterans Day', () => {
      expect(isUSHoliday('2024-11-11')).toEqual({
        id: 'veterans-day',
        name: 'Veterans Day'
      });
    });

    it('should identify Christmas Day', () => {
      expect(isUSHoliday('2024-12-25')).toEqual({
        id: 'christmas-day',
        name: 'Christmas Day'
      });
    });
  });

  describe('floating holidays', () => {
    it('should identify MLK Day (3rd Monday in January)', () => {
      expect(isUSHoliday('2024-01-15')).toEqual({
        id: 'martin-luther-king-jr-day',
        name: 'Martin Luther King Jr. Day'
      });
      expect(isUSHoliday('2025-01-20')).toEqual({
        id: 'martin-luther-king-jr-day',
        name: 'Martin Luther King Jr. Day'
      });
    });

    it('should identify Presidents Day (3rd Monday in February)', () => {
      expect(isUSHoliday('2024-02-19')).toEqual({
        id: 'presidents-day',
        name: 'Presidents Day'
      });
    });

    it('should identify Memorial Day (last Monday in May)', () => {
      expect(isUSHoliday('2024-05-27')).toEqual({
        id: 'memorial-day',
        name: 'Memorial Day'
      });
    });

    it('should identify Labor Day (1st Monday in September)', () => {
      expect(isUSHoliday('2024-09-02')).toEqual({
        id: 'labor-day',
        name: 'Labor Day'
      });
    });

    it('should identify Columbus Day (2nd Monday in October)', () => {
      expect(isUSHoliday('2024-10-14')).toEqual({
        id: 'columbus-day',
        name: 'Columbus Day'
      });
    });

    it('should identify Thanksgiving Day (4th Thursday in November)', () => {
      expect(isUSHoliday('2024-11-28')).toEqual({
        id: 'thanksgiving-day',
        name: 'Thanksgiving Day'
      });
    });
  });

  describe('non-holidays', () => {
    it('should return null for non-holiday dates', () => {
      expect(isUSHoliday('2024-03-15')).toBeNull();
      expect(isUSHoliday('2024-08-01')).toBeNull();
      expect(isUSHoliday('2024-12-26')).toBeNull();
    });

    it('should return null for weekend dates that are not holidays', () => {
      expect(isUSHoliday('2024-03-16')).toBeNull(); // Saturday
      expect(isUSHoliday('2024-03-17')).toBeNull(); // Sunday
    });
  });

  describe('edge cases', () => {
    it('should handle leap years correctly', () => {
      expect(isUSHoliday('2024-02-19')).toEqual({
        id: 'presidents-day',
        name: 'Presidents Day'
      });
    });

    it('should handle year transitions correctly', () => {
      expect(isUSHoliday('2024-12-31')).toBeNull();
      expect(isUSHoliday('2025-01-01')).toEqual({
        id: 'new-years-day',
        name: "New Year's Day"
      });
    });
  });
});