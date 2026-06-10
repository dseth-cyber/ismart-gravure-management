export interface ProductDto {
  id: string;
  code: string;
  name: string;
  customerCode: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductDto {
  code: string;
  name: string;
  customerCode: string;
}

export interface UpdateProductDto {
  name?: string;
  customerCode?: string;
}
