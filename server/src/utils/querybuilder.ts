import { Request } from "express";

export interface FilterOptions {
  searchFields?: string[];
  dateFields?: string[];
  enumFields?: { [key: string]: string[] };
  arrayFields?: string[];
  rangeFields?: string[];
  booleanFields?: string[];
}

/**
 * Build MongoDB filter object from query parameters
 */
export const buildFilter = (query: Request['query'], options: FilterOptions = {}): any => {
  const filter: any = {};
  
  const {
    searchFields = [],
    dateFields = [],
    enumFields = {},
    arrayFields = [],
    rangeFields = [],
    booleanFields = []
  } = options;

  // Handle text search
  if (query.search && searchFields.length > 0) {
    filter.$text = { $search: query.search as string };
  }

  // Handle enum fields
  Object.keys(enumFields).forEach(field => {
    if (query[field] && enumFields[field].includes(query[field] as string)) {
      filter[field] = query[field];
    }
  });

  // Handle array fields (comma-separated values)
  arrayFields.forEach(field => {
    if (query[field]) {
      const values = (query[field] as string).split(',').map(v => v.trim());
      filter[field] = { $in: values };
    }
  });

  // Handle range fields (format: "min-max" or just "value")
  rangeFields.forEach(field => {
    if (query[field]) {
      const value = query[field] as string;
      if (value.includes('-')) {
        const [min, max] = value.split('-').map(Number);
        filter[field] = { $gte: min, $lte: max || min };
      } else {
        filter[field] = Number(value);
      }
    }
  });

  // Handle boolean fields
  booleanFields.forEach(field => {
    if (query[field] && query[field] !== 'all') {
      filter[field] = query[field] === 'true';
    }
  });

  // Handle date range filters
  dateFields.forEach(field => {
    const startField = `${field}Start`;
    const endField = `${field}End`;
    
    if (query[startField] || query[endField]) {
      filter[field] = {};
      
      if (query[startField]) {
        filter[field].$gte = new Date(query[startField] as string);
      }
      
      if (query[endField]) {
        filter[field].$lte = new Date(query[endField] as string);
      }
    }
  });

  return filter;
};

/**
 * Build sort object from query parameters
 */
export const buildSort = (query: Request['query'], defaultSort: any = { createdAt: -1 }): any => {
  if (!query.sortBy) return defaultSort;

  const sortBy = query.sortBy as string;
  const sortOrder = (query.sortOrder as string) === 'asc' ? 1 : -1;

  // Predefined sort options
  const sortOptions: { [key: string]: any } = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    rating: { rating: -1, totalRatings: -1 },
    popularity: { likes: -1, comments: -1 },
    alphabetical: { name: 1, title: 1 },
    participants: { totalParticipants: -1 },
    'ending-soon': { endDate: 1 },
    updated: { updatedAt: -1 }
  };

  if (sortOptions[sortBy]) {
    return sortOptions[sortBy];
  }

  // Custom sort field
  return { [sortBy]: sortOrder };
};
