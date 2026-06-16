import { prisma } from '../../config/database';

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'cylinder' | 'product' | 'customer' | 'inkFormula' | 'job';
  link: string;
}

export interface SearchResultsDto {
  cylinders: SearchResultItem[];
  products: SearchResultItem[];
  customers: SearchResultItem[];
  inkFormulas: SearchResultItem[];
  jobs: SearchResultItem[];
}

export class SearchService {
  static async globalSearch(query: string): Promise<SearchResultsDto> {
    if (!query || query.trim().length === 0) {
      return {
        cylinders: [],
        products: [],
        customers: [],
        inkFormulas: [],
        jobs: []
      };
    }

    const term = query.trim();

    // 1. Search Cylinders
    const cylinders = await prisma.cylinder.findMany({
      where: {
        deletedAt: null,
        OR: [
          { id: { contains: term, mode: 'insensitive' } },
          { productCode: { contains: term, mode: 'insensitive' } },
          { color: { contains: term, mode: 'insensitive' } },
          { location: { contains: term, mode: 'insensitive' } }
        ]
      },
      take: 5
    });

    // 2. Search Products
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { code: { contains: term, mode: 'insensitive' } },
          { name: { contains: term, mode: 'insensitive' } },
          { customerCode: { contains: term, mode: 'insensitive' } }
        ]
      },
      take: 5
    });

    // 3. Search Customers
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { code: { contains: term, mode: 'insensitive' } },
          { name: { contains: term, mode: 'insensitive' } }
        ]
      },
      take: 5
    });

    // 4. Search Ink Formulas
    const inkFormulas = await prisma.inkFormula.findMany({
      where: {
        deletedAt: null,
        OR: [
          { code: { contains: term, mode: 'insensitive' } },
          { productCode: { contains: term, mode: 'insensitive' } },
          { color: { contains: term, mode: 'insensitive' } },
          { pantone: { contains: term, mode: 'insensitive' } }
        ]
      },
      take: 5
    });

    // 5. Search Production Jobs
    const jobs = await prisma.productionJob.findMany({
      where: {
        OR: [
          { jobNumber: { contains: term, mode: 'insensitive' } },
          { orderNumber: { contains: term, mode: 'insensitive' } },
          { productCode: { contains: term, mode: 'insensitive' } },
          { machineName: { contains: term, mode: 'insensitive' } }
        ]
      },
      take: 5
    });

    return {
      cylinders: cylinders.map(c => ({
        id: c.id,
        title: c.id,
        subtitle: `Product: ${c.productCode} | Color: ${c.color} | Location: ${c.location}`,
        type: 'cylinder',
        link: `/cylinders?search=${encodeURIComponent(c.id)}`
      })),
      products: products.map(p => ({
        id: p.code,
        title: p.name,
        subtitle: `Code: ${p.code} | Cust: ${p.customerCode}`,
        type: 'product',
        link: `/products?search=${encodeURIComponent(p.code)}`
      })),
      customers: customers.map(cust => ({
        id: cust.code,
        title: cust.name,
        subtitle: `Code: ${cust.code}`,
        type: 'customer',
        link: `/customers?search=${encodeURIComponent(cust.code)}`
      })),
      inkFormulas: inkFormulas.map(f => ({
        id: f.code,
        title: f.code,
        subtitle: `Color: ${f.color} | Pantone: ${f.pantone} | Product: ${f.productCode}`,
        type: 'inkFormula',
        link: `/inks?tab=formulas&search=${encodeURIComponent(f.code)}`
      })),
      jobs: jobs.map(j => ({
        id: j.jobNumber,
        title: j.jobNumber,
        subtitle: `Order: ${j.orderNumber} | Prod: ${j.productCode} | Machine: ${j.machineName}`,
        type: 'job',
        link: `/jobs?search=${encodeURIComponent(j.jobNumber)}`
      }))
    };
  }
}
