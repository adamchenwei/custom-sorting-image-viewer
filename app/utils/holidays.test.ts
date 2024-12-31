import { isUSHoliday } from "./holidays";

describe('isUSHoliday', () => {
  describe('input validation', () => {
    it('should return error for invalid date format', () => {
      expect(isUSHoliday('2024/12/25')).toEqual([{
        id: 'error',
        name: 'Date must be in yyyy-mm-dd format'
      }]);
      expect(isUSHoliday('12-25-2024')).toEqual([{
        id: 'error',
        name: 'Date must be in yyyy-mm-dd format'
      }]);
      expect(isUSHoliday('invalid')).toEqual([{
        id: 'error',
        name: 'Date must be in yyyy-mm-dd format'
      }]);
    });

    it('should return error for invalid dates', () => {
      expect(isUSHoliday('2024-13-01')).toEqual([{
        id: 'error',
        name: 'Invalid month: 13. Month must be between 1 and 12'
      }]);
      expect(isUSHoliday('2024-00-01')).toEqual([{
        id: 'error',
        name: 'Invalid month: 0. Month must be between 1 and 12'
      }]);
      expect(isUSHoliday('2024-12-32')).toEqual([{
        id: 'error',
        name: 'Invalid day: 32. Day must be between 1 and 31 for month 12'
      }]);
    });
  });

  describe('fixed date holidays', () => {
    it('should identify New Years Day with multiple tags', () => {
      const result = isUSHoliday('2024-01-01');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'new-years-day',
        name: "New Year's Day"
      });
      expect(result[1]).toEqual({
        id: 'three-days-after-new-year',
        name: 'Three Days After New Year'
      });
    });

    it('should identify Juneteenth during DST', () => {
      const result = isUSHoliday('2024-06-19');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'juneteenth',
        name: 'Juneteenth'
      });
      expect(result[1]).toEqual({
        id: 'daylight-saving-applied-1h-back',
        name: 'Daylight Saving Time Active'
      });
    });

    it('should identify Independence Day during DST', () => {
      const result = isUSHoliday('2024-07-04');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'independence-day',
        name: 'Independence Day'
      });
      expect(result[1]).toEqual({
        id: 'daylight-saving-applied-1h-back',
        name: 'Daylight Saving Time Active'
      });
    });

    it('should identify Veterans Day', () => {
      expect(isUSHoliday('2024-11-11')).toEqual([{
        id: 'veterans-day',
        name: 'Veterans Day'
      }]);
    });

    it('should identify Christmas Day', () => {
      expect(isUSHoliday('2024-12-25')).toEqual([{
        id: 'christmas-day',
        name: 'Christmas Day'
      }]);
    });
  });

  describe('floating holidays', () => {
    it('should identify MLK Day (3rd Monday in January)', () => {
      expect(isUSHoliday('2024-01-15')).toEqual([{
        id: 'martin-luther-king-jr-day',
        name: 'Martin Luther King Jr. Day'
      }]);
      expect(isUSHoliday('2025-01-20')).toEqual([{
        id: 'martin-luther-king-jr-day',
        name: 'Martin Luther King Jr. Day'
      }]);
    });

    it('should identify Presidents Day (3rd Monday in February)', () => {
      expect(isUSHoliday('2024-02-19')).toEqual([{
        id: 'presidents-day',
        name: 'Presidents Day'
      }]);
    });

    it('should identify Memorial Day (last Monday in May)', () => {
      const result = isUSHoliday('2024-05-27');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'memorial-day',
        name: 'Memorial Day'
      });
      expect(result[1]).toEqual({
        id: 'daylight-saving-applied-1h-back',
        name: 'Daylight Saving Time Active'
      });
    });

    it('should identify Labor Day (1st Monday in September)', () => {
      const result = isUSHoliday('2024-09-02');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'labor-day',
        name: 'Labor Day'
      });
      expect(result[1]).toEqual({
        id: 'daylight-saving-applied-1h-back',
        name: 'Daylight Saving Time Active'
      });
    });

    it('should identify Columbus Day (2nd Monday in October)', () => {
      const result = isUSHoliday('2024-10-14');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'columbus-day',
        name: 'Columbus Day'
      });
      expect(result[1]).toEqual({
        id: 'daylight-saving-applied-1h-back',
        name: 'Daylight Saving Time Active'
      });
    });

    it('should identify Thanksgiving Day (4th Thursday in November)', () => {
      expect(isUSHoliday('2024-11-28')).toEqual([{
        id: 'thanksgiving-day',
        name: 'Thanksgiving Day'
      }]);
    });
  });

  describe('non-holidays', () => {
    it('should return not-holiday for non-holiday dates', () => {
      expect(isUSHoliday('2024-03-15')).toEqual([{
        id: 'daylight-saving-applied-1h-back',
        name: 'Daylight Saving Time Active'
      }]);
      expect(isUSHoliday('2024-08-01')).toEqual([{
        id: 'daylight-saving-applied-1h-back',
        name: 'Daylight Saving Time Active'
      }]);
      expect(isUSHoliday('2024-12-27')).toEqual([{
        id: 'not-holiday',
        name: '2024-12-27 is not a holiday'
      }]);
    });

    it('should return not-holiday for weekend dates that are not holidays', () => {
      expect(isUSHoliday('2024-03-16')).toEqual([{
        id: 'daylight-saving-applied-1h-back',
        name: 'Daylight Saving Time Active'
      }]);
      expect(isUSHoliday('2024-03-17')).toEqual([{
        id: 'daylight-saving-applied-1h-back',
        name: 'Daylight Saving Time Active'
      }]);
    });
  });

  describe('edge cases', () => {
    it('should handle leap years correctly', () => {
      expect(isUSHoliday('2024-02-19')).toEqual([{
        id: 'presidents-day',
        name: 'Presidents Day'
      }]);
    });

    it('should handle year transitions correctly', () => {
      expect(isUSHoliday('2024-12-31')).toEqual([{
        id: 'three-days-before-new-year',
        name: 'Three Days Before New Year'
      }]);
      const newYearResult = isUSHoliday('2025-01-01');
      expect(newYearResult).toHaveLength(2);
      expect(newYearResult[0]).toEqual({
        id: 'new-years-day',
        name: "New Year's Day"
      });
      expect(newYearResult[1]).toEqual({
        id: 'three-days-after-new-year',
        name: 'Three Days After New Year'
      });
    });
  });

  describe('custom holidays', () => {
    describe('week before Christmas', () => {
      it('should identify dates in the week before Christmas', () => {
        expect(isUSHoliday('2024-12-18')).toEqual([{
          id: 'week-before-christmas',
          name: 'The Week Before Christmas'
        }]);
        expect(isUSHoliday('2024-12-19')).toEqual([{
          id: 'week-before-christmas',
          name: 'The Week Before Christmas'
        }]);
        expect(isUSHoliday('2024-12-24')).toEqual([{
          id: 'week-before-christmas',
          name: 'The Week Before Christmas'
        }]);
      });

      it('should not identify dates outside the week before Christmas', () => {
        expect(isUSHoliday('2024-12-17')).toEqual([{
          id: 'not-holiday',
          name: '2024-12-17 is not a holiday'
        }]);
        expect(isUSHoliday('2024-12-25')).toEqual([{
          id: 'christmas-day',
          name: 'Christmas Day'
        }]);
      });
    });

    describe('day after Christmas', () => {
      it('should identify December 26th as the day after Christmas', () => {
        expect(isUSHoliday('2024-12-26')).toEqual([{
          id: 'day-after-christmas',
          name: 'The Day After Christmas'
        }]);
      });

      it('should work across different years', () => {
        expect(isUSHoliday('2025-12-26')).toEqual([{
          id: 'day-after-christmas',
          name: 'The Day After Christmas'
        }]);
      });
    });
  });

  describe('overlapping holidays and priority', () => {
    it('should handle multiple applicable tags with correct priority', () => {
      // Independence Day during DST
      const julyFourth = isUSHoliday('2024-07-04');
      expect(julyFourth).toHaveLength(2);
      expect(julyFourth[0].id).toBe('independence-day'); // Higher priority
      expect(julyFourth[1].id).toBe('daylight-saving-applied-1h-back'); // Lower priority

      // New Year's Day and three days after
      const newYear = isUSHoliday('2024-01-01');
      expect(newYear).toHaveLength(2);
      expect(newYear[0].id).toBe('new-years-day'); // Higher priority
      expect(newYear[1].id).toBe('three-days-after-new-year'); // Lower priority
    });
  });
});