export interface SalesOrderDto {
  id: string;
  orderNumber: string;
  customerCode: string;
  productCode: string;
  quantity: number;
  unit: string;
  dueDate: Date | string;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateSalesOrderDto {
  orderNumber: string;
  customerCode: string;
  productCode: string;
  quantity: number;
  unit: string;
  dueDate: string;
}

export interface UpdateSalesOrderStatusDto {
  status: string;
}
