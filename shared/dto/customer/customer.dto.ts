export interface CustomerDto {
  id: string;
  code: string;
  name: string;
  contactInfo?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCustomerDto {
  code: string;
  name: string;
  contactInfo?: string;
}

export interface UpdateCustomerDto {
  name?: string;
  contactInfo?: string;
}
